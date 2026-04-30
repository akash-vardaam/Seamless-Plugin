
import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import { useSegmentedEventPagination } from '../hooks/useSegmentedEventPagination';
import { useCategories } from '../hooks/useCategories';
import { useTags } from '../hooks/useTags';
import { useFilterState, useClientFilters } from '../hooks/useFilters';
import { FilterBar } from './FilterBar';
import { ViewSwitcher } from './ViewSwitcher';
import { Card } from './Card';
import { CalendarView } from './CalendarView';
import { Pagination } from './Pagination';
import type { ViewType, Event } from '../types/event';
import { useCalendarEvents } from '../hooks/useCalendarEvents';
import { useShadowRoot } from './ShadowRoot';
import { SeamlessInitialLoader } from './ui/SeamlessInitialLoader';
import { useInitialLoading } from '../hooks/useInitialLoading';
// ... defaults

export const EventListView: React.FC = () => {
    const shadowRoot = useShadowRoot();
    // 1. Categories
    const {
        categories,
        loading: categoriesLoading
    } = useCategories();
    const {
        tags,
        loading: tagsLoading
    } = useTags();

    // 2. Filter State
    const { filters, updateFilter, resetFilters } = useFilterState();
    const [searchParams, setSearchParams] = useSearchParams();

    // 3. Current page state (drives backend pagination)
    const currentPage = parseInt(searchParams.get('page') || '1');

    // Calendar State
    // Initialize from URL or default to today
    const calendarDate = useMemo(() => {
        const dateParam = searchParams.get('date');
        return dateParam ? new Date(dateParam) : new Date();
    }, [searchParams]);

    // Helper to update URL params
    const updateUrlParams = (updates: Record<string, string | null>) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            Object.entries(updates).forEach(([key, value]) => {
                if (value === null || (key === 'page' && value === '1')) {
                    newParams.delete(key);
                } else {
                    newParams.set(key, value);
                }
            });

            // In WordPress mode we use MemoryRouter which keeps its state in memory only.
            // Sync the updated params back to the real browser URL so that filters are
            // reflected in the address bar and can be bookmarked / shared.
            try {
                const realParams = new URLSearchParams(window.location.search);
                newParams.forEach((val, key) => {
                    // Never overwrite the seamless_event deep-link param
                    if (key !== 'seamless_event') realParams.set(key, val);
                });
                // Remove any filter keys that were cleared
                Array.from(realParams.keys()).forEach(key => {
                    if (!newParams.has(key) && key !== 'seamless_event') realParams.delete(key);
                });
                const qs = realParams.toString();
                history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
            } catch {
                // Silently skip if history API is not available
            }

            return newParams;
        });
    };

    // 4. Data — fetches one API page at a time (per_page=8)
    const {
        events: paginatedItems, loading: paginatedLoading, error: paginatedError, totalPages
    } = useSegmentedEventPagination(filters, currentPage);

    // 5. View state
    const getDefaultView = (): ViewType => 'list';

    const currentView = (searchParams.get('view') as ViewType) || getDefaultView();
    const currentSubView = (searchParams.get('cal_view') as any) || 'MONTH';
    const currentIsListView = searchParams.get('cal_list') === 'true';

    // 6. Calendar Data - fetches by month or year depending on view
    const {
        events: calendarItems, loading: calendarLoading, error: calendarError
    } = useCalendarEvents(calendarDate, filters, currentView === 'calendar', currentSubView);

    // Determine active data source
    const items = currentView === 'calendar' ? calendarItems : paginatedItems;
    const itemsLoading = currentView === 'calendar' ? calendarLoading : paginatedLoading;
    const error = currentView === 'calendar' ? calendarError : paginatedError;

    // 7. Client-side filtering (Year fallback)
    const eventsData = (items || []) as Event[];

    // Note: useClientFilters handles "Year" filtering which API cannot do.
    const filteredItems = useClientFilters(eventsData, filters);

    const handleViewChange = (view: ViewType) => {
        // Reset page to 1 on view change
        updateUrlParams({ view, page: '1' });
    };

    const handleCalViewChange = (cal_view: string) => {
        updateUrlParams({ cal_view });
    };

    const handleCalListToggle = () => {
        updateUrlParams({ cal_list: currentIsListView ? null : 'true' });
    };

    const handleMonthChange = (date: Date) => {
        // Store simple date string YYYY-MM-DD or just ISO
        updateUrlParams({ date: date.toISOString() });
    };

    const handlePageChange = (page: number) => {
        // Clamp page to valid range
        const safePage = Math.max(1, Math.min(page, totalPages));
        updateUrlParams({ page: safePage.toString() });
        // Scroll to top of the events container - search within shadow root first
        const container = (shadowRoot || document).getElementById('seamless-event-container');
        container?.scrollIntoView({ behavior: 'smooth' });
    };

    // Derive years from loaded data
    const years = useMemo(() => {
        const s = new Set<string>();
        items.forEach(e => {
            if (e.start_date) {
                const y = new Date(e.start_date).getFullYear().toString();
                if (!isNaN(parseInt(y))) s.add(y);
            }
        });
        return Array.from(s).sort((a, b) => parseInt(b) - parseInt(a));
    }, [items]);

    const loading = itemsLoading || categoriesLoading || tagsLoading;
    const showInitialLoader = useInitialLoading(loading);
    const weekDayLabels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    const listItems = useMemo(() => {
        let previousDateKey = '';

        return filteredItems.map((item) => {
            const rawDate = item?.start_date || item?.formatted_start_date || '';
            const parsedDate = rawDate ? new Date(rawDate) : null;
            const dateKey = parsedDate && !Number.isNaN(parsedDate.getTime())
                ? parsedDate.toLocaleDateString('en-CA')
                : `${item.id}-${rawDate}`;
            const showTimelineDate = dateKey !== previousDateKey;
            previousDateKey = dateKey;

            return { item, showTimelineDate };
        });
    }, [filteredItems]);

    const renderCalendarLoadingSkeleton = () => {
        const headerSkeleton = (
            <div className="calendar-header seamless-calendar-header--skeleton">
                <div className="calendar-title seamless-calendar-title--skeleton">
                    <div className="date-info">
                        <div className="month-abbr">
                            <Skeleton width={34} containerClassName="seamless-skeleton-container" />
                        </div>
                        <div className="day-number">
                            <Skeleton width={26} containerClassName="seamless-skeleton-container" />
                        </div>
                    </div>
                    <div className="cal-selectors-wrap">
                        <div className="cal-selectors-row">
                            <div className="seamless-calendar-skeleton-pill">
                                <Skeleton width={110} containerClassName="seamless-skeleton-container" />
                            </div>
                            <div className="seamless-calendar-skeleton-pill">
                                <Skeleton width={80} containerClassName="seamless-skeleton-container" />
                            </div>
                        </div>
                        <div className="date-range">
                            <Skeleton width={230} containerClassName="seamless-skeleton-container" />
                        </div>
                    </div>
                </div>
                <div className="calendar-controls seamless-calendar-controls--skeleton">
                    <div className="seamless-calendar-skeleton-nav">
                        <Skeleton height={42} containerClassName="seamless-skeleton-container" />
                    </div>
                    <div className="seamless-calendar-skeleton-view-switch">
                        <Skeleton height={42} containerClassName="seamless-skeleton-container" />
                    </div>
                </div>
            </div>
        );

        if (currentIsListView) {
            return (
                <div className="seamless-calendar-container seamless-calendar-container--skeleton">
                    {headerSkeleton}
                    <div className="seamless-list-view seamless-calendar-list--skeleton">
                        {Array.from({ length: 8 }).map((_, idx) => (
                            <div key={idx} className="seamless-list-view-item">
                                <div className="seamless-list-view-date">
                                    <Skeleton width={128} containerClassName="seamless-skeleton-container" />
                                </div>
                                <div className="seamless-list-view-info">
                                    <span className="seamless-list-view-title">
                                        <Skeleton width={`${78 - idx * 4}%`} containerClassName="seamless-skeleton-container" />
                                    </span>
                                    <span className="seamless-list-view-time">
                                        <Skeleton width={92} containerClassName="seamless-skeleton-container" />
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (currentSubView === 'WEEK') {
            return (
                <div className="seamless-calendar-container seamless-calendar-container--skeleton">
                    {headerSkeleton}
                    <div className="seamless-calendar-skeleton-week">
                        <div className="seamless-calendar-skeleton-week-days">
                            <div className="seamless-calendar-skeleton-week-day">
                                <span><Skeleton width={32} containerClassName="seamless-skeleton-container" /></span>
                            </div>
                            {weekDayLabels.map((day, idx) => (
                                <div key={day + idx} className="seamless-calendar-skeleton-week-day">
                                    <span><Skeleton width={22} containerClassName="seamless-skeleton-container" /></span>
                                    <p><Skeleton width={34} containerClassName="seamless-skeleton-container" /></p>
                                </div>
                            ))}
                        </div>
                        <div className="seamless-calendar-skeleton-week-body">
                            <div className="seamless-calendar-skeleton-time-col">
                                {Array.from({ length: 8 }).map((_, idx) => (
                                    <p key={idx}><Skeleton width={34} containerClassName="seamless-skeleton-container" /></p>
                                ))}
                            </div>
                            <div className="seamless-calendar-skeleton-week-cols">
                                {Array.from({ length: 7 }).map((_, colIdx) => (
                                    <div key={colIdx} className="seamless-calendar-skeleton-week-col">
                                        <span><Skeleton height={18} width="88%" containerClassName="seamless-skeleton-container" /></span>
                                        <span><Skeleton height={22} width="72%" containerClassName="seamless-skeleton-container" /></span>
                                        <span><Skeleton height={18} width="64%" containerClassName="seamless-skeleton-container" /></span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (currentSubView === 'DAY') {
            return (
                <div className="seamless-calendar-container seamless-calendar-container--skeleton">
                    {headerSkeleton}
                    <div className="seamless-calendar-skeleton-day">
                        <div className="seamless-calendar-skeleton-day-head">
                            <span><Skeleton width={34} containerClassName="seamless-skeleton-container" /></span>
                            <p><Skeleton width={130} containerClassName="seamless-skeleton-container" /></p>
                        </div>
                        <div className="seamless-calendar-skeleton-day-body">
                            <div className="seamless-calendar-skeleton-time-col">
                                {Array.from({ length: 8 }).map((_, idx) => (
                                    <p key={idx}><Skeleton width={34} containerClassName="seamless-skeleton-container" /></p>
                                ))}
                            </div>
                            <div className="seamless-calendar-skeleton-day-col">
                                <span><Skeleton height={20} width="94%" containerClassName="seamless-skeleton-container" /></span>
                                <span><Skeleton height={24} width="82%" containerClassName="seamless-skeleton-container" /></span>
                                <span><Skeleton height={20} width="68%" containerClassName="seamless-skeleton-container" /></span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (currentSubView === 'YEAR') {
            return (
                <div className="seamless-calendar-container seamless-calendar-container--skeleton">
                    {headerSkeleton}
                    <div className="seamless-year-view seamless-year-view--skeleton">
                        {Array.from({ length: 12 }).map((_, idx) => (
                            <div key={idx} className="seamless-year-month-card seamless-year-month-card--skeleton">
                                <div className="seamless-year-month-title">
                                    <Skeleton width={56} containerClassName="seamless-skeleton-container" />
                                </div>
                                <div className="seamless-calendar-skeleton-year-days">
                                    {Array.from({ length: 35 }).map((__, dayIdx) => (
                                        <span key={dayIdx}><Skeleton width={12} height={12} containerClassName="seamless-skeleton-container" /></span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div className="seamless-calendar-container seamless-calendar-container--skeleton">
                {headerSkeleton}
                <div className="seamless-calendar-skeleton-month">
                    <div className="seamless-month-header-row">
                        {weekDayLabels.map((day) => (
                            <div key={day} className="seamless-month-header-cell">
                                <span><Skeleton width={36} containerClassName="seamless-skeleton-container" /></span>
                            </div>
                        ))}
                    </div>
                    <div className="seamless-calendar-skeleton-month-grid">
                        {Array.from({ length: 42 }).map((_, idx) => (
                            <div key={idx} className="seamless-month-cell seamless-calendar-skeleton-month-cell">
                                <span><Skeleton width={24} containerClassName="seamless-skeleton-container" /></span>
                                <p><Skeleton count={1.2} containerClassName="seamless-skeleton-container" /></p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    // ── Render ─────────────────────────────────────────────────────
    if (error) {
        return (
            <div className="seamless-page-wrapper">
                <div className="seamless-error-container">
                    <p className="seamless-error-title">Error loading items</p>
                    <p className="seamless-error-message">{error}</p>
                </div>
            </div>
        );
    }

    if (showInitialLoader) {
        return <SeamlessInitialLoader message="Loading events..." />;
    }

    return (
        <section className="seamless-container">
            <section className="seamless-filter-section">
                <FilterBar
                    search={filters.search}
                    onSearchChange={(v) => updateFilter('search', v)}
                    status={filters.status}
                    onStatusChange={(v) => updateFilter('status', v as any)}
                    categories={categories}
                    selectedCategories={filters.categories}
                    onCategoryToggle={(categoryId) => {
                        const nextCategories = filters.categories.includes(categoryId)
                            ? filters.categories.filter((id) => id !== categoryId)
                            : [...filters.categories, categoryId];
                        updateFilter('categories', nextCategories);
                    }}
                    tags={tags}
                    selectedTags={filters.tags}
                    onTagToggle={(tagId) => {
                        const nextTags = filters.tags.includes(tagId)
                            ? filters.tags.filter((id) => id !== tagId)
                            : [...filters.tags, tagId];
                        updateFilter('tags', nextTags);
                    }}
                    year={filters.year}
                    onYearChange={(v) => updateFilter('year', v)}
                    years={years}
                    onReset={resetFilters}
                />
            </section>

            <section className="seamless-results-info">
                <span className="seamless-results-text">
                    {loading ? (
                        <span><Skeleton width={180} containerClassName="seamless-skeleton-container" /></span>
                    ) : (
                        <>
                            Showing{' '}
                            <span className="seamless-results-count">{filteredItems.length}</span>{' '}
                            item(s)
                            {currentView !== 'calendar' && (
                                <>
                                    {' · '}Page {currentPage} of {totalPages}
                                </>
                            )}
                        </>
                    )}
                </span>
                <ViewSwitcher currentView={currentView} onViewChange={handleViewChange} />
            </section>

            <main className="seamless-items-display seamless-items-display--skeleton-frame">
                {loading ? (
                    <SkeletonTheme baseColor="#e5e7eb" highlightColor="#f8fafc">
                        {currentView === 'calendar' ? (
                            renderCalendarLoadingSkeleton()
                        ) : currentView === 'list' ? (
                            <div className="seamless-items-list seamless-items-list--skeleton">
                                {Array.from({ length: 6 }).map((_, idx) => (
                                    <article
                                        key={idx}
                                        className="seamless-card-modern seamless-card-modern--skeleton"
                                    >
                                        <div className="seamless-card-modern-timeline">
                                            <div className="seamless-card-modern-date-group">
                                                <span className="seamless-card-modern-date">
                                                    <Skeleton width={92} containerClassName="seamless-skeleton-container" />
                                                </span>
                                                <span className="seamless-card-modern-weekday">
                                                    <Skeleton width={74} containerClassName="seamless-skeleton-container" />
                                                </span>
                                            </div>
                                            <span className="seamless-card-modern-dot" />
                                        </div>

                                        <div className="seamless-card-modern-shell">
                                            <div className="seamless-card-modern-content">
                                                <div className="seamless-card-modern-body">
                                                    <div className="seamless-card-modern-title">
                                                        <Skeleton height={26} width={`${78 - (idx % 3) * 8}%`} containerClassName="seamless-skeleton-container" />
                                                    </div>

                                                    <div className="seamless-card-modern-meta">
                                                        <div className="seamless-card-modern-meta-row seamless-card-modern-meta-row--skeleton">
                                                            <Skeleton circle width={14} height={14} containerClassName="seamless-skeleton-icon" />
                                                            <Skeleton width={130} containerClassName="seamless-skeleton-container" />
                                                        </div>
                                                        <div className="seamless-card-modern-meta-row seamless-card-modern-meta-row--skeleton">
                                                            <Skeleton circle width={14} height={14} containerClassName="seamless-skeleton-icon" />
                                                            <Skeleton width={190} containerClassName="seamless-skeleton-container" />
                                                        </div>
                                                        <div className="seamless-card-modern-meta-row seamless-card-modern-meta-row--skeleton">
                                                            <Skeleton circle width={14} height={14} containerClassName="seamless-skeleton-icon" />
                                                            <Skeleton width={220} containerClassName="seamless-skeleton-container" />
                                                        </div>
                                                    </div>

                                                    <div className="seamless-card-modern-description">
                                                        <Skeleton count={2} containerClassName="seamless-skeleton-container" />
                                                    </div>

                                                    <div className="seamless-card-modern-link seamless-card-modern-link--skeleton">
                                                        <Skeleton width={86} containerClassName="seamless-skeleton-container" />
                                                        <Skeleton circle width={14} height={14} containerClassName="seamless-skeleton-icon" />
                                                    </div>
                                                </div>

                                                <div className="seamless-card-modern-image-wrap">
                                                    <div className="seamless-card-modern-image seamless-card-modern-image--skeleton">
                                                        <Skeleton height="100%" borderRadius={12} containerClassName="seamless-skeleton-container" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <div className="seamless-items-grid seamless-items-grid--skeleton">
                                {Array.from({ length: 6 }).map((_, idx) => (
                                    <article key={idx} className="seamless-card seamless-card--skeleton">
                                        <div className="seamless-card-image-container">
                                            <Skeleton height={200} borderRadius={0} />
                                        </div>
                                        <div className="seamless-card-content">
                                            <div className="seamless-card-title"><Skeleton height={26} width="76%" containerClassName="seamless-skeleton-container" /></div>
                                            <div className="seamless-card-date"><Skeleton width={210} containerClassName="seamless-skeleton-container" /></div>
                                            <div className="seamless-card-description"><Skeleton count={2.4} containerClassName="seamless-skeleton-container" /></div>
                                            <div className="seamless-card-time"><Skeleton width={165} containerClassName="seamless-skeleton-container" /></div>
                                            <div className="seamless-card-see-details seamless-card-see-details--skeleton">
                                                <Skeleton height={18} containerClassName="seamless-skeleton-container" />
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </SkeletonTheme>
                ) : filteredItems.length === 0 ? (
                    <div className="seamless-empty-state">
                        <p className="seamless-empty-state-text">No items found matching your filters.</p>
                    </div>
                ) : !loading && currentView === 'calendar' ? (
                    <CalendarView
                        events={filteredItems}
                        currentDate={calendarDate}
                        onDateChange={handleMonthChange}
                        viewMode={currentSubView}
                        onViewModeChange={handleCalViewChange}
                        isListView={currentIsListView}
                        onListViewToggle={handleCalListToggle}
                    />
                ) : !loading && currentView === 'grid' ? (
                    <>
                        <div className="seamless-items-grid">
                            {filteredItems.map(item => (
                                <Card key={item?.id} item={item} layout="grid" />
                            ))}
                        </div>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                            showPageNumbers
                        />
                    </>
                ) : !loading && (
                    <>
                        <div className="seamless-items-list">
                            {listItems.map(({ item, showTimelineDate }) => (
                                <Card
                                    key={item?.id}
                                    item={item}
                                    layout="list"
                                    listVariant="modern"
                                    showTimelineDate={showTimelineDate}
                                />
                            ))}
                        </div>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                            showPageNumbers
                        />
                    </>
                )}
            </main>
        </section>
    );
};
