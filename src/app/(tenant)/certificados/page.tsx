import { requireProfile } from '@/lib/auth/guards'
import { createServerComponentClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Award, Download, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default async function CertificadosPage() {
  const { profile } = await requireProfile()
  const supabase = await createServerComponentClient()

  const { data: certificates } = await supabase
    .from('certificates')
    .select('*')
    .eq('profile_id', profile.id)
    .order('issued_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Meus Certificados</h1>
        {(!certificates || certificates.length === 0) ? (
          <p style={{ color: 'var(--color-text-secondary)' }}>Você ainda não tem certificados. Conclua um curso para receber seu certificado.</p>
        ) : (
          <div className="space-y-4">
            {certificates.map((cert: any) => (
              <Card key={cert.id}>
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Award className="h-10 w-10" style={{ color: 'var(--color-primary-500)' }} />
                    <div>
                      <p className="font-semibold">{cert.course_title}</p>
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Emitido em {new Date(cert.issued_at).toLocaleDateString('pt-BR')}</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-disabled)' }}>Código: {cert.verification_code}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {cert.pdf_url ? (
                      <a href={cert.pdf_url} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" />PDF</Button></a>
                    ) : (
                      <Button variant="outline" size="sm" disabled>Gerando...</Button>
                    )}
                    <Link href={`/verify/${cert.verification_code}`} target="_blank"><Button variant="ghost" size="sm"><ExternalLink className="h-4 w-4" /></Button></Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
    </div>
  )
}
