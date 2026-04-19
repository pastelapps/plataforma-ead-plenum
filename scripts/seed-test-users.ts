/**
 * Script para criar 3 usuários de teste:
 * 1. Master (dono da organização) - acessa painel admin geral
 * 2. Admin Tenant - administra a Prefeitura de Florianópolis
 * 3. Aluno - aluno da Prefeitura de Florianópolis
 *
 * Uso: npx tsx scripts/seed-test-users.ts
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ORG_ID = "11111111-1111-1111-1111-111111111111";
const TENANT_ID = "44444444-4444-4444-4444-444444444444"; // Florianópolis
const COURSE_1_ID = "aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

const TEST_USERS = {
  master: {
    email: "master@plenum.com.br",
    password: "Master@123",
    full_name: "Master Plenum",
  },
  adminTenant: {
    email: "admin@florianopolis.gov.br",
    password: "Admin@123",
    full_name: "Administrador Florianópolis",
  },
  aluno: {
    email: "aluno@florianopolis.gov.br",
    password: "Aluno@123",
    full_name: "João Silva (Aluno Teste)",
  },
};

async function main() {
  console.log("=== Criando usuários de teste ===\n");

  // 1. Criar tenant Florianópolis (se não existir)
  console.log("1. Criando tenant Prefeitura de Florianópolis...");
  const { error: tenantError } = await supabase.from("tenants").upsert(
    {
      id: TENANT_ID,
      organization_id: ORG_ID,
      name: "Prefeitura de Florianópolis",
      slug: "prefeitura-florianopolis",
      completion_threshold: 80.0,
    },
    { onConflict: "id" }
  );
  if (tenantError) {
    console.error("  Erro ao criar tenant:", tenantError.message);
  } else {
    console.log("  OK - Tenant criado/atualizado");
  }

  // Design tokens para o tenant
  const { error: tokensError } = await supabase.from("design_tokens").upsert(
    {
      tenant_id: TENANT_ID,
      mode: "light",
      color_primary_500: "#e91e63",
      color_primary_600: "#c2185b",
      color_sidebar_bg: "#880e4f",
    },
    { onConflict: "tenant_id,mode" }
  );
  if (tokensError) console.error("  Aviso tokens:", tokensError.message);

  // Design assets
  await supabase
    .from("design_assets")
    .upsert({ tenant_id: TENANT_ID }, { onConflict: "tenant_id" });

  // Vincular curso ao tenant
  const { error: tcError } = await supabase.from("tenant_courses").upsert(
    {
      tenant_id: TENANT_ID,
      course_id: COURSE_1_ID,
    },
    { onConflict: "tenant_id,course_id" }
  );
  if (tcError) console.error("  Aviso tenant_courses:", tcError.message);
  else console.log("  OK - Curso vinculado ao tenant");

  // 2. Criar usuário MASTER
  console.log("\n2. Criando usuário MASTER...");
  const master = await createAuthUser(TEST_USERS.master);
  if (master) {
    const { error } = await supabase.from("organization_admins").upsert(
      {
        organization_id: ORG_ID,
        user_id: master.id,
        role: "owner",
        active: true,
      },
      { onConflict: "organization_id,user_id" }
    );
    if (error) console.error("  Erro org_admin:", error.message);
    else console.log("  OK - Vinculado como OWNER da organização Plenum");
  }

  // 3. Criar usuário ADMIN TENANT
  console.log("\n3. Criando usuário ADMIN TENANT...");
  const adminTenant = await createAuthUser(TEST_USERS.adminTenant);
  if (adminTenant) {
    const { error } = await supabase.from("profiles").upsert(
      {
        user_id: adminTenant.id,
        tenant_id: TENANT_ID,
        full_name: TEST_USERS.adminTenant.full_name,
        role: "admin_tenant",
        active: true,
      },
      { onConflict: "user_id,tenant_id" }
    );
    if (error) console.error("  Erro profile:", error.message);
    else console.log("  OK - Vinculado como ADMIN_TENANT de Florianópolis");
  }

  // 4. Criar usuário ALUNO
  console.log("\n4. Criando usuário ALUNO...");
  const aluno = await createAuthUser(TEST_USERS.aluno);
  if (aluno) {
    // Profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          user_id: aluno.id,
          tenant_id: TENANT_ID,
          full_name: TEST_USERS.aluno.full_name,
          role: "student",
          active: true,
        },
        { onConflict: "user_id,tenant_id" }
      )
      .select()
      .single();

    if (profileError) {
      console.error("  Erro profile:", profileError.message);
    } else {
      console.log("  OK - Vinculado como STUDENT de Florianópolis");

      // Matrícula no curso
      const { data: tc } = await supabase
        .from("tenant_courses")
        .select("id")
        .eq("tenant_id", TENANT_ID)
        .eq("course_id", COURSE_1_ID)
        .single();

      if (tc && profile) {
        const { error: enrollError } = await supabase
          .from("enrollments")
          .upsert(
            {
              profile_id: profile.id,
              tenant_course_id: tc.id,
              status: "active",
              progress: 0,
            },
            { onConflict: "profile_id,tenant_course_id" }
          );
        if (enrollError) console.error("  Aviso matrícula:", enrollError.message);
        else console.log('  OK - Matriculado em "Gestão Pública Moderna"');
      }
    }
  }

  // Resumo
  console.log("\n==========================================");
  console.log("  USUÁRIOS DE TESTE CRIADOS COM SUCESSO");
  console.log("==========================================\n");
  console.log("  MASTER (Admin Geral)");
  console.log(`    Email: ${TEST_USERS.master.email}`);
  console.log(`    Senha: ${TEST_USERS.master.password}`);
  console.log("    Acesso: /admin (painel geral da organização)\n");
  console.log("  ADMIN TENANT (Admin Florianópolis)");
  console.log(`    Email: ${TEST_USERS.adminTenant.email}`);
  console.log(`    Senha: ${TEST_USERS.adminTenant.password}`);
  console.log("    Acesso: /admin no tenant prefeitura-florianopolis\n");
  console.log("  ALUNO");
  console.log(`    Email: ${TEST_USERS.aluno.email}`);
  console.log(`    Senha: ${TEST_USERS.aluno.password}`);
  console.log("    Acesso: portal do aluno em prefeitura-florianopolis\n");
  console.log("==========================================\n");
}

async function createAuthUser(user: {
  email: string;
  password: string;
  full_name: string;
}) {
  // Verifica se já existe
  const { data: existing } = await supabase.rpc("get_user_by_email", {
    p_email: user.email,
  });

  if (existing) {
    // Tenta via listUsers
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: { full_name: user.full_name },
  });

  if (error) {
    if (error.message.includes("already been registered")) {
      console.log(`  Usuário ${user.email} já existe, buscando...`);
      const { data: list } = await supabase.auth.admin.listUsers();
      const found = list?.users?.find((u) => u.email === user.email);
      if (found) {
        console.log(`  Encontrado: ${found.id}`);
        return found;
      }
      console.error("  Não foi possível encontrar o usuário existente");
      return null;
    }
    console.error(`  Erro ao criar ${user.email}:`, error.message);
    return null;
  }

  console.log(`  Criado: ${data.user.email} (${data.user.id})`);
  return data.user;
}

main().catch(console.error);
