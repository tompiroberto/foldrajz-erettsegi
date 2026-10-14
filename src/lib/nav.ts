import type { Mode } from '@/store/settings';

export interface NavItem {
  to: string;
  label: string;
}

export const MODE_HOME: Record<Mode, string> = { topo: '/topografia', theory: '/elmelet' };
export const MODE_LABEL: Record<Mode, string> = { topo: 'Topográfia', theory: 'Elmélet' };

export const SUBNAV: Record<Mode, NavItem[]> = {
  topo: [
    { to: '/topografia/terkep', label: 'Térkép' },
    { to: '/topografia/kviz', label: 'Kvíz' },
    { to: '/topografia/erettsegi', label: 'Érettségi' },
  ],
  theory: [
    { to: '/elmelet/tananyag', label: 'Tananyag' },
    { to: '/elmelet/fogalomtar', label: 'Fogalomtár' },
    { to: '/elmelet/folyamatok', label: 'Folyamatok' },
    { to: '/elmelet/szamolas', label: 'Számolás' },
    { to: '/elmelet/kviz', label: 'Kvíz' },
    { to: '/elmelet/erettsegi', label: 'Érettségi' },
  ],
};
