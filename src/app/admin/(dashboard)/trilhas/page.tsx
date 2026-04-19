import { requireOrgAdmin } from '@/lib/auth/guards'
import { createServerComponentClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, GripVertical } from 'lucide-react'

export default async function TracksListPage() {
  const { organization } = await requireOrgAdmin()
  const supabase = await createServerComponentClient()

  const { data: tracks } = await (supabase
    .from('tracks') as any)
    .select('*, track_courses(id, courses(id, title))')
    .eq('organization_id', organization.id)
    .order('position', { ascending: true })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Trilhas</h1>
          <p className="text-gray-500">Organize cursos em trilhas tematicas</p>
        </div>
        <Link href="/admin/trilhas/nova">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Trilha
          </Button>
        </Link>
      </div>

      {(!tracks || tracks.length === 0) ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">Nenhuma trilha criada ainda</p>
            <Link href="/admin/trilhas/nova">
              <Button variant="outline">Criar primeira trilha</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tracks.map((track: any) => {
            const courseCount = track.track_courses?.length ?? 0
            return (
              <Card key={track.id}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <GripVertical className="h-5 w-5 text-gray-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{track.title}</h3>
                        <Badge variant={track.active ? 'default' : 'secondary'}>
                          {track.active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                      {track.description && (
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{track.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">{courseCount} curso{courseCount !== 1 ? 's' : ''}</p>
                    </div>
                    <Link href={`/admin/trilhas/${track.id}`}>
                      <Button variant="outline" size="sm">Editar</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
