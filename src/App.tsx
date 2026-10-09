import { Suspense, lazy, useEffect } from 'react';
import { Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { BottomTabs, Header } from './components/Header';
import { SearchPalette, useSearchShortcut } from './components/SearchPalette';
import { ModeBackground } from './components/bg/ModeBackground';
import { modeForPath, useAppearance } from './lib/appearance';
import { useSettings } from './store/settings';

const Home = lazy(() => import('./pages/Home'));
const TopoHome = lazy(() => import('./pages/TopoHome'));
const TheoryHome = lazy(() => import('./pages/TheoryHome'));
const Tananyag = lazy(() => import('./pages/Tananyag'));
const Fogalomtar = lazy(() => import('./pages/Fogalomtar'));
const Vizsga = lazy(() => import('./pages/Vizsga'));
const Haladas = lazy(() => import('./pages/Haladas'));
const Beallitasok = lazy(() => import('./pages/Beallitasok'));
const TopoMap = lazy(() => import('./pages/TopoMap'));
const Szamolas = lazy(() => import('./pages/Szamolas'));
const TopoQuiz = lazy(() => import('./pages/TopoQuiz'));
const Abrak = lazy(() => import('./pages/Abrak'));
const Folyamatok = lazy(() => import('./pages/Folyamatok'));
const TheoryQuiz = lazy(() => import('./pages/TheoryQuiz'));
const Ismetles = lazy(() => import('./pages/Ismetles'));
const stub = (name: keyof typeof import('./pages/Stubs')) => lazy(() => import('./pages/Stubs').then((m) => ({ default: m[name] })));
const NotFound = stub('NotFound');

function PageFallback() {
  return (
    <div className="stack" aria-busy="true" aria-label="Betöltés">
      <div className="skeleton" style={{ height: 40, width: '40%' }} />
      <div className="skeleton" style={{ height: 18, width: '70%' }} />
      <div className="skeleton" style={{ height: 160 }} />
    </div>
  );
}

/** Remembers the last path per mode and scrolls to the top on navigation. */
function useRouteMemory() {
  const { pathname, search, hash } = useLocation();
  const set = useSettings((s) => s.set);
  useEffect(() => {
    const st = useSettings.getState();
    const mode = modeForPath(pathname, st.lastMode);
    if (pathname.startsWith('/topografia') || pathname.startsWith('/elmelet')) {
      set({ lastMode: mode, lastPath: { ...st.lastPath, [mode]: pathname + search } });
    }
    if (!hash) window.scrollTo({ top: 0 });
  }, [pathname, search, hash, set]);
}

function Layout() {
  useAppearance();
  useSearchShortcut();
  useRouteMemory();
  const { pathname } = useLocation();
  const wide = pathname === '/topografia/terkep';
  return (
    <div className="app-shell">
      <ModeBackground />
      <Header />
      <main id="main" className={`app-main${wide ? ' is-wide' : ''}`} tabIndex={-1}>
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <footer className="app-footer">
        Adatok: Oktatási Hivatal – Földrajz részletes érettségi vizsgakövetelmény (2024) és korábbi érettségi feladatsorok (oktatas.hu).
        Térképek: Natural Earth (közkincs), PB2002 lemezhatárok (P. Bird), geoBoundaries (CC BY 4.0). A magyarázó szövegek
        egy része AI-generált – ellenőrizd a tankönyvvel.
      </footer>
      <BottomTabs />
      <SearchPalette />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="topografia" element={<TopoHome />} />
        <Route path="topografia/terkep" element={<TopoMap />} />
        <Route path="topografia/kviz" element={<TopoQuiz />} />
        <Route path="elmelet" element={<TheoryHome />} />
        <Route path="elmelet/tananyag" element={<Tananyag />} />
        <Route path="elmelet/tananyag/:subId" element={<Tananyag />} />
        <Route path="elmelet/fogalomtar" element={<Fogalomtar />} />
        <Route path="elmelet/fogalomtar/:slug" element={<Fogalomtar />} />
        <Route path="elmelet/folyamatok" element={<Folyamatok />} />
        <Route path="elmelet/folyamatok/:id" element={<Folyamatok />} />
        <Route path="elmelet/szamolas" element={<Szamolas />} />
        <Route path="elmelet/szamolas/:calcId" element={<Szamolas />} />
        <Route path="elmelet/kviz" element={<TheoryQuiz />} />
        <Route path="elmelet/abrak" element={<Abrak />} />
        <Route path="ismetles" element={<Ismetles />} />
        <Route path="haladas" element={<Haladas />} />
        <Route path="vizsga" element={<Vizsga />} />
        <Route path="vizsga/feladatsor/:examId" element={<Vizsga />} />
        <Route path="vizsga/:sub" element={<Vizsga />} />
        <Route path="beallitasok" element={<Beallitasok />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
