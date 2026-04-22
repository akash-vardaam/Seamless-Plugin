import React from 'react';
import type { ViewType } from '../types/event';

interface ViewSwitcherProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ currentView, onViewChange }) => {
  const views = [
    {
      key: 'list' as ViewType,
      label: 'List view',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="8" y1="6" x2="21" y2="6"></line>
          <line x1="8" y1="12" x2="21" y2="12"></line>
          <line x1="8" y1="18" x2="21" y2="18"></line>
          <line x1="3" y1="6" x2="3.01" y2="6"></line>
          <line x1="3" y1="12" x2="3.01" y2="12"></line>
          <line x1="3" y1="18" x2="3.01" y2="18"></line>
        </svg>
      ),
    },
    {
      key: 'grid' as ViewType,
      label: 'Grid view',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
        </svg>
      ),
    },
    {
      key: 'calendar' as ViewType,
      label: 'Calendar view',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      ),
    },
  ];

  return (
    <div className="seamless-view-switcher">
      {views.map((view) => (
        <button
          key={view.key}
          type="button"
          aria-label={view.label}
          title={view.label}
          onClick={() => onViewChange(view.key)}
          className={`seamless-view-switcher-button ${currentView === view.key
            ? 'seamless-view-switcher-button-active'
            : 'seamless-view-switcher-button-inactive'
            }`}
        >
          <span className="seamless-view-switcher-icon" aria-hidden="true">
            {view.icon}
          </span>
        </button>
      ))}
    </div>
  );
};
