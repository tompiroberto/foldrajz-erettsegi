import { Fragment } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, ArrowDown, ArrowRight, ArrowUp, Baby, Banknote, Building, BuildingComplex, Circle, Cloud, CloudRain, Coins, Droplet, Droplets,
  Factory, Fish, Flame, Fuel, Gem, Globe, HeartPulse, House, Landmark, Layers, Leaf, Mountain, MountainSnow, Pickaxe, Plane, Recycle, Shield,
  Ship, Skull, Snowflake, Sprout, Sun, Thermometer, Tractor, Trash, Trees, TriangleAlert, Truck, Users, WavesHorizontal, Wheat, Wind, Zap,
  type LucideIcon,
} from 'lucide-react';

export interface FlowStep {
  title: string;
  icon?: string;
}

export interface FlowDiagramProps {
  steps: FlowStep[];
  step: number;
  reduced?: boolean;
}

// Explicit map of the FLOW_ICONS ids (src/content/catalog.ts) – keeps the bundle small.
// Renamed lucide icons: waves → WavesHorizontal, building-2 → BuildingComplex, home → House,
// alert-triangle → TriangleAlert, trash-2 → Trash.
const ICONS: Record<string, LucideIcon> = {
  sun: Sun, cloud: Cloud, 'cloud-rain': CloudRain, droplet: Droplet, droplets: Droplets, waves: WavesHorizontal, wind: Wind,
  snowflake: Snowflake, thermometer: Thermometer, flame: Flame, mountain: Mountain, 'mountain-snow': MountainSnow, layers: Layers,
  gem: Gem, pickaxe: Pickaxe, factory: Factory, fuel: Fuel, zap: Zap, leaf: Leaf, trees: Trees, sprout: Sprout, tractor: Tractor,
  wheat: Wheat, fish: Fish, users: Users, baby: Baby, building: Building, 'building-2': BuildingComplex, home: House, truck: Truck,
  ship: Ship, plane: Plane, coins: Coins, banknote: Banknote, landmark: Landmark, globe: Globe, 'arrow-down': ArrowDown,
  'arrow-up': ArrowUp, 'arrow-right': ArrowRight, shield: Shield, 'alert-triangle': TriangleAlert, activity: Activity,
  recycle: Recycle, 'trash-2': Trash, skull: Skull, 'heart-pulse': HeartPulse,
};

/** Kebab-case lucide id → icon; unknown ids fall back to a plain circle. */
function iconFor(name: string | undefined): LucideIcon | null {
  if (!name) return null;
  return ICONS[name.trim().toLowerCase()] ?? Circle;
}

/** Generic process chain: numbered round nodes, the current one highlighted. */
export function FlowDiagram({ steps, step, reduced = false }: FlowDiagramProps) {
  const t = reduced ? { duration: 0 } : { duration: 0.8, ease: 'easeInOut' as const };
  const current = Math.max(0, Math.min(step, steps.length - 1));
  return (
    <div
      role="img"
      aria-label={`Folyamatábra ${steps.length} lépésben; most a ${current + 1}. lépés: ${steps[current]?.title ?? ''}.`}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: '12px 4px',
        padding: '8px 0',
      }}
    >
      {steps.map((s, i) => {
        const active = i === current;
        const done = i < current;
        const Icon = iconFor(s.icon);
        const size = active ? 64 : 48;
        return (
          <Fragment key={i}>
            {i > 0 && (
              <div aria-hidden style={{ display: 'flex', alignItems: 'center', height: 64, width: 28, justifyContent: 'center' }}>
                <motion.svg
                  width="24"
                  height="16"
                  viewBox="0 0 24 16"
                  animate={
                    i === current && !reduced
                      ? { x: [-4, 3, -4], opacity: 1 }
                      : { x: 0, opacity: i <= current ? 0.95 : 0.4 }
                  }
                  transition={i === current && !reduced ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : t}
                >
                  <path
                    d="M2 8 H18 M13 3 L19 8 L13 13"
                    fill="none"
                    stroke={i <= current ? 'var(--accent)' : 'var(--line)'}
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </motion.svg>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: 104,
                gap: 6,
                textAlign: 'center',
              }}
            >
              <div style={{ height: 64, display: 'flex', alignItems: 'center' }}>
                <motion.div
                  initial={false}
                  animate={{
                    width: size,
                    height: size,
                    backgroundColor: active ? 'var(--accent)' : done ? 'var(--paper-2)' : 'var(--paper)',
                    borderColor: active || done ? 'var(--accent)' : 'var(--line)',
                    opacity: active || done ? 1 : 0.7,
                  }}
                  transition={t}
                  style={{
                    borderRadius: '50%',
                    borderStyle: 'solid',
                    borderWidth: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    color: active ? 'var(--paper)' : 'var(--ink)',
                    boxShadow: active ? '0 0 0 4px color-mix(in srgb, var(--accent) 25%, transparent)' : 'none',
                  }}
                >
                  {Icon ? <Icon size={active ? 28 : 22} aria-hidden /> : <span style={{ fontWeight: 700, fontSize: active ? 22 : 17 }}>{i + 1}</span>}
                  {Icon && (
                    <span
                      style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        minWidth: 20,
                        height: 20,
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 700,
                        lineHeight: '20px',
                        background: active ? 'var(--ink)' : 'var(--paper-2)',
                        color: active ? 'var(--paper)' : 'var(--ink)',
                        border: '1px solid var(--line)',
                      }}
                    >
                      {i + 1}
                    </span>
                  )}
                </motion.div>
              </div>
              <span
                style={{
                  fontSize: 13,
                  lineHeight: 1.25,
                  fontWeight: active ? 700 : 400,
                  color: active ? 'var(--ink)' : 'var(--muted)',
                }}
              >
                {s.title}
              </span>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}
