import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'

interface CertificateData {
  studentName: string
  courseName: string
  tenantName: string
  durationHours: number
  issuedAt: string
  verificationCode: string
  tenantLogoUrl: string | null
  certificateBgUrl: string | null
  signatureUrl: string | null
  primaryColor: string
  secondaryColor: string
}

export function CertificateTemplate({ data }: { data: CertificateData }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {data.certificateBgUrl && <Image src={data.certificateBgUrl} style={styles.background} />}
        <View style={styles.content}>
          {data.tenantLogoUrl && <Image src={data.tenantLogoUrl} style={styles.logo} />}
          <Text style={[styles.title, { color: data.primaryColor }]}>CERTIFICADO DE CONCLUSÃO</Text>
          <Text style={styles.body}>Certificamos que</Text>
          <Text style={[styles.studentName, { color: data.primaryColor }]}>{data.studentName}</Text>
          <Text style={styles.body}>concluiu com aproveitamento o curso</Text>
          <Text style={styles.courseName}>{data.courseName}</Text>
          <Text style={styles.body}>com carga horária de {data.durationHours} horas, oferecido por {data.tenantName}.</Text>
          <Text style={styles.date}>Emitido em {new Date(data.issuedAt).toLocaleDateString('pt-BR')}</Text>
          {data.signatureUrl && <Image src={data.signatureUrl} style={styles.signature} />}
          <Text style={styles.verification}>Código de verificação: {data.verificationCode}</Text>
        </View>
      </Page>
    </Document>
  )
}

const styles = StyleSheet.create({
  page: { position: 'relative', padding: 60 },
  background: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  content: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  logo: { width: 150, height: 60, objectFit: 'contain', marginBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, letterSpacing: 2 },
  body: { fontSize: 14, textAlign: 'center', marginBottom: 10, color: '#374151' },
  studentName: { fontSize: 24, fontWeight: 'bold', marginBottom: 15 },
  courseName: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#111827' },
  date: { fontSize: 12, color: '#6b7280', marginTop: 20 },
  signature: { width: 150, height: 60, objectFit: 'contain', marginTop: 20 },
  verification: { fontSize: 10, color: '#9ca3af', marginTop: 30 },
})
