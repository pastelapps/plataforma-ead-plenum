'use client'

import { LiveChat } from '@/components/live/LiveChat'
import { Card, CardContent } from '@/components/ui/card'
import { Clock } from 'lucide-react'

interface AdminChatPanelProps {
  sessionId: string
  status: string
  adminName: string
}

export function AdminChatPanel({ sessionId, status, adminName }: AdminChatPanelProps) {
  if (status === 'scheduled') {
    return (
      <Card className="h-[400px] flex items-center justify-center">
        <CardContent className="text-center">
          <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500">Aguardando inicio da live</p>
          <p className="text-xs text-gray-400 mt-1">
            O chat sera liberado ao clicar em <strong>Iniciar Live</strong>
          </p>
        </CardContent>
      </Card>
    )
  }

  // live ou ended - mostra chat (readonly quando ended)
  return (
    <div className="h-[500px] lg:h-[600px]">
      <LiveChat
        sessionId={sessionId}
        profileId={null}
        profileName={adminName}
        isInstructor
        readOnly={status === 'ended'}
        profileLinkTargetBlank
      />
    </div>
  )
}
