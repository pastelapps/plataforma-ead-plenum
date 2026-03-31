'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'

interface TenantStudentCount {
  name: string
  count: number
}

interface DashboardChartsProps {
  tenantStudentCounts: TenantStudentCount[]
  totalStudents: number
}

export function DashboardCharts({ tenantStudentCounts, totalStudents }: DashboardChartsProps) {
  const maxCount = Math.max(...tenantStudentCounts.map(t => t.count), 1)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Atividade dos últimos 30 dias - placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            Atividade dos últimos 30 dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-full h-32 bg-gradient-to-t from-blue-50 to-transparent rounded-lg flex items-end justify-center px-4 pb-2 mb-4">
              {/* Simulated bar chart placeholder - deterministic heights */}
              {[45, 62, 38, 78, 55, 90, 42, 68, 35, 82, 50, 73, 40, 85, 58].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 mx-0.5 bg-blue-200 rounded-t"
                    style={{ height: `${height}%` }}
                  />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Em breve: grafico de logins nos ultimos 30 dias
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Alunos por Tenant */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alunos por Tenant</CardTitle>
        </CardHeader>
        <CardContent>
          {tenantStudentCounts.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">Nenhum tenant encontrado.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tenantStudentCounts.map((tenant, index) => {
                const percentage = totalStudents > 0 ? Math.round((tenant.count / totalStudents) * 100) : 0
                const barWidth = maxCount > 0 ? Math.max((tenant.count / maxCount) * 100, 2) : 2
                const colors = [
                  'bg-blue-500',
                  'bg-emerald-500',
                  'bg-amber-500',
                  'bg-purple-500',
                  'bg-rose-500',
                  'bg-cyan-500',
                  'bg-indigo-500',
                  'bg-orange-500',
                ]
                const color = colors[index % colors.length]

                return (
                  <div key={tenant.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate mr-2">{tenant.name}</span>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {tenant.count} aluno{tenant.count !== 1 ? 's' : ''} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${color} transition-all duration-500`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                )
              })}

              <div className="pt-2 border-t mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Total</span>
                  <span className="text-muted-foreground">{totalStudents} aluno{totalStudents !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
