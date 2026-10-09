import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LayoutGroup, motion } from 'framer-motion';
import { Compass, Layers, Moon, RotateCcw, Search, Settings, Sun, SunMoon } from 'lucide-react';
import { MODE_HOME, MODE_LABEL, SUBNAV } from '@/lib/nav';
import { useMode, usePrefersReducedMotion } from '@/lib/appearance';
import { useSettings, type Mode, type ThemePref } from '@/store/settings';
import { useDueCount, useOverallProgress } from '@/store/selectors';
import { ProgressRing } from './ProgressRing';
import { useSearch } from './SearchPalette';

const ICON: Record<Mode, typeof Compass> = { topo: Compass, theory: Layers };
const NEXT_THEME: Record<ThemePref, ThemePref> = { system: 'light', light: 'dark', dark: 'system' };
const THEME_LABEL: Record<ThemePref, string> = {
  system: 'Téma: rendszer szerint',
  light: 'Téma: világos',
  dark: 'Téma: sötét',
};

function ModeHalf({ mode, active }: { mode: Mode; active: boolean }) {
  const navigate = useNavigate();
  const lastPath = useSettings((s) => s.lastPath[mode]);
  const reduced = usePrefersReducedMotion();
  const Icon = ICON[mode];
  const [peek, setPeek] = useState(false);
  // Inactive half: slim; on hover/focus it stretches out to invite a switch.
  const grow = active ? 7 : peek ? 3.4 : 1.4;
  return (
    <motion.div
      initial={false}
      animate={{ flexGrow: grow }}
      transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 26, mass: 0.8 }}
      className={`mode-half mode-${mode} ${active ? 'is-active' : 'is-inactive'}${peek && !active ? ' is-peek' : ''}`}
      onHoverStart={() => setPeek(true)}
      onHoverEnd={() => setPeek(false)}
      onFocus={() => setPeek(true)}
      onBlur={() => setPeek(false)}
    >
      <button
        type="button"
        className="mode-label"
        aria-current={active ? 'true' : undefined}
        onClick={() => navigate(active ? MODE_HOME[mode] : lastPath || MODE_HOME[mode])}
      >
        <Icon size={18} aria-hidden />
        <span>{MODE_LABEL[mode].toUpperCase()}</span>
        {!active && peek && (
          <motion.span className='mode-peek-hint' initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}>
            {SUBNAV[mode].map((i) => i.label).join(' · ')} →
          </motion.span>
        )}
      </button>
      {active && (
        <motion.nav
          className="pill-tabs mode-subnav"
          aria-label={`${MODE_LABEL[mode]} menü`}
          initial={reduced ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          {SUBNAV[mode].map((it) => (
            <NavLink key={it.to} to={it.to} className={({ isActive }) => `pill${isActive ? ' active' : ''}`}>
              {it.label}
            </NavLink>
          ))}
        </motion.nav>
      )}
    </motion.div>
  );
}

export function Header() {
  const mode = useMode();
  const navigate = useNavigate();
  const theme = useSettings((s) => s.theme);
  const setSettings = useSettings((s) => s.set);
  const due = useDueCount();
  const overall = useOverallProgress();
  const openSearch = useSearch((s) => s.open);
  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : SunMoon;

  return (
    <header className="site-header">
      <a href="#main" className="skip-link">
        Ugrás a tartalomra
      </a>
      <Link to="/" className="brand" aria-label="Kezdőlap">
        <span className="brand-mark" aria-hidden>
          <Compass size={20} />
        </span>
      </Link>

      {/* Desktop: the two halves with a diagonal fold seam. */}
      <LayoutGroup>
        <div className="mode-split" data-active={mode}>
          <ModeHalf mode="topo" active={mode === 'topo'} />
          <ModeHalf mode="theory" active={mode === 'theory'} />
        </div>
      </LayoutGroup>

      {/* Mobile: a two-segment toggle. */}
      <div className="mode-toggle" role="group" aria-label="Mód">
        {(['topo', 'theory'] as Mode[]).map((m) => {
          const Icon = ICON[m];
          return (
            <button
              key={m}
              type="button"
              className={m === mode ? 'active' : ''}
              aria-pressed={m === mode}
              onClick={() => navigate(m === mode ? MODE_HOME[m] : useSettings.getState().lastPath[m] || MODE_HOME[m])}
            >
              <Icon size={16} aria-hidden /> {MODE_LABEL[m]}
            </button>
          );
        })}
      </div>

      <div className="header-tools">
        <button type="button" className="search-trigger" onClick={openSearch} aria-label="Keresés (/)">
          <Search size={18} aria-hidden />
          <span className="search-text">Keresés</span>
          <kbd>/</kbd>
        </button>
        <Link to="/ismetles" className="icon-btn" aria-label={`Mai ismétlés: ${due} elem`} title="Mai ismétlés">
          <RotateCcw size={19} aria-hidden />
          {due > 0 && <span className="badge-count">{due > 99 ? '99+' : due}</span>}
        </Link>
        <Link to="/haladas" className="icon-btn ring-link" title="Haladás" aria-label="Haladás">
          <ProgressRing value={overall} size={30} stroke={3.5} label="Összes haladás" />
        </Link>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setSettings({ theme: NEXT_THEME[theme] })}
          aria-label={THEME_LABEL[theme]}
          title={THEME_LABEL[theme]}
        >
          <ThemeIcon size={19} aria-hidden />
        </button>
        <Link to="/beallitasok" className="icon-btn" aria-label="Beállítások" title="Beállítások">
          <Settings size={19} aria-hidden />
        </Link>
      </div>
    </header>
  );
}

/** Mobile bottom tab bar with the current mode's sub-navigation. */
export function BottomTabs() {
  const mode = useMode();
  return (
    <nav className="bottom-tabs" aria-label={`${MODE_LABEL[mode]} menü`}>
      {SUBNAV[mode].map((it) => (
        <NavLink key={it.to} to={it.to} className={({ isActive }) => (isActive ? 'active' : '')}>
          {it.label}
        </NavLink>
      ))}
    </nav>
  );
}
