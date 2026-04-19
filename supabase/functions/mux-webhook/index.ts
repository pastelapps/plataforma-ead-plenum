const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function updateLiveSession(
  filter: Record<string, string>,
  updates: Record<string, unknown>
) {
  // Build query string from filter
  const params = new URLSearchParams();
  for (const [col, val] of Object.entries(filter)) {
    params.append(col, `eq.${val}`);
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/live_sessions?${params.toString()}`,
    {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        "Accept-Profile": "ead",
        "Content-Profile": "ead",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(updates),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error(`Update failed: ${res.status} ${err}`);
  }
  return res.ok;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await req.text();
  const event = JSON.parse(body);
  console.log(`Mux webhook: ${event.type}`, event.data?.id);

  switch (event.type) {
    // Stream ficou ao vivo
    case "video.live_stream.active": {
      await updateLiveSession(
        { mux_live_stream_id: event.data.id },
        { status: "live", actual_start: new Date().toISOString() }
      );
      console.log(`Stream ${event.data.id} → live`);
      break;
    }

    // Stream terminou
    case "video.live_stream.idle": {
      await updateLiveSession(
        { mux_live_stream_id: event.data.id },
        { status: "ended", actual_end: new Date().toISOString() }
      );
      console.log(`Stream ${event.data.id} → ended`);
      break;
    }

    // Gravação pronta
    case "video.asset.ready": {
      const asset = event.data;
      const playbackId = asset.playback_ids?.[0]?.id;
      const liveStreamId = asset.live_stream_id;

      if (liveStreamId && playbackId) {
        await updateLiveSession(
          { mux_live_stream_id: liveStreamId },
          {
            mux_asset_id: asset.id,
            mux_recording_playback_id: playbackId,
            recording_available: false,
            recording_duration_sec: Math.round(asset.duration ?? 0),
          }
        );
        console.log(`Asset ${asset.id} ready for stream ${liveStreamId}`);
      }
      break;
    }

    // Asset deletado
    case "video.asset.deleted": {
      await updateLiveSession(
        { mux_asset_id: event.data.id },
        {
          mux_asset_id: null,
          mux_recording_playback_id: null,
          recording_available: false,
          recording_duration_sec: null,
        }
      );
      console.log(`Asset ${event.data.id} deleted`);
      break;
    }

    default:
      console.log(`Unhandled event: ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
