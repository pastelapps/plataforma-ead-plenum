import { redirect } from 'next/navigation'

// Magic link desabilitado - redireciona para login com senha
export default function MagicLinkPage() {
  redirect('/login')
}
