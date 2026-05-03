import React, { useMemo, useEffect, useState } from 'react';
import { useMembershipPlans } from '../hooks/useMembershipPlans';
import { getWordPressSiteUrl } from '../utils/urlHelper';
import { SeamlessInitialLoader } from './ui/SeamlessInitialLoader';
import { useInitialLoading } from '../hooks/useInitialLoading';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';

const getSafeDescriptionText = (description?: string) => {
    if (!description) return '';
    if (typeof window === 'undefined') {
        return description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(description, 'text/html');
    return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
};

export const MembershipListView: React.FC = () => {
    const { plans, loading, error } = useMembershipPlans();
    const [hasHydrated, setHasHydrated] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') {
            setHasHydrated(true);
            return;
        }

        let frame: number | null = window.requestAnimationFrame(() => {
            setHasHydrated(true);
        });

        return () => {
            if (frame !== null) {
                window.cancelAnimationFrame(frame);
            }
        };
    }, []);

    const showInitialLoader = useInitialLoading(loading || !hasHydrated);

    const comparisonKeys = useMemo(() => {
        const keys = new Set<string>();
        plans.forEach(plan => {
            if (plan.content_rules) {
                Object.keys(plan.content_rules).forEach((k) => keys.add(k));
            }
        });
        return Array.from(keys);
    }, [plans]);

    if (error) {
        return (
            <div className="seamless-error-container">
                <p className="seamless-error-title">Error loading plans</p>
                <p className="seamless-error-message">{error}</p>
            </div>
        );
    }

    const baseUrl = getWordPressSiteUrl();

    if (showInitialLoader) return <SeamlessInitialLoader message="Loading membership plans..." />;

    return (
        <div className="seamless-membership-container">
            {loading ? (
                <SkeletonTheme baseColor="#e5e7eb" highlightColor="#f8fafc">
                    <div className="seamless-plans-grid">
                        {Array.from({ length: 3 }).map((_, idx) => (
                            <div key={idx} className="seamless-plan-card">
                                <div className="seamless-plan-header-row">
                                    <div className="seamless-plan-header-left">
                                        <Skeleton height={32} width="70%" containerClassName="seamless-skeleton-container" />
                                    </div>
                                    <div className="seamless-plan-header-right">
                                        <Skeleton height={48} width={80} containerClassName="seamless-skeleton-container" />
                                    </div>
                                </div>
                                <div className="seamless-plan-meta-row">
                                    <div className="seamless-plan-meta-badges">
                                        <Skeleton width={140} height={24} containerClassName="seamless-skeleton-container" />
                                    </div>
                                    <Skeleton width={100} containerClassName="seamless-skeleton-container" />
                                </div>
                                <div className="seamless-plan-divider" />
                                <div className="seamless-plan-features-list">
                                    <Skeleton count={3} containerClassName="seamless-skeleton-container" />
                                </div>
                                <div className="seamless-plan-footer">
                                    <Skeleton height={44} containerClassName="seamless-skeleton-container" />
                                </div>
                            </div>
                        ))}
                    </div>
                </SkeletonTheme>
            ) : (
                <div className="seamless-plans-grid">
                {plans.map((plan) => {
                    const descriptionText = getSafeDescriptionText(plan.description);
                    const fallbackText = plan.content_rules && Object.keys(plan.content_rules).length > 0
                        ? Object.values(plan.content_rules).map((value) => String(value)).join(' � ')
                        : '';
                    const bodyText = descriptionText || fallbackText;

                    return (
                        <div key={plan.id} className="seamless-plan-card">
                            <div className="seamless-plan-header-row">
                                <div className="seamless-plan-header-left">
                                    <h3 className="seamless-plan-label">{plan.label}</h3>
                                </div>
                                <div className="seamless-plan-header-right">
                                    <div className="seamless-plan-price-badge">
                                        <span className="seamless-currency">$</span>
                                        <span className="seamless-amount">{plan.price}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="seamless-plan-meta-row">
                                <div className="seamless-plan-meta-badges">
                                    <div className="seamless-plan-badge">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="seamless-membership-plan-icon"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                        Subscription plan
                                    </div>
                                    {plan.is_group_membership && typeof plan.group_seats === 'number' && (
                                        <div className="seamless-plan-badge seamless-plan-badge-seats">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                            {plan.group_seats} seats
                                        </div>
                                    )}
                                </div>
                                <div className="seamless-plan-renewal">{plan.billing_cycle_display}</div>
                            </div>

                            <div className="seamless-plan-divider" />

                            <div className="seamless-plan-features-list">
                                {bodyText && <p className="seamless-plan-description-text">{bodyText}</p>}
                            </div>

                            <div className="seamless-plan-footer">
                                <a
                                    href={`${baseUrl.replace(/\/$/, '')}/memberships/${plan.id}`}
                                    className="seamless-plan-cta"
                                >
                                    GET STARTED
                                </a>
                            </div>
                        </div>
                    );
                })}
            </div>
            )}

            {!loading && comparisonKeys.length > 0 && (
                <div
                    className="seamless-comparison-section"
                    style={{ animation: 'seamless-slide-up-fade 0.46s ease-out forwards' }}
                >
                    <div className="seamless-compare-container">
                    <h2 className="seamless-comparison-title">Compare Plans</h2>
                    <span className="seamless-comparison-description">See what's included before you decide.</span>
                    </div>
                    <div className="seamless-comparison-table-wrapper">
                        <table className="seamless-comparison-table">
                            <thead>
                                <tr>
                                    <th className="seamless-comparison-header-cell">Offering</th>
                                    {plans.map((plan) => (
                                        <th key={plan.id} className="seamless-comparison-header-cell">
                                            <span className="seamless-comparison-plan-name">{plan.label}</span>
                                            <span className="seamless-comparison-plan-price">${plan.price} / {plan.billing_cycle_display}</span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonKeys.map((key) => (
                                    <tr key={key} className="seamless-comparison-row">
                                        <td>{key}</td>
                                        {plans.map((plan) => (
                                            <td key={`${plan.id}-${key}`} className="seamless-comparison-value">
                                                {plan.content_rules?.[key] !== undefined
                                                    ? String(plan.content_rules[key])
                                                    : '—'}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
