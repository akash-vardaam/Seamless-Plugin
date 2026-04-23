import React, { useState, useRef, useEffect } from 'react';
import { useCourses } from '../hooks/useCourses';
import { SearchInput } from './SearchInput';
import { Pagination } from './Pagination';
import { LoadingSpinner } from './LoadingSpinner';

const accessOptions = [
    { value: '', label: 'All Courses' },
    { value: 'free', label: 'Free' },
    { value: 'paid', label: 'Paid' },
];



export const CoursesView: React.FC = () => {
    const {
        courses,
        pagination,
        loading,
        error,
        filters,
        availableYears,
        updateSearch,
        updateAccess,
        updateSort,
        updateYear,
        updatePage,
        resetFilters
    } = useCourses();

    const handleCourseClick = (slug: string) => {
        // Course detail pages should open on Seamless client domain from settings.
        const cfg = (window as any).seamlessReactConfig;
        const clientDomain = (cfg?.clientDomain || '').toString().trim();
        const baseUrl = (clientDomain || cfg?.siteUrl || window.location.origin).replace(/\/$/, '');
        window.location.href = `${baseUrl}/courses/${slug}`;
    };

    // Sort options updated: removed "All Years" from label concept, now just "Sort By" or specific
    const sortOptions = [
        { value: 'newest', label: 'Newest First' },
        { value: 'oldest', label: 'Oldest First' },
        { value: 'title_asc', label: 'A–Z' },
        { value: 'title_desc', label: 'Z–A' },
    ];

    // Year options - constructed from availableYears
    const yearOptions = [
        { value: '', label: 'All Years' },
        ...availableYears.map(year => ({ value: String(year), label: String(year) }))
    ];

    // Helper to strip HTML and truncate
    const getShortDescription = (html: string, length: number = 100) => {
        const div = document.createElement('div');
        div.innerHTML = html;
        const text = div.textContent || div.innerText || '';
        if (text.length <= length) return text;
        return text.substr(0, length).trim() + '...';
    };

    const [openPanel, setOpenPanel] = useState<'access' | 'year' | 'sort' | null>(null);
    const filterContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const path = event.composedPath();
            if (filterContainerRef.current && !path.includes(filterContainerRef.current)) {
                setOpenPanel(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const activeFilterCount = (filters.access ? 1 : 0) + (filters.year ? 1 : 0) + (filters.sort && filters.sort !== 'newest' ? 1 : 0);

    const checkIcon = (
        <span className="seamless-filter-check-icon" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3.5 8.5 6.5 11.5 12.5 4.5"></polyline>
            </svg>
        </span>
    );

    const formatDuration = (minutes: number) => {
        if (!minutes) return '0 mins';
        return `${minutes} mins`; // Or convert to hours if > 60
    };

    if (error) {
        return (
            <div className="seamless-courses-container">
                <div className="seamless-error-container" style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>
                    <p className="seamless-error-title" style={{ fontSize: 'var(--seamless-font-size-xl)', fontWeight: 600 }}>Error loading courses</p>
                    <p className="seamless-error-message">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="seamless-courses-container">
            {/* Filter Bar */}
            <div className="seamless-filter-shell" ref={filterContainerRef} style={{ marginBottom: '40px' }}>
                <div className="seamless-filter-topbar">
                    <div className="seamless-filter-search">
                        <div className="seamless-filter-search-field">
                            <span className="seamless-filter-search-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="7"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </span>
                            <SearchInput value={filters.search} onChange={updateSearch} placeholder="Search courses by title or description..." />
                        </div>
                    </div>

                    <div className="seamless-filter-actions">
                        {/* Access Filter */}
                        <div className="seamless-filter-menu-wrap">
                            <button
                                type="button"
                                className={`seamless-filter-menu-button ${openPanel === 'access' ? 'is-open' : ''} ${filters.access ? 'is-active' : ''}`}
                                onClick={() => setOpenPanel((current) => current === 'access' ? null : 'access')}
                                aria-expanded={openPanel === 'access'}
                            >
                                <span className="seamless-filter-button-icon" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                </span>
                                <span>{accessOptions.find(o => o.value === filters.access)?.label || 'All Courses'}</span>
                            </button>
                            {openPanel === 'access' && (
                                <div className="seamless-filter-menu">
                                    {accessOptions.map((option) => (
                                        <button
                                            key={option.value || 'all'}
                                            type="button"
                                            className={`seamless-filter-menu-item ${filters.access === option.value ? 'is-selected' : ''}`}
                                            onClick={() => {
                                                updateAccess(option.value);
                                                setOpenPanel(null);
                                            }}
                                        >
                                            <span>{option.label}</span>
                                            {filters.access === option.value && checkIcon}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Year Filter */}
                        <div className="seamless-filter-menu-wrap">
                            <button
                                type="button"
                                className={`seamless-filter-menu-button ${openPanel === 'year' ? 'is-open' : ''} ${filters.year ? 'is-active' : ''}`}
                                onClick={() => setOpenPanel((current) => current === 'year' ? null : 'year')}
                                aria-expanded={openPanel === 'year'}
                            >
                                <span className="seamless-filter-button-icon" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="4" width="18" height="18" rx="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                </span>
                                <span>{filters.year || 'All Years'}</span>
                            </button>
                            {openPanel === 'year' && (
                                <div className="seamless-filter-menu seamless-filter-menu-year">
                                    {yearOptions.map((option) => (
                                        <button
                                            key={option.value || 'all'}
                                            type="button"
                                            className={`seamless-filter-menu-item ${filters.year === option.value ? 'is-selected' : ''}`}
                                            onClick={() => {
                                                updateYear(option.value);
                                                setOpenPanel(null);
                                            }}
                                        >
                                            <span>{option.label}</span>
                                            {filters.year === option.value && checkIcon}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Sort Filter */}
                        <div className="seamless-filter-menu-wrap">
                            <button
                                type="button"
                                className={`seamless-filter-menu-button ${openPanel === 'sort' ? 'is-open' : ''} ${filters.sort && filters.sort !== 'newest' ? 'is-active' : ''}`}
                                onClick={() => setOpenPanel((current) => current === 'sort' ? null : 'sort')}
                                aria-expanded={openPanel === 'sort'}
                            >
                                <span className="seamless-filter-button-icon" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="19" x2="12" y2="5"></line>
                                        <polyline points="5 12 12 5 19 12"></polyline>
                                    </svg>
                                </span>
                                <span>{sortOptions.find(o => o.value === filters.sort)?.label || 'Newest First'}</span>
                            </button>
                            {openPanel === 'sort' && (
                                <div className="seamless-filter-menu">
                                    {sortOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            className={`seamless-filter-menu-item ${filters.sort === option.value ? 'is-selected' : ''}`}
                                            onClick={() => {
                                                updateSort(option.value);
                                                setOpenPanel(null);
                                            }}
                                        >
                                            <span>{option.label}</span>
                                            {filters.sort === option.value && checkIcon}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Reset Button */}
                        <button
                            type="button"
                            className="seamless-filter-reset"
                            onClick={() => {
                                setOpenPanel(null);
                                resetFilters();
                            }}
                        >
                            <span className="seamless-filter-button-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="1 4 1 10 7 10"></polyline>
                                    <path d="M3.51 15a9 9 0 1 0 -.49-5"></path>
                                </svg>
                            </span>
                            <span>Reset</span>
                            {activeFilterCount > 0 && <span className="seamless-filter-badge">{activeFilterCount}</span>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div style={{ position: 'relative', minHeight: '300px' }}>
                {loading && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        zIndex: 10
                    }}>
                        <LoadingSpinner />
                    </div>
                )}

                {/* Grid */}
                {!loading && courses.length === 0 ? (
                    <div className="seamless-empty-state" style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
                        <p style={{ fontSize: 'var(--seamless-font-size-lg)' }}>No courses found matching your criteria.</p>
                    </div>
                ) : (
                    <div className="seamless-courses-grid">
                        {courses.map(course => (
                            <div key={course?.id} className="seamless-course-card">
                                {/* Image */}
                                <div className="seamless-course-image-container">
                                    {course?.image ? (
                                        <img src={course?.image} alt={course?.title} className="seamless-course-image" />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e2e8f0', color: '#94a3b8' }}>
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                        </div>
                                    )}
                                    <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
                                        <span className={`seamless-course-access-badge ${course?.access_type.value === 'free' ? 'seamless-course-access-free' : 'seamless-course-access-paid'}`}>
                                            {course?.access_type.label}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="seamless-course-content">
                                    <h3 className="seamless-course-title">{course?.title}</h3>

                                    <div className="seamless-course-description">
                                        {getShortDescription(course?.description)}
                                    </div>

                                    <div className="seamless-course-meta">
                                        <div className="seamless-course-meta-item">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                            {/* Published Date - simple format */}
                                            {new Date(course?.published_at).toLocaleDateString()}
                                        </div>
                                        <div className="seamless-course-meta-item">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                            {formatDuration(course?.duration_minutes)}
                                        </div>
                                        {/* Optional Lessons count if available */}
                                        <div className="seamless-course-meta-item">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                                            {Array.isArray(course?.lessons) ? course?.lessons.length : (typeof course?.lessons === 'number' ? course?.lessons : 0)} lessons
                                        </div>
                                    </div>

                                    <div className="seamless-course-footer">
                                        <div className="seamless-course-price">
                                            {course?.access_type.value === 'paid' && course?.price ? (
                                                `$ ${Number(course?.price).toFixed(2)}`
                                            ) : (
                                                'Free'
                                            )}
                                        </div>
                                        <button
                                            className="seamless-course-cta"
                                            onClick={() => handleCourseClick(course?.slug)}
                                        >
                                            VIEW DETAILS
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination && pagination.total > 0 && (
                    <Pagination
                        currentPage={pagination.current_page}
                        totalPages={pagination.last_page}
                        onPageChange={updatePage}
                        showPageNumbers={true}
                    />
                )}
            </div>
        </div>
    );
};
