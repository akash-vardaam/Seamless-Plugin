import React, { useMemo } from 'react';
import { BrowserRouter, MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { EventListView } from './components/EventListView';
import { SingleEventPage } from './components/SingleEventPage';
import { MembershipListView } from './components/MembershipView';
import { CoursesView } from './components/CoursesView';
import { UserDashboardView } from './components/UserDashboardView';
import { ShadowRoot } from './components/ShadowRoot';

// ── Inline CSS imports ────────────────────────────────────────────────────────
// Each file is imported as a raw string via Vite's `?inline` suffix.
// They are injected into the Shadow DOM so no external theme or plugin can
// override them.  Import ORDER matters for CSS cascade priority.
//
// 📌 To change any design value, edit src/theme.ts (TypeScript tokens)
//    and src/styles/variables.css (CSS custom properties).
// ─────────────────────────────────────────────────────────────────────────────
import variablesStyles from './styles/variables.css?inline';
import resetStyles from './styles/reset.css?inline';
import layoutStyles from './styles/layout.css?inline';
import formsStyles from './styles/forms.css?inline';
import filterBarStyles from './styles/filter-bar.css?inline';
import cardStyles from './styles/card.css?inline';
import buttonStyles from './styles/buttons.css?inline';
import paginationStyles from './styles/pagination.css?inline';
import calendarStyles from './styles/calendar.css?inline';
import viewSwitcherStyles from './styles/view-switcher.css?inline';
import singleEventStyles from './styles/single-event.css?inline';
import dashboardStyles from './styles/user-dashboard.css?inline';
import dashboardUtilsStyles from './styles/user-dashboard-utils.css?inline';
import coursesStyles from './styles/courses.css?inline';
import membershipStyles from './styles/membership.css?inline';
import accordionStyles from './styles/seamless-accordion.css?inline';
import calendarNewStyles from './styles/calendar-new.css?inline';
import indexUtilStyles from './styles/index.css?inline';

interface AppProps {
  /**
   * When mounted by a WordPress shortcode, this tells the app which
   * "page" to render directly (without router-based navigation).
   *   'events'       → EventListView  (shortcode: seamless_events_list)
   *   'single-event' → SingleEventPage (shortcode: seamless_single_event)
   *   'memberships'  → MembershipListView (shortcode: seamless_memberships)
   *   'courses'      → CoursesView     (shortcode: seamless_courses)
   *   'dashboard'    → UserDashboardView (shortcode: seamless_dashboard)
   */
  initialView?: string;
  /** Slug for the single-event view (passed as data attribute by the shortcode) */
  initialSlug?: string;
  /** WordPress site base URL, used for MemoryRouter basename */
  siteUrl?: string;
}

/**
 * Route map – maps `data-seamless-view` values to the component that should render.
 * In WordPress mode each shortcode only ever shows one view, so we render it
 * directly inside a MemoryRouter locked to the matching path.
 */
const VIEW_ROUTES: Record<string, { path: string; element: React.ReactNode }> = {
  events: { path: '/', element: <EventListView /> },
  'single-event': { path: '/events/:slug', element: <SingleEventPage /> },
  memberships: { path: '/', element: <MembershipListView /> },
  courses: { path: '/', element: <CoursesView /> },
  dashboard: { path: '/', element: <UserDashboardView /> },
};

const App: React.FC<AppProps> = ({ initialView, initialSlug, siteUrl: _siteUrl }) => {
  /**
   * Concatenate ALL stylesheet strings into a single CSS string.
   * This means only ONE #adopted-style-sheet is created in the shadow root
   * instead of one per file — dramatically reducing stylesheet overhead.
   *
   * useMemo prevents regenerating the string on every render.
   */
  const styles = useMemo(() => [
    [
      variablesStyles,
      resetStyles,
      layoutStyles,
      formsStyles,
      filterBarStyles,
      cardStyles,
      buttonStyles,
      paginationStyles,
      calendarStyles,
      viewSwitcherStyles,
      singleEventStyles,
      dashboardStyles,
      dashboardUtilsStyles,
      coursesStyles,
      membershipStyles,
      accordionStyles,
      calendarNewStyles,
      indexUtilStyles,
    ].join('\n'),
  ] as string[], []);

  // ── WordPress shortcode mode ────────────────────────────────────────────────
  if (initialView) {
    const route = VIEW_ROUTES[initialView];
    if (!route) {
      return (
        <ShadowRoot styles={styles}>
          <div id="seamless-plugin-root" className="seamless-page-wrapper">
            <p>Unknown view: {initialView}</p>
          </div>
        </ShadowRoot>
      );
    }

    // Build the initial entry for MemoryRouter so the route matches immediately.
    let initialEntry = route.path;

    // Read ALL query params from the real browser URL.
    const searchParams = new URLSearchParams(window.location.search);
    const eventParam = searchParams.get('seamless_event');
    const typeParam = searchParams.get('type') || 'events';

    if (initialView === 'events' && eventParam) {
      if (typeParam === 'group-event') {
        initialEntry = `/group-event/${eventParam}`;
      } else {
        initialEntry = `/events/${eventParam}`;
      }
      const qs = searchParams.toString();
      if (qs) initialEntry += `?${qs}`;
    } else if (initialView === 'single-event' && initialSlug) {
      initialEntry = `/events/${initialSlug}`;
    } else {
      const qs = searchParams.toString();
      if (qs) initialEntry += `?${qs}`;
    }

    return (
      <ShadowRoot styles={styles}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <div id="seamless-plugin-root" className="seamless-page-wrapper">
            <Routes>
              <Route path={route.path} element={route.element} />
              <Route path="/events/:slug" element={<SingleEventPage />} />
              <Route path="/group-event/:slug" element={<SingleEventPage />} />
              <Route path="*" element={route.element} />
            </Routes>
          </div>
        </MemoryRouter>
      </ShadowRoot>
    );
  }

  // ── Standalone / development mode ──────────────────────────────────────────
  return (
    <ShadowRoot styles={styles}>
      <BrowserRouter>
        <div id="seamless-plugin-root" className="seamless-page-wrapper">
          <Routes>
            <Route path="/" element={<EventListView />} />
            <Route path="/events" element={<EventListView />} />
            <Route path="/events/:slug" element={<SingleEventPage />} />
            <Route path="/group-event/:slug" element={<SingleEventPage />} />
            <Route path="/memberships" element={<MembershipListView />} />
            <Route path="/courses" element={<CoursesView />} />
            <Route path="/dashboard" element={<UserDashboardView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ShadowRoot>
  );
};

export default App;