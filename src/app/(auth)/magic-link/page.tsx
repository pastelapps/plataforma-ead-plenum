import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function MagicLinkPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verifique seu email</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Enviamos um link de acesso para o seu email. Clique no link para entrar na plataforma.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Não recebeu? Verifique sua caixa de spam ou tente novamente.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
