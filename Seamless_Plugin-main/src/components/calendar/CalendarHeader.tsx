import React, { useState, useRef, useEffect } from 'react';

type ViewMode = 'MONTH' | 'WEEK' | 'DAY' | 'YEAR';

interface CalendarHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  activeDate: Date;
  onDateChange: (date: Date) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  isListView?: boolean;
  onListViewToggle?: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  viewMode,
  onViewModeChange,
  activeDate,
  onDateChange,
  onPrev,
  onNext,
  onToday,
  isListView = false,
  onListViewToggle,
}) => {
  const [monthMenuOpen, setMonthMenuOpen] = useState(false);
  const monthMenuRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const todayMonthAbbr = today.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const todayDate = today.getDate();

  const currentMonth = activeDate.getMonth();
  const currentYear = activeDate.getFullYear();

  // Close month menu on outside click
  useEffect(() => {
    if (!monthMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (monthMenuRef.current && !monthMenuRef.current.contains(e.target as Node)) {
        setMonthMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [monthMenuOpen]);

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(activeDate);
    newDate.setDate(1); // Set to 1st to prevent overflow when month changes
    newDate.setMonth(monthIndex);
    onDateChange(newDate);
    setMonthMenuOpen(false);
  };

  const handleYearDown = () => {
    const newDate = new Date(activeDate);
    newDate.setFullYear(currentYear - 1);
    onDateChange(newDate);
  };

  const handleYearUp = () => {
    const newDate = new Date(activeDate);
    newDate.setFullYear(currentYear + 1);
    onDateChange(newDate);
  };

  // Subtitle: always show a full human-readable date for the active date
  const dateRangeLabel = activeDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="calendar-header">
      <div className="calendar-title">
        {/* Date Info Box (Today) */}
        <div className="date-info" onClick={onToday} title="Go to today" role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onToday()}>
          <div className="month-abbr">{todayMonthAbbr}</div>
          <div className="day-number">{todayDate}</div>
        </div>

        {/* Month + Year selectors */}
        <div className="cal-selectors-wrap">
          <div className="cal-selectors-row">

            {/* Month — pill with stacked ↑↓ arrows */}
            {viewMode !== 'YEAR' && (
              <div className="cal-month-drop-wrap" ref={monthMenuRef}>
                <button
                  className="cal-month-trigger"
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={monthMenuOpen}
                  aria-controls="calMonthMenu"
                  onClick={() => setMonthMenuOpen(open => !open)}
                >
                  <span className="cal-month-label">{MONTH_NAMES[currentMonth]}</span>
                  {/* Stacked ↑ ↓ chevrons */}
                  <span className="cal-month-spinners" aria-hidden="true">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="1 5 5 1 9 5" />
                    </svg>
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="1 1 5 5 9 1" />
                    </svg>
                  </span>
                </button>

                {monthMenuOpen && (
                  <ul
                    className="cal-month-menu"
                    id="calMonthMenu"
                    role="listbox"
                    aria-label="Select month"
                  >
                    {MONTH_NAMES.map((name, i) => (
                      <li
                        key={i}
                        className={`cal-month-item${i === currentMonth ? ' active' : ''}`}
                        role="option"
                        aria-selected={i === currentMonth}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleMonthSelect(i);
                        }}
                      >
                        <span>{name}</span>
                        {i === currentMonth && (
                          <svg className="cal-month-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Year — ‹ 2026 › */}
            <div className="cal-year-nav" aria-label="Year">
              <button className="cal-year-arrow last-year-btn" onClick={handleYearDown} aria-label="Previous year" type="button">
                <svg width="7" height="12" viewBox="0 0 7 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 1 1 6 6 11" />
                </svg>
              </button>
              <span className="cal-year-label">{currentYear}</span>
              <button className="cal-year-arrow next-year-btn" onClick={handleYearUp} aria-label="Next year" type="button">
                <svg width="7" height="12" viewBox="0 0 7 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 1 6 6 1 11" />
                </svg>
              </button>
            </div>
          </div>

          {/* Subtitle — full readable date */}
          <div className="date-range">{dateRangeLabel}</div>
        </div>
      </div>

      {/* Controls: Navigation + View Switcher */}
      <div className="calendar-controls">
        {/* Prev / Today / Next */}
        <div className="calendar-navigation">
          <button className="nav-button" onClick={onPrev} title="Previous" aria-label="Previous" type="button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button className="nav-button today-button" onClick={onToday} type="button">Today</button>
          <button className="nav-button" onClick={onNext} title="Next" aria-label="Next" type="button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* View buttons */}
        <div className="view-selector">
          {/* Month */}
          <button
            className={`view-button${viewMode === 'MONTH' && !isListView ? ' active' : ''}`}
            data-view="month"
            title="Month View"
            aria-label="Month View"
            type="button"
            onClick={() => { onViewModeChange('MONTH'); onListViewToggle && isListView && onListViewToggle(); }}
          >
            <svg width="25" height="25" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="8" y="12" width="48" height="44" rx="4" />
              <line x1="8" y1="22" x2="56" y2="22" />
              <circle cx="18" cy="32" r="2" />
              <circle cx="32" cy="32" r="2" />
              <circle cx="46" cy="32" r="2" />
              <circle cx="18" cy="44" r="2" />
              <circle cx="32" cy="44" r="2" />
              <circle cx="46" cy="44" r="2" />
              <line x1="20" y1="8" x2="20" y2="16" />
            </svg>
          </button>

          {/* Week */}
          <button
            className={`view-button${viewMode === 'WEEK' && !isListView ? ' active' : ''}`}
            data-view="week"
            title="Week View"
            aria-label="Week View"
            type="button"
            onClick={() => { onViewModeChange('WEEK'); onListViewToggle && isListView && onListViewToggle(); }}
          >
            <svg width="25" height="25" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="8" y="12" width="48" height="44" rx="4" />
              <line x1="8" y1="22" x2="56" y2="22" />
              <line x1="16" y1="32" x2="48" y2="32" />
              <line x1="16" y1="40" x2="48" y2="40" />
              <line x1="16" y1="48" x2="40" y2="48" />
              <line x1="20" y1="8" x2="20" y2="16" />
              <line x1="44" y1="8" x2="44" y2="16" />
            </svg>
          </button>

          {/* Day */}
          <button
            className={`view-button${viewMode === 'DAY' && !isListView ? ' active' : ''}`}
            data-view="day"
            title="Day View"
            aria-label="Day View"
            type="button"
            onClick={() => { onViewModeChange('DAY'); onListViewToggle && isListView && onListViewToggle(); }}
          >
            <svg width="25" height="25" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="8" y="12" width="48" height="44" rx="4" />
              <line x1="8" y1="22" x2="56" y2="22" />
              <text x="32" y="45" textAnchor="middle" fontSize="14" fontFamily="Arial, sans-serif" fill="currentColor">DAY</text>
              <line x1="20" y1="8" x2="20" y2="16" />
              <line x1="44" y1="8" x2="44" y2="16" />
            </svg>
          </button>

          {/* Year */}
          <button
            className={`view-button year-view${viewMode === 'YEAR' && !isListView ? ' active' : ''}`}
            data-view="year"
            title="Year View"
            aria-label="Year View"
            type="button"
            onClick={() => { onViewModeChange('YEAR'); onListViewToggle && isListView && onListViewToggle(); }}
          >
            <svg width="25" height="25" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="24" height="24" rx="3" />
              <rect x="36" y="4" width="24" height="24" rx="3" />
              <rect x="4" y="36" width="24" height="24" rx="3" />
              <rect x="36" y="36" width="24" height="24" rx="3" />
            </svg>
          </button>

          {/* List toggle */}
          <button
            className={`view-button display-list-btn${isListView ? ' active' : ''}`}
            title="Display List"
            aria-label="Toggle list view"
            type="button"
            onClick={onListViewToggle}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            <span>List</span>
          </button>
        </div>
      </div>
    </div>
  );
};
