import React, { useMemo } from 'react';
import type { Event } from '../../types/event';
import { extractDateOnly } from './utils';
import { navigateToEvent, createEventSlug } from '../../utils/urlHelper';

interface YearViewProps {
  currentDate: Date;
  events: Event[];
  onMonthClick: (date: Date) => void;
}

const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const YearView: React.FC<YearViewProps> = ({ currentDate, events, onMonthClick }) => {
  const year = currentDate.getFullYear();
  const today = new Date();

  // Map dateKey -> array of events on that day
  const eventsByDate = useMemo(() => {
    const map: Record<string, Event[]> = {};
    events.forEach(e => {
      try {
        const dateKey = extractDateOnly(e.start_date);
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(e);
      } catch {}
    });
    return map;
  }, [events]);

  const months = useMemo(() =>
    Array.from({ length: 12 }, (_, monthIndex) => {
      const firstDay = new Date(year, monthIndex, 1).getDay();
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
            {MONTH_NAMES_SHORT[monthIndex]}
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
              const isToday = dayObj.date.toDateString() === today.toDateString();
              const dateKey = `${dayObj.date.getFullYear()}-${String(dayObj.date.getMonth() + 1).padStart(2, '0')}-${String(dayObj.date.getDate()).padStart(2, '0')}`;
              const dayEvents = dayObj.inMonth ? (eventsByDate[dateKey] || []) : [];
              const hasEvents = dayEvents.length > 0;

              return (
                <div
                  key={dIdx}
                  className={`seamless-year-day${!dayObj.inMonth ? ' inactive' : ''}${isToday ? ' today' : ''}${hasEvents ? ' has-events' : ''}`}
                  onClick={() => handleDayClick(dayObj, dayEvents)}
                  role={hasEvents ? 'button' : undefined}
                  tabIndex={hasEvents ? 0 : undefined}
                  title={hasEvents ? `${dayEvents.length} event${dayEvents.length > 1 ? 's' : ''} — ${dayEvents.map(e => e.title).join(', ')}` : undefined}
                  onKeyDown={hasEvents ? (e) => e.key === 'Enter' && handleDayClick(dayObj, dayEvents) : undefined}
                >
                  <span className="seamless-year-day-num">{dayObj.date.getDate()}</span>
                  {hasEvents && (
                    <span className="seamless-year-event-dot" aria-hidden="true" />
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
