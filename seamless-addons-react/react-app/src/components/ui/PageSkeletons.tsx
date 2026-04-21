import React from 'react';
import Skeleton from './Skeleton';

interface EventsListSkeletonProps {
  view?: 'grid' | 'list';
  showFilter?: boolean;
}

interface SingleEventSkeletonProps {
  part?: string;
}

interface MembershipsSkeletonProps {
  part?: string;
}

function TextBlock({ lines = 3, widths = [] as string[] }) {
  return (
    <div style={{ display: 'grid', gap: '.55rem' }}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          className="sr-skeleton-line"
          style={{ width: widths[index] ?? (index === lines - 1 ? '70%' : '100%') }}
        />
      ))}
    </div>
  );
}

function EventListRowSkeleton() {
  return (
    <div className="sr-event-row">
      <Skeleton className="sr-skeleton-date-box" />
      <div style={{ display: 'grid', gap: '.55rem' }}>
        <Skeleton className="sr-skeleton-line sr-skeleton-line-lg" style={{ width: '72%' }} />
        <Skeleton className="sr-skeleton-line" style={{ width: '44%' }} />
      </div>
      <div className="sr-skeleton-stack-end">
        <Skeleton className="sr-skeleton-chip" style={{ width: '4.5rem' }} />
        <Skeleton className="sr-skeleton-chip sr-skeleton-chip-muted" style={{ width: '5.5rem' }} />
      </div>
    </div>
  );
}

function EventGridCardSkeleton() {
  return (
    <article className="sr-card">
      <Skeleton className="sr-card-image" />
      <div className="sr-card-body">
        <div className="sr-skeleton-inline" style={{ marginBottom: '.75rem' }}>
          <Skeleton className="sr-skeleton-line" style={{ width: '52%' }} />
          <Skeleton className="sr-skeleton-chip" style={{ width: '4rem' }} />
        </div>
        <div style={{ marginBottom: '.75rem' }}>
          <TextBlock lines={2} widths={['84%', '62%']} />
        </div>
        <Skeleton className="sr-skeleton-line" style={{ width: '48%', marginBottom: '.75rem' }} />
        <Skeleton className="sr-skeleton-chip sr-skeleton-chip-muted" style={{ width: '5.25rem', marginBottom: '1rem' }} />
        <Skeleton className="sr-skeleton-button" />
      </div>
    </article>
  );
}

function TableSkeleton({ columns = 4, rows = 4 }: { columns?: number; rows?: number }) {
  return (
    <div className="sr-table-wrap">
      <table className="sr-table">
        <thead>
          <tr>
            {Array.from({ length: columns }, (_, index) => (
              <th key={index}>
                <Skeleton className="sr-skeleton-line" style={{ width: `${70 - index * 8}%` }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }, (_, columnIndex) => (
                <td key={columnIndex}>
                  <Skeleton className="sr-skeleton-line" style={{ width: `${80 - columnIndex * 8}%` }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MembershipCardSkeleton() {
  return (
    <article className="sr-card">
      <div className="sr-card-body">
        <div className="sr-skeleton-inline" style={{ marginBottom: '.9rem' }}>
          <Skeleton className="sr-skeleton-line sr-skeleton-line-lg" style={{ width: '42%' }} />
          <Skeleton className="sr-skeleton-line sr-skeleton-line-lg" style={{ width: '24%' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <TextBlock lines={2} widths={['100%', '72%']} />
        </div>
        <div style={{ display: 'grid', gap: '.65rem', marginBottom: '1.25rem' }}>
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="sr-skeleton-inline" style={{ justifyContent: 'flex-start' }}>
              <Skeleton className="sr-skeleton-dot" circle />
              <Skeleton className="sr-skeleton-line" style={{ width: `${68 - index * 8}%` }} />
            </div>
          ))}
        </div>
        <Skeleton className="sr-skeleton-button" />
      </div>
    </article>
  );
}

function CourseCardSkeleton() {
  return (
    <article className="sr-card">
      <Skeleton className="sr-card-image" />
      <div className="sr-card-body">
        <div className="sr-skeleton-inline" style={{ marginBottom: '.75rem' }}>
          <Skeleton className="sr-skeleton-chip sr-skeleton-chip-muted" style={{ width: '4.75rem' }} />
          <Skeleton className="sr-skeleton-chip" style={{ width: '3.75rem' }} />
        </div>
        <div style={{ marginBottom: '.65rem' }}>
          <TextBlock lines={2} widths={['86%', '58%']} />
        </div>
        <Skeleton className="sr-skeleton-line" style={{ width: '36%', marginBottom: '.6rem' }} />
        <div style={{ marginBottom: '1rem' }}>
          <TextBlock lines={2} widths={['100%', '76%']} />
        </div>
        <div className="sr-skeleton-inline">
          <Skeleton className="sr-skeleton-line" style={{ width: '26%' }} />
          <Skeleton className="sr-skeleton-button sr-skeleton-button-sm" style={{ width: 86 }} />
        </div>
      </div>
    </article>
  );
}

export function AppLoadingSkeleton() {
  return (
    <div className="sr-container sr-section">
      <div style={{ display: 'grid', gap: '1rem' }}>
        <Skeleton className="sr-skeleton-line sr-skeleton-line-lg" style={{ width: '32%' }} />
        <Skeleton className="sr-skeleton-line" style={{ width: '58%' }} />
        <div className="sr-grid sr-grid-3">
          {Array.from({ length: 3 }, (_, index) => <EventGridCardSkeleton key={index} />)}
        </div>
      </div>
    </div>
  );
}

export function EventsListSkeleton({ view = 'list', showFilter = true }: EventsListSkeletonProps) {
  return (
    <div className="sr-container sr-section">
      {showFilter && (
        <div className="sr-filter-bar">
          <Skeleton className="sr-skeleton-input" style={{ maxWidth: 220 }} />
          <Skeleton className="sr-skeleton-input" style={{ maxWidth: 160 }} />
          <div style={{ marginLeft: 'auto' }}>
            <Skeleton className="sr-skeleton-input" style={{ width: 88, height: 40 }} />
          </div>
        </div>
      )}

      {view === 'grid' ? (
        <div className="sr-grid sr-grid-3">
          {Array.from({ length: 6 }, (_, index) => <EventGridCardSkeleton key={index} />)}
        </div>
      ) : (
        <div className="sr-section" style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {Array.from({ length: 5 }, (_, index) => <EventListRowSkeleton key={index} />)}
        </div>
      )}
    </div>
  );
}

export function SingleEventSkeleton({ part = 'full' }: SingleEventSkeletonProps) {
  if (part === 'event-title') {
    return <Skeleton className="sr-skeleton-line sr-skeleton-line-xl" style={{ width: '55%' }} />;
  }

  if (part === 'event-featured-image') {
    return <Skeleton className="sr-skeleton-hero" />;
  }

  if (part === 'event-category' || part === 'event-badges') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', alignItems: 'flex-start' }}>
        <Skeleton className="sr-skeleton-chip sr-skeleton-chip-muted" style={{ width: '5rem' }} />
        <Skeleton className="sr-skeleton-chip" style={{ width: '4rem' }} />
      </div>
    );
  }

  if (part === 'event-location') {
    return <Skeleton className="sr-skeleton-line" style={{ width: '40%' }} />;
  }

  if (part === 'event-schedules') {
    return (
      <div className="sr-event-meta">
        <Skeleton className="sr-skeleton-line" style={{ width: '30%' }} />
        <Skeleton className="sr-skeleton-line" style={{ width: '28%' }} />
      </div>
    );
  }

  if (part === 'event-tickets' || part === 'event-register-url') {
    return (
      <div className="sr-skeleton-panel">
        <Skeleton className="sr-skeleton-line sr-skeleton-line-lg" style={{ width: '30%', margin: '0 auto .9rem' }} />
        <Skeleton className="sr-skeleton-button" style={{ width: 180, margin: '0 auto' }} />
      </div>
    );
  }

  if (part === 'event-description' || part === 'event-additional-details' || part === 'event-excerpt') {
    return <TextBlock lines={5} widths={['100%', '96%', '92%', '88%', '64%']} />;
  }

  if (part === 'event-breadcrumbs') {
    return <Skeleton className="sr-skeleton-line" style={{ width: '42%' }} />;
  }

  if (part === 'event-sidebar') {
    return <Skeleton className="sr-skeleton-panel" style={{ minHeight: 220 }} />;
  }

  return (
    <article className="sr-container sr-section sr-single-event">
      <Skeleton className="sr-skeleton-hero" />
      <div className="sr-skeleton-inline" style={{ alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{ display: 'grid', gap: '.6rem', flex: 1 }}>
          <Skeleton className="sr-skeleton-chip sr-skeleton-chip-muted" style={{ width: '5rem' }} />
          <Skeleton className="sr-skeleton-line sr-skeleton-line-xl" style={{ width: '66%' }} />
        </div>
        <div className="sr-skeleton-stack-end">
          <Skeleton className="sr-skeleton-chip" style={{ width: '4.5rem' }} />
          <Skeleton className="sr-skeleton-chip sr-skeleton-chip-muted" style={{ width: '6rem' }} />
        </div>
      </div>
      <div className="sr-event-meta">
        <Skeleton className="sr-skeleton-line" style={{ width: '28%' }} />
        <Skeleton className="sr-skeleton-line" style={{ width: '26%' }} />
        <Skeleton className="sr-skeleton-line" style={{ width: '22%' }} />
      </div>
      <div style={{ marginBottom: '2rem' }}>
        <TextBlock lines={6} widths={['100%', '96%', '94%', '90%', '86%', '58%']} />
      </div>
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <Skeleton className="sr-skeleton-chip sr-skeleton-chip-muted" style={{ width: '5rem' }} />
        <Skeleton className="sr-skeleton-chip sr-skeleton-chip-muted" style={{ width: '6rem' }} />
        <Skeleton className="sr-skeleton-chip sr-skeleton-chip-muted" style={{ width: '4.5rem' }} />
      </div>
      <div className="sr-skeleton-panel">
        <Skeleton className="sr-skeleton-line sr-skeleton-line-lg" style={{ width: '24%', margin: '0 auto .9rem' }} />
        <Skeleton className="sr-skeleton-button" style={{ width: 180, margin: '0 auto' }} />
      </div>
    </article>
  );
}

export function MembershipsSkeleton({ part = 'list' }: MembershipsSkeletonProps) {
  if (part === 'compare-plans') {
    return (
      <div className="sr-container sr-section">
        <TableSkeleton columns={4} rows={4} />
      </div>
    );
  }

  return (
    <div className="sr-container sr-section">
      <div className="sr-grid sr-grid-2">
        {Array.from({ length: 4 }, (_, index) => <MembershipCardSkeleton key={index} />)}
      </div>
    </div>
  );
}

export function CoursesSkeleton() {
  return (
    <div className="sr-container sr-section">
      <div className="sr-grid sr-grid-3">
        {Array.from({ length: 6 }, (_, index) => <CourseCardSkeleton key={index} />)}
      </div>
    </div>
  );
}

export function DashboardProfileSkeleton() {
  return (
    <div>
      <div className="sr-skeleton-inline" style={{ marginBottom: '1.5rem' }}>
        <Skeleton className="sr-skeleton-line sr-skeleton-line-xl" style={{ width: '24%' }} />
        <Skeleton className="sr-skeleton-button sr-skeleton-button-sm" style={{ width: 112 }} />
      </div>
      <div className="sr-card">
        <div className="sr-card-body">
          <div className="sr-grid sr-grid-2">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} style={{ display: 'grid', gap: '.45rem' }}>
                <Skeleton className="sr-skeleton-line" style={{ width: '34%' }} />
                <Skeleton className="sr-skeleton-line sr-skeleton-line-lg" style={{ width: `${72 - (index % 2) * 10}%` }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardMembershipsSkeleton() {
  return (
    <div>
      <Skeleton className="sr-skeleton-line sr-skeleton-line-xl" style={{ width: '28%', marginBottom: '1.5rem' }} />
      <Skeleton className="sr-skeleton-line sr-skeleton-line-lg" style={{ width: '18%', marginBottom: '.75rem' }} />
      <div style={{ marginBottom: '2rem' }}>
        <TableSkeleton columns={4} rows={3} />
      </div>
      <Skeleton className="sr-skeleton-line sr-skeleton-line-lg" style={{ width: '16%', marginBottom: '.75rem' }} />
      <TableSkeleton columns={4} rows={3} />
    </div>
  );
}

export function DashboardCoursesSkeleton() {
  return (
    <div>
      <Skeleton className="sr-skeleton-line sr-skeleton-line-xl" style={{ width: '20%', marginBottom: '1.5rem' }} />
      <div className="sr-grid sr-grid-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="sr-card">
            <div className="sr-card-body">
              <Skeleton className="sr-skeleton-line sr-skeleton-line-lg" style={{ width: `${72 - (index % 2) * 10}%`, marginBottom: '.8rem' }} />
              <div style={{ marginTop: '.75rem' }}>
                <div className="sr-skeleton-inline" style={{ marginBottom: '.4rem' }}>
                  <Skeleton className="sr-skeleton-line" style={{ width: '18%' }} />
                  <Skeleton className="sr-skeleton-line" style={{ width: '10%' }} />
                </div>
                <Skeleton className="sr-skeleton-progress" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardOrdersSkeleton() {
  return (
    <div>
      <Skeleton className="sr-skeleton-line sr-skeleton-line-xl" style={{ width: '24%', marginBottom: '1.5rem' }} />
      <TableSkeleton columns={5} rows={4} />
    </div>
  );
}

export function DashboardOrganizationSkeleton() {
  return (
    <div>
      <Skeleton className="sr-skeleton-line sr-skeleton-line-xl" style={{ width: '28%', marginBottom: '1.5rem' }} />
      <div className="sr-card" style={{ marginBottom: '1.5rem' }}>
        <div className="sr-card-body">
          <Skeleton className="sr-skeleton-line sr-skeleton-line-lg" style={{ width: '34%', marginBottom: '.5rem' }} />
          <Skeleton className="sr-skeleton-line" style={{ width: '28%' }} />
        </div>
      </div>
      <Skeleton className="sr-skeleton-line sr-skeleton-line-lg" style={{ width: '22%', marginBottom: '.75rem' }} />
      <TableSkeleton columns={4} rows={4} />
    </div>
  );
}
