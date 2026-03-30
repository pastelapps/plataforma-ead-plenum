'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useEnrollment(enrollmentId: string) {
  const [enrollment, setEnrollment] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('enrollments')
        .select('*, lesson_progress(*)')
        .eq('id', enrollmentId)
        .single()
      setEnrollment(data)
      setLoading(false)
    }
    if (enrollmentId) load()
  }, [enrollmentId])

  return { enrollment, loading }
}
