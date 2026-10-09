import type { CSSProperties } from "react";
import { Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { LandingCopy } from "./landingCopy";
import { usePauseOffscreen } from "./usePauseOffscreen";

/** Static x-scale for each meridian; the CSS animation rotates them past each other. */
const MERIDIAN_SCALES = [1, 0.8, 0.58, 0.36, 0.18, 0.04] as const;
const LATITUDES = [-150, -75, 0, 75, 150] as const;
const GLOBE = { cx: 300, cy: 300, r: 250 } as const;

/** Three arcs between four remote "desks". Pure decoration, so no data implied. */
const ARCS = [
    { d: "M148 262 C190 110 360 100 424 176", end: [424, 176] },
    { d: "M424 176 C520 250 520 340 468 392", end: [468, 392] },
    { d: "M212 436 C280 520 420 490 468 392", end: [468, 392] },
] as const;

/** Deep-forest hero art: an SVG wireframe globe and a floating Project Record card.
 * It is intentionally vector-only so the hero never waits on an image to paint. */
export default function LandingVisual({ copy }: { copy: LandingCopy["record"] }) {
    const reduced = useReducedMotion();
    const ref = usePauseOffscreen<HTMLDivElement>();
    return <motion.div ref={ref} className="lv3-visual" initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}>
      <svg className="lv3-globe" viewBox="0 0 600 600" role="img" aria-label={copy.globeLabel} focusable="false">
        <defs>
          <radialGradient id="lv3-globe-fill" cx="38%" cy="32%" r="75%">
            <stop offset="0" stopColor="#B9F4D0" stopOpacity=".16"/>
            <stop offset="1" stopColor="#B9F4D0" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <circle cx={GLOBE.cx} cy={GLOBE.cy} r={GLOBE.r} fill="url(#lv3-globe-fill)"/>
        <g className="lv3-grid" fill="none">
          {LATITUDES.map((dy) => {
            const rx = Math.sqrt(GLOBE.r ** 2 - dy ** 2);
            return <ellipse key={dy} cx={GLOBE.cx} cy={GLOBE.cy + dy} rx={rx} ry={rx * 0.16}/>;
          })}
          {MERIDIAN_SCALES.map((scale, index) => <ellipse key={scale} className="lv3-meridian" style={{ "--i": index, "--s": scale } as CSSProperties} cx={GLOBE.cx} cy={GLOBE.cy} rx={GLOBE.r} ry={GLOBE.r} vectorEffect="non-scaling-stroke"/>)}
        </g>
        <circle className="lv3-globe-edge" cx={GLOBE.cx} cy={GLOBE.cy} r={GLOBE.r} fill="none"/>
        <g fill="none" strokeLinecap="round">
          {ARCS.map((arc, index) => <path key={arc.d} className="lv3-arc" style={{ "--i": index } as CSSProperties} d={arc.d} pathLength={1}/>)}
        </g>
        <g>
          {[[148, 262], [424, 176], [468, 392], [212, 436]].map(([x, y], index) => <g key={`${x}-${y}`}>
            <circle className="lv3-pulse" style={{ "--i": index } as CSSProperties} cx={x} cy={y} r="6"/>
            <circle className="lv3-node" cx={x} cy={y} r="5"/>
          </g>)}
        </g>
      </svg>

      <div className="lv3-card">
        <div className="lv3-card-head">
          <span className="lv3-card-label">{copy.label}</span>
          <span className="lv3-chip lv3-chip-illustration">{copy.illustration}</span>
        </div>
        <p className="lv3-card-title">{copy.title}</p>
        <p className="lv3-card-meta">{copy.meta}</p>
        <div className="lv3-progress" role="presentation" aria-label={copy.progress}><span/></div>
        <ul className="lv3-rows">
          {copy.rows.map(([label, state], index) => <li key={label} style={{ "--r": index } as CSSProperties}>
            <span className="lv3-tick" aria-hidden="true"><Check strokeWidth={3}/></span>
            <span className="lv3-row-label">{label}</span>
            <span className="lv3-row-state">{state}</span>
          </li>)}
        </ul>
        <div className="lv3-escrow">
          <span>{copy.escrowLabel}</span>
          <span className="lv3-chip lv3-chip-amber">{copy.escrowState}</span>
        </div>
      </div>
    </motion.div>;
}
