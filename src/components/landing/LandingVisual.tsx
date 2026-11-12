import type { CSSProperties } from "react";
import { Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { LandingCopy } from "./landingCopy";

/** Hero illustration: one Project Record, the thing a company actually reviews.
 * It is plain markup, labelled as an illustration, so the hero never waits on an image. */
export default function LandingVisual({ copy }: { copy: LandingCopy["record"] }) {
    const reduced = useReducedMotion();
    return <motion.div className="lv3-visual" initial={reduced ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}>
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
