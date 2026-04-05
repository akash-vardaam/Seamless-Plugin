import React from 'react';
import { format, parseISO, isValid } from 'date-fns';
import type { Event } from '../../api';
import { config } from '../../config';

interface EventCardProps {
  event: Event;
  layout?: 'card' | 'list';
}

function formatDate(dateStr: string) {
  try {
    const d = parseISO(dateStr);
    return isValid(d)
      ? { month: format(d, 'MMM'), day: format(d, 'd'), full: format(d, 'MMMM d, yyyy') }
      : null;
  } catch {
    return null;
  }
}

function buildEventUrl(event: Event) {
  const slug = event.slug || event.uuid || event.id;
  const base = config.siteUrl.replace(/\/$/, '');
  return `${base}/${config.singleEventEndpoint}/${encodeURIComponent(slug)}?type=${event.type ?? 'event'}`;
}

export default function EventCard({ event, layout = 'card' }: EventCardProps) {
  const date = formatDate(event.start_date);
  const url  = buildEventUrl(event);

  if (layout === 'list') {
    return (
      <a href={url} className="sr-event-row" rel="noopener">
        {date && (
          <div className="sr-event-date-box" aria-label={date.full}>
            <span className="month">{date.month}</span>
            <span className="day">{date.day}</span>
          </div>
        )}
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '.95rem' }}>{event.title}</p>
          {event.location && (
            <p style={{ margin: '.2rem 0 0', fontSize: '.8rem', color: 'var(--sr-text-muted)' }}>{event.location}</p>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.35rem' }}>
          {event.is_free
            ? <span className="sr-badge sr-badge-success">Free</span>
            : event.price && <span className="sr-badge sr-badge-info">${event.price}</span>
          }
          {event.category && <span className="sr-tag">{event.category}</span>}
        </div>
      </a>
    );
  }

  return (
    <article className="sr-card">
      {event.featured_image ? (
        <img
          className="sr-card-image"
          src={event.featured_image}
          alt={event.title}
          loading="lazy"
        />
      ) : (
        <div className="sr-card-image" style={{ background: 'var(--sr-bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--sr-border)" strokeWidth="1">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
      )}

      <div className="sr-card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem', alignItems: 'flex-start', gap: '.5rem' }}>
          <p style={{ margin: 0, fontSize: '.75rem', color: 'var(--sr-text-muted)', fontWeight: 600 }}>
            {date ? date.full : event.start_date}
          </p>
          {event.is_free
            ? <span className="sr-badge sr-badge-success">Free</span>
            : event.price && <span className="sr-badge sr-badge-info">${event.price}</span>
          }
        </div>

        <h3 style={{ margin: '0 0 .5rem', fontSize: '1rem', fontWeight: 700, lineHeight: 1.3, color: 'var(--sr-text)' }}>
          <a href={url} style={{ color: 'inherit', textDecoration: 'none' }}>{event.title}</a>
        </h3>

        {event.location && (
          <p style={{ margin: '0 0 .75rem', fontSize: '.8rem', color: 'var(--sr-text-muted)', display: 'flex', alignItems: 'center', gap: '.25rem' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            {event.location}
          </p>
        )}

        {event.category && (
          <div className="sr-tags" style={{ marginBottom: '.75rem' }}>
            <span className="sr-tag">{event.category}</span>
          </div>
        )}

        <a href={url} className="sr-btn sr-btn-primary sr-btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
          View Details
        </a>
      </div>
    </article>
  );
}
