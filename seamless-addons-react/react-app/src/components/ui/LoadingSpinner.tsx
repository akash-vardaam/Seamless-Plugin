import React from 'react';

export default function LoadingSpinner({ text = 'Loading…' }: { text?: string }) {
  return (
    <div className="sr-loading-center">
      <div className="sr-spinner" role="status" aria-label={text} />
      <span>{text}</span>
    </div>
  );
}
