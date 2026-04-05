import React from 'react';

interface Props {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({ title = 'Something went wrong', message, onRetry }: Props) {
  return (
    <div className="sr-error-state" role="alert">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <h3 style={{ margin: '0', fontSize: '1rem' }}>{title}</h3>
      {message && <p style={{ margin: '0', color: 'var(--sr-text-muted)', fontSize: '.875rem' }}>{message}</p>}
      {onRetry && (
        <button className="sr-btn sr-btn-outline sr-btn-sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
