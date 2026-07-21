import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BackgroundManager from './BackgroundManager';
import Sidebar from './Sidebar';
import SettingsPanel from './SettingsPanel';
import { loadSettings, applySettings } from '../lib/settings';

export default function Layout() {
  const location = useLocation();

  useEffect(() => {
    const settings = loadSettings();
    applySettings(settings);
  }, [location.pathname]);

  return (
    <>
      <BackgroundManager />
      <Sidebar />
      <button id="mobile-menu-btn" className="mobile-menu-btn" onClick={() => document.dispatchEvent(new CustomEvent('toggle-sidebar'))} aria-label="Menu">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
      <main id="main-content" className="main-content">
        <div className="main-inner">
          <div key={location.pathname} className="page-enter">
            <Outlet />
          </div>
        </div>
      </main>
      <SettingsPanel />
      <style>{`
        .page-enter { animation: fadeSlideUp .5s ease-out; }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
