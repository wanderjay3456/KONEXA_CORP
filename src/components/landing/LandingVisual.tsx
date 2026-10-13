import { motion, useReducedMotion } from "motion/react";
import type { LandingCopy } from "./landingCopy";

/** A readable illustrative brief, rather than simulated live project activity. */
export default function LandingVisual({ copy }: { copy: LandingCopy["record"] }) {
    const reduced = useReducedMotion();
    return <motion.aside className="lv3-visual" aria-label={copy.label}
        initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.15 }}>
      <figure className="lv3-editorial-photo"><motion.img src="/og.png" width="1536" height="1024" alt={copy.imageAlt} fetchPriority="high" decoding="async" initial={reduced ? false : { scale: 1.04 }} animate={{ scale: 1 }} transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}/><figcaption>{copy.imageCaption}</figcaption></figure>
      <div className="lv3-brief-content">
      <div className="lv3-brief-head"><span>{copy.illustration}</span><span aria-hidden="true">KONEXA</span></div>
      <h2 className="lv3-brief-title">{copy.title}</h2>
      <p className="lv3-brief-meta">{copy.meta}</p>
      <p className="lv3-brief-description">{copy.brief}</p>
      <details className="lv3-brief-details"><summary>{copy.outputLabel}<span aria-hidden="true">+</span></summary>
        <ul className="lv3-outputs">{copy.outputs.map(output => <li key={output}>{output}</li>)}</ul>
        <div className="lv3-review-note"><h3>{copy.reviewLabel}</h3><p>{copy.review}</p></div>
      </details>
      </div>
    </motion.aside>;
}
