import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Calendar, Clock, MapPin, Users, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSingleEvent } from '../hooks/useSingleEvent';
import { SeamlessAccordion } from './SeamlessAccordion';
import { getEventsListURL, getWordPressSiteUrl } from '../utils/urlHelper';
import { SeamlessInitialLoader } from './ui/SeamlessInitialLoader';

import type { Event } from '../types/event';
import { useShadowRoot } from './ShadowRoot';

export const SingleEventPage: React.FC = () => {
    console.log('Rendering SingleEventPage');
    const shadowRoot = useShadowRoot();
    const location = useLocation();
    const { slug: paramSlug } = useParams<{ slug: string }>();
    const safeDecode = (value: string): string => {
        try {
            return decodeURIComponent(value);
        } catch {
            return value;
        }
    };
    // Logic to determine slug: param > DOM attribute
    const [slug, setSlug] = useState<string>(paramSlug ? safeDecode(paramSlug) : '');
    const [calendarDropdownOpen, setCalendarDropdownOpen] = useState(false);
    const [isCalendarAdded, setIsCalendarAdded] = useState(false);
    const [activeSponsorIndex, setActiveSponsorIndex] = useState(0);
    const [isSponsorTrackAnimating, setIsSponsorTrackAnimating] = useState(true);
    const calendarDropdownRef = React.useRef<HTMLDivElement>(null);
    const configuredFallbackImage = ((window as any)?.seamlessReactConfig?.fallbackEventImageUrl as string | undefined) || '';
    const fallbackEventImageUrl =
        (configuredFallbackImage
            ? configuredFallbackImage.replace(/seamless-logo\.png(?:\?.*)?$/i, 'seamless-logo-small.png')
            : '') ||
        `${getWordPressSiteUrl().replace(/\/+$/g, '')}/seamless-logo-small.png`;

    const handleCalendarOptionClick = () => {
        setCalendarDropdownOpen(false);
        setIsCalendarAdded(true);
        setTimeout(() => setIsCalendarAdded(false), 3000);
    };

    useEffect(() => {
        if (paramSlug) {
            setSlug(safeDecode(paramSlug));
        } else {
            const querySlug = new URLSearchParams(location.search).get('seamless_event');
            if (querySlug) {
                setSlug(safeDecode(querySlug));
                return;
            }

            const pathParts = location.pathname.split('/').filter(Boolean);
            const singleEventEndpoint = ((window as any)?.seamlessReactConfig?.singleEventEndpoint || 'event')
                .toString()
                .replace(/^\/+|\/+$/g, '');
            const endpointIndex = pathParts.indexOf(singleEventEndpoint);
            if (endpointIndex > -1 && pathParts[endpointIndex + 1]) {
                setSlug(safeDecode(pathParts[endpointIndex + 1]));
                return;
            }

            const container = (shadowRoot || document) as (Document | ShadowRoot);
            const domSlug = container.getElementById?.('event_detail')?.getAttribute('data-event-slug');
            if (domSlug) {
                setSlug(safeDecode(domSlug));
            }
        }
    }, [location.pathname, location.search, paramSlug, shadowRoot]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const path = event.composedPath();
            if (calendarDropdownRef.current && !path.includes(calendarDropdownRef.current)) {
                setCalendarDropdownOpen(false);
            }
        };

        if (calendarDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [calendarDropdownOpen]);

    // Detect group events via the 'type' query param (set by Card.tsx link, and by App.tsx deep-link logic)
    const searchParams = new URLSearchParams(location.search);
    const eventType = searchParams.get('type') || '';
    const isGroupEvent = eventType === 'group-event' || location.pathname.includes('/group-event/');
    const { event, loading, error } = useSingleEvent(slug, isGroupEvent);

    // Date/Time Formatters
    const formatEventDateRange = (startStr: string, endStr: string) => {
        if (!startStr) return '';
        try {
            const start = new Date(startStr);
            const end = endStr ? new Date(endStr) : start;

            const isSameDay = start.toDateString() === end.toDateString();
            const startWeekday = start.toLocaleDateString('en-US', { weekday: 'long' });
            const startMonth = start.toLocaleDateString('en-US', { month: 'long' });
            const startDay = start.getDate();
            const startYear = start.getFullYear();

            if (isSameDay) {
                return `${startWeekday}, ${startMonth} ${startDay}, ${startYear}`;
            }

            const endWeekday = end.toLocaleDateString('en-US', { weekday: 'long' });

            // Check if same month
            if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
                const endDay = end.getDate();
                return `${startWeekday} - ${endWeekday}, ${startMonth} ${startDay} - ${endDay}, ${startYear}`;
            }
            // If different month but same year
            if (start.getFullYear() === end.getFullYear()) {
                const endMonth = end.toLocaleDateString('en-US', { month: 'long' });
                const endDay = end.getDate();
                return `${startWeekday} - ${endWeekday}, ${startMonth} ${startDay} - ${endMonth} ${endDay}, ${startYear}`;
            }

            return `${start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`;
        } catch {
            return startStr;
        }
    };

    // For specific date mapping logic later on in schedule where we just need "Mar 04, 2026"
    const getFormattedDate = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };


    const extractMeridiemTime = (value?: string) => {
        if (!value) return '';
        const match = value.match(/(\d{1,2}:\d{2}\s?[AP]M)$/i);
        return match ? match[1].toUpperCase().replace(/\s+/g, ' ') : '';
    };

    const getFormattedTimeRange = (startStr: string, endStr: string) => {
        if (!startStr) return '';

        const formattedStart = extractMeridiemTime(startStr);
        const formattedEnd = extractMeridiemTime(endStr);
        if (formattedStart) {
            return `${formattedStart}${formattedEnd ? ` - ${formattedEnd}` : ''} CDT`;
        }

        try {
            const options: Intl.DateTimeFormatOptions = {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            };
            const start = new Date(startStr).toLocaleTimeString('en-US', options);
            const end = endStr ? new Date(endStr).toLocaleTimeString('en-US', options) : '';
            return `${start}${end ? ` - ${end}` : ''} CDT`;
        } catch {
            return '';
        }
    };
    const getCalendarLocation = (evt: Event) => {
        const locationParts = [
            evt.venue?.name,
            evt.venue?.address_line_1,
            evt.venue?.city,
            evt.venue?.state ? `${evt.venue.state}${evt.venue.zip_code ? ` ${evt.venue.zip_code}` : ''}` : evt.venue?.zip_code,
        ].filter(Boolean);

        if (locationParts.length > 0) {
            return locationParts.join(', ');
        }

        return evt.virtual_meeting_link ? 'Online Event' : '';
    };


    // Date/Time Helper for Calendar Links
    const formatCalendarDate = (dateStr: string) => {
        return new Date(dateStr).toISOString().replace(/-|:|\.\d\d\d/g, "");
    };

    const getCalendarDetails = (evt: Event) => {
        const title = encodeURIComponent(evt.title);
        const details = encodeURIComponent(evt.description.replace(/<[^>]+>/g, ''));
        const location = encodeURIComponent(getCalendarLocation(evt));
        const start = formatCalendarDate(evt.start_date);
        const end = formatCalendarDate(evt.end_date);
        return { title, details, location, start, end };
    };

    const generateICSFile = (evt: Event) => {
        const { start, end } = getCalendarDetails(evt);
        const description = evt.description.replace(/<[^>]+>/g, '');
        const location = getCalendarLocation(evt);

        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'BEGIN:VEVENT',
            `DTSTART:${start}`,
            `DTEND:${end}`,
            `SUMMARY:${evt.title}`,
            `DESCRIPTION:${description}`,
            `LOCATION:${location.replace(/,/g, '\\,')}`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        return URL.createObjectURL(blob);
    };

    const getYahooCalendarLink = (evt: Event) => {
        const { title, details, location, start, end } = getCalendarDetails(evt);
        return `https://calendar.yahoo.com/?v=60&view=d&type=20&title=${title}&st=${start}&et=${end}&desc=${details}&in_loc=${location}`;
    };

    const getOutlookCalendarLink = (evt: Event) => {
        const { title, details, location, start, end } = getCalendarDetails(evt);
        return `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&startdt=${start}&enddt=${end}&subject=${title}&body=${details}&location=${location}`;
    };

    const getOffice365CalendarLink = (evt: Event) => {
        const { title, details, location, start, end } = getCalendarDetails(evt);
        return `https://outlook.office.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&startdt=${start}&enddt=${end}&subject=${title}&body=${details}&location=${location}`;
    };

    const getGoogleCalendarLink = (evt: Event) => {
        try {
            const startDate = new Date(evt.start_date).toISOString().replace(/-|:|\.\d\d\d/g, "");
            const endDate = new Date(evt.end_date).toISOString().replace(/-|:|\.\d\d\d/g, "");
            const title = encodeURIComponent(evt.title);
            const details = encodeURIComponent(evt.description.replace(/<[^>]+>/g, '')); // Strip HTML for cal desc
            const location = encodeURIComponent(getCalendarLocation(evt));

            return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${location}&ctz=America/Chicago`;
        } catch {
            return '#';
        }
    };

    const sponsorCount = event?.sponsors?.length ?? 0;
    const hasSponsors = sponsorCount > 0;
    const visibleSponsors = sponsorCount > 1 ? 2 : 1;
    const sponsorSlideGap = 20;
    const isSponsorCarouselLooping = sponsorCount > visibleSponsors;
    const sponsorLoopOffset = isSponsorCarouselLooping ? visibleSponsors : 0;
    const sponsorSlideBasis = `calc((100% - ${sponsorSlideGap * (visibleSponsors - 1)}px) / ${visibleSponsors})`;
    const sponsorTrackStep = `(${sponsorSlideBasis} + ${sponsorSlideGap}px)`;
    const sponsorSlides = React.useMemo(() => {
        const sponsors = event?.sponsors ?? [];

        if (!isSponsorCarouselLooping) {
            return sponsors;
        }

        return [
            ...sponsors.slice(-visibleSponsors),
            ...sponsors,
            ...sponsors.slice(0, visibleSponsors),
        ];
    }, [event?.sponsors, isSponsorCarouselLooping, visibleSponsors]);

    useEffect(() => {
        setIsSponsorTrackAnimating(true);
        setActiveSponsorIndex(sponsorLoopOffset);
    }, [sponsorCount, sponsorLoopOffset]);

    useEffect(() => {
        if (!isSponsorCarouselLooping) {
            return;
        }

        const autoplayId = window.setInterval(() => {
            setActiveSponsorIndex((prev) => prev + 1);
        }, 3500);

        return () => window.clearInterval(autoplayId);
    }, [isSponsorCarouselLooping]);

    const goToPreviousSponsor = () => {
        if (!sponsorCount) return;
        if (!isSponsorCarouselLooping) {
            setActiveSponsorIndex(0);
            return;
        }

        setActiveSponsorIndex((prev) => prev - 1);
    };

    const goToNextSponsor = () => {
        if (!sponsorCount) return;
        if (!isSponsorCarouselLooping) {
            setActiveSponsorIndex(0);
            return;
        }

        setActiveSponsorIndex((prev) => prev + 1);
    };

    const handleSponsorTrackTransitionEnd = () => {
        if (!isSponsorCarouselLooping) {
            return;
        }

        if (activeSponsorIndex >= sponsorCount + sponsorLoopOffset) {
            setIsSponsorTrackAnimating(false);
            setActiveSponsorIndex(sponsorLoopOffset);
            return;
        }

        if (activeSponsorIndex < sponsorLoopOffset) {
            setIsSponsorTrackAnimating(false);
            setActiveSponsorIndex(sponsorCount + activeSponsorIndex);
        }
    };

    useEffect(() => {
        if (isSponsorTrackAnimating) {
            return;
        }

        const resetAnimationFrame = window.requestAnimationFrame(() => {
            setIsSponsorTrackAnimating(true);
        });

        return () => window.cancelAnimationFrame(resetAnimationFrame);
    }, [isSponsorTrackAnimating]);

    if (loading) {
        return <SeamlessInitialLoader message="Loading event details..." />;
    }

    const handleEventImageError = (evt: React.SyntheticEvent<HTMLImageElement>) => {
        const target = evt.currentTarget;
        if (target.dataset.fallbackApplied === 'true') {
            return;
        }

        target.dataset.fallbackApplied = 'true';
        target.classList.add('seamless-default-icon');
        target.src = fallbackEventImageUrl;
    };

    if (error || !event) {
        return (
            <div className="seamless-single-event-container">
                <div className="seamless-error-container">
                    <p className="seamless-error-title">Event not found</p>
                    <a href={getEventsListURL()} className="seamless-btn-outline-primary seamless-single-evt-back-btn">Back to Events</a>
                </div>
            </div>
        );
    }

    // Prepare Sections
    const sections: { title: string; content: React.ReactNode }[] = [];


    const isMultiDayEvent = getFormattedDate(event?.start_date) !== getFormattedDate(event?.end_date);

    // 1. Schedule Section
    if (event?.schedules && event?.schedules.length > 0) {
        sections.push({
            title: 'Schedule',
            content: (
                <table className="event-schedule-table">
                    <thead>
                        <tr>
                            <th>{isMultiDayEvent ? 'DATE & TIME' : 'TIME'}</th>
                            <th>DESCRIPTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {event?.schedules.map((sch, idx) => {
                            // Helper to parse "Mar 04, 2026 12:00 PM" -> { date: "Mar 04", year: "2026", time: "12:00 PM", fullDate: "Mar 04, 2026" }
                            // Fallback using split if regex fails
                            const parseDateStr = (str: string) => {
                                if (!str) return { date: '', year: '', time: '', fullDate: '' };
                                const match = str.match(/^([A-Za-z]+\s\d+),\s(\d{4})\s(.*)$/);
                                if (match) {
                                    return { date: match[1], year: match[2], time: match[3], fullDate: `${match[1]}, ${match[2]}` };
                                }
                                // Fallback logic if format is different
                                return { date: str, year: '', time: '', fullDate: str };
                            };

                            const schStart = parseDateStr(sch?.start_date_display);
                            const schEnd = parseDateStr(sch?.end_date_display);
                            // Use formatted_start_date from event, or fallback to start_date
                            const mainStart = parseDateStr(event?.formatted_start_date || event?.start_date);

                            const isSameAsMainDate = schStart.fullDate === mainStart.fullDate;

                            // Check previous row to see if date changed
                            let isNewDateGroup = true;
                            if (idx > 0) {
                                const prevSchStart = parseDateStr(event?.schedules[idx - 1].start_date_display);
                                if (prevSchStart.fullDate === schStart.fullDate) {
                                    isNewDateGroup = false;
                                }
                            }

                            // Comparison Logic for Display
                            let displayString = '';
                            const isItemMultiDay = schStart.fullDate !== schEnd.fullDate;

                            if (isItemMultiDay) {
                                displayString = `${schStart.date} ${schStart.time} – ${schEnd.date} ${schEnd.time}`;
                            } else {
                                const timeRange = `${schStart.time} – ${schEnd.time}`;
                                if (isSameAsMainDate) {
                                    displayString = timeRange;
                                } else {
                                    // Date is different from main event.
                                    if (isNewDateGroup) {
                                        displayString = `${schStart.date} ${timeRange}`;
                                    } else {
                                        // Same date as previous row (but different from main event).
                                        // Standard table approach: Don't repeat date.
                                        displayString = timeRange;
                                    }
                                }
                            }

                            return (
                                <tr key={idx}>
                                    <td>{displayString}</td>
                                    <td dangerouslySetInnerHTML={{ __html: sch?.description }} />
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )
        });
    }

    // 2. Additional Details Sections (with defensive filtering)
    if (event?.additional_details && event?.additional_details.length > 0) {
        event?.additional_details.forEach(detail => {
            // Skip entries that have no title and no content — they would render as blank accordions
            if (!detail?.name && !detail?.value) return;
            sections.push({
                title: detail?.name || 'Details',
                content: <div dangerouslySetInnerHTML={{ __html: detail?.value || '' }} />
            });
        });
    }

    // 3. Legacy / fallback fields — some events return data in these older fields
    // rather than inside additional_details. Render them so nothing is lost.
    const legacySections: { key: keyof typeof event; label: string }[] = [
        { key: 'registration_details', label: 'Registration Details' },
        { key: 'dates_to_know', label: 'Dates to Know' },
        { key: 'location_parking_details', label: 'Location & Parking' },
        { key: 'advocacy_resources', label: 'Advocacy Resources' },
        { key: 'cme_credits', label: 'CME Credits' },
    ];

    legacySections.forEach(({ key, label }) => {
        const val = event?.[key] as string | undefined;
        if (val && val.trim()) {
            // Only add if not already covered by additional_details (match by label)
            const alreadyPresent = sections.some(
                s => s.title?.toLowerCase() === label.toLowerCase()
            );
            if (!alreadyPresent) {
                sections.push({
                    title: label,
                    content: <div dangerouslySetInnerHTML={{ __html: val }} />,
                });
            }
        }
    });

    const computedCapacity = event?.capacity || (event?.tickets && event?.tickets.length > 0 ? event?.tickets[0].inventory : null);

    // Choose which date boundaries to use
    const startDateToUse = isGroupEvent && event?.event_date_range?.start ? event?.event_date_range.start : event?.start_date;
    const endDateToUse = isGroupEvent && event?.event_date_range?.end ? event?.event_date_range.end : event?.end_date;
    const startDateDisplay = event?.formatted_start_date || startDateToUse;
    const endDateDisplay = event?.formatted_end_date || endDateToUse;

    // Check if event has passed
    const isEventPassed = new Date(endDateToUse || startDateToUse).getTime() < new Date().getTime();
    console.log('Event Passed:', isEventPassed);

    return (
        <article className="seamless-single-event-container">
            <nav className="seamless-breadcrumbs" aria-label="Breadcrumb">
                <a href={getWordPressSiteUrl()} className="seamless-breadcrumb-link">Home</a>
                <span className="seamless-breadcrumb-separator" aria-hidden="true">»</span>
                <a href={getEventsListURL()} className="seamless-breadcrumb-link">Events</a>
                <span className="seamless-breadcrumb-separator" aria-hidden="true">»</span>
                <span className="seamless-breadcrumb-current">{event?.title}</span>
            </nav>

            <div className="seamless-single-event-grid">
                {/* Header - Moved out for mobile/tab ordering */}
                <div className="seamless-event-header-wrapper">
                    <header className="seamless-event-header-group">
                        <div className="seamless-event-icon-circle">
                            <img
                                src={event?.featured_image || fallbackEventImageUrl}
                                className={event?.featured_image ? '' : 'seamless-default-icon'}
                                alt={event?.featured_image ? 'Event Icon' : 'Seamless Logo'}
                                onError={handleEventImageError}
                            />
                        </div>
                        <h1 className="seamless-event-title">{event?.title}</h1>
                    </header>

                    {/* Left Column Content (Description + Accordions) */}
                    <section className="seamless-single-event-content">
                        {/* Description */}
                        <div className="seamless-event-description" dangerouslySetInnerHTML={{ __html: event?.description }}></div>


                        {/* Accordions */}
                        <SeamlessAccordion items={sections} />

                        {hasSponsors && (
                            <section className="seamless-sponsors-section" aria-label="Event sponsors">
                                <h3 className="seamless-sponsors-title">Thank You, Partners!</h3>
                                <p className="seamless-sponsors-description">
                                    We&apos;re grateful for our health care partners and their support of this series and Minnesota&apos;s family physicians.
                                </p>

                                <div className="seamless-sponsors-carousel">
                                    {isSponsorCarouselLooping && (
                                        <button
                                            type="button"
                                            className="seamless-sponsor-nav seamless-sponsor-nav-prev"
                                            onClick={goToPreviousSponsor}
                                            aria-label="Show previous sponsor"
                                        >
                                            <ChevronLeft size={28} strokeWidth={2.25} />
                                        </button>
                                    )}

                                    <div className="seamless-sponsor-slider-window">
                                        <div
                                            className="seamless-sponsor-slider-track"
                                            style={{
                                                transform: `translateX(calc(-${activeSponsorIndex} * ${sponsorTrackStep}))`,
                                                transition: isSponsorTrackAnimating ? 'transform 0.45s ease' : 'none',
                                                gap: `${sponsorSlideGap}px`,
                                            }}
                                            onTransitionEnd={handleSponsorTrackTransitionEnd}
                                        >
                                            {sponsorSlides.map((sponsorUrl, index) => (
                                                <div
                                                    key={`${sponsorUrl}-${index}`}
                                                    className="seamless-sponsor-slide"
                                                    style={{
                                                        flex: `0 0 ${sponsorSlideBasis}`,
                                                    }}
                                                >
                                                    <img
                                                        src={sponsorUrl}
                                                        alt={`Sponsor ${index + 1}`}
                                                        className="seamless-sponsor-image"
                                                        loading="lazy"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {isSponsorCarouselLooping && (
                                        <button
                                            type="button"
                                            className="seamless-sponsor-nav seamless-sponsor-nav-next"
                                            onClick={goToNextSponsor}
                                            aria-label="Show next sponsor"
                                        >
                                            <ChevronRight size={28} strokeWidth={2.25} />
                                        </button>
                                    )}
                                </div>
                            </section>
                        )}
                    </section>
                </div>

                {/* Right Column: Sidebar */}
                <aside className="seamless-single-event-sidebar">
                    {/* Details Box */}
                    <section className="seamless-sidebar-box seamless-details-box">
                        <ul className="seamless-single-evt-details-list">
                            <li className="seamless-detail-row">
                                <Calendar className="seamless-detail-icon" size={20} />
                                <div className='seamless-detials-container'>
                                    <span className="seamless-detail-label">Date</span>
                                    <p className="seamless-detail-value">{formatEventDateRange(startDateDisplay, endDateDisplay)}</p>
                                </div>
                            </li>
                            <li className="seamless-detail-row">
                                <Clock className="seamless-detail-icon" size={20} />
                                <div className='seamless-detials-container'>
                                    <span className="seamless-detail-label">Time</span>
                                    <p className="seamless-detail-value">{getFormattedTimeRange(startDateDisplay, endDateDisplay)}</p>
                                </div>
                            </li>
                            {computedCapacity !== null && (
                                <li className="seamless-detail-row">
                                    <Users className="seamless-detail-icon" size={20} />
                                    <div className="seamless-single-evt-full-width seamless-detials-container">
                                        <span className="seamless-detail-label">Capacity</span>
                                        <p className="seamless-detail-value">{computedCapacity} capacity</p>
                                    </div>
                                </li>
                            )}
                            <li className="seamless-detail-row">
                                <MapPin className="seamless-detail-icon" size={20} />
                                <div className='seamless-detials-container'>
                                    <span className="seamless-detail-label">Location</span>
                                    {event?.venue?.name && (
                                        <p className="seamless-detail-value seamless-location-details">
                                            {event?.venue?.google_map_url ? (
                                                <a href={event?.venue.google_map_url} target="_blank" rel="noopener noreferrer" className="seamless-location-link">
                                                    {event?.venue.name}
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                                </a>
                                            ) : (
                                                <span>{event?.venue.name}</span>
                                            )}
                                        </p>
                                    )}
                                    {(event?.venue?.address_line_1 || event?.venue?.city) && (
                                        <div className="seamless-detail-subvalue" style={{ lineHeight: 'var(--seamless-line-height-1-4)', display: 'flex', flexDirection: 'column' }}>
                                            <span>{event?.venue.address_line_1 ? `${event?.venue.address_line_1} ${event?.venue.name || ''},` : ''}</span>
                                            <span>{event?.venue.city ? `(${event?.venue.city}, ${event?.venue.state})` : ''}</span>
                                        </div>
                                    )}
                                </div>
                            </li>
                        </ul>

                        {!isEventPassed && (
                            <div className="seamless-single-evt-dropdown-wrap" ref={calendarDropdownRef}>
                                <div className="seamless-calendar-trigger-group">
                                    <button
                                        onClick={() => setCalendarDropdownOpen(!calendarDropdownOpen)}
                                        className="seamless_single_page_calendar_button"
                                    >
                                        <span>Add to Calendar</span>
                                        {isCalendarAdded && (
                                            <div className="seamless-calendar-check-icon">
                                                <Check size={20} strokeWidth={3} />
                                            </div>
                                        )}
                                    </button>
                                </div>

                                {calendarDropdownOpen && (
                                    <div className="seamless-calendar-dropdown">
                                        <a href={generateICSFile(event)} download={`${event?.slug}.ics`} className="seamless-calendar-option" onClick={handleCalendarOptionClick}>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 245.657" className="seamless-cal-icon" style={{ height: '14px', width: 'auto' }} fill="#000000"><path d="M167.084 130.514c-.308-31.099 25.364-46.022 26.511-46.761-14.429-21.107-36.91-24.008-44.921-24.335-19.13-1.931-37.323 11.27-47.042 11.27-9.692 0-24.67-10.98-40.532-10.689-20.849.308-40.07 12.126-50.818 30.799-21.661 37.581-5.54 93.281 15.572 123.754 10.313 14.923 22.612 31.688 38.764 31.089 15.549-.612 21.433-10.073 40.242-10.073s24.086 10.073 40.546 9.751c16.737-.308 27.34-15.214 37.585-30.187 11.855-17.318 16.714-34.064 17.009-34.925-.372-.168-32.635-12.525-32.962-49.68l.045-.013zm-30.917-91.287C144.735 28.832 150.524 14.402 148.942 0c-12.344.503-27.313 8.228-36.176 18.609-7.956 9.216-14.906 23.904-13.047 38.011 13.786 1.075 27.862-7.004 36.434-17.376z"></path></svg>
                                            Apple
                                        </a>
                                        <a href={getGoogleCalendarLink(event)} target="_blank" rel="noopener noreferrer" className="seamless-calendar-option" onClick={handleCalendarOptionClick}>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className="seamless-cal-icon" style={{ height: '14px', width: 'auto' }}><path d="M152.637 47.363H47.363v105.273h105.273z" fill="#fff"></path><path d="M152.637 200L200 152.637h-47.363z" fill="#f72a25"></path><path d="M200 47.363h-47.363v105.273H200z" fill="#fbbc04"></path><path d="M152.637 152.637H47.363V200h105.273z" fill="#34a853"></path><path d="M0 152.637v31.576A15.788 15.788 0 0 0 15.788 200h31.576v-47.363z" fill="#188038"></path><path d="M200 47.363V15.788A15.79 15.79 0 0 0 184.212 0h-31.575v47.363z" fill="#1967d2"></path><path d="M15.788 0A15.79 15.79 0 0 0 0 15.788v136.849h47.363V47.363h105.274V0z" fill="#4285f4"></path><path d="M68.962 129.02c-3.939-2.653-6.657-6.543-8.138-11.67l9.131-3.76c.83 3.158 2.279 5.599 4.346 7.341 2.051 1.742 4.557 2.588 7.471 2.588 2.995 0 5.55-.911 7.699-2.718 2.148-1.823 3.223-4.134 3.223-6.934 0-2.865-1.139-5.208-3.402-7.031s-5.111-2.718-8.496-2.718h-5.273v-9.033h4.736c2.913 0 5.387-.781 7.389-2.376 2.002-1.579 2.995-3.743 2.995-6.494 0-2.441-.895-4.395-2.686-5.859s-4.053-2.197-6.803-2.197c-2.686 0-4.818.716-6.396 2.148s-2.767 3.255-3.451 5.273l-9.033-3.76c1.204-3.402 3.402-6.396 6.624-8.984s7.34-3.89 12.337-3.89c3.695 0 7.031.716 9.977 2.148s5.257 3.418 6.934 5.941c1.676 2.539 2.507 5.387 2.507 8.545 0 3.223-.781 5.941-2.327 8.187-1.546 2.23-3.467 3.955-5.729 5.143v.537a17.39 17.39 0 0 1 7.34 5.729c1.904 2.572 2.865 5.632 2.865 9.212s-.911 6.771-2.718 9.57c-1.823 2.799-4.329 5.013-7.52 6.624s-6.787 2.425-10.775 2.425c-4.622 0-8.887-1.318-12.826-3.988zm56.087-45.312l-10.026 7.243-5.013-7.601 17.985-12.972h6.901v61.198h-9.847z" fill="#1a73e8"></path></svg>
                                            Google
                                        </a>
                                        <a href={generateICSFile(event)} download={`${event?.slug}.ics`} className="seamless-calendar-option" onClick={handleCalendarOptionClick}>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200.016" className="seamless-cal-icon" style={{ height: '14px', width: 'auto' }} fill="#4b4b4b"><path d="M132.829 7.699c0-4.248 4.199-7.699 9.391-7.699s9.391 3.451 9.391 7.699v33.724c0 4.248-4.199 7.699-9.391 7.699s-9.391-3.451-9.391-7.699zm-25.228 161.263c-.553 0-.993-2.327-.993-5.208s.439-5.208.993-5.208h25.7c.553 0 .993 2.327.993 5.208s-.439 5.208-.993 5.208zm-81.803-59.766c-.553 0-.993-2.327-.993-5.208s.439-5.208.993-5.208h25.7c.553 0 .993 2.327.993 5.208s-.439 5.208-.993 5.208zm40.902 0c-.553 0-.993-2.327-.993-5.208s.439-5.208.993-5.208h25.7c.553 0 .993 2.327.993 5.208s-.439 5.208-.993 5.208zm40.902 0c-.553 0-.993-2.327-.993-5.208s.439-5.208.993-5.208h25.7c.553 0 .993 2.327.993 5.208s-.439 5.208-.993 5.208zm40.918 0c-.553 0-.993-2.327-.993-5.208s.439-5.208.993-5.208h25.7c.553 0 .993 2.327.993 5.208s-.439 5.208-.993 5.208zM25.798 139.079c-.553 0-.993-2.327-.993-5.208s.439-5.208.993-5.208h25.7c.553 0 .993 2.327.993 5.208s-.439 5.208-.993 5.208zm40.902 0c-.553 0-.993-2.327-.993-5.208s.439-5.208.993-5.208h25.7c.553 0 .993 2.327.993 5.208s-.439 5.208-.993 5.208zm40.902 0c-.553 0-.993-2.327-.993-5.208s.439-5.208.993-5.208h25.7c.553 0 .993 2.327.993 5.208s-.439 5.208-.993 5.208zm40.918 0c-.553 0-.993-2.327-.993-5.208s.439-5.208.993-5.208h25.7c.553 0 .993 2.327.993 5.208s-.439 5.208-.993 5.208zM25.798 168.962c-.553 0-.993-2.327-.993-5.208s.439-5.208.993-5.208h25.7c.553 0 .993 2.327.993 5.208s-.439 5.208-.993 5.208zm40.902 0c-.553 0-.993-2.327-.993-5.208s.439-5.208.993-5.208h25.7c.553 0 .993 2.327.993 5.208s-.439 5.208-.993 5.208zM48.193 7.699C48.193 3.451 52.393 0 57.585 0s9.391 3.451 9.391 7.699v33.724c0 4.248-4.199 7.699-9.391 7.699s-9.391-3.451-9.391-7.699zM10.417 73.763h179.15V34.945c0-1.302-.537-2.49-1.4-3.369-.863-.863-2.051-1.4-3.369-1.4h-17.155c-2.881 0-5.208-2.327-5.208-5.208s2.327-5.208 5.208-5.208h17.171c4.183 0 7.975 1.709 10.726 4.46S200 30.762 200 34.945v44.043 105.843c0 4.183-1.709 7.975-4.46 10.726s-6.543 4.46-10.726 4.46H15.186c-4.183 0-7.975-1.709-10.726-4.46C1.709 192.79 0 188.997 0 184.814V78.971 34.945c0-4.183 1.709-7.975 4.46-10.726s6.543-4.46 10.726-4.46h18.343c2.881 0 5.208 2.327 5.208 5.208s-2.327 5.208-5.208 5.208H15.186c-1.302 0-2.49.537-3.369 1.4-.863.863-1.4 2.051-1.4 3.369zm179.167 10.433H10.417v100.618c0 1.302.537 2.49 1.4 3.369.863.863 2.051 1.4 3.369 1.4h169.629c1.302 0 2.49-.537 3.369-1.4.863-.863 1.4-2.051 1.4-3.369zM82.08 30.176c-2.881 0-5.208-2.327-5.208-5.208s2.327-5.208 5.208-5.208h34.977c2.881 0 5.208 2.327 5.208 5.208s-2.327 5.208-5.208 5.208z"></path></svg>
                                            iCal File
                                        </a>
                                        <a href={getOffice365CalendarLink(event)} target="_blank" rel="noopener noreferrer" className="seamless-calendar-option" onClick={handleCalendarOptionClick}>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 239.766" className="seamless-cal-icon" style={{ height: '14px', width: 'auto' }} fill="#ea3829"><path d="M200 219.785l-.021-.012V20.591L128.615 0 .322 48.172 0 48.234.016 192.257l43.78-17.134V57.943l84.819-20.279-.012 172.285L.088 192.257l128.515 47.456v.053l71.376-19.753v-.227z"></path></svg>
                                            Microsoft 365
                                        </a>
                                        <a href={getOutlookCalendarLink(event)} target="_blank" rel="noopener noreferrer" className="seamless-calendar-option" onClick={handleCalendarOptionClick}>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 175" className="seamless-cal-icon" style={{ height: '14px', width: 'auto' }}><path d="M178.725 0H71.275A8.775 8.775 0 0 0 62.5 8.775v9.975l60.563 18.75L187.5 18.75V8.775A8.775 8.775 0 0 0 178.725 0z" fill="#0364b8"></path><path d="M197.813 96.281c.915-2.878 2.187-5.855 2.187-8.781-.002-1.485-.795-2.857-1.491-3.26l-68.434-38.99a9.37 9.37 0 0 0-9.244-.519c-.312.154-.614.325-.906.512l-67.737 38.6-.025.013-.075.044a4.16 4.16 0 0 0-2.088 3.6c.541 2.971 1.272 5.904 2.188 8.781l71.825 52.532z" fill="#0a2767"></path><path d="M150 18.75h-43.75L93.619 37.5l12.631 18.75L150 93.75h37.5v-37.5z" fill="#28a8ea"></path><path d="M150 18.75h37.5v37.5H150z" fill="#50d9ff"></path><path d="M150 93.75l-43.75-37.5H62.5v37.5l43.75 37.5 67.7 11.05z" fill="#0364b8"></path><path d="M106.25 56.25v37.5H150v-37.5zM150 93.75v37.5h37.5v-37.5zm-87.5-75h43.75v37.5H62.5z" fill="#0078d4"></path><path d="M62.5 93.75h43.75v37.5H62.5z" fill="#064a8c"></path><path d="M126.188 145.113l-73.706-53.75 3.094-5.438 68.181 38.825a3.3 3.3 0 0 0 2.625-.075l68.331-38.937 3.1 5.431z" fill="#0a2767" opacity=".5"></path><path d="M197.919 91.106l-.088.05-.019.013-67.738 38.588c-2.736 1.764-6.192 1.979-9.125.569l23.588 31.631 51.588 11.257v-.001c2.434-1.761 3.876-4.583 3.875-7.587V87.5c.001 1.488-.793 2.862-2.081 3.606z" fill="#1490df"></path><path d="M200 165.625v-4.613l-62.394-35.55-7.531 4.294a9.356 9.356 0 0 1-9.125.569l23.588 31.631 51.588 11.231v.025a9.362 9.362 0 0 0 3.875-7.588z" opacity=".05"></path><path d="M199.688 168.019l-68.394-38.956-1.219.688c-2.734 1.766-6.19 1.984-9.125.575l23.588 31.631 51.587 11.256v.001a9.38 9.38 0 0 0 3.562-5.187z" opacity=".1"></path><path d="M51.455 90.721c-.733-.467-1.468-1.795-1.455-3.221v78.125c-.007 5.181 4.194 9.382 9.375 9.375h131.25c1.395-.015 2.614-.366 3.813-.813.638-.258 1.252-.652 1.687-.974z" fill="#28a8ea"></path><path d="M112.5 141.669V39.581a8.356 8.356 0 0 0-8.331-8.331H62.687v46.6l-10.5 5.987-.031.012-.075.044A4.162 4.162 0 0 0 50 87.5v.031-.031V150h54.169a8.356 8.356 0 0 0 8.331-8.331z" opacity=".1"></path><path d="M106.25 147.919V45.831a8.356 8.356 0 0 0-8.331-8.331H62.687v40.35l-10.5 5.987-.031.012-.075.044A4.162 4.162 0 0 0 50 87.5v.031-.031 68.75h47.919a8.356 8.356 0 0 0 8.331-8.331z" opacity=".2"></path><path d="M106.25 135.419V45.831a8.356 8.356 0 0 0-8.331-8.331H62.687v40.35l-10.5 5.987-.031.012-.075.044A4.162 4.162 0 0 0 50 87.5v.031-.031 56.25h47.919a8.356 8.356 0 0 0 8.331-8.331z" opacity=".2"></path><path d="M100 135.419V45.831a8.356 8.356 0 0 0-8.331-8.331H62.687v40.35l-10.5 5.987-.031.012-.075.044A4.162 4.162 0 0 0 50 87.5v.031-.031 56.25h41.669a8.356 8.356 0 0 0 8.331-8.331z" opacity=".2"></path><path d="M8.331 37.5h83.337A8.331 8.331 0 0 1 100 45.831v83.338a8.331 8.331 0 0 1-8.331 8.331H8.331A8.331 8.331 0 0 1 0 129.169V45.831A8.331 8.331 0 0 1 8.331 37.5z" fill="#0078d4"></path><path d="M24.169 71.675a26.131 26.131 0 0 1 10.263-11.337 31.031 31.031 0 0 1 16.313-4.087 28.856 28.856 0 0 1 15.081 3.875 25.875 25.875 0 0 1 9.988 10.831 34.981 34.981 0 0 1 3.5 15.938 36.881 36.881 0 0 1-3.606 16.662 26.494 26.494 0 0 1-10.281 11.213 30 30 0 0 1-15.656 3.981 29.556 29.556 0 0 1-15.425-3.919 26.275 26.275 0 0 1-10.112-10.85 34.119 34.119 0 0 1-3.544-15.744 37.844 37.844 0 0 1 3.481-16.563zm10.938 26.613a16.975 16.975 0 0 0 5.769 7.463 15.069 15.069 0 0 0 9.019 2.719 15.831 15.831 0 0 0 9.631-2.806 16.269 16.269 0 0 0 5.606-7.481 28.913 28.913 0 0 0 1.787-10.406 31.644 31.644 0 0 0-1.687-10.538 16.681 16.681 0 0 0-5.413-7.75 14.919 14.919 0 0 0-9.544-2.956 15.581 15.581 0 0 0-9.231 2.744 17.131 17.131 0 0 0-5.9 7.519 29.85 29.85 0 0 0-.044 21.5z" fill="#fff"></path></svg>
                                            Outlook.com
                                        </a>
                                        <a href={getYahooCalendarLink(event)} target="_blank" rel="noopener noreferrer" className="seamless-calendar-option" onClick={handleCalendarOptionClick}>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 177.803" className="seamless-cal-icon" style={{ height: '14px', width: 'auto' }} fill="#6001d2"><path d="M0 43.284h38.144l22.211 56.822 22.5-56.822h37.135L64.071 177.803H26.694l15.308-35.645L.001 43.284zm163.235 45.403H121.64L158.558 0 200 .002zm-30.699 8.488c12.762 0 23.108 10.346 23.108 23.106s-10.345 23.106-23.108 23.106a23.11 23.11 0 0 1-23.104-23.106 23.11 23.11 0 0 1 23.104-23.106z"></path></svg>
                                            Yahoo
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>

                    {/* Tickets Box */}
                    <section className="seamless-sidebar-box seamless-tickets-box">

                        <h3 className="seamless-tickets-title">Tickets</h3>

                        {isEventPassed ? (
                            <div className="seamless-event-passed-box">
                                This event has passed
                            </div>
                        ) : (
                            <>
                                {/* Normal Event Tickets */}
                                {!isGroupEvent && event?.tickets && event?.tickets.map(ticket => (
                                    <div key={ticket?.id} className="seamless-ticket-item">
                                        <div className="seamless-ticket-row">
                                            <span className="seamless-ticket-name">{ticket?.label}</span>
                                            <span className="seamless-ticket-price">{ticket?.price === 0 ? 'Free' : `$${ticket?.price}`}</span>
                                        </div>
                                        {ticket?.formatted_registration_end_date && (
                                            <span className="seamless-ticket-deadline">
                                                Registration ends on {ticket.formatted_registration_end_date}
                                            </span>
                                        )}
                                    </div>
                                ))}

                                {/* Group Event Tickets from Associated Events */}
                                {isGroupEvent && event?.associated_events && event?.associated_events.map(assocEvent => (
                                    <div key={assocEvent.id} className="seamless-ticket-item">
                                        <div className="seamless-ticket-row">
                                            <span className="seamless-ticket-name">{assocEvent.title}</span>
                                            {assocEvent.price !== undefined ? (
                                                <span className="seamless-ticket-price">{assocEvent.price == 0 ? 'Free' : `$${assocEvent.price}`}</span>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}

                                {event?.registration_url ? (
                                    <a
                                        href={event?.registration_url}
                                        className="event-register-btn"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Register Now
                                    </a>
                                ) : null}
                            </>
                        )}
                    </section>
                </aside>
            </div>
        </article>
    );
};
