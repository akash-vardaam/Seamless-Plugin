import React, { useMemo } from 'react';
import { BrowserRouter, MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { EventListView } from './components/EventListView';
import { SingleEventPage } from './components/SingleEventPage';
import { MembershipListView } from './components/MembershipView';
import { CoursesView } from './components/CoursesView';
import { UserDashboardView } from './components/UserDashboardView';
import { ShadowRoot } from './components/ShadowRoot';
import { getRuntimeThemeSettings } from './theme';
import { getEventListRoutePath, getSingleEventRoutePath } from './utils/urlHelper';

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
  initialView?: string;
  initialSlug?: string;
  initialType?: string;
  siteUrl?: string;
}

const normalizeEventType = (value?: string): string => {
  return (value || '').trim().toLowerCase().replace(/_/g, '-');
};

const App: React.FC<AppProps> = ({ initialView, initialSlug, initialType, siteUrl: _siteUrl }) => {
  const runtimeThemeSettings = useMemo(() => getRuntimeThemeSettings(), []);
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
      runtimeThemeSettings.styleOverrides,
    ].join('\n'),
  ] as string[], [runtimeThemeSettings.styleOverrides]);

  const singleEventRoutePath = getSingleEventRoutePath();
  const eventListRoutePath = getEventListRoutePath();
  const viewRoutes: Record<string, { path: string; element: React.ReactNode }> = {
    events: { path: eventListRoutePath, element: <EventListView /> },
    'single-event': { path: singleEventRoutePath, element: <SingleEventPage /> },
    memberships: { path: '/', element: <MembershipListView /> },
    courses: { path: '/', element: <CoursesView /> },
    dashboard: { path: '/', element: <UserDashboardView /> },
  };

  if (initialView) {
    const route = viewRoutes[initialView];
    if (!route) {
      return (
        <ShadowRoot styles={styles}>
          <div id="seamless-plugin-root" className="seamless-page-wrapper">
            <p>Unknown view: {initialView}</p>
          </div>
        </ShadowRoot>
      );
    }

    let initialEntry = route.path;
    const searchParams = new URLSearchParams(window.location.search);
    const eventParam = searchParams.get('seamless_event');
    const typeParam = normalizeEventType(searchParams.get('type') || initialType || '');
    const isGroupEvent = typeParam === 'group-event';

    if (initialView === 'events' && eventParam) {
      initialEntry = singleEventRoutePath.replace(':slug', eventParam);
      const qs = searchParams.toString();
      if (qs) {
        initialEntry += `?${qs}`;
      }
    } else if (initialView === 'single-event' && (initialSlug || eventParam)) {
      initialEntry = singleEventRoutePath.replace(':slug', initialSlug || eventParam || '');
      if (isGroupEvent) {
        initialEntry += '?type=group-event';
      }
    } else {
      const qs = searchParams.toString();
      if (qs) {
        initialEntry += `?${qs}`;
      }
    }

    return (
      <ShadowRoot styles={styles}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <div id="seamless-plugin-root" className="seamless-page-wrapper">
            <Routes>
              <Route path={route.path} element={route.element} />
              <Route path={singleEventRoutePath} element={<SingleEventPage />} />
              <Route path="*" element={route.element} />
            </Routes>
          </div>
        </MemoryRouter>
      </ShadowRoot>
    );
  }

  return (
    <ShadowRoot styles={styles}>
      <BrowserRouter>
        <div id="seamless-plugin-root" className="seamless-page-wrapper">
          <Routes>
            <Route path="/" element={<EventListView />} />
            <Route path={eventListRoutePath} element={<EventListView />} />
            <Route path={singleEventRoutePath} element={<SingleEventPage />} />
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
