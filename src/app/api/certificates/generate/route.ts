import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'
import { renderToBuffer } from '@react-pdf/renderer'
import { CertificateTemplate } from '@/components/certificate/CertificateTemplate'

export async function POST(request: NextRequest) {
  const { certificateId } = await request.json()
  const supabase = createServiceRoleClient()

  const { data: cert } = await supabase
    .from('certificates')
    .select('*')
    .eq('id', certificateId)
    .single()

  if (!cert) {
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
  }

  const { data: tokens } = await supabase
    .from('design_tokens')
    .select('color_primary_500, color_secondary_500')
    .eq('tenant_id', cert.tenant_id)
    .eq('mode', 'light')
    .single()

  const { data: assets } = await supabase
    .from('design_assets')
    .select('logo_horizontal_url, certificate_bg_url, certificate_logo_url, certificate_signature_url')
    .eq('tenant_id', cert.tenant_id)
    .single()

  const pdfBuffer = await renderToBuffer(
    CertificateTemplate({
      data: {
        studentName: cert.student_name,
        courseName: cert.course_title,
        tenantName: cert.tenant_name,
        durationHours: cert.duration_hours ?? 0,
        issuedAt: cert.issued_at,
        verificationCode: cert.verification_code,
        tenantLogoUrl: assets?.certificate_logo_url ?? assets?.logo_horizontal_url ?? null,
        certificateBgUrl: assets?.certificate_bg_url ?? null,
        signatureUrl: assets?.certificate_signature_url ?? null,
        primaryColor: tokens?.color_primary_500 ?? '#3b82f6',
        secondaryColor: tokens?.color_secondary_500 ?? '#22c55e',
      },
    })
  )

  const fileName = `certificates/${cert.tenant_id}/${cert.id}.pdf`
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(fileName, pdfBuffer, { contentType: 'application/pdf', upsert: true })

  if (uploadError) {
    return NextResponse.json({ error: 'Failed to upload PDF' }, { status: 500 })
  }

  const { data: publicUrl } = supabase.storage.from('documents').getPublicUrl(fileName)

  await supabase.from('certificates').update({ pdf_url: publicUrl.publicUrl }).eq('id', cert.id)

  return NextResponse.json({ success: true, pdfUrl: publicUrl.publicUrl })
}
