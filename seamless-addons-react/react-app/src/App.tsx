import React, { Suspense, lazy } from 'react';
import LoadingSpinner from './components/ui/LoadingSpinner';

import EventsList from './views/EventsList';
import SingleEvent from './views/SingleEvent';
import Memberships from './views/Memberships';
import Courses from './views/Courses';
import Dashboard from './views/Dashboard';

interface AppProps {
  view: string;
  extras: Record<string, string>;
}

export default function App({ view, extras }: AppProps) {
  const renderView = () => {
    switch (view) {
      case 'events':
      case 'events-list':
        return <EventsList extras={extras} />;
      case 'single-event':
      case 'event-additional-details':
      case 'event-breadcrumbs':
      case 'event-description':
      case 'event-excerpt':
      case 'event-featured-image':
      case 'event-location':
      case 'event-register-url':
      case 'event-schedules':
      case 'event-sidebar':
      case 'event-tickets':
      case 'event-title':
        return <SingleEvent slug={extras['slug'] ?? ''} type={extras['type'] ?? 'event'} part={view} extras={extras} />;
      case 'memberships':
      case 'memberships-list':
        return <Memberships />;
      case 'membership-compare-plans':
        return <Memberships part="compare-plans" />;
      case 'courses':
      case 'courses-list':
        return <Courses />;
      case 'dashboard':
      case 'user-dashboard':
        return <Dashboard />;
      default:
        return (
          <div className="seamless-error">
            <p>Unknown view: <code>{view}</code></p>
          </div>
        );
    }
  };

  return (
    <div className="seamless-app">
      <Suspense fallback={<LoadingSpinner />}>
        {renderView()}
      </Suspense>
    </div>
  );
}
