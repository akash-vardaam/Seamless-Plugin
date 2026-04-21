import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, isPast, isValid } from 'date-fns';
import { fetchEventBySlug, fetchGroupEventBySlug } from '../services/eventService';
import { ensureObject } from '../services/utils';
import ErrorState from '../components/ui/ErrorState';
import { SingleEventSkeleton } from '../components/ui/PageSkeletons';
import '../styles/global.css';

interface Props {
  slug: string;
  type?: string;
  part?: string;
  extras?: Record<string, string>;
}

function fmt(d: string) {
  try {
    const dt = parseISO(d);
    return isValid(dt) ? format(dt, 'EEEE, MMMM d, yyyy · h:mm a') : d;
  } catch {
    return d;
  }
}

export default function SingleEvent({ slug, type = 'event', part = 'full' }: Props) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['single-event', slug, type],
    queryFn: async () => {
      if (type === 'group-event') {
        const response = await fetchGroupEventBySlug(slug);
        return ensureObject(response);
      }

      const response = await fetchEventBySlug(slug);
      return ensureObject(response);
    },
    enabled: !!slug,
  });

  const event = data;

  if (!slug) return <ErrorState title="No event specified" />;
  if (isLoading) return <SingleEventSkeleton part={part} />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;
  if (!event) return <ErrorState title="Event not found" />;

  const past = event.end_date && isPast(parseISO(event.end_date));
  const regUrl = event.registration_url;

  const renderPart = () => {
    switch (part) {
      case 'event-title':
        return <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.2, color: 'var(--sr-text)' }}>{event.title}</h1>;
      case 'event-featured-image':
        return event.featured_image ? <div className="sr-hero"><img src={event.featured_image} alt={event.title} /></div> : null;
      case 'event-category':
      case 'event-badges':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', alignItems: 'flex-start' }}>
            {event.category && <span className="sr-tag">{event.category}</span>}
            {event.is_free ? <span className="sr-badge sr-badge-success">Free</span> : event.price && <span className="sr-badge sr-badge-info">${event.price}</span>}
            {past && <span className="sr-badge sr-badge-neutral">Event Passed</span>}
          </div>
        );
      case 'event-location':
        return event.location ? (
          <div className="sr-event-meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span><strong>Location:</strong> {event.location}</span>
          </div>
        ) : null;
      case 'event-schedules':
        return (
          <div className="sr-event-meta">
            {event.start_date && (
              <div className="sr-event-meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span><strong>Starts:</strong> {fmt(event.start_date)}</span>
              </div>
            )}
            {event.end_date && (
              <div className="sr-event-meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span><strong>Ends:</strong> {fmt(event.end_date)}</span>
              </div>
            )}
          </div>
        );
      case 'event-tickets':
      case 'event-register-url':
        return (
          <>
            {!past && regUrl && (
              <div style={{ padding: '1.5rem', background: 'var(--sr-bg-subtle)', borderRadius: 'var(--sr-radius-lg)', border: '1px solid var(--sr-border)', textAlign: 'center' }}>
                <p style={{ margin: '0 0 1rem', fontWeight: 600 }}>Ready to join?</p>
                <a href={regUrl} target="_blank" rel="noopener noreferrer" className="sr-btn sr-btn-primary sr-btn-lg">Register Now</a>
                {event.registration_closes && <p style={{ margin: '.75rem 0 0', fontSize: '.8rem', color: 'var(--sr-text-muted)' }}>Registration closes: {fmt(event.registration_closes)}</p>}
              </div>
            )}
            {past && (
              <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--sr-bg-subtle)', borderRadius: 'var(--sr-radius-lg)', border: '1px solid var(--sr-border)' }}>
                <p style={{ margin: 0, color: 'var(--sr-text-muted)', fontWeight: 600 }}>This event has ended.</p>
              </div>
            )}
          </>
        );
      case 'event-description':
      case 'event-additional-details':
      case 'event-excerpt':
        return event.description ? <div style={{ lineHeight: 1.75, fontSize: '.95rem', color: 'var(--sr-text)', marginBottom: '2rem' }} dangerouslySetInnerHTML={{ __html: event.description }} /> : null;
      case 'event-sidebar':
        return <div>Sidebar Component</div>;
      case 'event-breadcrumbs':
        return <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--sr-text-muted)' }}>Events / {event.category ?? 'Uncategorized'} / {event.title}</div>;
      default:
        return (
          <>
            {event.featured_image && (
              <div className="sr-hero">
                <img src={event.featured_image} alt={event.title} />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
              <div>
                {event.category && <span className="sr-tag" style={{ marginBottom: '.5rem', display: 'inline-block' }}>{event.category}</span>}
                <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.2, color: 'var(--sr-text)' }}>{event.title}</h1>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', alignItems: 'flex-end' }}>
                {event.is_free
                  ? <span className="sr-badge sr-badge-success" style={{ fontSize: '1rem', padding: '.3rem 1rem' }}>Free</span>
                  : event.price && <span className="sr-badge sr-badge-info" style={{ fontSize: '1rem', padding: '.3rem 1rem' }}>${event.price}</span>}
                {past && <span className="sr-badge sr-badge-neutral">Event Passed</span>}
              </div>
            </div>

            <div className="sr-event-meta">
              {event.start_date && (
                <div className="sr-event-meta-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span><strong>Starts:</strong> {fmt(event.start_date)}</span>
                </div>
              )}
              {event.end_date && (
                <div className="sr-event-meta-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span><strong>Ends:</strong> {fmt(event.end_date)}</span>
                </div>
              )}
              {event.location && (
                <div className="sr-event-meta-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span><strong>Location:</strong> {event.location}</span>
                </div>
              )}
              {event.capacity && (
                <div className="sr-event-meta-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span><strong>Capacity:</strong> {event.registered_count ?? 0} / {event.capacity}</span>
                </div>
              )}
            </div>

            {event.description && (
              <div
                style={{ lineHeight: 1.75, fontSize: '.95rem', color: 'var(--sr-text)', marginBottom: '2rem' }}
                dangerouslySetInnerHTML={{ __html: event.description }}
              />
            )}

            {event.tags && event.tags.length > 0 && (
              <div className="sr-tags" style={{ marginBottom: '2rem' }}>
                {event.tags.map((t: string) => <span key={t} className="sr-tag">{t}</span>)}
              </div>
            )}

            {!past && regUrl && (
              <div style={{ padding: '1.5rem', background: 'var(--sr-bg-subtle)', borderRadius: 'var(--sr-radius-lg)', border: '1px solid var(--sr-border)', textAlign: 'center' }}>
                <p style={{ margin: '0 0 1rem', fontWeight: 600 }}>Ready to join?</p>
                <a href={regUrl} target="_blank" rel="noopener noreferrer" className="sr-btn sr-btn-primary sr-btn-lg">
                  Register Now
                </a>
                {event.registration_closes && (
                  <p style={{ margin: '.75rem 0 0', fontSize: '.8rem', color: 'var(--sr-text-muted)' }}>
                    Registration closes: {fmt(event.registration_closes)}
                  </p>
                )}
              </div>
            )}

            {past && (
              <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--sr-bg-subtle)', borderRadius: 'var(--sr-radius-lg)', border: '1px solid var(--sr-border)' }}>
                <p style={{ margin: 0, color: 'var(--sr-text-muted)', fontWeight: 600 }}>This event has ended.</p>
              </div>
            )}
          </>
        );
    }
  };

  return (
    <article className="sr-container sr-section sr-single-event">
      {renderPart()}
    </article>
  );
}
