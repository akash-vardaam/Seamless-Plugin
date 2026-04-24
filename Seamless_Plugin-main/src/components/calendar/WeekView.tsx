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
  const weekDates = useMemo(() => {
    const base = new Date(currentDate);
    base.setHours(0, 0, 0, 0);
    const mondayOffset = (base.getDay() + 6) % 7;
    const monday = new Date(base);
    monday.setDate(base.getDate() - mondayOffset);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const todayStr = new Date().toDateString();
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const { dayColumns, allDayLayouts } = useMemo(() => {
    const cols: any[][] = weekDates.map(() => []);
    const allDayCandidates: any[] = [];
    const weekStart = new Date(weekDates[0]);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekDates[6]);
    weekEnd.setHours(23, 59, 59, 999);

    events.forEach(e => {
      try {
        const startRaw = new Date(e.start_date);
        const endRaw = e.end_date
          ? new Date(e.end_date)
          : new Date(startRaw.getTime() + 60 * 60 * 1000);

        const startDay = new Date(startRaw);
        startDay.setHours(0, 0, 0, 0);
        const endDay = new Date(endRaw);
        endDay.setHours(23, 59, 59, 999);
        const isMultiDay = startDay.toDateString() !== endDay.toDateString();

        if ((e?.all_day || isMultiDay) && startDay <= weekEnd && endDay >= weekStart) {
          allDayCandidates.push({ event: e, rawStart: startDay, rawEnd: endDay });
          return;
        }

        weekDates.forEach((d, colIndex) => {
          const dayStart = new Date(d);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(d);
          dayEnd.setHours(23, 59, 59, 999);

          if (startRaw > dayEnd || endRaw < dayStart) return;
          if (startRaw.getTime() === endRaw.getTime()) return;

          const blockStart = new Date(Math.max(startRaw.getTime(), dayStart.getTime()));
          const blockEnd = new Date(Math.min(endRaw.getTime(), dayEnd.getTime() + 1));

          let startHour = blockStart.getHours() + blockStart.getMinutes() / 60;
          let endHour = blockEnd.getHours() + blockEnd.getMinutes() / 60;

          if (blockEnd.getHours() === 0 && blockEnd.getMinutes() === 0 && blockEnd > blockStart) {
            endHour = 24;
          }
          if (endHour <= startHour) endHour = startHour + 1;

          cols[colIndex].push({
            event: e,
            top: startHour * HOUR_HEIGHT,
            height: (endHour - startHour) * HOUR_HEIGHT,
            left: 0,
            width: 100,
          });
        });
      } catch (err) {
        console.error(err);
      }
    });

    allDayCandidates.sort((a, b) => {
      const lenA = a.rawEnd.getTime() - a.rawStart.getTime();
      const lenB = b.rawEnd.getTime() - b.rawStart.getTime();
      if (lenA !== lenB) return lenB - lenA;
      return a.rawStart.getTime() - b.rawStart.getTime();
    });

    const rowOccupancy: boolean[][] = [];
    const allDayItems: any[] = [];
    allDayCandidates.forEach(e => {
      let startCol = weekDates.findIndex(wd => wd.toDateString() === e.rawStart.toDateString());
      let endCol = weekDates.findIndex(wd => wd.toDateString() === e.rawEnd.toDateString());

      if (e.rawStart.getTime() < weekStart.getTime()) startCol = 0;
      if (e.rawEnd.getTime() > weekEnd.getTime()) endCol = 6;
      if (startCol === -1) startCol = 0;
      if (endCol === -1) endCol = 6;

      let level = 0;
      while (true) {
        if (!rowOccupancy[level]) rowOccupancy[level] = new Array(7).fill(false);
        let conflict = false;
        for (let i = startCol; i <= endCol; i++) {
          if (rowOccupancy[level][i]) {
            conflict = true;
            break;
          }
        }
        if (!conflict) {
          for (let i = startCol; i <= endCol; i++) rowOccupancy[level][i] = true;
          break;
        }
        level++;
      }

      allDayItems.push({ event: e.event, startCol, endCol, level });
    });

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
            block.left = (i / subCols.length) * 100;
            block.width = 100 / subCols.length;
          });
        });
      });
    });

    return { dayColumns: cols, allDayLayouts: allDayItems };
  }, [events, weekDates]);

  return (
    <div className="seamless-week-view seamless-week-view--legacy">
      <div className="seamless-week-header-row">
        <div className="seamless-week-time-gutter">
          <div className="seamless-week-allday-label">All Day</div>
        </div>
        <div className="seamless-week-days">
          {weekDates.map((d, i) => (
            <div
              key={i}
              className={[
                'seamless-week-day-header',
                d.toDateString() === todayStr ? 'today' : '',
                i === 6 ? 'sunday' : '',
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

      <div className="seamless-week-allday-row">
        <div className="seamless-week-time-gutter" />
        <div className="seamless-week-allday-week-content">
          {allDayLayouts.length === 0 ? (
            <div className="seamless-week-allday-empty" aria-hidden="true" />
          ) : (
            allDayLayouts.map((item, idx) => {
              const color = getCategoryColor(item.event);
              return (
                <div
                  key={idx}
                  className={`seamless-week-allday-event seamless-color-${color}-bg`}
                  style={{
                    gridColumn: `${item.startCol + 1} / span ${item.endCol - item.startCol + 1}`,
                    gridRow: `${item.level + 1}`,
                  }}
                  onClick={() =>
                    navigateToEvent(
                      item.event?.slug || createEventSlug(item.event?.title, item.event?.id),
                      item.event?.is_group_event,
                    )
                  }
                >
                  {item.event?.title}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="seamless-week-grid-body">
        <div className="seamless-week-time-gutter">
          {hours.map(hour => {
            if (hour === 0) return <div key={hour} className="seamless-week-hour-label empty" />;
            const h = hour > 12 ? hour - 12 : hour;
            const ap = hour >= 12 ? 'pm' : 'am';
            return <div key={hour} className="seamless-week-hour-label">{h} {ap}</div>;
          })}
        </div>

        <div className="seamless-week-columns-container">
          <div className="seamless-week-bg-lines">
            {hours.map(hour => <div key={hour} className="seamless-week-bg-line" />)}
          </div>

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
                        top: `${block.top}px`,
                        height: `${Math.max(block.height, 28)}px`,
                        left: `calc(${block.left}% + 4px)`,
                        width: `calc(${block.width}% - 8px)`,
                      }}
                      onClick={() =>
                        navigateToEvent(
                          block.event?.slug || createEventSlug(block.event?.title, block.event?.id),
                          block.event?.is_group_event,
                        )
                      }
                    >
                      <span className="seamless-week-event-title-span">{block.event?.title}</span>
                      <span className="seamless-week-event-time-span">
                        {new Date(block.event?.start_date).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </span>
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
