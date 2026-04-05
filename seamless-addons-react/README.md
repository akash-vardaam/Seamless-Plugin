# Seamless React Plugin

A WordPress plugin that replaces the original Pure-JS + PHP implementation with a
**React 18 + TypeScript + PHP** architecture.

## Repository structure

```
seamless-react/
├── plugin/                  ← WordPress plugin (copy to wp-content/plugins/)
│   ├── seamless.php         ← Plugin entry point
│   ├── src/
│   │   ├── Autoloader.php
│   │   ├── Admin/           ← Admin settings page + meta box
│   │   ├── Auth/            ← Auth, SSO, PKCE callback
│   │   ├── Endpoints/       ← Custom WP rewrite rules
│   │   ├── Frontend/        ← Asset enqueue, shortcodes, AJAX handlers
│   │   └── Operations/      ← UserProfile API proxy
│   └── react-build/
│       └── dist/            ← **Built React output – deploy here**
│
└── react-app/               ← React source (run `npm run build` here)
    ├── src/
    │   ├── main.tsx         ← Shadow DOM mount logic
    │   ├── App.tsx          ← View router
    │   ├── api/             ← WP AJAX + public AMS API helpers
    │   ├── config.ts        ← WordPress config types
    │   ├── views/           ← EventsList, SingleEvent, Memberships, Courses, Dashboard
    │   ├── components/      ← Reusable UI components
    │   └── styles/          ← global.css (all styles scoped to Shadow DOM)
    └── vite.config.ts       ← Outputs to ../../plugin/react-build/dist/
```

## Key design decisions

| Feature | Approach |
|---|---|
| **Style isolation** | Shadow DOM — React renders inside `host.attachShadow({mode:'open'})`, so zero CSS bleed from/to theme |
| **Security** | All mutations go through WP AJAX (`admin-ajax.php`) with `wp_create_nonce()` / `check_ajax_referer()` — no custom REST endpoints exposed |
| **Public data** | Fetched directly from `clientDomain/api/…` (read-only, no token) |
| **Private data** | Proxied server-side via `seamless_react_api_proxy` AJAX action; only `dashboard/` paths are forwarded |
| **Performance** | React Query caching, code-splitting with `React.lazy`, filemtime-based cache-busting |
| **SSO** | PKCE OAuth 2.0 with state/nonce via `wp_create_nonce` + transient storage |

## Setup

### 1. Install the WordPress plugin

```
cp -r plugin/ /path/to/wp-content/plugins/seamless-react/
```

Activate **Seamless React** in *Plugins → Installed Plugins*.

Open **Seamless React → Settings**, enter your AMS domain, and click **Save and Connect**.

### 2. Build the React app

```bash
cd react-app
npm install
npm run build
```

This outputs to `plugin/react-build/dist/`. The PHP plugin automatically picks up
the hashed filenames from the `assets/` folder.

### 3. Deploy updates (React only)

After making changes to the React app:

```bash
cd react-app
npm run build
```

Then replace `plugin/react-build/dist/` on the server — no PHP changes needed.

### 4. Local React development

```bash
cd react-app
npm run dev
```

Opens a Vite dev server at `http://localhost:5174` with fake WordPress globals.

## Available shortcodes

| Shortcode | Description |
|---|---|
| `[seamless_react_event_list]` | Events with filter bar |
| `[seamless_react_events view="grid"]` | Events in grid layout |
| `[seamless_react_events view="list"]` | Events in list layout |
| `[seamless_react_single_event slug="my-event"]` | Single event detail |
| `[seamless_react_memberships]` | Membership plans |
| `[seamless_react_courses]` | Course catalog |
| `[seamless_react_dashboard]` | User accounts dashboard |
| `[seamless_react_login_button]` | SSO login / logout button |
