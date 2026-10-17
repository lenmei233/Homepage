import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

// Route-level code splitting: each page (and its heavy deps) loads on demand,
// so the initial bundle stays small and first paint is fast.
const Home = lazy(() => import('./components/Home'));
const Projects = lazy(() => import('./components/Projects'));
const TechStack = lazy(() => import('./components/TechStack'));
const Tools = lazy(() => import('./components/Tools'));
const Friends = lazy(() => import('./components/Friends'));
const About = lazy(() => import('./components/About'));
const SettingsPage = lazy(() => import('./components/SettingsPage'));

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]" aria-hidden="true">
      <div className="w-40 h-40 rounded-2xl animate-pulse bg-white/5" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Suspense fallback={<PageFallback />}><Home /></Suspense>} />
          <Route path="/projects" element={<Suspense fallback={<PageFallback />}><Projects /></Suspense>} />
          <Route path="/tech-stack" element={<Suspense fallback={<PageFallback />}><TechStack /></Suspense>} />
          <Route path="/tools" element={<Suspense fallback={<PageFallback />}><Tools /></Suspense>} />
          <Route path="/friends" element={<Suspense fallback={<PageFallback />}><Friends /></Suspense>} />
          <Route path="/about" element={<Suspense fallback={<PageFallback />}><About /></Suspense>} />
          <Route path="/settings" element={<Suspense fallback={<PageFallback />}><SettingsPage /></Suspense>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
