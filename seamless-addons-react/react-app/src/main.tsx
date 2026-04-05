import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';

/**
 * Main entry point.
 *
 * Scans the document for every `.seamless-react-mount` div and mounts a
 * React root inside a **Shadow DOM** attached to that host element.
 *
 * This completely isolates our styles & scripts from the surrounding WordPress
 * theme – eliminating CSS/JS conflicts with other plugins.
 */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,    // 30 s
      gcTime:    5 * 60 * 1000, // 5 min
      retry: 1,
    },
  },
});

function mountAll() {
  const mounts = document.querySelectorAll<HTMLElement>('.seamless-react-mount');

  mounts.forEach((host) => {
    if (host.dataset.mounted === 'true') return; // prevent double-mount
    host.dataset.mounted = 'true';

    const view    = host.dataset.seamlessView ?? 'events';
    const useShadow = host.dataset.shadow !== 'false';

    // Collect data-* extras into a props object
    const extras: Record<string, string> = {};
    for (const [key, value] of Object.entries(host.dataset)) {
      if (key !== 'seamlessView' && key !== 'shadow' && key !== 'mounted' && key !== 'siteUrl') {
        extras[key] = value ?? '';
      }
    }

    let mountTarget: Element;

    if (useShadow) {
      // Enable Shadow DOM for full style isolation
      const shadow = host.attachShadow({ mode: 'open' });

      // Inject our compiled CSS into the shadow root via a <link> tag
      const styleLink = document.createElement('link');
      styleLink.rel = 'stylesheet';

      // Find our injected stylesheet URL (the one loaded by WordPress)
      const existingLink = document.querySelector<HTMLLinkElement>('link[id="seamless-react-app-css"]');
      if (existingLink) {
        styleLink.href = existingLink.href;
      }
      shadow.appendChild(styleLink);

      // Also inject Google Fonts into the shadow so typography works
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap';
      shadow.appendChild(fontLink);

      const container = document.createElement('div');
      container.className = 'seamless-shadow-root';
      shadow.appendChild(container);
      mountTarget = container;
    } else {
      // Fallback: mount directly (no style isolation)
      mountTarget = host;
    }

    const root = ReactDOM.createRoot(mountTarget);
    root.render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <App view={view} extras={extras} />
        </QueryClientProvider>
      </React.StrictMode>
    );
  });
}

// Mount immediately for elements already in the DOM
mountAll();

// Also observe for dynamically injected mounts (Elementor widgets, etc.)
const observer = new MutationObserver(() => mountAll());
observer.observe(document.body, { childList: true, subtree: true });
