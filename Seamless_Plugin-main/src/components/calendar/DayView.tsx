import React, { useMemo } from 'react';
import type { Event } from '../../types/event';
import { getCategoryColor } from './utils';
import { navigateToEvent, createEventSlug } from '../../utils/urlHelper';

interface DayViewProps {
  currentDate: Date;
  events: Event[];
}

const HOUR_HEIGHT = 60;

export const DayView: React.FC<DayViewProps> = ({ currentDate, events }) => {
  const isToday = currentDate.toDateString() === new Date().toDateString();
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const { dayEvents, allDayEvents } = useMemo(() => {
    const dayEvts: any[] = [];
    const allDayEvts: any[] = [];

    // Define the day's boundaries
    const dayStart = new Date(currentDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);

    events.forEach(e => {
      try {
        const startRaw = new Date(e.start_date);
        const endRaw = e.end_date ? new Date(e.end_date) : new Date(startRaw.getTime() + 60 * 60 * 1000);

        // Only include events that overlap with this specific day
        const overlaps = startRaw <= dayEnd && endRaw >= dayStart;
        if (!overlaps) return;

        // Treat as all-day if: explicitly all_day, or spans multiple calendar days
        const startDateStr = startRaw.toDateString();
        const endDateStr = endRaw.toDateString();
        const isMultiDay = startDateStr !== endDateStr;

        if (e?.all_day || isMultiDay) {
          allDayEvts.push(e);
          return;
        }

        // Single-day timed event on this exact day
        const startHour = startRaw.getHours() + startRaw.getMinutes() / 60;
        let endHour = endRaw.getHours() + endRaw.getMinutes() / 60;
        if (endHour <= startHour) endHour = startHour + 1;

        dayEvts.push({
          event: e,
          top: startHour * HOUR_HEIGHT,
          height: (endHour - startHour) * HOUR_HEIGHT,
        });
      } catch (err) {}
    });

    return { dayEvents: dayEvts, allDayEvents: allDayEvts };
  }, [events, currentDate]);

  return (
    <div className="seamless-week-view seamless-day-view">
      {/* Header */}
      <div className="seamless-week-header-row">
        <div className="seamless-week-time-gutter seamless-day-gutter">
          <div className="seamless-week-allday-label">All Day</div>
        </div>
        <div className="seamless-day-header-single">
          <div className={`seamless-week-day-header${isToday ? ' today' : ''}`}>
            <span className="seamless-week-date-num">{currentDate.getDate()}</span>
            <span className="seamless-week-day-name">
              {currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <div className="seamless-week-allday-row">
          <div className="seamless-week-time-gutter seamless-day-gutter" />
          <div className="seamless-day-allday-content">
            {allDayEvents.map((e, idx) => {
              const color = getCategoryColor(e);
              return (
                <div
                  key={idx}
                  className={`seamless-week-allday-event seamless-color-${color}-bg`}
                  onClick={() => navigateToEvent(e.slug || createEventSlug(e.title, e.id), e.is_group_event)}
                >
                  {e.title}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid body */}
      <div className="seamless-week-grid-body">
        {/* Time gutter */}
        <div className="seamless-week-time-gutter seamless-day-gutter">
          {hours.map(hour => {
            if (hour === 0) return <div key={hour} className="seamless-week-hour-label empty" />;
            const displayHour = hour > 12 ? hour - 12 : hour;
            const ampm = hour >= 12 ? 'pm' : 'am';
            return (
              <div key={hour} className="seamless-week-hour-label">
                {displayHour} {ampm}
              </div>
            );
          })}
        </div>

        {/* Single day column */}
        <div className="seamless-day-columns-container">
          {/* Background lines */}
          <div className="seamless-week-bg-lines">
            {hours.map(hour => (
              <div key={hour} className="seamless-week-bg-line" />
            ))}
          </div>

          {/* Events */}
          <div className="seamless-day-single-col">
            {dayEvents.map((block, eIdx) => {
              const color = getCategoryColor(block.event);
              return (
                <div
                  key={eIdx}
                  className={`seamless-week-event-block seamless-color-${color}-bg`}
                  style={{
                    top: `${block.top}px`,
                    height: `${Math.max(block.height, 22)}px`,
                    left: '2px',
                    right: '2px',
                    width: 'auto',
                  }}
                  onClick={() =>
                    navigateToEvent(
                      block.event?.slug || createEventSlug(block.event?.title, block.event?.id),
                      block.event?.is_group_event,
                    )
                  }
                >
                  <span className={`seamless-week-event-dot seamless-color-${color}-border`} />
                  <span className="seamless-week-event-title-span">{block.event?.title}</span>
                </div>
              );
            })}

            {dayEvents.length === 0 && allDayEvents.length === 0 && (
              <div className="seamless-day-no-events">No events today</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
