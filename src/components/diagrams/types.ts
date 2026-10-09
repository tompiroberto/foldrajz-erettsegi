// Contract for every diagram component (src/components/diagrams/<key>.tsx).
//
// - Default export: a React component taking DiagramProps.
// - Pure SVG (viewBox, scales to its container: width="100%"), no external images.
// - Colours ONLY via the CSS variables below (they switch for light/dark and mode):
//     var(--ink) text & outlines · var(--muted) secondary text · var(--line) thin lines
//     var(--paper) / var(--paper-2) backgrounds · var(--accent) / var(--accent-2) highlights
//   plus these fixed physical colours: sea #4A90C2, land #C9B79C, magma #E4572E, sun #F2C14E,
//   ice #DCEBF5, vegetation #5E9C5A, warm #D64545, cold #2563EB.
// - Labels in Hungarian, font-family inherit, ≥ 12 px at 600 px width.
// - Animated diagrams use `step` (0-based, from the process outline) to show that stage and
//   animate the change with framer-motion (respect `reduced`: no motion, jump to the state).
// - Accessible: <svg role="img" aria-label={...}> with a one-sentence Hungarian description of what is shown at this step.

export interface DiagramProps {
  /** Current step of the process (0-based). Static diagrams ignore it. */
  step?: number;
  /** Reduced motion: render the state without animation. */
  reduced?: boolean;
}
