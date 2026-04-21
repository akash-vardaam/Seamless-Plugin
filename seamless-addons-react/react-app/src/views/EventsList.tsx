import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchEvents } from '../services/eventService';
import { ensureArray } from '../services/utils';
import EventCard from '../components/events/EventCard';
import ErrorState from '../components/ui/ErrorState';
import { EventsListSkeleton } from '../components/ui/PageSkeletons';
import '../styles/global.css';

interface Props {
  extras: Record<string, string>;
}

type ViewMode = 'grid' | 'list';

export default function EventsList({ extras }: Props) {
  const initialView = (extras['shortcodeView'] as ViewMode)
    ?? (extras['default_view'] as ViewMode)
    ?? 'list';

  const [view, setView] = useState<ViewMode>(initialView === 'all' ? 'list' : initialView);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(extras['shortcodeCategory'] ?? extras['category_slug'] ?? '');
  const [sort, setSort] = useState(extras['shortcodeSort'] ?? extras['sort_by'] ?? 'all');
  const perPage = extras['events_per_page'] ?? '12';
  const showFilter = extras['show_search_bar'] !== 'no';

  const params: Record<string, any> = {
    page: String(page),
    per_page: perPage,
  };
  if (search) params['search'] = search;
  if (category) params['category'] = category;
  if (sort !== 'all') params['sort'] = sort;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['events', page, search, category, sort, perPage],
    queryFn: async () => {
      const response = await fetchEvents(params);
      const events = ensureArray(response);
      return {
        data: events,
        meta: {
          current_page: page,
          last_page: 1,
          per_page: parseInt(perPage, 10),
          total: events.length,
        },
      };
    },
  });

  const events = data?.data ?? [];
  const totalPages = data?.meta?.last_page ?? 1;

  if (isLoading) {
    return <EventsListSkeleton view={view} showFilter={showFilter} />;
  }

  return (
    <div className="sr-container sr-section">
      {showFilter && (
        <div className="sr-filter-bar">
          <input
            className="sr-input"
            style={{ maxWidth: 220 }}
            type="search"
            placeholder="Search events..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <select
            className="sr-select"
            style={{ maxWidth: 160 }}
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Events</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>

          <span style={{ marginLeft: 'auto' }}>
            <div className="sr-view-toggle">
              <button
                className={`sr-view-btn${view === 'list' ? ' active' : ''}`}
                title="List view"
                onClick={() => setView('list')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </button>
              <button
                className={`sr-view-btn${view === 'grid' ? ' active' : ''}`}
                title="Grid view"
                onClick={() => setView('grid')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              </button>
            </div>
          </span>
        </div>
      )}

      {isError && <ErrorState message={(error as Error).message} onRetry={() => refetch()} />}

      {!isError && (
        <>
          {events.length === 0 ? (
            <div className="sr-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <p>No events found.</p>
            </div>
          ) : (
            <div
              className={view === 'grid' ? 'sr-grid sr-grid-3' : 'sr-section'}
              style={view === 'list' ? { display: 'flex', flexDirection: 'column', gap: '.75rem' } : {}}
            >
              {events.map((evt: any) => (
                <EventCard key={evt.id || evt.uuid} event={evt} layout={view} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="sr-pagination">
              <button className="sr-page-btn" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`sr-page-btn${p === page ? ' active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button className="sr-page-btn" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
