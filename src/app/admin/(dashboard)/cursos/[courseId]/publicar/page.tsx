'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { CheckCircle, AlertCircle } from 'lucide-react'

export default function PublicarPage() {
  const router = useRouter()
  const { courseId } = useParams()
  const [loading, setLoading] = useState(false)

  const handlePublish = async () => {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('courses')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', courseId as string)
    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success('Curso publicado!')
    router.push('/admin/cursos')
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Publicar Curso</h1>
      <Card>
        <CardHeader><CardTitle>Confirmar Publicação</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium">Antes de publicar, verifique:</p>
              <ul className="list-disc pl-5 text-sm text-gray-600 mt-2 space-y-1">
                <li>Todos os módulos e aulas foram criados</li>
                <li>Os vídeos estão com status &quot;ready&quot;</li>
                <li>A descrição e thumbnail foram preenchidos</li>
              </ul>
            </div>
          </div>
          <Button onClick={handlePublish} disabled={loading} className="w-full">
            <CheckCircle className="h-4 w-4 mr-2" />
            {loading ? 'Publicando...' : 'Confirmar Publicação'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
