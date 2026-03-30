'use client'

interface PandaVideoPlayerProps {
  pandaVideoId: string
  enrollmentId: string
  lessonId: string
}

export function PandaVideoPlayer({ pandaVideoId, enrollmentId, lessonId }: PandaVideoPlayerProps) {
  const metadata = encodeURIComponent(JSON.stringify({ enrollment_id: enrollmentId, lesson_id: lessonId }))

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <iframe
        id={`panda-player-${pandaVideoId}`}
        src={`https://player-vz-7b95dace-d2a.tv.pandavideo.com.br/embed/?v=${pandaVideoId}&metadata=${metadata}`}
        style={{ border: 'none', width: '100%', height: '100%' }}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}
