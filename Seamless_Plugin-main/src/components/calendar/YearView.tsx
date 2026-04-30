import React, { useMemo } from 'react';
import type { Event } from '../../types/event';
import { navigateToEvent, createEventSlug } from '../../utils/urlHelper';
import { getCategoryColor } from './utils';

interface YearViewProps {
  currentDate: Date;
  events: Event[];
  onMonthClick: (date: Date) => void;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const toDateKey = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const dateOnly = (value: string): Date => {
  const parsed = new Date(value);
  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

const YEAR_EVENT_DOT_COLORS: Record<string, string> = {
  amber: '#f59e0b',
  red: '#ef4444',
  indigo: '#6366f1',
  green: '#22c55e',
  purple: '#a855f7',
  orange: '#f97316',
  pink: '#ec4899',
  blue: '#3b82f6',
  teal: '#14b8a6',
  slate: '#64748b',
};

const getYearEventDotColor = (event: Event): string => {
  return YEAR_EVENT_DOT_COLORS[getCategoryColor(event)] || YEAR_EVENT_DOT_COLORS.amber;
};

export const YearView: React.FC<YearViewProps> = ({ currentDate, events, onMonthClick }) => {
  const year = currentDate.getFullYear();
  const today = new Date();

  const eventsByDate = useMemo(() => {
    const map: Record<string, Event[]> = {};
    events.forEach(e => {
      try {
        const start = dateOnly(e.start_date);
        const end = e.end_date ? dateOnly(e.end_date) : new Date(start);
        const cursor = new Date(start);

        while (cursor <= end) {
          const dateKey = toDateKey(cursor);
          if (!map[dateKey]) map[dateKey] = [];
          map[dateKey].push(e);
          cursor.setDate(cursor.getDate() + 1);
        }
      } catch {}
    });
    return map;
  }, [events]);

  const months = useMemo(() =>
    Array.from({ length: 12 }, (_, monthIndex) => {
      const firstDay = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      const daysInPrevMonth = new Date(year, monthIndex, 0).getDate();

      const days: { date: Date; inMonth: boolean }[] = [];

      // Leading days from previous month
      for (let i = firstDay - 1; i >= 0; i--) {
        days.push({ date: new Date(year, monthIndex - 1, daysInPrevMonth - i), inMonth: false });
      }
      // Current month days
      for (let d = 1; d <= daysInMonth; d++) {
        days.push({ date: new Date(year, monthIndex, d), inMonth: true });
      }
      // Trailing days to fill 35 cells (5 rows × 7)
      let next = 1;
      while (days.length < 35) {
        days.push({ date: new Date(year, monthIndex + 1, next++), inMonth: false });
      }

      return { monthIndex, days };
    }),
    [year],
  );

  const handleDayClick = (dayObj: { date: Date; inMonth: boolean }, dayEvents: Event[]) => {
    if (!dayObj.inMonth || dayEvents.length === 0) return;

    if (dayEvents.length === 1) {
      // Navigate directly to the single event
      const e = dayEvents[0];
      navigateToEvent(e.slug || createEventSlug(e.title, e.id), e.is_group_event);
    } else {
      // Multiple events — navigate to month view for that day
      onMonthClick(dayObj.date);
    }
  };

  return (
    <div className="seamless-year-view">
      {months.map(({ monthIndex, days }) => (
        <div key={monthIndex} className="seamless-year-month-card">
          {/* Month title — click to go to month view */}
          <div
            className="seamless-year-month-title"
            onClick={() => onMonthClick(new Date(year, monthIndex, 1))}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onMonthClick(new Date(year, monthIndex, 1))}
          >
            {MONTH_NAMES[monthIndex]}
          </div>

          {/* Day-of-week headers */}
          <div className="seamless-year-day-headers">
            {DAY_HEADERS.map((d, i) => (
              <div key={i} className="seamless-year-day-hdr">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="seamless-year-days-grid">
            {days.map((dayObj, dIdx) => {
              const isToday = dayObj.inMonth && dayObj.date.toDateString() === today.toDateString();
              const dateKey = toDateKey(dayObj.date);
              const dayEvents = dayObj.inMonth ? (eventsByDate[dateKey] || []) : [];
              const hasEvents = dayEvents.length > 0;

              return (
                <div
                  key={dIdx}
                  className={`seamless-year-day${!dayObj.inMonth ? ' inactive' : ''}${isToday ? ' today' : ''}${hasEvents ? ' has-events' : ''}`}
                  onClick={() => handleDayClick(dayObj, dayEvents)}
                  role={hasEvents ? 'button' : undefined}
                  tabIndex={hasEvents ? 0 : undefined}
                  aria-label={hasEvents ? `${dayEvents.length} event${dayEvents.length > 1 ? 's' : ''}: ${dayEvents.map(e => e.title).join(', ')}` : undefined}
                  onKeyDown={hasEvents ? (e) => e.key === 'Enter' && handleDayClick(dayObj, dayEvents) : undefined}
                >
                  <span className="seamless-year-day-num">{dayObj.date.getDate()}</span>
                  {hasEvents && (
                    <>
                      <span className="seamless-year-event-dots" aria-hidden="true">
                        {dayEvents.slice(0, 4).map((event, eventIdx) => (
                          <span
                            key={`${event.id || event.title}-${eventIdx}`}
                            className="seamless-year-event-dot"
                            style={{
                              '--seamless-year-dot-color': getYearEventDotColor(event),
                            } as React.CSSProperties}
                          />
                        ))}
                      </span>
                      <span className="seamless-year-event-tooltip" role="tooltip">
                        {dayEvents.map((event, eventIdx) => (
                          <span key={`${event.id || event.title}-tooltip-${eventIdx}`} className="seamless-year-event-tooltip-title">
                            {event.title}
                          </span>
                        ))}
                      </span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
