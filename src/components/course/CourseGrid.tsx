import { CourseCard } from './CourseCard'

interface CourseGridProps {
  title: string
  courses: any[]
  favorites?: any[]
  showCertBadge?: boolean
  showEnrollButton?: boolean
}

export function CourseGrid({ title, courses, favorites, showCertBadge, showEnrollButton }: CourseGridProps) {
  if (!courses?.length) return null
  const favIds = new Set(favorites?.map((f: any) => f.course_id) ?? [])

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {courses.map((item: any) => {
          const course = item.tenant_courses?.courses ?? item.courses ?? item
          return (
            <CourseCard
              key={course.id ?? course.slug}
              course={course}
              progress={item.progress}
              isFavorite={favIds.has(course.id)}
              showCertBadge={showCertBadge}
              showEnrollButton={showEnrollButton}
            />
          )
        })}
      </div>
    </section>
  )
}
