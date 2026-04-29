import './styles/tokens.css';
import './styles/overlays.css';
import './styles/tailwind.css';
import './styles/animations.css';
import './styles/scrollbar.css';

import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const isShowcase = import.meta.env.DEV && window.location.pathname === '/_showcase';

// Dev-only: dynamically imported so the showcase tree-shakes from prod builds.
const Showcase = isShowcase
  ? lazy(() => import('./showcase/Showcase').then((m) => ({ default: m.Showcase })))
  : null;

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root not found');

createRoot(rootEl).render(
  <StrictMode>
    {Showcase ? (
      <Suspense fallback={<div>Loading showcase…</div>}>
        <Showcase />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);
