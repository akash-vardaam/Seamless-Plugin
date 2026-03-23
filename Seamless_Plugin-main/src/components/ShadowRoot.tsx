import React, { useRef, useEffect, useState, createContext, useContext } from 'react';
import ReactDOM from 'react-dom';

/**
 * Context that exposes the ShadowRoot instance to any child component
 * that needs to perform scoped DOM lookups (e.g. getElementById).
 */
export const ShadowContext = createContext<ShadowRoot | null>(null);

export const useShadowRoot = () => useContext(ShadowContext);

interface ShadowRootProps {
    children: React.ReactNode;
    /**
     * Array of raw CSS strings to inject INSIDE the shadow root.
     * These override any host-page theme / plugin CSS because shadow-DOM
     * styles are encapsulated — they are never overridden by external sheets.
     *
     * Pass every stylesheet as a separate string.  In practice App.tsx
     * provides a single concatenated bundle via Vite's `?inline` import.
     */
    styles?: string[];
}

/**
 * ShadowRoot component
 * ─────────────────────────────────────────────────────────────────────────────
 * Attaches an open shadow root to a host <div> and portals `children` into it.
 *
 * Style injection strategy
 * ────────────────────────
 * We use the modern `CSSStyleSheet` / `adoptedStyleSheets` API when available
 * (Chrome 73+, Firefox 101+, Safari 16.4+).  This is the most performant path
 * and gives the sheets the highest possible cascade priority inside the shadow
 * root — effectively making our styles impossible to override by external CSS.
 *
 * For older browsers we fall back to injecting <style> tags directly into
 * the shadow root, which also has full isolation from the host page.
 *
 * Either way, external theme / plugin CSS CANNOT reach inside the shadow root
 * at all — so conflicts with Elementor, Divi, or other plugins are eliminated.
 */
export const ShadowRoot: React.FC<ShadowRootProps> = ({ children, styles = [] }) => {
    const hostRef = useRef<HTMLDivElement>(null);
    const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null);

    // ── Step 1: attach the shadow root once ──────────────────────────────────
    useEffect(() => {
        if (!hostRef.current) return;

        // Re-use an already-attached shadow root (StrictMode double-invoke safe)
        const root =
            hostRef.current.shadowRoot ?? hostRef.current.attachShadow({ mode: 'open' });

        setShadowRoot(root);
    }, []); // run only on mount

    // ── Step 2: inject styles whenever shadowRoot or styles change ───────────
    useEffect(() => {
        if (!shadowRoot || styles.length === 0) return;

        if (typeof CSSStyleSheet !== 'undefined' && 'adoptedStyleSheets' in shadowRoot) {
            // ── Constructable Stylesheets path (modern browsers) ──────────────
            // These sheets are applied LAST in the shadow cascade, giving them
            // the highest cascade position inside the shadow root.
            const sheets: CSSStyleSheet[] = styles.map((css) => {
                const sheet = new CSSStyleSheet();
                sheet.replaceSync(css);
                return sheet;
            });
            // Replace (don't append) so re-renders don't accumulate duplicates.
            shadowRoot.adoptedStyleSheets = sheets;
        } else {
            // ── Fallback: <style> injection ───────────────────────────────────
            // Remove previously injected plugin styles to avoid duplicates.
            shadowRoot
                .querySelectorAll('style[data-seamless-style]')
                .forEach((el) => el.remove());

            styles.forEach((css) => {
                const tag = document.createElement('style');
                tag.setAttribute('data-seamless-style', 'true');
                tag.textContent = css;
                // Append LAST so our rules win over any other injected sheets.
                shadowRoot.appendChild(tag);
            });
        }
    }, [shadowRoot, styles]);

    return (
        /*
         * `display: contents` makes the host element itself invisible in layout —
         * only its shadow content participates in the page layout.
         * This means the shadow host wrapper does NOT create an extra block box,
         * avoiding any unexpected width / box-model side-effects.
         */
        <div ref={hostRef} id="seamless-shadow-host" style={{ display: 'contents' }}>
            {shadowRoot && (
                <ShadowContext.Provider value={shadowRoot}>
                    {ReactDOM.createPortal(children, shadowRoot)}
                </ShadowContext.Provider>
            )}
        </div>
    );
};
