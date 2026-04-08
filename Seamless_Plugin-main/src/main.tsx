import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

/**
 * Seamless React Plugin – Multi-mount entry point
 *
 * Supports two modes:
 *  1. WordPress shortcode mode – each shortcode renders a div with a specific
 *     `data-seamless-view` attribute that tells the app which route to show.
 *  2. Dev / standalone mode – falls back to the #root container and renders the
 *     full BrowserRouter-based SPA.
 *
 * Each WordPress shortcode mounts its own isolated React root so that
 * multiple shortcodes can coexist on the same page without conflicts.
 */

interface MountConfig {
  container: HTMLElement;
  view: string;
  slug: string;
  type: string;
  containerMaxWidth: string;
  siteUrl: string;
}

const getGlobalContainerMaxWidth = () => {
  const cfg = (window as any).seamlessReactConfig;
  return cfg?.containerMaxWidth || '';
};

const renderMount = ({ container, view, slug, type, containerMaxWidth, siteUrl }: MountConfig) => {
  createRoot(container).render(
    <StrictMode>
      <App
        initialView={view}
        initialSlug={slug}
        initialType={type}
        containerMaxWidth={containerMaxWidth}
        siteUrl={siteUrl}
      />
    </StrictMode>,
  );
};

// Detect all Seamless shortcode containers on the page.
const shortcodeContainers = document.querySelectorAll<HTMLElement>('[data-seamless-view]');
const mounts: MountConfig[] = Array.from(shortcodeContainers).map((container) => ({
  container,
  view: container.getAttribute('data-seamless-view') || 'events',
  slug: container.getAttribute('data-seamless-slug') || '',
  type: container.getAttribute('data-seamless-type') || '',
  containerMaxWidth: container.getAttribute('data-container-max-width') || getGlobalContainerMaxWidth(),
  siteUrl: container.getAttribute('data-site-url') || window.location.origin,
}));

// Backward compatibility for legacy single-event templates that still expose
// #event_detail as the mount point instead of the newer data-seamless-view div.
if (mounts.length === 0) {
  const legacySingleEventContainer = document.getElementById('event_detail');
  const legacySlug = legacySingleEventContainer?.getAttribute('data-event-slug') || '';

  if (legacySingleEventContainer && legacySlug) {
    mounts.push({
      container: legacySingleEventContainer,
      view: 'single-event',
      slug: legacySlug,
      type:
        legacySingleEventContainer.getAttribute('data-event-type') ||
        new URLSearchParams(window.location.search).get('type') ||
        '',
      containerMaxWidth:
        legacySingleEventContainer.getAttribute('data-container-max-width') ||
        getGlobalContainerMaxWidth(),
      siteUrl: window.location.origin,
    });
  }
}

if (mounts.length > 0) {
  mounts.forEach(renderMount);
} else {
  // Dev / standalone mode – use the standard #root container
  const containerElement =
    document.getElementById('seamless-react-root') ||
    document.getElementById('events-react-root') ||
    document.getElementById('root');

  if (containerElement) {
    containerElement.id = 'seamless-event-container';
    createRoot(containerElement).render(
      <StrictMode>
        <App containerMaxWidth={getGlobalContainerMaxWidth()} />
      </StrictMode>,
    );
  } else {
    console.warn(
      '[Seamless React] No mount point found. Expected a [data-seamless-view] element, ' +
      '#seamless-react-root, #events-react-root, or #root.'
    );
  }
}
