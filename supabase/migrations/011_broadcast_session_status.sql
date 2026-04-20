-- =============================================
-- 011: Broadcast de mudanca de status da live
-- Quando admin altera status (live -> ended, etc),
-- o trigger avisa clientes conectados em tempo real.
-- =============================================

CREATE OR REPLACE FUNCTION ead.broadcast_session_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, ead, realtime
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM realtime.send(
      jsonb_build_object(
        'session_id', NEW.id,
        'status', NEW.status,
        'actual_start', NEW.actual_start,
        'actual_end', NEW.actual_end
      ),
      'status_changed',
      'session-' || NEW.id::text,
      false
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'broadcast_session_status failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_broadcast_session_status ON ead.live_sessions;
CREATE TRIGGER trg_broadcast_session_status
  AFTER UPDATE ON ead.live_sessions
  FOR EACH ROW EXECUTE FUNCTION ead.broadcast_session_status();
