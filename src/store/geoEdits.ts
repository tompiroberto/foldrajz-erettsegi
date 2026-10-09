// Térképszerkesztő (brief §8.1, `?edit=1`): local geometry corrections, exported as a GeoJSON
// patch that `scripts/build-geo.ts` reads from scripts/manual-geo/szerkeszto*.geojson.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Feature, Geometry } from 'geojson';

export interface GeoEdit {
  /** 'geometry' replaces the drawing; 'anchor' only moves the label/marker point. */
  kind: 'geometry' | 'anchor';
  geometry: Geometry;
  name: string;
  at: string;
}

interface GeoEditStore {
  edits: Record<string, GeoEdit>;
  save: (id: string, edit: Omit<GeoEdit, 'at'>) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useGeoEdits = create<GeoEditStore>()(
  persist(
    (set) => ({
      edits: {},
      save: (id, edit) => set((s) => ({ edits: { ...s.edits, [id]: { ...edit, at: new Date().toISOString() } } })),
      remove: (id) =>
        set((s) => {
          const edits = { ...s.edits };
          delete edits[id];
          return { edits };
        }),
      clear: () => set({ edits: {} }),
    }),
    { name: 'fe-geo-edits' },
  ),
);

export function editsToGeoJSON(edits: Record<string, GeoEdit>) {
  return {
    type: 'FeatureCollection' as const,
    features: Object.entries(edits).map(
      ([id, e]): Feature => ({
        type: 'Feature',
        properties: { id, name: e.name, confidence: 'medium', note: `Térképszerkesztő, ${e.at.slice(0, 10)}`, ...(e.kind === 'anchor' ? { anchorOnly: true } : {}) },
        geometry: e.geometry,
      }),
    ),
  };
}
