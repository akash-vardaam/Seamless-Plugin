import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMembershipPlans } from '../services/eventService';
import { ensureArray } from '../services/utils';
import ErrorState from '../components/ui/ErrorState';
import { MembershipsSkeleton } from '../components/ui/PageSkeletons';
import '../styles/global.css';

interface Props {
  part?: string;
  extras?: Record<string, string>;
}

export default function Memberships({ part = 'list' }: Props) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['memberships'],
    queryFn: async () => {
      const response = await fetchMembershipPlans();
      return ensureArray(response);
    },
  });

  const plans = data ?? [];

  if (isLoading) return <MembershipsSkeleton part={part} />;
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;

  if (plans.length === 0) {
    return (
      <div className="sr-empty">
        <p>No membership plans available.</p>
      </div>
    );
  }

  if (part === 'compare-plans') {
    return (
      <div className="sr-container sr-section">
        <div style={{ overflowX: 'auto' }}>
          <table className="sr-table" style={{ width: '100%', borderCollapse: 'collapse', borderRadius: 'var(--sr-radius-lg)', overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: 'var(--sr-bg-subtle)' }}>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid var(--sr-border)' }}>Features</th>
                {plans.map((plan: any) => (
                  <th key={plan.id} style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid var(--sr-border)' }}>
                    <div style={{ fontWeight: 800 }}>{plan.label}</div>
                    <div style={{ color: 'var(--sr-primary)', fontSize: '1.2rem' }}>{plan.is_free ? 'Free' : `$${plan.price}`}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--sr-border)' }}>
                <td style={{ padding: '1rem', fontWeight: 600 }}>Access Type</td>
                {plans.map((plan: any) => (
                  <td key={plan.id} style={{ padding: '1rem', textAlign: 'center' }}>
                    {plan.is_free ? 'Public' : 'Exclusive'}
                  </td>
                ))}
              </tr>
              <tr style={{ borderBottom: '1px solid var(--sr-border)' }}>
                <td style={{ padding: '1rem', fontWeight: 600 }}>Support</td>
                {plans.map((plan: any) => (
                  <td key={plan.id} style={{ padding: '1rem', textAlign: 'center' }}>
                    {plan.is_free ? 'Community' : 'Priority'}
                  </td>
                ))}
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td style={{ padding: '1rem' }} />
                {plans.map((plan: any) => (
                  <td key={plan.id} style={{ padding: '1rem', textAlign: 'center' }}>
                    <button className="sr-btn sr-btn-primary sr-btn-sm" style={{ width: '100%' }}>Select</button>
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="sr-container sr-section">
      <div className="sr-grid sr-grid-2">
        {plans.map((plan: any) => (
          <article key={plan.id} className="sr-card" style={{ position: 'relative' }}>
            <div className="sr-card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.75rem' }}>
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', color: 'var(--sr-text)' }}>{plan.label}</h3>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--sr-primary)' }}>
                  {plan.is_free ? 'Free' : `$${plan.price}`}
                  {!plan.is_free && plan.interval && (
                    <span style={{ fontSize: '.75rem', fontWeight: 400, color: 'var(--sr-text-muted)' }}>/{plan.interval}</span>
                  )}
                </div>
              </div>

              {plan.description && (
                <p style={{ margin: '0 0 1rem', fontSize: '.875rem', color: 'var(--sr-text-muted)', lineHeight: 1.6 }}>{plan.description}</p>
              )}

              {plan.features && plan.features.length > 0 && (
                <ul style={{ margin: '0 0 1.25rem', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                  {plan.features.map((feat: string, index: number) => (
                    <li key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '.5rem', fontSize: '.875rem', color: 'var(--sr-text)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sr-secondary)" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: '2px' }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {feat}
                    </li>
                  ))}
                </ul>
              )}

              <button className="sr-btn sr-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                {plan.is_free ? 'Get Started' : 'Subscribe'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
