import { Suspense, lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { DiagramProps } from './types';
import { DIAGRAMS } from '@/content/catalog';
import { usePrefersReducedMotion } from '@/lib/appearance';

// Every <key>.tsx in this folder is a diagram; loaded on demand.
const modules = import.meta.glob<{ default: ComponentType<DiagramProps> }>('./*.tsx');
const registry = new Map<string, LazyExoticComponent<ComponentType<DiagramProps>>>();
for (const [path, load] of Object.entries(modules)) {
  const key = path.replace('./', '').replace('.tsx', '');
  if (key !== 'index' && key !== 'FlowDiagram') registry.set(key, lazy(load));
}

export const hasDiagram = (key: string | null | undefined) => !!key && registry.has(key);

/** Renders the diagram for a catalog key (nothing if it is not drawn yet). */
export function Diagram({ id, step = 0, caption = true }: { id: string; step?: number; caption?: boolean }) {
  const reduced = usePrefersReducedMotion();
  const C = registry.get(id);
  if (!C) return null;
  return (
    <figure className="diagram">
      <Suspense fallback={<div className="skeleton" style={{ aspectRatio: '16 / 9' }} />}>
        <C step={step} reduced={reduced} />
      </Suspense>
      {caption && DIAGRAMS[id] && <figcaption>{DIAGRAMS[id]}</figcaption>}
    </figure>
  );
}
