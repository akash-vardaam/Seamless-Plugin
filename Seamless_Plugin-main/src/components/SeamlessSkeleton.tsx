import React, { useEffect, useRef, useState } from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface SeamlessSkeletonProps {
  name?: string;
  loading: boolean;
  mode?: 'page' | 'section' | 'inline';
  minDurationMs?: number;
  children: React.ReactNode;
}

const wrapperStyle: Record<NonNullable<SeamlessSkeletonProps['mode']>, React.CSSProperties> = {
  page: { width: '100%', minHeight: '55vh', padding: '24px' },
  section: { width: '100%', minHeight: '220px', padding: '16px' },
  inline: { width: '100%', minHeight: '120px', padding: '8px 0' },
};

const stackStyle: React.CSSProperties = {
  display: 'grid',
  gap: '12px',
};

const SkeletonFallback: React.FC<{ mode: NonNullable<SeamlessSkeletonProps['mode']> }> = ({ mode }) => {
  const rowHeights = mode === 'page' ? [52, 160, 160, 160] : mode === 'section' ? [34, 112, 112] : [20, 20, 20];

  return (
    <div aria-hidden="true" style={wrapperStyle[mode]}>
      <div style={stackStyle}>
        {rowHeights.map((height, index) => (
          <Skeleton key={index} height={height} borderRadius={12} />
        ))}
      </div>
    </div>
  );
};

export const SeamlessSkeleton: React.FC<SeamlessSkeletonProps> = ({
  loading,
  mode = 'page',
  minDurationMs = 600,
  children,
}) => {
  const [showSkeleton, setShowSkeleton] = useState<boolean>(loading);
  const loadingStartRef = useRef<number | null>(loading ? Date.now() : null);
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (loading) {
      loadingStartRef.current = Date.now();
      setShowSkeleton(true);
      return;
    }

    const startedAt = loadingStartRef.current;
    if (!startedAt) {
      setShowSkeleton(false);
      return;
    }

    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(minDurationMs - elapsed, 0);

    if (remaining === 0) {
      setShowSkeleton(false);
      return;
    }

    hideTimerRef.current = window.setTimeout(() => {
      setShowSkeleton(false);
      hideTimerRef.current = null;
    }, remaining);
  }, [loading, minDurationMs]);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  if (!showSkeleton) return <>{children}</>;

  return (
    <SkeletonTheme baseColor="#e5e7eb" highlightColor="#f8fafc">
      <SkeletonFallback mode={mode} />
    </SkeletonTheme>
  );
};
