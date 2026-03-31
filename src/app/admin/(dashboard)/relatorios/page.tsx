import { requireOrgAdmin } from '@/lib/auth/guards'

export default async function RelatoriosPage() {
  await requireOrgAdmin()
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Relatórios</h1>
      <p className="text-gray-500">Em breve: analytics de matrículas, conclusões e performance por tenant.</p>
    </div>
  )
}
