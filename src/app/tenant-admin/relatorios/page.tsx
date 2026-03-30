import { requireRole } from '@/lib/auth/guards'

export default async function TenantRelatoriosPage() {
  await requireRole('admin_tenant')
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Relatórios</h1>
      <p className="text-gray-500">Em breve: taxas de conclusão, ranking de alunos, cursos mais acessados.</p>
    </div>
  )
}
