import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi } from '../api';
import { config } from '../config';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorState from '../components/ui/ErrorState';
import '../styles/global.css';

type Tab = 'profile' | 'memberships' | 'courses' | 'orders' | 'organization';

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>('profile');

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'profile',      label: 'Profile',       icon: '👤' },
    { id: 'memberships',  label: 'Memberships',   icon: '🎫' },
    { id: 'courses',      label: 'Courses',        icon: '📚' },
    { id: 'orders',       label: 'Orders',         icon: '🧾' },
    { id: 'organization', label: 'Organization',   icon: '🏢' },
  ];

  return (
    <div className="sr-container sr-section">
      <div className="sr-dashboard">
        {/* Sidebar */}
        <aside className="sr-sidebar">
          <div style={{ padding: '1.25rem 1.25rem .75rem', borderBottom: '1px solid var(--sr-border)' }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: 'var(--sr-text)' }}>My Account</p>
            {config.userEmail && (
              <p style={{ margin: '.2rem 0 0', fontSize: '.75rem', color: 'var(--sr-text-muted)' }}>{config.userEmail}</p>
            )}
          </div>
          <ul className="sr-sidebar-nav">
            {tabs.map(t => (
              <li key={t.id} className={tab === t.id ? 'active' : ''}>
                <button onClick={() => setTab(t.id)}>
                  <span>{t.icon}</span>
                  {t.label}
                </button>
              </li>
            ))}
            {config.logoutUrl && (
              <li>
                <a href={config.logoutUrl} style={{ color: '#ef4444' }}>
                  <span>🚪</span>Logout
                </a>
              </li>
            )}
          </ul>
        </aside>

        {/* Main content */}
        <main>
          {tab === 'profile'      && <ProfileTab />}
          {tab === 'memberships'  && <MembershipsTab />}
          {tab === 'courses'      && <CoursesTab />}
          {tab === 'orders'       && <OrdersTab />}
          {tab === 'organization' && <OrganizationTab />}
        </main>
      </div>
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab() {
  const qc = useQueryClient();
  const { data: profile, isLoading, isError, error } = useQuery({
    queryKey:  ['dashboard-profile'],
    queryFn:   dashboardApi.getProfile,
  });

  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState<Record<string, string>>({});
  const [msg,     setMsg]     = useState('');

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      dashboardApi.updateProfile(config.userEmail, data),
    onSuccess: () => {
      setMsg('Profile updated.');
      setEditing(false);
      qc.invalidateQueries({ queryKey: ['dashboard-profile'] });
    },
    onError: (e: Error) => setMsg(e.message),
  });

  if (isLoading) return <LoadingSpinner text="Loading profile…" />;
  if (isError)   return <ErrorState message={(error as Error).message} />;

  const p = (profile as any) ?? {};

  const fields = [
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name',  label: 'Last Name'  },
    { key: 'email',      label: 'Email'       },
    { key: 'phone',      label: 'Phone'       },
    { key: 'city',       label: 'City'        },
    { key: 'country',    label: 'Country'     },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>My Profile</h2>
        <button className="sr-btn sr-btn-outline sr-btn-sm" onClick={() => {
          setEditing(e => !e);
          setForm({});
          setMsg('');
        }}>
          {editing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {msg && <p style={{ color: msg.includes('updated') ? 'green' : 'red', marginBottom: '1rem', fontSize: '.875rem' }}>{msg}</p>}

      {editing ? (
        <div>
          <div className="sr-grid sr-grid-2">
            {fields.map(f => (
              <div key={f.key} className="sr-field">
                <label className="sr-label">{f.label}</label>
                <input
                  className="sr-input"
                  defaultValue={p[f.key] ?? ''}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <button
            className="sr-btn sr-btn-primary"
            disabled={updateMutation.isPending}
            onClick={() => updateMutation.mutate(form)}
          >
            {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      ) : (
        <div className="sr-card">
          <div className="sr-card-body">
            <div className="sr-grid sr-grid-2">
              {fields.map(f => (
                <div key={f.key}>
                  <p style={{ margin: 0, fontSize: '.75rem', color: 'var(--sr-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>{f.label}</p>
                  <p style={{ margin: '.2rem 0 0', fontSize: '.95rem', fontWeight: 600 }}>{p[f.key] ?? '—'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Memberships Tab ──────────────────────────────────────────────────────────

function MembershipsTab() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard-memberships'],
    queryFn:  dashboardApi.getMemberships,
  });

  if (isLoading) return <LoadingSpinner text="Loading memberships…" />;
  if (isError)   return <ErrorState message={(error as Error).message} />;

  const { current = [], history = [] } = (data as any) ?? {};

  function statusBadge(status: string) {
    const lower = status.toLowerCase();
    if (lower === 'active')    return <span className="sr-badge sr-badge-success">Active</span>;
    if (lower === 'cancelled') return <span className="sr-badge sr-badge-warning">Cancelled</span>;
    if (lower === 'expired')   return <span className="sr-badge sr-badge-danger">Expired</span>;
    return <span className="sr-badge sr-badge-neutral">{status}</span>;
  }

  function renderRows(rows: any[]) {
    if (!rows.length) return <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--sr-text-muted)', padding: '2rem' }}>None found.</td></tr>;
    return rows.map((m: any, i: number) => (
      <tr key={m.id ?? i}>
        <td><strong>{m.plan?.label ?? '—'}</strong></td>
        <td>{statusBadge(m.status ?? 'unknown')}</td>
        <td style={{ fontSize: '.8rem', color: 'var(--sr-text-muted)' }}>{m.expiry_date ?? m.expires_at ?? '—'}</td>
        <td>${m.plan?.price ?? '—'}</td>
      </tr>
    ));
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', fontWeight: 800 }}>My Memberships</h2>

      <h3 style={{ margin: '0 0 .75rem', fontSize: '1rem', fontWeight: 700 }}>Current</h3>
      <div className="sr-table-wrap" style={{ marginBottom: '2rem' }}>
        <table className="sr-table">
          <thead><tr><th>Plan</th><th>Status</th><th>Expires</th><th>Price</th></tr></thead>
          <tbody>{renderRows(current)}</tbody>
        </table>
      </div>

      <h3 style={{ margin: '0 0 .75rem', fontSize: '1rem', fontWeight: 700 }}>History</h3>
      <div className="sr-table-wrap">
        <table className="sr-table">
          <thead><tr><th>Plan</th><th>Status</th><th>Expired</th><th>Price</th></tr></thead>
          <tbody>{renderRows(history)}</tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Courses Tab ───────────────────────────────────────────────────────────────

function CoursesTab() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard-courses'],
    queryFn:  dashboardApi.getCourses,
  });

  if (isLoading) return <LoadingSpinner text="Loading courses…" />;
  if (isError)   return <ErrorState message={(error as Error).message} />;

  const { enrolled = [], included = [] } = (data as any) ?? {};
  const all = [...enrolled, ...included];

  if (!all.length) return <div className="sr-empty"><p>No courses found.</p></div>;

  return (
    <div>
      <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', fontWeight: 800 }}>My Courses</h2>
      <div className="sr-grid sr-grid-2">
        {all.map((c: any, i: number) => (
          <div key={c.id ?? i} className="sr-card">
            <div className="sr-card-body">
              <h3 style={{ margin: '0 0 .5rem', fontSize: '1rem', fontWeight: 700 }}>{c.title}</h3>
              {c.progress !== undefined && (
                <div style={{ marginTop: '.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', marginBottom: '.3rem' }}>
                    <span>Progress</span><span>{c.progress}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--sr-border)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${c.progress}%`, background: 'var(--sr-secondary)', borderRadius: '3px' }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Orders Tab ──────────────────────────────────────────────────────────────

function OrdersTab() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard-orders'],
    queryFn:  dashboardApi.getOrders,
  });

  if (isLoading) return <LoadingSpinner text="Loading orders…" />;
  if (isError)   return <ErrorState message={(error as Error).message} />;

  const orders: any[] = Array.isArray(data) ? data : [];

  if (!orders.length) return <div className="sr-empty"><p>No orders found.</p></div>;

  return (
    <div>
      <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', fontWeight: 800 }}>Order History</h2>
      <div className="sr-table-wrap">
        <table className="sr-table">
          <thead>
            <tr><th>Order #</th><th>Item</th><th>Date</th><th>Amount</th><th>Status</th></tr>
          </thead>
          <tbody>
            {orders.map((o: any, i: number) => (
              <tr key={o.id ?? i}>
                <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{o.order_number ?? o.id ?? '—'}</td>
                <td>{o.item_name ?? o.description ?? '—'}</td>
                <td style={{ fontSize: '.8rem', color: 'var(--sr-text-muted)' }}>{o.created_at ?? o.date ?? '—'}</td>
                <td style={{ fontWeight: 700 }}>${o.amount ?? o.total ?? '—'}</td>
                <td><span className="sr-badge sr-badge-success">{o.status ?? 'Paid'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Organization Tab ────────────────────────────────────────────────────────

function OrganizationTab() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard-organization'],
    queryFn:  dashboardApi.getOrganization,
  });

  if (isLoading) return <LoadingSpinner text="Loading organization…" />;
  if (isError)   return <ErrorState message={(error as Error).message} />;

  const org = (data as any) ?? {};

  return (
    <div>
      <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', fontWeight: 800 }}>My Organization</h2>
      {org.organization?.name && (
        <div className="sr-card" style={{ marginBottom: '1.5rem' }}>
          <div className="sr-card-body">
            <p style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem' }}>{org.organization.name}</p>
            {org.organization.email && <p style={{ margin: '.3rem 0 0', color: 'var(--sr-text-muted)', fontSize: '.875rem' }}>{org.organization.email}</p>}
          </div>
        </div>
      )}

      {org.group_memberships && org.group_memberships.length > 0 && (
        <>
          <h3 style={{ margin: '0 0 .75rem', fontSize: '1rem', fontWeight: 700 }}>Group Members</h3>
          <div className="sr-table-wrap">
            <table className="sr-table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
              <tbody>
                {(org.group_memberships as any[]).flatMap((gm: any) =>
                  (gm.members ?? []).map((m: any, i: number) => (
                    <tr key={m.id ?? i}>
                      <td>{m.first_name} {m.last_name}</td>
                      <td style={{ fontSize: '.8rem', color: 'var(--sr-text-muted)' }}>{m.email}</td>
                      <td><span className="sr-badge sr-badge-neutral">{m.role ?? 'member'}</span></td>
                      <td>{m.status === 'active' ? <span className="sr-badge sr-badge-success">Active</span> : <span className="sr-badge sr-badge-neutral">{m.status}</span>}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {(!org.organization && !org.group_memberships?.length) && (
        <div className="sr-empty"><p>No organization data found.</p></div>
      )}
    </div>
  );
}
