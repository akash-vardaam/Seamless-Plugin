import React from 'react';
import { Link } from 'react-router-dom';
import type { Event } from '../types/event';
import { getEventPageURL } from '../utils/urlHelper';


interface CardProps {
  item: Event;
  layout?: 'list' | 'grid';
  listVariant?: 'classic' | 'modern';
  showTimelineDate?: boolean;
}

const formatDateRange = (startDate: string, endDate: string): string => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // If same date, just return formatted date once
    if (start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }

    // Different dates - show range
    const startDay = start.toLocaleDateString('en-US', { weekday: 'long' });
    const endDay = end.toLocaleDateString('en-US', { weekday: 'long' });
    const startDateStr = start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const endDateStr = end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    return `${startDay} - ${endDay}, ${startDateStr} - ${endDateStr}`;
  } catch {
    return startDate;
  }
};

const formatTimeRange = (startDate: string, endDate: string): string => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const formatOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Chicago',
    };
    const startTime = start.toLocaleTimeString('en-US', formatOptions);
    const endTime = end.toLocaleTimeString('en-US', formatOptions);
    const timezone = start
      .toLocaleTimeString('en-US', { timeZone: 'America/Chicago', timeZoneName: 'short' })
      .split(' ')
      .pop() || 'CT';
    return `${startTime} - ${endTime} ${timezone}`;
  } catch {
    return '';
  }
};

const formatTimelineDate = (date: string): { date: string; weekday: string } => {
  try {
    const parsed = new Date(date);
    return {
      date: parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      weekday: parsed.toLocaleDateString('en-US', { weekday: 'long' }),
    };
  } catch {
    return { date, weekday: '' };
  }
};

const formatMultiDayRange = (startDate: string, endDate: string): string => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start.toDateString() === end.toDateString()) {
      return '';
    }

    const startLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endLabel = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startLabel} - ${endLabel}`;
  } catch {
    return '';
  }
};

const createItemSlug = (title: string, id: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim() || id;
};

const getItemLink = (item: Event): string => {
  const isGroup = item?.is_group_event;
  const slug = item?.slug || createItemSlug(item?.title, item?.id);
  return getEventPageURL(slug, isGroup);
};

const getItemRoute = (item: Event): string => {
  const fullUrl = getItemLink(item);

  try {
    const parsed = new URL(fullUrl, window.location.origin);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return fullUrl;
  }
};

const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
};

const getFallbackImageUrl = (): string => {
  if (typeof window !== 'undefined') {
    return (window as any).seamlessReactConfig?.fallbackEventImageUrl || '/seamless-logo.png';
  }

  return '/seamless-logo.png';
};

const getEventImageUrl = (item: Event): string => {
  return item?.featured_image || getFallbackImageUrl();
};

const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
  if (event.currentTarget.dataset.fallbackApplied === 'true') return;

  const fallbackUrl = getFallbackImageUrl();
  event.currentTarget.dataset.fallbackApplied = 'true';
  event.currentTarget.classList.add('seamless-card-image-fallback');
  event.currentTarget.src = fallbackUrl;
};

const getLocationText = (item: Event): string => {
  const venue = item?.venue || {};
  const parts: string[] = [];

  if (venue?.name) {
    parts.push(venue.name);
  } else if ((venue as any)?.address) {
    parts.push((venue as any).address);
  }

  const cityState = [venue?.city, venue?.state].filter(Boolean).join(', ');
  if (cityState) parts.push(cityState);
  if (venue?.zip_code) parts.push(venue.zip_code);

  const location = parts.join(', ').trim();

  if (location && item?.virtual_meeting_link) return `${location} + Online`;
  if (location) return location;
  if (item?.virtual_meeting_link) return 'Online';
  return 'TBD';
};

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const MapPinIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ArrowUpRightIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

export const Card: React.FC<CardProps> = ({
  item,
  layout = 'list',
  listVariant = 'classic',
  showTimelineDate = true,
}) => {
  const hasFeaturedImage = Boolean(item?.featured_image);
  const imageUrl = getEventImageUrl(item);

  if (layout === 'grid') {
    const description = stripHtmlTags(
      (item as Event & { excerpt_description?: string })?.excerpt_description ||
      item?.except_description ||
      item?.description ||
      ''
    );

    return (
      <article className="seamless-card">
        {/* Image Container */}
        <div className="seamless-card-image-container">
          <img
            src={imageUrl}
            alt={item?.title || 'Seamless'}
            className={`seamless-card-image${hasFeaturedImage ? '' : ' seamless-card-image-fallback'}`}
            onError={handleImageError}
          />
        </div>

        {/* Item Details */}
        <div className="seamless-card-content">
          {/* Title */}
          <Link
            to={getItemRoute(item)}
            className="seamless-card-title seamless-font-merriweather"
          >
            {item?.title}
          </Link>

          {/* Date Range */}
          <p className="seamless-card-date">
            {formatDateRange(item?.start_date, item?.end_date || item?.start_date)}
          </p>

          {description ? (
            <p className="seamless-card-description">
              {description}
            </p>
          ) : null}

          {/* Time */}
          <p className="seamless-card-time">
            {formatTimeRange(item?.start_date, item?.end_date || item?.start_date)}
          </p>
          
          {/* SEE DETAILS Button */}
          <button
            onClick={() => window.location.href = getItemRoute(item)}
            className="seamless-card-see-details"
          >
            SEE DETAILS
          </button>
        </div>
      </article>
    );
  }

  if (listVariant === 'modern') {
    const timeline = formatTimelineDate(item?.start_date);
    const multiDayRange = formatMultiDayRange(item?.start_date, item?.end_date || item?.start_date);
    const description = stripHtmlTags(
      (item as Event & { excerpt_description?: string })?.excerpt_description ||
      item?.except_description ||
      item?.description ||
      ''
    );

    return (
      <article className={`seamless-card-modern${showTimelineDate ? '' : ' seamless-card-modern-same-day'}`}>
        <div className="seamless-card-modern-timeline">
          {showTimelineDate ? (
            <div className="seamless-card-modern-date-group">
              <span className="seamless-card-modern-date">{timeline.date}</span>
              {timeline.weekday ? (
                <span className="seamless-card-modern-weekday">{timeline.weekday}</span>
              ) : null}
            </div>
          ) : (
            <div className="seamless-card-modern-date-group seamless-card-modern-date-group-hidden" aria-hidden="true" />
          )}
          <span className="seamless-card-modern-dot" />
        </div>

        <div className="seamless-card-modern-shell">
          <div className="seamless-card-modern-content">
            <div className="seamless-card-modern-body">
              <Link
                to={getItemRoute(item)}
                className="seamless-card-modern-title seamless-font-merriweather"
              >
                {item?.title}
              </Link>

              <div className="seamless-card-modern-meta">
                {multiDayRange ? (
                  <div className="seamless-card-modern-meta-row">
                    <CalendarIcon />
                    <span>{multiDayRange}</span>
                  </div>
                ) : null}

                <div className="seamless-card-modern-meta-row">
                  <ClockIcon />
                  <span>{formatTimeRange(item?.start_date, item?.end_date || item?.start_date) || 'All Day'}</span>
                </div>

                <div className="seamless-card-modern-meta-row">
                  <MapPinIcon />
                  <span>{getLocationText(item)}</span>
                </div>
              </div>

              {description ? (
                <p className="seamless-card-modern-description">{description}</p>
              ) : null}

              <Link to={getItemRoute(item)} className="seamless-card-modern-link">
                <span>View Event</span>
                <ArrowUpRightIcon />
              </Link>
            </div>

            <div className="seamless-card-modern-image-wrap">
              <img
                src={imageUrl}
                alt={item?.title || 'Seamless'}
                className={`seamless-card-modern-image${hasFeaturedImage ? '' : ' seamless-card-image-fallback'}`}
                onError={handleImageError}
              />
            </div>
          </div>
        </div>
      </article>
    );
  }

  // List layout
  return (
    <article className="seamless-card-list">
      <div className="seamless-card-list-content">
        {/* Image Container */}
        <div className="seamless-card-list-image">
          <div className="seamless-card-list-image-wrapper">
            <img
              src={imageUrl}
              alt={item?.title || 'Seamless'}
              className={`seamless-card-list-image-img${hasFeaturedImage ? '' : ' seamless-card-image-fallback'}`}
              onError={handleImageError}
            />
          </div>
        </div>

        {/* Item Details */}
        <div className="seamless-card-list-details">
          {/* Title */}
          <a
            href={getItemLink(item)}
            className="seamless-card-list-title seamless-font-merriweather"
          >
            {item?.title}
          </a>

          {/* Item Meta Information */}
          <div className="seamless-card-list-meta">
            {/* Date Range */}
            <p className="seamless-card-list-meta-item seamless-card-list-meta-date">
              {formatDateRange(item?.start_date, item?.end_date || item?.start_date)}
            </p>

            {/* Time */}
            <p className="seamless-card-list-meta-item">
              {formatTimeRange(item?.start_date, item?.end_date || item?.start_date)}
            </p>

            {/* Location */}
            {item?.venue ? (
              <p className="seamless-card-list-meta-item">
                {item?.venue.name || 'Online'}
              </p>
            ) : (
              <p className="seamless-card-list-meta-item">
                Online
              </p>
            )}
          </div>

          {/* Description */}
          {item?.description && (
            <p className="seamless-card-list-description">
              {stripHtmlTags(item?.description)}
            </p>
          )}

          {/* SEE DETAILS Link */}
          <a
            href={getItemLink(item)}
            className="seamless-card-list-see-details"
          >
            SEE DETAILS
          </a>
        </div>
      </div>
    </article>
  );
};
