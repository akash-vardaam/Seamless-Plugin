import React from 'react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
  circle?: boolean;
}

export default function Skeleton({ className = '', style, circle = false }: SkeletonProps) {
  const classes = ['sr-skeleton', className, circle ? 'sr-skeleton-circle' : '']
    .filter(Boolean)
    .join(' ');

  return <div className={classes} style={style} aria-hidden="true" />;
}
