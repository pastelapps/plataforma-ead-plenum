import { createServiceRoleClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle } from 'lucide-react'

interface Props { params: Promise<{ code: string }> }

export default async function VerifyCertificatePage({ params }: Props) {
  const { code } = await params
  const supabase = createServiceRoleClient()

  const { data: cert } = await supabase
    .from('certificates')
    .select('*')
    .eq('verification_code', code)
    .single()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>{cert ? 'Certificado Válido' : 'Certificado não encontrado'}</CardTitle>
        </CardHeader>
        <CardContent>
          {cert ? (
            <div className="space-y-3">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <p><strong>{cert.student_name}</strong></p>
              <p>concluiu o curso</p>
              <p className="font-semibold">{cert.course_title}</p>
              <p className="text-sm text-gray-500">oferecido por {cert.tenant_name}</p>
              <p className="text-sm text-gray-500">em {new Date(cert.issued_at).toLocaleDateString('pt-BR')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <XCircle className="h-16 w-16 text-red-500 mx-auto" />
              <p className="text-gray-500">O código de verificação informado não corresponde a nenhum certificado.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
