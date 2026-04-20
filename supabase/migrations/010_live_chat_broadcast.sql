-- =============================================
-- 010: Broadcast em tempo real do chat via trigger
-- Usa realtime.send para publicar INSERTs no canal
-- chat-{session_id}. Mais confiavel que postgres_changes
-- em schema custom.
-- =============================================

CREATE OR REPLACE FUNCTION ead.broadcast_chat_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, ead, realtime
AS $$
BEGIN
  PERFORM realtime.send(
    jsonb_build_object(
      'id', NEW.id,
      'live_session_id', NEW.live_session_id,
      'profile_id', NEW.profile_id,
      'message', NEW.message,
      'sender_name', NEW.sender_name,
      'is_instructor', NEW.is_instructor,
      'created_at', NEW.created_at
    ),
    'new_message',
    'chat-' || NEW.live_session_id::text,
    false -- public channel (topico UUID da sessao = nao-enumeravel)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Nunca quebrar o INSERT por falha de broadcast
  RAISE WARNING 'broadcast_chat_insert failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_broadcast_chat_insert ON ead.live_chat_messages;
CREATE TRIGGER trg_broadcast_chat_insert
  AFTER INSERT ON ead.live_chat_messages
  FOR EACH ROW EXECUTE FUNCTION ead.broadcast_chat_insert();
