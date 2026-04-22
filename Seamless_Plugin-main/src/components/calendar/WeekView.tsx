import React, { useMemo } from 'react';
import type { Event } from '../../types/event';
import { getCategoryColor } from './utils';
import { navigateToEvent, createEventSlug } from '../../utils/urlHelper';

interface WeekViewProps {
  currentDate: Date;
  events: Event[];
}

const HOUR_HEIGHT = 60;

export const WeekView: React.FC<WeekViewProps> = ({ currentDate, events }) => {
  // Derive the 7 days of the week — use a pure computation (no mutation)
  const weekDates = useMemo(() => {
    const base = new Date(currentDate);
    base.setHours(0, 0, 0, 0);
    const day = base.getDay(); // 0 = Sunday
    const sunday = new Date(base);
    sunday.setDate(base.getDate() - day);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const todayStr = new Date().toDateString();
  const isCurrentWeek = weekDates.some(d => d.toDateString() === todayStr);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Build per-column event blocks with overlap layout
  const dayColumns = useMemo(() => {
    const cols: any[][] = weekDates.map(() => []);

    events.forEach(e => {
      try {
        const startRaw = new Date(e.start_date);
        const endRaw = e.end_date
          ? new Date(e.end_date)
          : new Date(startRaw.getTime() + 60 * 60 * 1000);

        weekDates.forEach((d, colIndex) => {
          const dayStart = new Date(d);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(d);
          dayEnd.setHours(23, 59, 59, 999);

          // Skip if no overlap or zero-duration
          if (startRaw > dayEnd || endRaw < dayStart) return;
          if (startRaw.getTime() === endRaw.getTime()) return;

          const blockStart = new Date(Math.max(startRaw.getTime(), dayStart.getTime()));
          const blockEnd   = new Date(Math.min(endRaw.getTime(),   dayEnd.getTime() + 1));

          let startHour = blockStart.getHours() + blockStart.getMinutes() / 60;
          let endHour   = blockEnd.getHours()   + blockEnd.getMinutes()   / 60;

          // Midnight-crossing
          if (blockEnd.getHours() === 0 && blockEnd.getMinutes() === 0 && blockEnd > blockStart) {
            endHour = 24;
          }
          if (endHour <= startHour) endHour = startHour + 1;

          cols[colIndex].push({
            event: e,
            top:    startHour * HOUR_HEIGHT,
            height: (endHour - startHour) * HOUR_HEIGHT,
            left:   0,
            width:  100,
          });
        });
      } catch (err) {
        console.error(err);
      }
    });

    // Compute horizontal overlap layout per column
    cols.forEach(col => {
      col.sort((a: any, b: any) => a.top - b.top || b.height - a.height);

      const groups: any[][] = [];
      let lastEnd = -Infinity;

      col.forEach((block: any) => {
        if (block.top >= lastEnd) {
          groups.push([block]);
          lastEnd = block.top + block.height;
        } else {
          groups[groups.length - 1].push(block);
          lastEnd = Math.max(lastEnd, block.top + block.height);
        }
      });

      groups.forEach(group => {
        const subCols: any[][] = [];
        group.forEach((block: any) => {
          let placed = false;
          for (let i = 0; i < subCols.length; i++) {
            const last = subCols[i][subCols[i].length - 1];
            if (last.top + last.height <= block.top) {
              subCols[i].push(block);
              placed = true;
              break;
            }
          }
          if (!placed) subCols.push([block]);
        });

        subCols.forEach((sc, i) => {
          sc.forEach((block: any) => {
            block.left  = (i / subCols.length) * 100;
            block.width = 100 / subCols.length;
          });
        });
      });
    });

    return cols;
  }, [events, weekDates]);

  return (
    <div className="seamless-week-view">
      {/* ── Day header row ── */}
      <div className="seamless-week-header-row">
        <div className="seamless-week-time-gutter">
          <div className="seamless-week-allday-label">Time</div>
        </div>
        <div className="seamless-week-days">
          {weekDates.map((d, i) => (
            <div
              key={i}
              className={[
                'seamless-week-day-header',
                d.toDateString() === todayStr ? 'today' : '',
                i === 0 && !isCurrentWeek ? 'sunday' : '',
              ].filter(Boolean).join(' ')}
            >
              <span className="seamless-week-date-num">{d.getDate()}</span>
              <span className="seamless-week-day-name">
                {d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Grid body ── */}
      <div className="seamless-week-grid-body">
        {/* Time gutter */}
        <div className="seamless-week-time-gutter">
          {hours.map(hour => {
            if (hour === 0) return <div key={hour} className="seamless-week-hour-label empty" />;
            const h = hour > 12 ? hour - 12 : hour;
            const ap = hour >= 12 ? 'pm' : 'am';
            return <div key={hour} className="seamless-week-hour-label">{h} {ap}</div>;
          })}
        </div>

        {/* Columns area */}
        <div className="seamless-week-columns-container">
          {/* Background horizontal lines */}
          <div className="seamless-week-bg-lines">
            {hours.map(hour => <div key={hour} className="seamless-week-bg-line" />)}
          </div>

          {/* 7 day columns with absolute-positioned events */}
          <div className="seamless-week-columns">
            {dayColumns.map((colEvents, colIdx) => (
              <div key={colIdx} className="seamless-week-day-col">
                {colEvents.map((block: any, eIdx: number) => {
                  const color = getCategoryColor(block.event);
                  return (
                    <div
                      key={eIdx}
                      className={`seamless-week-event-block seamless-color-${color}-bg`}
                      style={{
                        top:    `${block.top}px`,
                        height: `${Math.max(block.height, 22)}px`,
                        left:   `calc(${block.left}% + 2px)`,
                        width:  `calc(${block.width}% - 4px)`,
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
