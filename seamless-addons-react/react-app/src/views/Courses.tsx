import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCourses } from '../services/eventService';
import { ensureArray } from '../services/utils';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorState from '../components/ui/ErrorState';
import '../styles/global.css';

interface Props {
  part?: string;
  extras?: Record<string, string>;
}

export default function Courses({ part = 'list', extras = {} }: Props) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await fetchCourses();
      return ensureArray(response);
    },
  });

  const courses = data ?? [];

  if (isLoading) return <LoadingSpinner text="Loading courses…" />;
  if (isError)   return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;

  if (courses.length === 0) {
    return <div className="sr-empty"><p>No courses available.</p></div>;
  }

  return (
    <div className="sr-container sr-section">
      <div className="sr-grid sr-grid-3">
        {courses.map((course: any) => (
          <article key={course.id} className="sr-card">
            {course.thumbnail ? (
              <img className="sr-card-image" src={course.thumbnail} alt={course.title} loading="lazy" />
            ) : (
              <div className="sr-card-image" style={{ background: 'var(--sr-bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--sr-border)" strokeWidth="1">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </div>
            )}
            <div className="sr-card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem', alignItems: 'center' }}>
                {course.level && <span className="sr-badge sr-badge-info">{course.level}</span>}
                {course.is_free
                  ? <span className="sr-badge sr-badge-success">Free</span>
                  : course.price && <strong style={{ color: 'var(--sr-primary)' }}>${course.price}</strong>
                }
              </div>
              <h3 style={{ margin: '0 0 .5rem', fontSize: '1rem', fontWeight: 700, color: 'var(--sr-text)', lineHeight: 1.3 }}>{course.title}</h3>
              {course.instructor && (
                <p style={{ margin: '0 0 .5rem', fontSize: '.8rem', color: 'var(--sr-text-muted)' }}>by {course.instructor}</p>
              )}
              {course.description && (
                <p style={{ margin: '0 0 .75rem', fontSize: '.8rem', color: 'var(--sr-text-muted)', lineHeight: 1.5 }}>
                  {course.description.slice(0, 100)}{course.description.length > 100 ? '…' : ''}
                </p>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '.5rem' }}>
                {course.duration && (
                  <span style={{ fontSize: '.75rem', color: 'var(--sr-text-muted)', display: 'flex', alignItems: 'center', gap: '.25rem' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {course.duration}
                  </span>
                )}
                <button className="sr-btn sr-btn-outline sr-btn-sm">Enroll</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
