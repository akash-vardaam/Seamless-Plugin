import React, { useState } from 'react';
import type { Event } from '../types/event';
import { CalendarHeader } from './calendar/CalendarHeader';
import { MonthView } from './calendar/MonthView';
import { WeekView } from './calendar/WeekView';
import { DayView } from './calendar/DayView';
import { YearView } from './calendar/YearView';
import { navigateToEvent, createEventSlug } from '../utils/urlHelper';
import { SearchInput } from './SearchInput';

type ViewMode = 'MONTH' | 'WEEK' | 'DAY' | 'YEAR';

interface CalendarViewProps {
  events: Event[];
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  isListView?: boolean;
  onListViewToggle?: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  currentDate: propDate,
  onDateChange,
  viewMode: propViewMode,
  onViewModeChange,
  isListView: propIsListView,
  onListViewToggle: propOnListViewToggle,
}) => {
  const [internalDate, setInternalDate] = useState(new Date());
  const activeDate = propDate || internalDate;

  const [internalViewMode, setInternalViewMode] = useState<ViewMode>('MONTH');
  const viewMode = propViewMode || internalViewMode;

  const [internalIsListView, setInternalIsListView] = useState(false);
  const isListView = propIsListView ?? internalIsListView;

  const setViewMode = (m: ViewMode) => {
    if (onViewModeChange) onViewModeChange(m);
    else setInternalViewMode(m);
  };

  const exitListView = () => {
    if (!isListView) return;
    if (propOnListViewToggle) propOnListViewToggle();
    else setInternalIsListView(false);
  };

  const toggleListView = () => {
    if (propOnListViewToggle) propOnListViewToggle();
    else setInternalIsListView(prev => !prev);
  };

  const handleHeaderViewChange = (mode: ViewMode) => {
    if (isListView) {
      exitListView();
    }
    setViewMode(mode);
  };

  const updateDate = (d: Date) => {
    if (onDateChange) onDateChange(d);
    else setInternalDate(d);
  };

  const handlePrev = () => {
    const d = new Date(activeDate);
    if (viewMode === 'MONTH') {
      d.setDate(1);
      d.setMonth(d.getMonth() - 1);
    }
    else if (viewMode === 'YEAR') d.setFullYear(d.getFullYear() - 1);
    else if (viewMode === 'WEEK') d.setDate(d.getDate() - 7);
    else if (viewMode === 'DAY') d.setDate(d.getDate() - 1);
    updateDate(d);
  };

  const handleNext = () => {
    const d = new Date(activeDate);
    if (viewMode === 'MONTH') {
      d.setDate(1);
      d.setMonth(d.getMonth() + 1);
    }
    else if (viewMode === 'YEAR') d.setFullYear(d.getFullYear() + 1);
    else if (viewMode === 'WEEK') d.setDate(d.getDate() + 7);
    else if (viewMode === 'DAY') d.setDate(d.getDate() + 1);
    updateDate(d);
  };

  const handleToday = () => {
    updateDate(new Date());
  };

  const handleListViewToggle = () => {
    toggleListView();
  };

  return (
    <div className="seamless-calendar-container">
      <CalendarHeader
        viewMode={viewMode}
        onViewModeChange={handleHeaderViewChange}
        activeDate={activeDate}
        onDateChange={updateDate}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        isListView={isListView}
        onListViewToggle={handleListViewToggle}
      />

      <div className="seamless-calendar-body">
        {isListView ? (
          <SeamlessListView events={events} />
        ) : (
          <>
            {viewMode === 'MONTH' && <MonthView currentDate={activeDate} events={events} />}
            {viewMode === 'WEEK' && <WeekView currentDate={activeDate} events={events} />}
            {viewMode === 'DAY' && <DayView currentDate={activeDate} events={events} />}
            {viewMode === 'YEAR' && <YearView currentDate={activeDate} events={events} onMonthClick={(date) => { updateDate(date); setViewMode('MONTH'); }} />}
          </>
        )}
      </div>
    </div>
  );
};

/** Simple event list for the "List" toggle view */
const SeamlessListView: React.FC<{ events: Event[] }> = ({ events }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const sorted = [...events].sort((a, b) => {
    return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
  });

  const filtered = sorted.filter(e =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="seamless-list-view-container">
      <div className="seamless-list-view-search" style={{ padding: '16px' }}>
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search events..."
          delay={0}
        />
      </div>

      {!filtered.length ? (
        <div className="seamless-list-view-empty" style={{ padding: '24px', textAlign: 'center', color: 'var(--sl-text-muted, #6b7280)' }}>
          {events.length === 0 ? 'No events to display.' : 'No events match your search.'}
        </div>
      ) : (
        <div className="seamless-list-view">
          {filtered.map((e, idx) => {
            const start = new Date(e.start_date);
            const dateLabel = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
            const timeLabel = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            return (
              <div
                key={e.id ?? idx}
                className="seamless-list-view-item"
                role="button"
                tabIndex={0}
                onClick={() => navigateToEvent(e.slug || createEventSlug(e.title, e.id), e.is_group_event)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    navigateToEvent(e.slug || createEventSlug(e.title, e.id), e.is_group_event);
                  }
                }}
              >
                <div className="seamless-list-view-date">{dateLabel}</div>
                <div className="seamless-list-view-info">
                  <span className="seamless-list-view-title">{e.title}</span>
                  <span className="seamless-list-view-time">{timeLabel}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
