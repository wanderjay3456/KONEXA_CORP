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
      <div className="lv3-asset-preview" role="group" aria-label={copy.outputLabel}>
        {copy.formats.map((format, index) => <figure key={format}>
          <div className={`lv3-sample-art lv3-sample-art-${index}`}><span aria-hidden="true" className="lv3-sample-shape"/><strong>{copy.sampleText}</strong></div>
          <figcaption>{format}</figcaption>
        </figure>)}
      </div>
      <ul className="lv3-outputs">{copy.outputs.map(output => <li key={output}>{output}</li>)}</ul>
      <div className="lv3-review-note"><h3>{copy.reviewLabel}</h3><p>{copy.review}</p></div>
    </motion.aside>;
}
