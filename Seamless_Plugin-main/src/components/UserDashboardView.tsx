import React, { useMemo, useState, useEffect } from 'react';
import { useShadowRoot } from './ShadowRoot';
import api, { requestWithCache } from '../services/api';
import { COUNTRIES_STATES } from '../utils/countriesStates';
import { ArrowDownRight, ArrowUpRight, Check, ChevronDown, CircleCheckBig, CircleX, Clock3, Download, Plus, Send, Trash2, User, UserPlus, Users, X } from 'lucide-react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
// Type definitions for our dashboard data
interface UserProfile {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    phone_type: string;
    address_line_1: string;
    address_line_2: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    [key: string]: any;
}

type MembershipAction = 'upgrade' | 'downgrade' | 'cancel';
type DashboardView = 'profile' | 'memberships' | 'organization' | 'courses' | 'orders';

interface OrganizationInfo {
    id?: string | number;
    name?: string;
    email?: string;
    [key: string]: any;
}

interface GroupMemberInput {
    first_name: string;
    last_name: string;
    email: string;
    role: 'member' | 'admin';
}

// Reusable Toast Component
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`seamless-toast-notification seamless-toast-${type}`}>
            {message}
            <button onClick={onClose} className="seamless-toast-close">&times;</button>
        </div>
    );
};

const DashboardSkeletonLoader = ({ rows = 4, compact = false }: { rows?: number; compact?: boolean }) => (
    <SkeletonTheme baseColor="#e5e7eb" highlightColor="#f8fafc">
        <div className={`seamless-dashboard-loading-panel seamless-dashboard-skeleton ${compact ? 'is-compact' : ''}`} aria-live="polite" aria-busy="true">
            <div className="seamless-dashboard-skeleton-stack">
                <span className="seamless-dashboard-skeleton-line seamless-dashboard-skeleton-line-title"><Skeleton width="55%" containerClassName="seamless-skeleton-container" /></span>
                {Array.from({ length: rows }).map((_, index) => (
                    <span key={index} className="seamless-dashboard-skeleton-line seamless-dashboard-skeleton-line-body"><Skeleton width={`${92 - index * 7}%`} containerClassName="seamless-skeleton-container" /></span>
                ))}
            </div>
        </div>
    </SkeletonTheme>
);

// Reusable Modal Component
const Modal = ({ isOpen, onClose, title, children, className }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode, className?: string }) => {
    if (!isOpen) return null;
    return (
        <div className="seamless-modal-overlay" onClick={onClose}>
            <div className={`seamless-modal-content ${className || ''}`} onClick={e => e.stopPropagation()}>
                <div className="seamless-modal-header">
                    <h3>{title}</h3>
                    <button onClick={onClose} className="seamless-modal-close">&times;</button>
                </div>
                <div className="seamless-modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

const normalizeBool = (value: any) => value === true || value === 1 || value === '1';

const getMemberInitials = (member: any) => {
    const user = member?.user || {};
    const fullName = `${user?.first_name || member?.invited_first_name || ''} ${user?.last_name || member?.invited_last_name || ''}`.trim();
    const email = user?.email || member?.invited_email || '';
    const source = fullName || email;
    if (!source) return 'U';
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
};

const getMemberDisplay = (member: any) => {
    const user = member?.user || {};
    const fullName = `${user?.first_name || member?.invited_first_name || ''} ${user?.last_name || member?.invited_last_name || ''}`.trim();
    return {
        name: fullName || user?.email || member?.invited_email || 'Member',
        email: user?.email || member?.invited_email || 'N/A',
    };
};

const getRoleTagClassName = (role: string) => {
    const normalizedRole = String(role || 'member').toLowerCase();

    if (normalizedRole === 'owner') return 'seamless-org-role-owner';
    if (normalizedRole === 'admin') return 'seamless-org-role-admin';
    return 'seamless-org-role-member';
};

const getRoleDisplayLabel = (role: string) => {
    const normalizedRole = String(role || 'member').toLowerCase();

    if (normalizedRole === 'owner') return 'Owner';
    if (normalizedRole === 'admin') return 'Admin';
    return 'User';
};

const getMemberStatusMeta = (status: string) => {
    const normalizedStatus = String(status || 'pending').toLowerCase();

    if (normalizedStatus === 'accepted') {
        return {
            label: 'Accepted',
            className: 'seamless-org-status-accepted',
            icon: <Check size={12} />,
        };
    }

    if (normalizedStatus === 'declined') {
        return {
            label: 'Declined',
            className: 'seamless-org-status-declined',
            icon: <X size={12} />,
        };
    }

    return {
        label: 'Pending',
        className: 'seamless-org-status-pending',
        icon: <Clock3 size={12} />,
    };
};

const getRequestErrorMessage = (err: any, fallback: string) => {
    const responseData = err?.response?.data;

    return responseData?.message
        || responseData?.data?.message
        || responseData?.error?.message
        || err?.message
        || fallback;
};

const isAwsSesIdentityError = (message: string) => {
    if (!message) return false;

    return [
        /aws\s*ses/i,
        /ses\s*api\s*failed/i,
        /email\s*address\s*is\s*not\s*verified/i,
        /identities\s*failed\s*the\s*check/i,
    ].some((pattern) => pattern.test(message));
};

export const UserDashboardView: React.FC = () => {
    const shadowRoot = useShadowRoot();
    // SSO / Login State
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Data State
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [memberships, setMemberships] = useState<any[] | null>(null);
    const [expiredMemberships, setExpiredMemberships] = useState<any[] | null>(null);
    const [courses, setCourses] = useState<any[] | null>(null);
    const [includedCourses, setIncludedCourses] = useState<any[] | null>(null);
    const [courseProgressMap, setCourseProgressMap] = useState<Record<string, any>>({});
    const [orders, setOrders] = useState<any[] | null>(null);
    const [organization, setOrganization] = useState<OrganizationInfo | null>(null);
    const [groupMemberships, setGroupMemberships] = useState<any[] | null>(null);

    // UI State
    const [activeView, setActiveView] = useState<DashboardView>('profile');
    const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
    const [activeMembershipTab, setActiveMembershipTab] = useState<'active' | 'history'>('active');
    const [activeCourseTab, setActiveCourseTab] = useState<'enrolled' | 'included'>('enrolled');
    const [openDropdownId, setOpenDropdownId] = useState<string | number | null>(null);
    const [expandedOrgPlans, setExpandedOrgPlans] = useState<Record<string, boolean>>({});
    const [selectedOrgMembership, setSelectedOrgMembership] = useState<any | null>(null);
    const [groupMemberRows, setGroupMemberRows] = useState<GroupMemberInput[]>([{ first_name: '', last_name: '', email: '', role: 'member' }]);
    const [selectedCsvFileName, setSelectedCsvFileName] = useState<string>('No file chosen');
    const [orgWarningState, setOrgWarningState] = useState<{ open: boolean; members: GroupMemberInput[]; additionalCount: number; totalAdditionalCost: number; remainingSeats: number; } | null>(null);
    const [pendingOrgActionKey, setPendingOrgActionKey] = useState<string | null>(null);
    const [memberRoleDrafts, setMemberRoleDrafts] = useState<Record<string, string>>({});
    const [orgInlineNotice, setOrgInlineNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Action States
    const [actionModal, setActionModal] = useState<MembershipAction | null>(null);
    const [selectedMembershipId, setSelectedMembershipId] = useState<string | null>(null);
    const [selectedPlanForSwap, setSelectedPlanForSwap] = useState<any | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [renewingPlanId, setRenewingPlanId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);


    const getAuthenticatedCourseBaseUrl = (): string => {
        const cfg = (window as any).seamlessReactConfig;
        return cfg?.clientDomain || cfg?.siteUrl || window.location.origin;
    };

    const getDashboardEmail = (): string => profile?.email || '';

    const getMembershipById = (membershipId?: string | null) =>
        memberships?.find((membership) => String(membership.id) === String(membershipId)) || null;

    const getAvailablePlansForMembership = (membershipId: string | null, type: 'upgrade' | 'downgrade') => {
        const membership = getMembershipById(membershipId);
        const plans = type === 'upgrade' ? membership?.upgradable_to : membership?.downgradable_to;
        return Array.isArray(plans) ? plans : [];
    };

    const reloadMembershipData = (preferCache: boolean = true) => {
        fetchApiEndpoint('/dashboard/memberships', setMemberships, true, 'GET', undefined, preferCache);
        fetchApiEndpoint('/dashboard/memberships/history', setExpiredMemberships, true, 'GET', undefined, preferCache);
    };

    useEffect(() => {
        if (!orgInlineNotice) return;

        const timer = window.setTimeout(() => {
            setOrgInlineNotice(null);
        }, 4000);

        return () => window.clearTimeout(timer);
    }, [orgInlineNotice]);

    const reloadOrganizationData = async (preferCache: boolean = true) => {
        const email = getDashboardEmail();
        if (!email) return;

        setIsLoading(true);
        try {
            const response = await requestWithCache<any>({
                method: 'GET',
                url: '/dashboard/organization',
                params: { email }
            }, { preferCache });
            const data = response.data?.data || response.data || {};
            setOrganization(data?.organization || {});
            setGroupMemberships(Array.isArray(data?.group_memberships) ? data.group_memberships : []);
        } catch (err) {
            console.error('[Dashboard] Failed to fetch organization data:', err);
            setOrganization((prev) => prev || {});
            setGroupMemberships((prev) => prev || []);
        } finally {
            setIsLoading(false);
        }
    };

    const isMembershipCurrentlyActive = (membership: any) => {
        const status = String(membership?.status || '').toLowerCase();
        const expiryAt = membership?.expiry_date || membership?.expires_at;
        if (!expiryAt) return status === 'active' || status === 'cancelled';

        const expiryTime = new Date(expiryAt).getTime();
        const notExpired = Number.isNaN(expiryTime) ? true : expiryTime > Date.now();

        if (!notExpired) return false;

        return status === 'active' || status === 'cancelled';
    };

    const isMembershipExpired = (membership: any) => {
        const expiryAt = membership?.expiry_date || membership?.expires_at || membership?.ended_at;
        if (!expiryAt) return false;

        const expiryTime = new Date(expiryAt).getTime();
        return Number.isNaN(expiryTime) ? false : expiryTime <= Date.now();
    };

    const activeMemberships = Array.isArray(memberships)
        ? memberships.filter(isMembershipCurrentlyActive)
        : [];

    const historyMemberships = [
        ...(Array.isArray(memberships) ? memberships.filter((membership) => !isMembershipCurrentlyActive(membership) && isMembershipExpired(membership)) : []),
        ...(Array.isArray(expiredMemberships) ? expiredMemberships.filter(isMembershipExpired) : []),
    ].filter((membership, index, allMemberships) =>
        index === allMemberships.findIndex((candidate) => String(candidate?.id) === String(membership?.id))
    );

    const organizationSummary = useMemo(() => {
        const plans = Array.isArray(groupMemberships) ? groupMemberships : [];
        const roleCounts = { owner: 0, admin: 0, member: 0 };
        const uniqueRoles = new Set<string>();

        plans.forEach((membership) => {
            const role = String(membership?.role || 'member').toLowerCase();
            uniqueRoles.add(role);
            if (role in roleCounts) {
                roleCounts[role as keyof typeof roleCounts] += 1;
            }
        });

        const orgName = organization?.name || 'Organization';
        const orgEmail = organization?.email || '';
        const hasMultipleMemberships = plans.length > 1;
        const hasMixedRoles = uniqueRoles.size > 1;

        return {
            plans,
            roleCounts,
            hasMultipleMemberships,
            hasMixedRoles,
            eyebrow: hasMultipleMemberships ? 'Organization Memberships' : 'My Organization',
            title: !hasMultipleMemberships && orgName ? orgName : 'Your Organization Access',
            description: hasMultipleMemberships
                ? `${plans.length} active group membership${plans.length === 1 ? '' : 's'}. Permissions below are shown per membership.`
                : (orgEmail || 'Manage your organization membership details below.'),
        };
    }, [groupMemberships, organization]);

    const fetchApiEndpoint = async (
        endpoint: string,
        stateSetter: React.Dispatch<React.SetStateAction<any>>,
        isArray: boolean = true,
        method: string = 'GET',
        bodyPayload?: any,
        preferCache: boolean = true
    ) => {
        setIsLoading(true);
        try {
            const response = await requestWithCache<any>({
                method,
                url: endpoint,
                data: bodyPayload
            }, { preferCache });

            const data = response.data;

            if (data && data.message && !data.data && isArray) {
                stateSetter([]);
                return;
            }

            const parsedData = data?.data || data;

            stateSetter((prev: any) => {
                if (!isArray && prev && typeof prev === 'object') {
                    return { ...prev, ...parsedData };
                }
                if (isArray) {
                    if (Array.isArray(parsedData)) return parsedData;
                    if (parsedData && Array.isArray(parsedData.data)) return parsedData.data;
                    return [];
                }
                return parsedData;
            });
        } catch (err: any) {
            console.error(`[Dashboard] Failed to fetch API data for ${endpoint}:`, err);
            stateSetter((prev: any) => prev || (isArray ? [] : null));
        } finally {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        let savedView = localStorage.getItem('seamless-user-dashboard-active-view-react');
        if (savedView && ['profile', 'memberships', 'organization', 'courses', 'orders'].includes(savedView)) {
            setActiveView(savedView as any);
        } else {
            savedView = 'profile';
        }
        // Always fetch the quick sidebar info using GET
        if (!profile) fetchApiEndpoint('/dashboard/profile', setProfile, false);
    }, []);

    useEffect(() => {
        if (activeView === 'profile') {
            // Then fetch the extended profile data using PUT when on the profile page
            fetchApiEndpoint('/dashboard/profile/edit', setProfile, false, 'PUT', {});
        } else if (activeView === 'orders' && orders === null) {
            fetchApiEndpoint('/dashboard/orders', setOrders);
        } else if (activeView === 'courses') {
            if (courses === null) fetchApiEndpoint('/dashboard/courses/enrolled', setCourses);
            if (includedCourses === null) fetchApiEndpoint('/dashboard/courses/included', setIncludedCourses);
        } else if (activeView === 'organization' && profile?.email) {
            if (groupMemberships === null) {
                reloadOrganizationData();
            }
        } else if (activeView === 'memberships') {
            if (memberships === null) {
                fetchApiEndpoint('/dashboard/memberships', setMemberships);
            }
            if (expiredMemberships === null) {
                fetchApiEndpoint('/dashboard/memberships/history', setExpiredMemberships);
            }
        }
    }, [activeView, activeCourseTab, activeMembershipTab, profile?.email]);

    useEffect(() => {
        // Fetch progress for any loaded course that doesn't have progress yet
        const fetchProgress = async (c: any) => {
            if (!c?.id || courseProgressMap[c.id]) return;
            try {
                // Use the proxied api instance instead of direct fetch
                const res = await requestWithCache<any>({
                    method: 'GET',
                    url: `/dashboard/courses/${c.id}/progress`
                });
                const data = res.data;
                if (data && (data.success || data.progress !== undefined)) {
                    setCourseProgressMap(prev => ({ ...prev, [c.id]: data.data || data || {} }));
                }
            } catch (err) {
                console.error(`Status check failed for ${c.id}`);
            }
        };

        if (courses && Array.isArray(courses)) courses.forEach(fetchProgress);
        if (includedCourses && Array.isArray(includedCourses)) includedCourses.forEach(fetchProgress);

    }, [courses, includedCourses]);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Use composedPath to handle Shadow DOM events correctly
            const path = event.composedPath();
            // const target = path[0] as Element;

            // Search up the path for the menu container
            const isInsideMenu = path.some(el =>
                (el as Element).classList?.contains('seamless-user-dashboard-menu-container')
            );

            if (!isInsideMenu) {
                setOpenDropdownId(null);
            }
        };
        if (openDropdownId !== null) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openDropdownId]);

    const switchView = (view: DashboardView) => {
        setActiveView(view);
        localStorage.setItem('seamless-user-dashboard-active-view-react', view);
        setIsEditingProfile(false);
    };

    // --- Actions ---

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                first_name: profile?.first_name || '',
                last_name: profile?.last_name || '',
                email: profile?.email || '',
                phone: profile?.phone || '',
                phone_type: profile?.phone_type || 'mobile',
                address_line_1: profile?.address_line_1 || '',
                address_line_2: profile?.address_line_2 || '',
                city: profile?.city || '',
                state: profile?.state || '',
                zip_code: profile?.zip_code || '',
                country: profile?.country || ''
            };

            // Switch to proxied api call
            console.log("Submitting payload to /dashboard/profile/edit:", payload);
            await api.put('/dashboard/profile/edit', payload);

            setToast({ type: 'success', message: 'Profile updated successfully!' });
            setIsEditingProfile(false);
            fetchApiEndpoint('/dashboard/profile/edit', setProfile, false, 'PUT', {}, false);
        } catch (error: any) {
            console.error("Profile update failed!", error);
            if (error.response) {
                console.error("Error response data:", error.response.data);
                console.error("Error response status:", error.response.status);
            }
            setToast({ type: 'error', message: 'Could not update profile.' });
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (!profile) return;
        const name = e.target.name;
        const value = e.target.value;
        setProfile((prev) => {
            if (!prev) return prev;
            if (name === 'country' && prev.country !== value) {
                return { ...prev, [name]: value, state: '' }; // reset state when country changes
            }
            return { ...prev, [name]: value };
        });
    };

    const triggerSystemAction = async (endpoint: string, method: string = 'POST', payload: any = {}, successMsg: string = 'Action successful.') => {
        setIsSubmitting(true);
        try {
            // Proxied api handles the rest
            const response = await api.request({
                method,
                url: endpoint,
                data: payload
            });
            const data = response.data;
            if (data?.success || response.status === 200) {
                setToast({ type: 'success', message: successMsg });
                reloadMembershipData(false);
            } else {
                setToast({ type: 'error', message: data?.message || 'Failed to apply action.' });
            }
        } catch (err: any) {
            setToast({ type: 'error', message: err?.response?.data?.message || 'An error occurred during action.' });
        } finally {
            setIsSubmitting(false);
            const modal = (shadowRoot || document).getElementById('seamless-action-modal') as any;
            if (modal) modal.close();
            setSelectedPlanForSwap(null);
        }
    };

    const handleDowngradeAction = async (isImmediate: boolean) => {
        if (!selectedPlanForSwap || actionModal !== 'downgrade') return;
        const membership = getMembershipById(selectedMembershipId);
        const email = getDashboardEmail();
        if (!membership?.id || !email) {
            setToast({ type: 'error', message: 'Membership details are missing. Please refresh and try again.' });
            return;
        }
        setIsSubmitting(true);
        try {
            const endpoint = `/dashboard/memberships/downgrade/${selectedPlanForSwap.id}`;
            const response = await api.post(endpoint, {
                email,
                membership_id: membership.id,
                immediate: isImmediate
            });
            const data = response.data;
            if (data?.success || response.status === 200) {
                setToast({ type: 'success', message: data?.message || `Successfully applied membership downgrade!` });
                reloadMembershipData(false);
            } else {
                setToast({ type: 'error', message: data?.message || 'Failed to apply action.' });
            }
        } catch (err: any) {
            setToast({ type: 'error', message: err?.response?.data?.message || 'An error occurred during action.' });
        } finally {
            setIsSubmitting(false);
            setActionModal(null);
            setSelectedPlanForSwap(null);
        }
    };

    const handleUpgradeAction = async () => {
        if (!selectedPlanForSwap || actionModal !== 'upgrade') return;
        const membership = getMembershipById(selectedMembershipId);
        const email = getDashboardEmail();
        if (!membership?.id || !email) {
            setToast({ type: 'error', message: 'Membership details are missing. Please refresh and try again.' });
            return;
        }
        setIsSubmitting(true);
        try {
            const endpoint = `/dashboard/memberships/upgrade/${selectedPlanForSwap.id}`;
            const response = await api.post(endpoint, {
                email,
                membership_id: membership.id,
            });
            const data = response.data;

            const checkoutUrl = data?.data?.stripe_checkout_url || data?.data?.checkout_url || data?.checkout_url || data?.data?.url;
            if (checkoutUrl) {
                window.location.href = checkoutUrl;
                return;
            }

            if (data?.success || response.status === 200) {
                setToast({ type: 'success', message: data?.message || `Successfully applied membership upgrade!` });
                reloadMembershipData(false);
            } else {
                setToast({ type: 'error', message: data?.message || 'Failed to apply action.' });
            }
        } catch (err: any) {
            setToast({ type: 'error', message: err?.response?.data?.message || err?.message || 'An error occurred during action.' });
        } finally {
            setIsSubmitting(false);
            setActionModal(null);
            setSelectedPlanForSwap(null);
        }
    };

    const handleCancelMembership = () => {
        const membership = getMembershipById(selectedMembershipId);
        const email = getDashboardEmail();
        if (!membership?.id || !email) {
            setToast({ type: 'error', message: 'Membership details are missing. Please refresh and try again.' });
            return;
        }
        triggerSystemAction(`/dashboard/memberships/cancel/${membership.id}`, 'POST', { email }, 'Membership successfully canceled.');
    };

    const handleCancelScheduledChange = async (membershipId: string) => {
        const email = getDashboardEmail();
        if (!membershipId || !email) {
            setToast({ type: 'error', message: 'Scheduled change details are missing. Please refresh and try again.' });
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await api.post('/dashboard/memberships/cancel-scheduled-change', {
                email,
                membership_id: membershipId,
            });
            const data = response.data;
            if (data?.success || response.status === 200) {
                setToast({ type: 'success', message: data?.message || 'Scheduled downgrade cancelled successfully.' });
                reloadMembershipData(false);
            } else {
                setToast({ type: 'error', message: data?.message || 'Failed to cancel the scheduled downgrade.' });
            }
        } catch (err: any) {
            setToast({ type: 'error', message: err?.response?.data?.message || 'An error occurred during action.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRenewMembership = async (planId: string) => {
        const email = getDashboardEmail();
        if (!planId || !email) {
            setToast({ type: 'error', message: 'Renewal details are missing. Please refresh and try again.' });
            return;
        }

        setRenewingPlanId(planId);
        try {
            const response = await api.post(`/dashboard/memberships/renew/${planId}`, { email });
            const data = response.data;
            const checkoutUrl = data?.data?.stripe_checkout_url || data?.data?.checkout_url || data?.checkout_url || data?.data?.url;

            if (checkoutUrl) {
                window.location.href = checkoutUrl;
                return;
            }

            if (data?.success || response.status === 200) {
                setToast({ type: 'success', message: data?.message || 'Membership renewal started successfully.' });
                reloadMembershipData(false);
            } else {
                setToast({ type: 'error', message: data?.message || 'Failed to renew membership.' });
            }
        } catch (err: any) {
            setToast({ type: 'error', message: getRequestErrorMessage(err, 'An error occurred during renewal.') });
        } finally {
            setRenewingPlanId(null);
        }
    };

    const openModalFor = (type: MembershipAction, id: string) => {
        setSelectedMembershipId(id);
        setActionModal(type);
        const plans = type === 'cancel' ? [] : getAvailablePlansForMembership(id, type);
        setSelectedPlanForSwap(plans[0] || null);
        setOpenDropdownId(null);
    };

    const toggleOrganizationPlan = (membershipId: string | number) => {
        setExpandedOrgPlans((prev) => ({
            ...prev,
            [String(membershipId)]: !prev[String(membershipId)],
        }));
    };

    const openAddMembersModal = (membership: any) => {
        setSelectedOrgMembership(membership);
        setGroupMemberRows([{ first_name: '', last_name: '', email: '', role: 'member' }]);
        setSelectedCsvFileName('No file chosen');
        setOrgWarningState(null);
        setOrgInlineNotice(null);
    };

    const closeAddMembersModal = () => {
        setSelectedOrgMembership(null);
        setGroupMemberRows([{ first_name: '', last_name: '', email: '', role: 'member' }]);
        setSelectedCsvFileName('No file chosen');
        setOrgWarningState(null);
        setOrgInlineNotice(null);
    };

    const updateGroupMemberRow = (index: number, field: keyof GroupMemberInput, value: string) => {
        setGroupMemberRows((prev) => prev.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
    };

    const addGroupMemberRow = () => {
        if (!selectedOrgMembership) return;
        const remainingSeats = Math.max(0, Number(selectedOrgMembership?.plan?.group_seats || 0) - Number(selectedOrgMembership?.member_count || selectedOrgMembership?.group_members?.length || 0));
        const additionalEnabled = normalizeBool(selectedOrgMembership?.plan?.additional_seats_enabled);
        if (!additionalEnabled && groupMemberRows.length >= remainingSeats) {
            return;
        }
        setGroupMemberRows((prev) => [...prev, { first_name: '', last_name: '', email: '', role: 'member' }]);
    };

    const removeGroupMemberRow = (index: number) => {
        setGroupMemberRows((prev) => prev.length === 1 ? prev : prev.filter((_, rowIndex) => rowIndex !== index));
    };

    const handleCsvImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            setSelectedCsvFileName('No file chosen');
            return;
        }

        setSelectedCsvFileName(file.name);
        const contents = await file.text();
        const rows = contents.split(/[\r\n]+/).map((row) => row.trim()).filter(Boolean);
        const importedRows = rows.slice(1).map((row) => row.split(',').map((cell) => cell.trim())).filter((cols) => cols.length >= 3).map((cols) => ({
            email: cols[0] || '',
            first_name: cols[1] || '',
            last_name: cols[2] || '',
            role: cols[3]?.toLowerCase() === 'admin' ? 'admin' : 'member',
        })) as GroupMemberInput[];

        if (importedRows.length > 0) {
            setGroupMemberRows(importedRows);
        }
    };

    const getOrgRemainingDays = (membership: any) => Math.max(0, Math.floor(parseFloat(membership?.remaining_days || 0)));

    const getAdditionalSeatPrice = (membership: any) => {
        const basePrice = parseFloat(membership?.plan?.per_seat_price || 0);
        const isProrated = normalizeBool(membership?.plan?.prorated);
        const remainingDays = getOrgRemainingDays(membership);
        if (isProrated && remainingDays > 0) {
            return (basePrice / 31) * remainingDays;
        }
        return basePrice;
    };

    const validateAdminSeatCapacity = (membership: any, membersToAdd: GroupMemberInput[]) => {
        const adminSeatLimit = Number(membership?.plan?.group_admin_seats || 0);
        const currentAdminCount = (membership?.group_members || []).filter((member: any) => ['accepted', 'pending'].includes(String(member?.status || '').toLowerCase()) && ['admin', 'owner'].includes(String(member?.role || '').toLowerCase())).length;
        const requestedAdmins = membersToAdd.filter((member) => member.role === 'admin').length;

        if (adminSeatLimit > 0 && currentAdminCount + requestedAdmins > adminSeatLimit) {
            const message = `Could not add admin(s). This plan includes only ${adminSeatLimit} admin seat(s) and you already have ${currentAdminCount}.`;
            setOrgInlineNotice({ type: 'error', message });
            setToast({
                type: 'error',
                message,
            });
            return false;
        }

        return true;
    };

    const submitGroupMembers = async (membershipId: string | number, membersToAdd: GroupMemberInput[], options?: { closeOnSuccess?: boolean; reloadOnSuccess?: boolean; successMessage?: string }) => {
        const closeOnSuccess = options?.closeOnSuccess ?? true;
        const reloadOnSuccess = options?.reloadOnSuccess ?? true;
        setIsSubmitting(true);
        setOrgInlineNotice(null);
        try {
            const response = await api.post(`/dashboard/group/${membershipId}/members`, { members: membersToAdd });
            const data = response.data?.data || response.data || {};
            const checkoutUrl = data?.stripe_checkout_url || response.data?.stripe_checkout_url;

            if (data?.requires_payment && checkoutUrl) {
                window.location.href = checkoutUrl;
                return true;
            }

            const successMessage = options?.successMessage || response.data?.message || 'Members added successfully!';
            setOrgInlineNotice({ type: 'success', message: successMessage });
            setToast({ type: 'success', message: successMessage });
            if (closeOnSuccess) {
                closeAddMembersModal();
            }
            if (reloadOnSuccess) {
                await reloadOrganizationData(false);
            }
            return true;
        } catch (err: any) {
            const errorMessage = getRequestErrorMessage(err, 'Failed to add members.');
            setOrgInlineNotice({ type: 'error', message: errorMessage });
            setToast({ type: 'error', message: errorMessage });
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddGroupMembers = async () => {
        if (!selectedOrgMembership) return;

        const membersToAdd = groupMemberRows.map((row) => ({
            ...row,
            first_name: row.first_name.trim(),
            last_name: row.last_name.trim(),
            email: row.email.trim(),
        })).filter((row) => row.first_name || row.last_name || row.email);

        if (membersToAdd.length === 0 || membersToAdd.some((row) => !row.first_name || !row.last_name || !row.email)) {
            const message = 'Please fill in all required fields.';
            setOrgInlineNotice({ type: 'error', message });
            setToast({ type: 'error', message });
            return;
        }

        if (!validateAdminSeatCapacity(selectedOrgMembership, membersToAdd)) {
            return;
        }

        const remainingSeats = Math.max(0, Number(selectedOrgMembership?.plan?.group_seats || 0) - Number(selectedOrgMembership?.member_count || selectedOrgMembership?.group_members?.length || 0));
        const additionalEnabled = normalizeBool(selectedOrgMembership?.plan?.additional_seats_enabled);

        if (additionalEnabled && membersToAdd.length > remainingSeats) {
            const additionalCount = membersToAdd.length - remainingSeats;
            const totalAdditionalCost = getAdditionalSeatPrice(selectedOrgMembership) * additionalCount;
            setOrgWarningState({
                open: true,
                members: membersToAdd,
                additionalCount,
                totalAdditionalCost,
                remainingSeats,
            });
            return;
        }

        await submitGroupMembers(selectedOrgMembership.id, membersToAdd);
    };

    const handleProceedWithSeatWarning = async () => {
        if (!selectedOrgMembership || !orgWarningState) return;

        const freeMembers = orgWarningState.members.slice(0, orgWarningState.remainingSeats);
        const paidMembers = orgWarningState.members.slice(orgWarningState.remainingSeats);

        if (freeMembers.length > 0) {
            const freeSuccess = await submitGroupMembers(selectedOrgMembership.id, freeMembers, {
                closeOnSuccess: false,
                reloadOnSuccess: false,
                successMessage: 'Initial members added. Redirecting to payment for additional seats...',
            });
            if (!freeSuccess) return;
        }

        if (paidMembers.length > 0) {
            await submitGroupMembers(selectedOrgMembership.id, paidMembers);
            return;
        }

        setOrgWarningState(null);
        closeAddMembersModal();
        await reloadOrganizationData(false);
    };

    const handleResendGroupInvite = async (membershipId: string | number, memberId: string | number) => {
        const actionKey = `resend-${membershipId}-${memberId}`;
        setPendingOrgActionKey(actionKey);
        setOrgInlineNotice(null);
        const endpoint = `/dashboard/group/${membershipId}/members/${memberId}/resend-invite`;
        try {
            const response = await api.post(endpoint);
            const successMessage = response.data?.message || 'Invite resent successfully!';
            setOrgInlineNotice({ type: 'success', message: successMessage });
            setToast({ type: 'success', message: successMessage });
        } catch (err: any) {
            const initialErrorMessage = getRequestErrorMessage(err, 'Failed to resend invite.');

            if (isAwsSesIdentityError(initialErrorMessage)) {
                try {
                    const fallbackResponse = await api.post(endpoint, {
                        provider: 'default',
                        mailer: 'default',
                        email_provider: 'default',
                        use_default_mailer: true,
                        use_wp_mail: true,
                    });

                    const fallbackSuccessMessage = fallbackResponse.data?.message || 'Invite resent successfully using the default mail system.';
                    setOrgInlineNotice({ type: 'success', message: fallbackSuccessMessage });
                    setToast({ type: 'success', message: fallbackSuccessMessage });
                    return;
                } catch (fallbackErr: any) {
                    const fallbackErrorMessage = getRequestErrorMessage(
                        fallbackErr,
                        'Failed to resend invite. Please check your default mail system configuration.',
                    );
                    setOrgInlineNotice({ type: 'error', message: fallbackErrorMessage });
                    setToast({ type: 'error', message: fallbackErrorMessage });
                    return;
                }
            }

            const errorMessage = initialErrorMessage;
            setOrgInlineNotice({ type: 'error', message: errorMessage });
            setToast({ type: 'error', message: errorMessage });
        } finally {
            setPendingOrgActionKey(null);
        }
    };

    const handleRemoveGroupMember = async (membershipId: string | number, memberId: string | number) => {
        if (!window.confirm('Are you sure you want to remove this member?')) {
            return;
        }
        const actionKey = `remove-${membershipId}-${memberId}`;
        setPendingOrgActionKey(actionKey);
        setOrgInlineNotice(null);
        try {
            const response = await api.delete(`/dashboard/group/${membershipId}/members/${memberId}`);
            const successMessage = response.data?.message || 'Member removed successfully!';
            setOrgInlineNotice({ type: 'success', message: successMessage });
            setToast({ type: 'success', message: successMessage });
            await reloadOrganizationData(false);
        } catch (err: any) {
            const errorMessage = getRequestErrorMessage(err, 'Failed to remove member.');
            setOrgInlineNotice({ type: 'error', message: errorMessage });
            setToast({ type: 'error', message: errorMessage });
        } finally {
            setPendingOrgActionKey(null);
        }
    };

    const handleSaveGroupRole = async (membership: any, member: any, role: string) => {
        const actionKey = `role-${membership?.id}-${member?.id}`;
        const currentRole = String(member?.role || 'member').toLowerCase();
        const adminSeatLimit = Number(membership?.plan?.group_admin_seats || 0);
        const currentAdminCount = (membership?.group_members || []).filter((candidate: any) => ['accepted', 'pending'].includes(String(candidate?.status || '').toLowerCase()) && ['admin', 'owner'].includes(String(candidate?.role || '').toLowerCase())).length;

        if (role === 'admin' && currentRole !== 'admin' && adminSeatLimit > 0 && currentAdminCount >= adminSeatLimit) {
            const message = `Could not change role to Admin. This plan includes only ${adminSeatLimit} admin seat(s) and all are occupied.`;
            setOrgInlineNotice({ type: 'error', message });
            setToast({ type: 'error', message });
            return;
        }

        setPendingOrgActionKey(actionKey);
        setOrgInlineNotice(null);
        try {
            const response = await api.put(`/dashboard/group/${membership?.id}/members/${member?.id}/role`, { role });
            const successMessage = response.data?.message || 'Role updated successfully!';
            setOrgInlineNotice({ type: 'success', message: successMessage });
            setToast({ type: 'success', message: successMessage });
            setMemberRoleDrafts((prev) => ({ ...prev, [`${membership?.id}-${member?.id}`]: role }));
            await reloadOrganizationData(false);
        } catch (err: any) {
            const errorMessage = getRequestErrorMessage(err, 'Failed to update role.');
            setOrgInlineNotice({ type: 'error', message: errorMessage });
            setToast({ type: 'error', message: errorMessage });
        } finally {
            setPendingOrgActionKey(null);
        }
    };

    // --- Renderers ---

    const renderPlanList = (plans: any[] | null, type: 'upgrade' | 'downgrade') => {
        const availablePlans = plans || [];
        if (availablePlans.length === 0) {
            return <div className="seamless-empty-card">No {type} options currently available.</div>;
        }

        const sp = selectedPlanForSwap;
        const currentMem = getMembershipById(selectedMembershipId);

        let proration = null;
        if (sp && currentMem) {
            const remainingDays = Math.max(0, Math.ceil(parseFloat(currentMem.remaining_days || 0)) - 1);
            const currentPrice = parseFloat(currentMem.plan?.price || 0);
            const newPrice = parseFloat(sp.price || 0);

            // Dynamically calculate roughly equivalent daily rates based on period
            const getDays = (p: string, num: number) => {
                if (p === 'year') return 365 * (num || 1);
                if (p === 'week') return 7 * (num || 1);
                if (p === 'day') return 1 * (num || 1);
                return 30 * (num || 1);
            };

            const currentDailyRate = currentPrice / getDays(currentMem.plan?.period || 'month', currentMem.plan?.period_number || 1);
            const newDailyRate = newPrice / getDays(sp.period || 'month', sp.period_number || 1);

            const currentPlanCredit = currentDailyRate * remainingDays;

            const isRefundMode = type === 'downgrade';

            // For upgrades, we charge the full new plan price minus credit from current.
            // For downgrades, we use the prorated difference of remaining days.
            const newPlanCharge = isRefundMode ? (newDailyRate * remainingDays) : newPrice;
            const diff = newPlanCharge - currentPlanCredit;

            proration = {
                days: remainingDays,
                charge: newPlanCharge.toFixed(2),
                credit: currentPlanCredit.toFixed(2),
                total: Math.abs(diff).toFixed(2),
                isRefund: isRefundMode
            };
        }

        const selectedPlan = sp || availablePlans[0];
        const isDowngrade = type === 'downgrade';
        const isImmediateDowngrade = Boolean(selectedPlan?.apply_proration_on_switch);
        const shouldShowScheduledMessage = isDowngrade ? !isImmediateDowngrade : true;
        const scheduledDate = currentMem?.expiry_date || currentMem?.expires_at;
        const scheduledDateLabel = scheduledDate
            ? new Date(scheduledDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            : '';
        const infoMessage = isDowngrade
            ? shouldShowScheduledMessage
                ? `Your plan will be downgraded to ${selectedPlan?.label || 'the selected plan'} at your next billing cycle${scheduledDateLabel ? ` on ${scheduledDateLabel}` : ''}. You will continue to have access to your current plan benefits until then.`
                : 'Your downgrade will take effect immediately. Any refund or credit shown below is based on the remaining time in your current billing cycle.'
            : 'All plan changes take effect immediately. You will be charged the prorated amount based on your current billing cycle.';
        const confirmLabel = isDowngrade
            ? shouldShowScheduledMessage
                ? 'Downgrade at Next Renewal'
                : 'Downgrade Current Membership'
            : 'Upgrade Plan';

        return (
            <div className="seamless-modal-body-split">
                <div className="seamless-user-dashboard-scheduled-info">
                    <div className="seamless-user-dashboard-info-message">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                        <div>
                            <p>{infoMessage}</p>
                        </div>
                    </div>
                </div>

                {/* LEFT COLUMN: Plans List + Pricing Breakdown */}
                <div className="seamless-user-dashboard-modal-columns">
                    <div>
                    <h4 className="seamless-modal-subheader">Available Plans</h4>
                    <div className="seamless-plan-list">
                        {availablePlans.map(plan => (
                            <div
                                key={plan.id}
                                className={`seamless-plan-select-item ${sp?.id === plan.id ? 'selected' : ''}`}
                                onClick={() => setSelectedPlanForSwap(plan)}
                            >
                                <span className="seamless-plan-select-name">{plan.label}</span>
                                <span className="seamless-plan-select-price">${plan.price}<span>/{plan.period}</span></span>
                            </div>
                        ))}
                    </div>

                    {sp && proration && (
                        <div className="seamless-pricing-breakdown">
                            <h4 className="seamless-modal-subheader seamless-pricing-breakdown-hdr">Pricing Breakdown</h4>

                            <div className="seamless-pricing-row">
                                <span>New Plan Charge:</span>
                                <span>{proration.isRefund ? '-' : ''}${proration.charge}</span>
                            </div>
                            <div className="seamless-pricing-row">
                                <span>Current Plan Credit:</span>
                                <span>{proration.isRefund ? '' : '-'}${proration.credit}</span>
                            </div>

                            <div className="seamless-pricing-row total">
                                <span>{type === 'upgrade' ? 'Estimated Additional Cost:' : 'Estimated Refund/Credit:'}</span>
                                <span className={`seamless-pricing-diff ${type === "upgrade" ? "seamless-color-upgrade" : "seamless-color-downgrade"}`}>
                                    ${proration.total}
                                </span>
                            </div>
                            <p className="seamless-pricing-prorated-text">Prorated for <strong>{proration.days}</strong> remaining days</p>
                        </div>
                    )}
                    </div>

                    {/* RIGHT COLUMN: Offerings */}
                    <div>
                        <h4 className="seamless-modal-subheader">{sp ? `${sp.label} - Offerings` : 'Offerings'}</h4>
                        <div className={`seamless-offerings-box ${sp ? "seamless-bg-offerings-active" : "seamless-bg-offerings-inactive"}`}>
                            {sp ? (
                                sp.content_rules && Object.keys(sp.content_rules).length > 0 ? (
                                    <ul className="seamless-offerings-list">
                                        {Object.entries(sp.content_rules).map(([key, val]: any) => (
                                            <li key={key}><CircleCheckBig color="green" size={16} />: {val}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <span className="seamless-offerings-empty">No offerings listed for this plan</span>
                                )
                            ) : (
                                <span className="seamless-offerings-empty">Select a plan to view its offerings</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sticky Footer Area in body */}
                <div className="seamless-modal-footer seamless-col-span-full seamless-modal-footer">
                    <button type="button" onClick={() => setActionModal(null)} className="seamless-user-dashboard-btn-secondary">Cancel</button>

                    {type === 'downgrade' && sp && (
                        <>
                            {sp?.refundable && sp?.apply_proration_on_switch && (
                                <button
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={() => handleDowngradeAction(true)}
                                    className="seamless-user-dashboard-btn-primary seamless-bg-warning"
                                >
                                    {isSubmitting ? 'Processing...' : 'Instant Downgrade (Prorated)'}
                                </button>
                            )}
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => handleDowngradeAction(false)}
                                className="seamless-user-dashboard-btn-primary"
                            >
                                {isSubmitting ? 'Processing...' : confirmLabel}
                            </button>
                        </>
                    )}

                    {type === 'upgrade' && (
                        <button
                            type="button"
                            disabled={isSubmitting || !sp}
                            onClick={handleUpgradeAction}
                            className="seamless-user-dashboard-btn-primary"
                        >
                            {isSubmitting ? 'Processing...' : confirmLabel}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    if (isLoading && !profile) {
        return (
            <div className="seamless-user-dashboard-section">
                <div className="seamless-dashboard-content-container">
                    <DashboardSkeletonLoader rows={6} />
                </div>
            </div>
        );
    }

    return (
        <div className="seamless-user-dashboard-section">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Modals */}
            <Modal isOpen={actionModal === 'upgrade'} onClose={() => setActionModal(null)} title="Upgrade Membership" className="seamless-modal-lg">
                {renderPlanList(getAvailablePlansForMembership(selectedMembershipId, 'upgrade'), 'upgrade')}
            </Modal>

            <Modal isOpen={actionModal === 'downgrade'} onClose={() => setActionModal(null)} title="Downgrade Membership" className="seamless-modal-lg">
                {renderPlanList(getAvailablePlansForMembership(selectedMembershipId, 'downgrade'), 'downgrade')}
            </Modal>

            <Modal isOpen={actionModal === 'cancel'} onClose={() => setActionModal(null)} title="Cancel Membership">
                <div className="seamless-cancel-modal-body">
                    <div className="seamless-cancel-modal-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                    </div>
                    <h4 className="seamless-cancel-modal-title">Are you sure you want to cancel?</h4>
                    <p className="seamless-cancel-modal-text">
                        You will immediately terminate the auto-renewal on your billing portal. You may still retain access through the end of your current billing or grace period.
                    </p>
                    <div className="seamless-cancel-actions">
                        <button onClick={() => setActionModal(null)} className="seamless-btn-keep">Keep Membership</button>
                        <button disabled={isSubmitting} onClick={handleCancelMembership} className="seamless-btn-cancel-now">
                            {isSubmitting ? 'Canceling...' : 'Yes, Cancel Now'}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={Boolean(selectedOrgMembership)} onClose={closeAddMembersModal} title="Organization Members Management" className="seamless-modal-lg">
                {selectedOrgMembership && (
                    <div className="seamless-org-modal-stack">
                        {orgInlineNotice && (
                            <div className={`seamless-org-inline-notice seamless-org-inline-notice-${orgInlineNotice.type}`}>
                                {orgInlineNotice.message}
                            </div>
                        )}

                        <div className="seamless-org-import-box">
                            <div className="seamless-org-import-header">
                                <span className="seamless-org-import-title">Bulk Import via CSV</span>
                                <button type="button" className="seamless-org-import-template-btn" onClick={() => {
                                    const csvContent = 'data:text/csv;charset=utf-8,Email,First Name,Last Name,Role\njohn.doe@example.com,John,Doe,member\njane.smith@example.com,Jane,Smith,admin';
                                    const link = document.createElement('a');
                                    link.href = encodeURI(csvContent);
                                    link.download = 'organization-members-template.csv';
                                    link.click();
                                }}>
                                    <Download size={14} />
                                    Download Template
                                </button>
                            </div>
                            <label className="seamless-org-import-file-label">
                                <span className="seamless-org-import-btn">Choose File</span>
                                <span className="seamless-org-import-filename">{selectedCsvFileName}</span>
                                <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCsvImport} />
                            </label>
                        </div>

                        {normalizeBool(selectedOrgMembership?.plan?.additional_seats_enabled) && (
                            <div className="seamless-user-dashboard-org-pricing-box">
                                <div className="seamless-org-pricing-top">
                                    <div className="seamless-org-pricing-title">Additional Seat Pricing</div>
                                    <div className="seamless-org-pricing-amount">${getAdditionalSeatPrice(selectedOrgMembership).toFixed(2)}</div>
                                </div>
                                <div className="seamless-org-pricing-middle">
                                    <div className="seamless-org-pricing-base-price">Base price: <span className="base-price">${parseFloat(selectedOrgMembership?.plan?.per_seat_price || 0).toFixed(2)}</span><span className="base-seat">/seat</span></div>
                                    {normalizeBool(selectedOrgMembership?.plan?.prorated) && getOrgRemainingDays(selectedOrgMembership) > 0 && (
                                        <div className="seamless-org-pricing-prorated-pill">
                                            <Clock3 size={12} />
                                            <span>Prorated ({getOrgRemainingDays(selectedOrgMembership)} days remaining)</span>
                                        </div>
                                    )}
                                    <div className="seamless-org-pricing-per-seat">per additional seat</div>
                                </div>
                                <div className="seamless-org-pricing-remaining-seats">
                                    {Math.max(0, Number(selectedOrgMembership?.plan?.group_seats || 0) - Number(selectedOrgMembership?.member_count || selectedOrgMembership?.group_members?.length || 0))} seats remaining at no extra charge
                                </div>
                            </div>
                        )}

                        <div className="seamless-org-add-form">
                            {groupMemberRows.map((row, index) => (
                                <div key={index} className="seamless-user-dashboard-org-add-row">
                                    <div className="seamless-user-dashboard-org-add-field">
                                        <label>First Name <span className="required">*</span></label>
                                        <input type="text" value={row.first_name} onChange={(e) => updateGroupMemberRow(index, 'first_name', e.target.value)} placeholder="e.g. John" />
                                    </div>
                                    <div className="seamless-user-dashboard-org-add-field">
                                        <label>Last Name <span className="required">*</span></label>
                                        <input type="text" value={row.last_name} onChange={(e) => updateGroupMemberRow(index, 'last_name', e.target.value)} placeholder="e.g. Doe" />
                                    </div>
                                    <div className="seamless-user-dashboard-org-add-field">
                                        <label>Email <span className="required">*</span></label>
                                        <input type="email" value={row.email} onChange={(e) => updateGroupMemberRow(index, 'email', e.target.value)} placeholder="e.g. john@company.com" />
                                    </div>
                                    <div className="seamless-user-dashboard-org-add-field seamless-user-dashboard-org-add-field-role">
                                        <label>Role</label>
                                        <div className="seamless-user-dashboard-org-role-wrap">
                                            <select value={row.role} onChange={(e) => updateGroupMemberRow(index, 'role', e.target.value as 'member' | 'admin')}>
                                                <option value="member">Member</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                            {groupMemberRows.length > 1 && (
                                                <button type="button" className="seamless-user-dashboard-org-remove-row-btn" onClick={() => removeGroupMemberRow(index)} aria-label="Remove Row">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="seamless-modal-footer">
                            <button type="button" className="seamless-user-dashboard-org-add-another-btn" onClick={addGroupMemberRow}>
                                Add Another Row
                            </button>
                            <div className="seamless-modal-footer-actions">
                                <button type="button" className="seamless-user-dashboard-btn-secondary" onClick={closeAddMembersModal}>Cancel</button>
                                <button type="button" className="seamless-user-dashboard-btn-primary" disabled={isSubmitting} onClick={handleAddGroupMembers}>
                                    {isSubmitting ? 'Sending...' : 'Send Invitations'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={Boolean(orgWarningState?.open)} onClose={() => setOrgWarningState(null)} title="Seat Capacity Warning">
                {selectedOrgMembership && orgWarningState && (
                    <div className="seamless-org-warning-stack">
                        <div className="seamless-org-warning-message-box">
                            <p>
                                You are adding <strong>{orgWarningState.additionalCount}</strong> additional member(s) which will exceed your seat capacity ({Number(selectedOrgMembership?.member_count || selectedOrgMembership?.group_members?.length || 0) + orgWarningState.members.length}/{Number(selectedOrgMembership?.plan?.group_seats || 0)}). Additional payment of <strong>${orgWarningState.totalAdditionalCost.toFixed(2)}</strong> is required to add these members.
                            </p>
                        </div>
                        <div className="seamless-org-warning-details">
                            <div className="seamless-org-warning-item">
                                <span className="label">Additional Members</span>
                                <span className="value">{orgWarningState.additionalCount}</span>
                            </div>
                            <div className="seamless-org-warning-item total-cost">
                                <span className="label">Additional Cost</span>
                                <span className="value">${orgWarningState.totalAdditionalCost.toFixed(2)}</span>
                            </div>
                        </div>
                        <p className="seamless-org-warning-note">Click "Proceed to Payment" to continue with adding these members. You will be redirected to our secure payment gateway.</p>
                        <div className="seamless-modal-footer">
                            <div className="seamless-modal-footer-actions">
                                <button type="button" className="seamless-user-dashboard-btn-secondary" onClick={() => setOrgWarningState(null)}>Cancel</button>
                                <button type="button" className="seamless-user-dashboard-btn-primary" disabled={isSubmitting} onClick={handleProceedWithSeatWarning}>
                                    {isSubmitting ? 'Processing...' : 'Proceed to Payment'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <div className="seamless-user-dashboard seamless-user-dashboard-react-layout" data-widget-id="react">
                <aside className="seamless-user-dashboard-sidebar">
                    <div className="seamless-user-dashboard-profile-card">
                        <div className="seamless-user-dashboard-profile-name">{profile?.first_name} {profile?.last_name}</div>
                        <div className="seamless-user-dashboard-profile-email">{profile?.email}</div>
                    </div>

                    <nav className="seamless-user-dashboard-nav">
                        {(['profile', 'memberships', 'organization', 'courses', 'orders'] as DashboardView[]).map(view => (
                            <a
                                key={view}
                                href={`#${view}`}
                                className={`seamless-user-dashboard-nav-item seamless-nav-link ${activeView === view ? 'active' : ''} seamless-no-underline`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    switchView(view as any);
                                }}
                            >
                                <span>{view === 'organization' ? 'Organizations' : view.charAt(0).toUpperCase() + view.slice(1)}</span>
                            </a>
                        ))}
                        <a
                            href={(() => {
                                const cfg = (window as any).seamlessReactConfig;
                                // logoutUrl is already set to ?sso_logout_redirect=1 by PHP.
                                // Append return_to so user lands back on this page after logout.
                                const base = cfg?.logoutUrl
                                    || `${(cfg?.siteUrl || window.location.origin).replace(/\/$/, '')}/?sso_logout_redirect=1`;
                                return `${base}&return_to=${encodeURIComponent(window.location.href)}`;
                            })()}
                            className="seamless-user-dashboard-nav-item seamless-user-dashboard-nav-logout seamless-nav-link seamless-no-underline"
                        >
                            <span>Logout</span>
                        </a>
                    </nav>
                </aside>

                <main className="seamless-user-dashboard-main">

                    {/* PROFILE VIEW */}
                    {activeView === 'profile' && (
                        <div className="seamless-user-dashboard-view active">
                            <div className="seamless-dashboard-content-container">
                                <div className="seamless-profile-content-card">
                                    <div className="seamless-profile-header">
                                        <h3>Profile Information</h3>
                                        {!isEditingProfile && (
                                            <button className="seamless-edit-btn" onClick={() => setIsEditingProfile(true)}>
                                                Edit Profile
                                            </button>
                                        )}
                                    </div>

                                    {!isEditingProfile ? (
                                        <div className="seamless-user-dashboard-profile-view-mode">
                                            <div className="seamless-grid-3-col">
                                                <div><label className="seamless-value-label">First Name</label><div className="seamless-value-text">{profile?.first_name || '—'}</div></div>
                                                <div><label className="seamless-value-label">Last Name</label><div className="seamless-value-text">{profile?.last_name || '—'}</div></div>
                                                <div><label className="seamless-value-label">Email</label><div className="seamless-value-text">{profile?.email || '—'}</div></div>
                                                <div><label className="seamless-value-label">Phone</label><div className="seamless-value-text">{profile?.phone || '—'} {profile?.phone_type ? `(${profile.phone_type})` : ''}</div></div>
                                            </div>

                                            <h4 className="seamless-section-title">Address Details</h4>
                                            <div className="seamless-grid-3-col">
                                                <div className="seamless-grid-span-2"><label className="seamless-value-label">Address Line 1</label><div className="seamless-value-text">{profile?.address_line_1 || '—'}</div></div>
                                                <div className="seamless-grid-span-2"><label className="seamless-value-label">Address Line 2</label><div className="seamless-value-text">{profile?.address_line_2 || '—'}</div></div>
                                                <div><label className="seamless-value-label">Country</label><div className="seamless-value-text">{profile?.country ? (COUNTRIES_STATES.countries[profile?.country as keyof typeof COUNTRIES_STATES.countries] || profile?.country) : '—'}</div></div>
                                                <div><label className="seamless-value-label">State</label><div className="seamless-value-text">{profile?.state ? ((COUNTRIES_STATES.states[profile?.country as keyof typeof COUNTRIES_STATES.states] as any)?.[profile?.state] || profile?.state) : '—'}</div></div>
                                                <div><label className="seamless-value-label">City</label><div className="seamless-value-text">{profile?.city || '—'}</div></div>
                                                <div><label className="seamless-value-label">Zip Code</label><div className="seamless-value-text">{profile?.zip_code || '—'}</div></div>
                                            </div>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleProfileSubmit}>
                                            <div className="seamless-grid-3-col">
                                                <div><label className="seamless-user-dashboard-label-text">First Name</label><input required name="first_name" value={profile?.first_name || ''} onChange={handleProfileChange} className="seamless-user-dashboard-input" /></div>
                                                <div><label className="seamless-user-dashboard-label-text">Last Name</label><input required name="last_name" value={profile?.last_name || ''} onChange={handleProfileChange} className="seamless-user-dashboard-input" /></div>
                                                <div className="seamless-grid-span-2"><label className="seamless-user-dashboard-label-text">Email</label><input required type="email" name="email" value={profile?.email || ''} onChange={handleProfileChange} className="seamless-user-dashboard-input" /></div>
                                                <div><label className="seamless-user-dashboard-label-text">Phone</label><input name="phone" value={profile?.phone || ''} onChange={handleProfileChange} className="seamless-user-dashboard-input" /></div>
                                                <div>
                                                    <label className="seamless-user-dashboard-label-text">Phone Type</label>
                                                    <select name="phone_type" value={profile?.phone_type || 'mobile'} onChange={handleProfileChange} className="seamless-user-dashboard-input">
                                                        <option value="mobile">Mobile</option><option value="home">Home</option><option value="work">Work</option><option value="">Other</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <h4 className="seamless-section-title">Address Details</h4>
                                            <div className="seamless-grid-3-col">
                                                <div className="seamless-grid-span-2"><label className="seamless-user-dashboard-label-text">Address Line 1</label><input name="address_line_1" value={profile?.address_line_1 || ''} onChange={handleProfileChange} className="seamless-user-dashboard-input" /></div>
                                                <div className="seamless-grid-span-2"><label className="seamless-user-dashboard-label-text">Address Line 2</label><input name="address_line_2" value={profile?.address_line_2 || ''} onChange={handleProfileChange} className="seamless-user-dashboard-input" /></div>
                                                <div>
                                                    <label className="seamless-user-dashboard-label-text">Country</label>
                                                    <select name="country" value={profile?.country || ''} onChange={handleProfileChange} className="seamless-user-dashboard-input">
                                                        <option value="">Select Country</option>
                                                        {Object.entries(COUNTRIES_STATES.countries).map(([code, name]) => (
                                                            <option key={code} value={code}>{name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                {profile?.country ? (
                                                    <div>
                                                        <label className="seamless-user-dashboard-label-text">State</label>
                                                        {Object.keys((COUNTRIES_STATES.states[profile?.country as keyof typeof COUNTRIES_STATES.states] as any) || {}).length > 0 ? (
                                                            <select name="state" value={profile?.state || ''} onChange={handleProfileChange} className="seamless-user-dashboard-input">
                                                                <option value="">Select State</option>
                                                                {Object.entries((COUNTRIES_STATES.states[profile?.country as keyof typeof COUNTRIES_STATES.states] as any) || {}).map(([code, name]) => (
                                                                    <option key={code} value={code as string}>{name as string}</option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <input name="state" value={profile?.state || ''} onChange={handleProfileChange} className="seamless-user-dashboard-input" />
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <label className="seamless-user-dashboard-label-text restricted">State</label>
                                                        {Object.keys((COUNTRIES_STATES.states[profile?.country as keyof typeof COUNTRIES_STATES.states] as any) || {}).length > 0 ? (
                                                            <select name="state" value={profile?.state || ''} onChange={handleProfileChange} className="seamless-user-dashboard-input">
                                                                <option value="">Select State</option>
                                                                {Object.entries((COUNTRIES_STATES.states[profile?.country as keyof typeof COUNTRIES_STATES.states] as any) || {}).map(([code, name]) => (
                                                                    <option key={code} value={code as string}>{name as string}</option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <input name="state" value={profile?.state || ''} onChange={handleProfileChange} className="seamless-user-dashboard-input" />
                                                        )}
                                                    </div>
                                                )}
                                                <div><label className="seamless-user-dashboard-label-text">City</label><input name="city" value={profile?.city || ''} onChange={handleProfileChange} className="seamless-user-dashboard-input" /></div>
                                                <div><label className="seamless-user-dashboard-label-text">Zip</label><input name="zip_code" value={profile?.zip_code || ''} onChange={handleProfileChange} className="seamless-user-dashboard-input" /></div>
                                            </div>

                                            <div className="seamless-form-actions">
                                                <button type="submit" disabled={isSubmitting} className="seamless-user-dashboard-btn-primary">{isSubmitting ? 'Saving...' : 'Save Profile'}</button>
                                                <button type="button" onClick={() => setIsEditingProfile(false)} disabled={isSubmitting} className="seamless-user-dashboard-btn-secondary">Cancel</button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MEMBERSHIPS VIEW */}
                    {activeView === 'memberships' && (
                        <div className="seamless-user-dashboard-view active">
                            <div className="seamless-dashboard-content-container">

                                {/* TOP SUMMARY SECTION */}
                                <div className="seamless-summary-row seamless-mb-32">
                                    <div className="seamless-count-card">
                                        <h2 className="seamless-count-card-number">{activeMemberships.length}</h2>
                                        <p className="seamless-count-card-label">Total Active Memberships</p>
                                    </div>

                                    <div className="seamless-flex-col-gap-24">
                                        {activeMemberships.length > 0 ? (
                                            <div className="seamless-blue-card seamless-padding-24-full-center">
                                                <div className="seamless-blue-card-content seamless-justify-center">
                                                    <h3 className="seamless-blue-card-title">{activeMemberships[0].plan?.label || activeMemberships[0].title || activeMemberships[0].name || 'Membership'}</h3>
                                                    <p className="seamless-blue-card-expiry seamless-mt-8">
                                                        Expires on: <strong>{activeMemberships[0].expiry_date ? new Date(activeMemberships[0].expiry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</strong>
                                                    </p>
                                                </div>
                                                <div className="seamless-blue-badge seamless-capitalize">{(activeMemberships[0].status || 'Active')}</div>
                                            </div>
                                        ) : (
                                            <div className="seamless-blue-card seamless-opacity-bg-card">
                                                <div className="seamless-blue-card-content seamless-justify-center">
                                                    <h3 className="seamless-blue-card-title">No Active Membership</h3>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="seamless-user-dashboard-tabs-wrapper">
                                    <div className="seamless-user-dashboard-tabs-header">
                                        <button className={`seamless-user-dashboard-tab ${activeMembershipTab === 'active' ? 'active' : ''}`} onClick={() => setActiveMembershipTab('active')}>
                                            Active Memberships <span className="seamless-tab-count"><span>{activeMemberships.length}</span></span>
                                        </button>
                                        <button className={`seamless-user-dashboard-tab ${activeMembershipTab === 'history' ? 'active' : ''}`} onClick={() => setActiveMembershipTab('history')}>
                                            Expired Memberships <span className="seamless-tab-count"><span>{historyMemberships.length}</span></span>
                                        </button>
                                    </div>

                                    <div className="seamless-user-dashboard-tab-content active seamless-transparent-mt-24">
                                        {activeMembershipTab === 'active' ? (
                                            memberships === null ? (
                                                <DashboardSkeletonLoader rows={4} />
                                            ) : activeMemberships.length === 0 ? (
                                                <div className="seamless-empty-card">
                                                    <p>You do not have any active memberships.</p>
                                                </div>
                                            ) : (
                                                <div className="seamless-grid-gap-16">
                                                    {activeMemberships.map((mem) => {
                                                        const membershipId = String(mem.id);
                                                        const status = String(mem.status || '').toLowerCase();
                                                        const isCancelled = status === 'cancelled';
                                                        const isActive = status === 'active';
                                                        const isGroupMembership = Boolean(mem?.plan?.is_group_membership || mem?.is_group_membership);
                                                        const hasUpgrades = Array.isArray(mem.upgradable_to) && mem.upgradable_to.length > 0;
                                                        const hasDowngrades = Array.isArray(mem.downgradable_to) && mem.downgradable_to.length > 0;
                                                        const hasPendingTransition = Boolean(mem.has_pending_transition && mem.pending_transition);
                                                        const purchasedAt = mem.start_date || mem.started_at || mem.created_at;
                                                        const expiryAt = mem.expiry_date || mem.expires_at;
                                                        const pendingEffectiveDate = mem.pending_transition?.effective_on || expiryAt;

                                                        return (
                                                            <div key={mem.id} className="seamless-membership-card-box seamless-items-start">
                                                                <div className="seamless-flex-col-gap-16-full">
                                                                    <div className="seamless-flex-between-center">
                                                                        <div className="seamless-flex-col-gap-8">
                                                                            <h3 className="seamless-card-title">{mem.plan?.label || mem.title || mem.name || 'Membership'}</h3>
                                                                        </div>

                                                                        {/* ACTIONS (Three dots menu) */}
                                                                        <div className='seamless-tag-container'>
                                                                        {isGroupMembership && (
                                                                                <span className="seamless-membership-type-tag">
                                                                                    <Users size={14} />
                                                                                    Group
                                                                                </span>
                                                                            )}
                                                                        {!isCancelled && (hasUpgrades || hasDowngrades || isActive) && (
                                                                            <div className={`seamless-user-dashboard-menu-container ${openDropdownId === mem.id ? "active" : ""} seamless-position-relative`}>
                                                                                <button onClick={() => setOpenDropdownId(openDropdownId === mem.id ? null : mem.id)} className="seamless-btn-transparent">
                                                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
                                                                                </button>

                                                                                <div className="seamless-user-dashboard-menu-dropdown seamless-menu-dropdown-styled seamless-menu-dropdown-pos">
                                                                                    {hasUpgrades && <button onClick={() => openModalFor('upgrade', membershipId)} className="seamless-menu-item-upgrade"><ArrowUpRight size={16} /> Upgrade Plan</button>}
                                                                                    {hasDowngrades && <button onClick={() => openModalFor('downgrade', membershipId)} className="seamless-menu-item-downgrade"><ArrowDownRight size={16} /> Downgrade Plan</button>}
                                                                                    {(hasUpgrades || hasDowngrades) && <div className="seamless-menu-divider" />}
                                                                                    {isActive && <button onClick={() => openModalFor('cancel', membershipId)} className="seamless-menu-item-cancel"><CircleX size={16} /> Cancel</button>}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        </div>
                                                                        {isCancelled && (
                                                                            <div className="seamless-cancelled-badge seamless-capitalize">Cancelled</div>
                                                                        )}
                                                                    </div>
                                                                    <div className="seamless-flex-gap-24-slate">
                                                                        <span>Purchased: {purchasedAt ? new Date(purchasedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
                                                                        <span>Expires: {expiryAt ? new Date(expiryAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
                                                                    </div>
                                                                    {hasPendingTransition && pendingEffectiveDate && (
                                                                        <div className="seamless-flex-between-center seamless-flex-wrap-gap-12">
                                                                            <span>
                                                                                Scheduled downgrade effective on {new Date(pendingEffectiveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                            </span>
                                                                            <button
                                                                                type="button"
                                                                                disabled={isSubmitting}
                                                                                onClick={() => handleCancelScheduledChange(membershipId)}
                                                                                className="seamless-user-dashboard-btn-secondary"
                                                                            >
                                                                                {isSubmitting ? 'Processing...' : 'Cancel Scheduled Downgrade'}
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )
                                        ) : (
                                            /* HISTORY */
                                            expiredMemberships === null ? (
                                                <DashboardSkeletonLoader rows={4} />
                                            ) : historyMemberships.length === 0 ? (
                                                <div className="seamless-empty-card">
                                                    <p>No past membership history available.</p>
                                                </div>
                                            ) : (
                                                <div className="seamless-grid-gap-16">
                                                    {historyMemberships.map((mem) => {
                                                        const isGroupMembership = Boolean(mem?.plan?.is_group_membership || mem?.is_group_membership);
                                                        return (
                                                        <div key={mem.id} className="seamless-membership-card-box seamless-items-start">
                                                            <div className="seamless-flex-col-gap-16-full">
                                                                <div className="seamless-flex-col-gap-8 seamless-dashboard-membership">
                                                                    <h3 className="seamless-card-title">{mem.plan?.label || mem.title || mem.name || 'Membership'}</h3>
                                                                    <div className='semaless-tag-container'>
                                                                    {isGroupMembership && (
                                                                        <span className="seamless-membership-type-tag">
                                                                            <Users size={14} />
                                                                            Group
                                                                        </span>
                                                                    )}
                                                                    {mem?.plan?.id && (
                                                                        <div className="seamless-status-tag">
                                                                            <span className="seamless-expired-badge seamless-capitalize">Expired</span>
                                                                            <button
                                                                                type="button"
                                                                                disabled={renewingPlanId === String(mem.plan.id)}
                                                                                onClick={() => handleRenewMembership(String(mem.plan.id))}
                                                                                className="seamless-user-dashboard-btn-renew"
                                                                            >
                                                                                {renewingPlanId === String(mem.plan.id) ? 'Processing...' : 'Renew'}
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                    </div>
                                                                </div>
                                                                <div className="seamless-flex-gap-24-slate">
                                                                    <span>Purchased: {mem.created_at ? new Date(mem.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
                                                                    <span>Expired: {mem.expiry_date ? new Date(mem.expiry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        );
                                                    })}
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ORGANIZATION VIEW */}
                    {activeView === 'organization' && (
                        <div className="seamless-user-dashboard-view active">
                            <div className="seamless-dashboard-content-container">
                                {groupMemberships === null ? (
                                    <DashboardSkeletonLoader rows={4} />
                                ) : organizationSummary.plans.length === 0 ? (
                                    <div className="seamless-user-dashboard-org-empty">
                                        <div className="seamless-user-dashboard-org-empty-icon">
                                            <Users size={40} />
                                        </div>
                                        <h3>No Organization Found</h3>
                                        <p>You are not currently part of any organization or group membership.</p>
                                    </div>
                                ) : (
                                    <div className="seamless-user-dashboard-org-wrapper">
                                        <div className="seamless-user-dashboard-org-header">
                                            <div className="seamless-user-dashboard-org-header-info">
                                                <p className="seamless-user-dashboard-org-name">{organizationSummary.eyebrow}</p>
                                                <h2 className="seamless-user-dashboard-org-title">{organizationSummary.title}</h2>
                                                <p className="seamless-user-dashboard-org-description">{organizationSummary.description}</p>
                                            </div>
                                            <div className="seamless-user-dashboard-org-summary">
                                                <span className="seamless-user-dashboard-org-plan-count">{organizationSummary.plans.length} {organizationSummary.plans.length === 1 ? 'Plan' : 'Plans'}</span>
                                                {organizationSummary.roleCounts.owner > 0 && <span className="seamless-user-dashboard-org-summary-pill seamless-org-role-owner">{organizationSummary.roleCounts.owner} {organizationSummary.roleCounts.owner === 1 ? 'Owner Role' : 'Owner Roles'}</span>}
                                                {organizationSummary.roleCounts.admin > 0 && <span className="seamless-user-dashboard-org-summary-pill seamless-org-role-admin">{organizationSummary.roleCounts.admin} {organizationSummary.roleCounts.admin === 1 ? 'Admin Role' : 'Admin Roles'}</span>}
                                                {organizationSummary.roleCounts.member > 0 && <span className="seamless-user-dashboard-org-summary-pill seamless-org-role-member">{organizationSummary.roleCounts.member} {organizationSummary.roleCounts.member === 1 ? 'Member Role' : 'Member Roles'}</span>}
                                            </div>
                                        </div>

                                        {orgInlineNotice && (
                                            <div className={`seamless-org-inline-notice seamless-org-inline-notice-${orgInlineNotice.type}`}>
                                                {orgInlineNotice.message}
                                            </div>
                                        )}

                                        {organizationSummary.plans.map((membership) => {
                                            const membershipId = String(membership?.id);
                                            const members = Array.isArray(membership?.group_members) ? membership.group_members : [];
                                            const roleKey = String(membership?.role || 'member').toLowerCase();
                                            const isOwner = roleKey === 'owner';
                                            const isAdmin = roleKey === 'admin';
                                            const acceptedCount = members.filter((member: any) => String(member?.status || '').toLowerCase() === 'accepted').length;
                                            const pendingCount = members.filter((member: any) => String(member?.status || '').toLowerCase() === 'pending').length;
                                            const memberCount = Number(membership?.member_count || members.length);
                                            const groupSeats = Number(membership?.plan?.group_seats || 0);
                                            const remainingSeats = Math.max(0, groupSeats - memberCount);
                                            const additionalSeatsEnabled = normalizeBool(membership?.plan?.additional_seats_enabled);
                                            const currentAdminCount = members.filter((member: any) => ['accepted', 'pending'].includes(String(member?.status || '').toLowerCase()) && ['admin', 'owner'].includes(String(member?.role || '').toLowerCase())).length;
                                            const isExpanded = Boolean(expandedOrgPlans[membershipId]);

                                            return (
                                                <div key={membershipId} className="seamless-user-dashboard-org-plan">
                                                    <button type="button" className="seamless-user-dashboard-org-plan-header" onClick={() => toggleOrganizationPlan(membershipId)}>
                                                        <div className="seamless-user-dashboard-org-plan-info">
                                                            <h3 className="seamless-user-dashboard-org-plan-title">{membership?.plan?.label || 'Group Plan'}</h3>
                                                            <div className="seamless-user-dashboard-org-plan-meta">
                                                                <span className={`seamless-user-dashboard-org-role-badge seamless-org-role-${roleKey}`}>Your role: {roleKey.charAt(0).toUpperCase() + roleKey.slice(1)}</span>
                                                                {organizationSummary.hasMultipleMemberships && organizationSummary.hasMixedRoles && (
                                                                    <span className="seamless-user-dashboard-org-plan-scope">Permissions apply only to this membership</span>
                                                                )}
                                                            </div>
                                                            <div className="seamless-user-dashboard-org-plan-stats">
                                                                <span className="seamless-user-dashboard-org-stat-active"><Users size={14} /> {acceptedCount} active / {groupSeats} seats</span>
                                                                {pendingCount > 0 && <span className="seamless-user-dashboard-org-stat-pending"><Clock3 size={14} /> {pendingCount} pending</span>}
                                                            </div>
                                                        </div>
                                                        <div className="seamless-user-dashboard-org-plan-toggle">
                                                            <span className="seamless-user-dashboard-badge seamless-user-dashboard-badge-active">Active</span>
                                                            <ChevronDown size={20} className={isExpanded ? 'open' : ''} />
                                                        </div>
                                                    </button>

                                                    {isExpanded && (
                                                        <div className="seamless-user-dashboard-org-plan-body">
                                                            <div className="seamless-user-dashboard-org-capacity">
                                                                <div className="seamless-user-dashboard-org-capacity-item seamless-org-capacity">
                                                                    <div className="seamless-user-dashboard-org-content-icon"><Users size={16} /><span className="seamless-user-dashboard-org-capacity-label">Capacity</span></div>
                                                                    <strong className="seamless-user-dashboard-org-capacity-value">{groupSeats}</strong>
                                                                </div>
                                                                <div className="seamless-user-dashboard-org-capacity-item seamless-org-current">
                                                                    <div className="seamless-user-dashboard-org-content-icon"><User size={16} /><span className="seamless-user-dashboard-org-capacity-label">Current</span></div>
                                                                    <strong className="seamless-user-dashboard-org-capacity-value">{acceptedCount}</strong>
                                                                </div>
                                                                <div className="seamless-user-dashboard-org-capacity-item seamless-org-remaining">
                                                                    <div className="seamless-user-dashboard-org-content-icon"><Plus size={16} /><span className="seamless-user-dashboard-org-capacity-label">Remaining</span></div>
                                                                    <strong className="seamless-user-dashboard-org-capacity-value">{remainingSeats}</strong>
                                                                </div>
                                                                <div className="seamless-user-dashboard-org-capacity-item seamless-org-additional">
                                                                    <div className="seamless-user-dashboard-org-content-icon"><UserPlus size={16} /><span className="seamless-user-dashboard-org-capacity-label">Additional</span></div>
                                                                    <strong className="seamless-user-dashboard-org-capacity-value">{Math.max(0, acceptedCount - groupSeats)}</strong>
                                                                </div>
                                                            </div>

                                                            <div className="seamless-user-dashboard-org-members-section">
                                                                <div className="seamless-user-dashboard-org-members-header">
                                                                    <h4>Members <span className="seamless-user-dashboard-org-members-count">{memberCount}</span></h4>
                                                                    {(isOwner || isAdmin) && (remainingSeats > 0 || additionalSeatsEnabled) && (
                                                                        <button type="button" className="seamless-user-dashboard-org-add-member-btn" onClick={() => openAddMembersModal({ ...membership, currentAdminCount, member_count: memberCount })}>
                                                                            <UserPlus size={16} />
                                                                            Add Members
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                <div className="seamless-user-dashboard-org-members-list">
                                                                    {members.map((member: any) => {
                                                                        const memberDisplay = getMemberDisplay(member);
                                                                        const memberRole = String(member?.role || 'member').toLowerCase();
                                                                        const memberStatus = String(member?.status || 'pending').toLowerCase();
                                                                        const memberStatusMeta = getMemberStatusMeta(memberStatus);
                                                                        const roleDraftKey = `${membershipId}-${member?.id}`;
                                                                        const selectedRole = memberRoleDrafts[roleDraftKey] || memberRole;
                                                                        const roleChanged = selectedRole !== memberRole;
                                                                        const actionKeyBase = `${membershipId}-${member?.id}`;

                                                                        return (
                                                                            <div key={member?.id || roleDraftKey} className="seamless-user-dashboard-org-member-row">
                                                                                <div className="seamless-user-dashboard-org-member-info">
                                                                                    <div className="seamless-user-dashboard-org-member-avatar seamless-org-avatar-initials">{getMemberInitials(member)}</div>
                                                                                    <div className="seamless-user-dashboard-org-member-details">
                                                                                        <span className="seamless-user-dashboard-org-member-name">
                                                                                            {memberDisplay.name}
                                                                                            <span className={`seamless-user-dashboard-org-role-badge ${getRoleTagClassName(memberRole)}`}>
                                                                                                {getRoleDisplayLabel(memberRole)}
                                                                                            </span>
                                                                                        </span>
                                                                                        <span className="seamless-user-dashboard-org-member-email">{memberDisplay.email}</span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="seamless-user-dashboard-org-member-actions">
                                                                                    <span className={`seamless-user-dashboard-org-status-badge ${memberStatusMeta.className}`}>
                                                                                        {memberStatusMeta.icon}
                                                                                        {memberStatusMeta.label}
                                                                                    </span>

                                                                                    {(isOwner || isAdmin) && memberRole !== 'owner' && memberStatus === 'accepted' && (
                                                                                        <div className="seamless-user-dashboard-org-role-change-wrap" data-current-role={memberRole}>
                                                                                            <select
                                                                                                className="seamless-user-dashboard-org-role-change-select"
                                                                                                value={selectedRole}
                                                                                                onChange={(e) => setMemberRoleDrafts((prev) => ({ ...prev, [roleDraftKey]: e.target.value }))}
                                                                                            >
                                                                                                <option value="member">User</option>
                                                                                                <option value="admin">Admin</option>
                                                                                            </select>
                                                                                            {roleChanged && (
                                                                                                <button
                                                                                                    type="button"
                                                                                                    className="seamless-user-dashboard-org-role-save-btn"
                                                                                                    disabled={pendingOrgActionKey === `role-${actionKeyBase}`}
                                                                                                    onClick={() => handleSaveGroupRole(membership, member, selectedRole)}
                                                                                                >
                                                                                                    <Check size={14} />
                                                                                                </button>
                                                                                            )}
                                                                                        </div>
                                                                                    )}

                                                                                    {memberStatus === 'pending' && (isOwner || isAdmin) && (
                                                                                        <button
                                                                                            type="button"
                                                                                            className="seamless-user-dashboard-org-resend-btn"
                                                                                            disabled={pendingOrgActionKey === `resend-${actionKeyBase}`}
                                                                                            onClick={() => handleResendGroupInvite(membershipId, member?.id)}
                                                                                            title="Send Invite Link"
                                                                                        >
                                                                                            <Send size={14} />
                                                                                        </button>
                                                                                    )}

                                                                                    {(isOwner || isAdmin) && memberRole !== 'owner' && (
                                                                                        <button
                                                                                            type="button"
                                                                                            className="seamless-user-dashboard-org-remove-btn"
                                                                                            disabled={pendingOrgActionKey === `remove-${actionKeyBase}`}
                                                                                            onClick={() => handleRemoveGroupMember(membershipId, member?.id)}
                                                                                            title="Remove Member"
                                                                                        >
                                                                                            <Trash2 size={14} />
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* COURSES VIEW */}
                    {activeView === 'courses' && (
                        <div className="seamless-user-dashboard-view active">
                            <div className="seamless-dashboard-content-container">
                                <div className="seamless-course-summary-grid">
                                    <div className="seamless-course-stat-card">
                                        <div className="seamless-course-stat-number">{(courses?.length || 0) + (includedCourses?.length || 0)}</div>
                                        <div className="seamless-course-stat-label">Total Courses</div>
                                    </div>
                                    <div className="seamless-course-stat-card">
                                        <div className="seamless-course-stat-number">{Object.values(courseProgressMap).filter(p => p.progress === 100).length}</div>
                                        <div className="seamless-course-stat-label">Completed</div>
                                    </div>
                                    <div className="seamless-course-progress-card">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
                                        No courses in progress
                                    </div>
                                </div>
                                <div className="seamless-user-dashboard-tabs-wrapper">
                                    <div className="seamless-user-dashboard-tabs-header">
                                        <button className={`seamless-user-dashboard-tab ${activeCourseTab === 'enrolled' ? 'active' : ''}`} onClick={() => setActiveCourseTab('enrolled')}>
                                            Enrolled Courses <span className="seamless-tab-count"><span>{courses?.length || 0}</span></span>
                                        </button>
                                        <button className={`seamless-user-dashboard-tab ${activeCourseTab === 'included' ? 'active' : ''}`} onClick={() => setActiveCourseTab('included')}>
                                            Included in Membership <span className="seamless-tab-count"><span>{includedCourses?.length || 0}</span></span>
                                        </button>
                                    </div>
                                    <div className="seamless-user-dashboard-tab-content active seamless-transparent-mt-24">
                                        {activeCourseTab === 'enrolled' && (
                                            courses === null ? (
                                                <DashboardSkeletonLoader rows={5} />
                                            ) : courses.length === 0 ? (
                                                <div className="seamless-empty-card"><p>You have not enrolled in any courses yet.</p></div>
                                            ) : (
                                                <div className="seamless-course-grid">
                                                    {courses.map((course: any, i: number) => {
                                                        const p = courseProgressMap[course?.id];
                                                        return (
                                                            <div key={course?.id || i} className="seamless-course-card-n">
                                                                <div className="seamless-course-card-img-wrapper">
                                                                    <img src={course?.image || 'https://via.placeholder.com/400x200?text=Course'} alt={course?.title} />
                                                                </div>
                                                                <div className="seamless-course-card-body">
                                                                    <h4 className="seamless-course-card-title">{course?.title || course?.name}</h4>
                                                                    <div className="seamless-course-card-meta">
                                                                        <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg> {p?.total_lessons || course?.lessons_count || 0} lessons</span>
                                                                        <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg> {course?.duration_minutes || 0} minutes</span>
                                                                    </div>
                                                                    <a href={`${getAuthenticatedCourseBaseUrl().replace(/\/$/, '')}/courses/${course?.slug || course?.id}`} className="seamless-course-card-action">
                                                                        Start Course <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )
                                        )}
                                        {activeCourseTab === 'included' && (
                                            includedCourses === null ? (
                                                <DashboardSkeletonLoader rows={5} />
                                            ) : includedCourses.length === 0 ? (
                                                <div className="seamless-empty-card"><p>You do not have any courses included in your membership.</p></div>
                                            ) : (
                                                <div className="seamless-course-grid">
                                                    {includedCourses.map((course: any, i: number) => {
                                                        const p = courseProgressMap[course?.id];
                                                        return (
                                                            <div key={course?.id || i} className="seamless-course-card-n">
                                                                <div className="seamless-course-card-img-wrapper">
                                                                    <img src={course?.image || 'https://via.placeholder.com/400x200?text=Course'} alt={course?.title} />
                                                                </div>
                                                                <div className="seamless-course-card-body">
                                                                    <h4 className="seamless-course-card-title">{course?.title || course?.name}</h4>
                                                                    <div className="seamless-course-card-meta">
                                                                        <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg> {p?.total_lessons || course?.lessons_count || 0} lessons</span>
                                                                        <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg> {course?.duration_minutes || 0} minutes</span>
                                                                    </div>
                                                                    <a href={`${getAuthenticatedCourseBaseUrl().replace(/\/$/, '')}/courses/${course?.slug || course?.id}`} className="seamless-course-card-action">
                                                                        Start Course <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg>
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ORDERS VIEW */}
                    {activeView === 'orders' && (
                        <div className="seamless-user-dashboard-view active">
                            <div className="seamless-dashboard-content-container">
                                <div className="seamless-orders-content-card">
                                    <div className="seamless-orders-content-header">
                                        <h3 className="seamless-user-dashboard-view-title seamless-mt-0">Order History</h3>
                                    </div>
                                    <div className="seamless-table-wrapper seamless-mt-24">
                                    <table className="seamless-styled-table">
                                        <thead className="seamless-styled-thead">
                                            <tr>
                                                <th>Customer</th>
                                                <th>No. Of Products</th>
                                                <th>Ordered Products</th>
                                                <th>Status</th>
                                                <th>Total</th>
                                                <th>Ordered Date</th>
                                                <th>Invoice</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders === null ? (
                                                <tr><td colSpan={7} className="seamless-p-24-center-slate"><DashboardSkeletonLoader rows={4} compact /></td></tr>
                                            ) : orders.length === 0 ? (
                                                <tr><td colSpan={7} className="seamless-p-24-center-slate">No orders found.</td></tr>
                                            ) : (
                                                orders.map((order: any, i: number) => {
                                                    const statusLower = (order.status || 'unknown').toLowerCase();
                                                    let badgeClass = 'seamless-badge-default';
                                                    if (statusLower === 'completed' || statusLower === 'success') badgeClass = 'seamless-badge-success';
                                                    else if (statusLower === 'pending') badgeClass = 'seamless-badge-pending';
                                                    else if (statusLower === 'failed' || statusLower === 'cancelled') badgeClass = 'seamless-badge-failed';

                                                    const fmtDate = order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';

                                                    return (
                                                        <tr key={order.id || i} className="seamless-styled-tr">
                                                            <td>{order.customer_name || 'N/A'}</td>
                                                            <td className="seamless-text-center">{order.products_count || 1}</td>
                                                            <td>{order.ordered_product || '—'}</td>
                                                            <td><span className={`seamless-badge ${badgeClass}`}>{order.status || 'Status'}</span></td>
                                                            <td className="seamless-total-amount">${parseFloat(order.total || 0).toFixed(2)}</td>
                                                            <td className="seamless-text-slate-600">{fmtDate}</td>
                                                            <td>
                                                                {order.invoice_url ? (
                                                                    <button onClick={() => window.open(order.invoice_url, '_blank', 'noopener,noreferrer')} className="seamless-btn-invoice">Invoice</button>
                                                                ) : '—'}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};
