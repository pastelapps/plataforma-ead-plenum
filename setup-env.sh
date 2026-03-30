#!/bin/bash
# ==============================================
# SETUP .env.local — Plataforma EAD Multi-Tenant
# ==============================================
echo ""
echo "🚀 Configuração do .env.local"
echo "================================"
echo ""
# SUPABASE
read -p "SUPABASE_URL: " SUPABASE_URL
read -p "SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
read -p "SUPABASE_SERVICE_ROLE_KEY: " SUPABASE_SERVICE_ROLE_KEY
read -p "SUPABASE_ACCESS_TOKEN (CLI): " SUPABASE_ACCESS_TOKEN
read -p "SUPABASE_PROJECT_REF (ex: xyzabcdef123): " SUPABASE_PROJECT_REF
# VERCEL
read -p "VERCEL_TOKEN: " VERCEL_TOKEN
# GITHUB
read -p "GITHUB_TOKEN: " GITHUB_TOKEN
# PANDA VIDEO
read -p "PANDA_API_KEY: " PANDA_API_KEY
read -p "PANDA_FOLDER_ID: " PANDA_FOLDER_ID
# RESEND
read -p "RESEND_API_KEY: " RESEND_API_KEY
# UPSTASH
read -p "UPSTASH_REDIS_REST_URL: " UPSTASH_REDIS_REST_URL
read -p "UPSTASH_REDIS_REST_TOKEN: " UPSTASH_REDIS_REST_TOKEN
# GERAR O ARQUIVO
cat > .env.local << EOF
# ========================
# SUPABASE
# ========================
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
SUPABASE_ACCESS_TOKEN=${SUPABASE_ACCESS_TOKEN}
SUPABASE_PROJECT_REF=${SUPABASE_PROJECT_REF}
# ========================
# VERCEL
# ========================
VERCEL_TOKEN=${VERCEL_TOKEN}
# ========================
# GITHUB
# ========================
GITHUB_TOKEN=${GITHUB_TOKEN}
# ========================
# PANDA VIDEO
# ========================
PANDA_API_KEY=${PANDA_API_KEY}
PANDA_API_URL=https://api-v2.pandavideo.com.br
PANDA_FOLDER_ID=${PANDA_FOLDER_ID}
# ========================
# RESEND
# ========================
RESEND_API_KEY=${RESEND_API_KEY}
RESEND_FROM_EMAIL=noreply@plataforma.com.br
# ========================
# UPSTASH REDIS
# ========================
UPSTASH_REDIS_REST_URL=${UPSTASH_REDIS_REST_URL}
UPSTASH_REDIS_REST_TOKEN=${UPSTASH_REDIS_REST_TOKEN}
# ========================
# APP
# ========================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000
NODE_ENV=development
EOF
echo ""
echo "✅ .env.local criado com sucesso!"
echo "⚠️  Nunca commite este arquivo no Git."
echo ""

