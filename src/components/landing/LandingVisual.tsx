import { motion, useReducedMotion } from "motion/react";
import type { LandingCopy } from "./landingCopy";

/** A readable illustrative brief, rather than simulated live project activity. */
export default function LandingVisual({ copy }: { copy: LandingCopy["record"] }) {
    const reduced = useReducedMotion();
    return <motion.aside className="lv3-visual" aria-label={copy.label}
        initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.15 }}>
      <div className="lv3-brief-head"><span>{copy.illustration}</span><span aria-hidden="true">KONEXA</span></div>
      <h2 className="lv3-brief-title">{copy.title}</h2>
      <p className="lv3-brief-meta">{copy.meta}</p>
      <p className="lv3-brief-description">{copy.brief}</p>
      <h3 className="lv3-output-label">{copy.outputLabel}</h3>
      <ul className="lv3-outputs">{copy.outputs.map(output => <li key={output}>{output}</li>)}</ul>
      <dl className="lv3-brief-details">
        {copy.rows.map(([label, detail]) => <div key={label}><dt>{label}</dt><dd>{detail}</dd></div>)}
      </dl>
      <p className="lv3-brief-review">{copy.review}</p>
    </motion.aside>;
}
