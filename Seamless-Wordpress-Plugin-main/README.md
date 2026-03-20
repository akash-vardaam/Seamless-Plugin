<a id="readme-top"></a>

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/Devdeep369/Seamless-Wordpress-Plugin">
    <img src="src/Admin/assets/seamless-logo.png" alt="Seamless Logo">
  </a>

  <h3 align="center">Seamless WordPress Plugin</h3>

  <p align="center">
    A feature-rich WordPress plugin for managing and displaying events, memberships, donations, and user dashboards — tightly integrated with the <strong>Seamless AMS</strong> platform via secure OAuth authentication.
  </p>
</div>

---

## ✨ Features

### 🗓️ Advanced Event Calendar

![Calendar Screen Shot][Calendar-screenshot]

- **Interactive calendar** powered by [Toast UI Calendar](https://github.com/nhn/tui.calendar) with **Month, Week, Day, and Year** views
- **Year view** with per-month mini-calendars and event-coloured day dots
- **Month dropdown** — click the month label to reveal a flyout menu for instant month navigation
- **Year spinner** — forward/backward buttons to navigate years without limits
- **Display List toggle** — switch any view between calendar and a searchable, colour-coded event list at any time
- **Smooth animations** — `cal-slide-up` transitions on every navigation, view switch, and label change
- **Mobile-optimised** — dot-based event display in month view on small screens with a tap-to-preview bottom sheet
- **Live event search** in list view with debounced client-side filtering

### 📋 Event Display Widgets

- **Event grid** and **event list** shortcodes with filter/sort dropdowns
- **Single event detail** pages with full description, venue, sponsors, and add-to-calendar support
- Elementor widgets for **EventsList**, **EventSidebar**, and **EventTickets** with preview data support
- Dynamic Elementor tags for event image, additional images, and sponsor logos

### 👤 User Dashboard

- Tabbed dashboard with **Memberships**, **Courses**, **Orders**, and **Profile** sections
- **Upgrade, Downgrade, and Renew** membership flows with Stripe Checkout redirect
- Dynamic membership plan comparison modal with offerings breakdown
- Hide/show sections based on plan offerings

### 🔐 Authentication & SSO

- **OAuth 2.0** integration with Seamless AMS
- Single Sign-On (SSO) support
- Token-based `AccessController` for protecting shortcode content
- **Content Restriction** meta box per post/page with configurable access rules

### ⚙️ Admin Settings

- Dedicated **Settings Page** for API credentials, endpoint configuration, and feature toggles
- **Welcome Page** with onboarding guidance
- Custom rewrite rules and configurable slug endpoints

---

## 🛠️ Tech Stack

| Layer             | Technology                                                  |
| ----------------- | ----------------------------------------------------------- |
| Backend           | PHP 7.4+, WordPress 6.0+, Composer PSR-4 autoloading        |
| Frontend Calendar | [Toast UI Calendar v2](https://github.com/nhn/tui.calendar) |
| Build tooling     | [Vite](https://vitejs.dev/) + Yarn                          |
| Carousel          | Slick Carousel (bundled)                                    |
| Styling           | Vanilla CSS with CSS custom properties (theme-aware)        |
| Elementor         | Custom Widgets & Dynamic Tags                               |

---

## 📦 Installation

1. Clone or download the repository into your `/wp-content/plugins/` directory:

   ```bash
   git clone https://github.com/your-org/seamless-wordpress-plugin.git
   ```

2. Install PHP dependencies:

   ```bash
   composer install
   ```

3. Install JS dependencies and build assets:

   ```bash
   yarn install
   yarn build
   ```

4. Activate the plugin from your WordPress admin panel under **Plugins**.

5. Navigate to **Seamless › Settings** and enter your Seamless AMS API credentials.

---

## 🔧 Development

Run the Vite dev build in watch mode:

```bash
yarn dev
```

Build production assets:

```bash
yarn build
```

Built assets are output to `src/Public/dist/`.

---

## 🩹 Shortcodes

| Shortcode                        | Description                              |
| -------------------------------- | ---------------------------------------- |
| `[seamless_event_calendar]`      | Full interactive calendar with all views |
| `[seamless_event_list]`          | Filterable, searchable event list        |
| `[seamless_event_grid]`          | Card-based event grid                    |
| `[seamless_single_event id="1"]` | Full detail page for a single event      |
| `[seamless_user_dashboard]`      | Authenticated user dashboard             |
| `[seamless_ams_content]`         | Protected AMS content block              |

---

## 📁 Project Structure

```
seamless-wordpress-plugin/
├── seamless.php                  # Plugin bootstrap & hooks
├── src/
│   ├── Admin/                    # Settings page, welcome screen, content restriction meta
│   ├── Auth/                     # OAuth, SSO, access control, token handling
│   ├── Endpoints/                # Custom WordPress rewrite rules
│   ├── Operations/               # Memberships, donations, user profile logic
│   ├── Public/
│   │   ├── SeamlessRender.php    # Main shortcode & widget renderer
│   │   ├── templates/            # PHP view templates (events, dashboard, calendar…)
│   │   └── dist/                 # Compiled CSS & JS (gitignored build output)
│   ├── css/seamless.css          # Source stylesheet
│   └── js/seamless.js            # Source JavaScript (calendar, events, dashboard)
├── vite.config.js
├── composer.json
└── package.json
```

---

## 📋 Requirements

- **WordPress** 6.0 or higher
- **PHP** 7.4 or higher
- **Seamless AMS** account with API credentials
- Node.js + Yarn (for development builds)

---

## 📄 License

Licensed under the [GNU General Public License v2.0](license.txt) or later.

---

## 🤝 Credits

Developed by [Devdeep Solanki](https://github.com/Devdeep369) for [Seamless AMS](https://seamlessams.com).

[Calendar-screenshot]: src/Admin/assets/Calendar-view.png
