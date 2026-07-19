import { motion, useReducedMotion } from "motion/react";

const nodes = [
  { id: "profile", x: 8, y: 22, delay: 0, driftX: 10, driftY: -8 },
  { id: "contract", x: 28, y: 13, delay: 0.7, driftX: -7, driftY: 9 },
  { id: "payment", x: 47, y: 31, delay: 1.2, driftX: 8, driftY: 7 },
  { id: "project", x: 68, y: 18, delay: 1.8, driftX: -9, driftY: -6 },
  { id: "review", x: 88, y: 35, delay: 2.4, driftX: 6, driftY: 9 },
  { id: "passport", x: 19, y: 72, delay: 2.9, driftX: 8, driftY: -7 },
  { id: "match", x: 43, y: 82, delay: 3.4, driftX: -7, driftY: -9 },
  { id: "hire", x: 76, y: 70, delay: 4, driftX: 10, driftY: 6 },
] as const;

const connections = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [2, 6], [4, 7], [5, 6], [6, 7], [2, 7],
] as const;

export default function NexusMotionField() {
  const reduced = useReducedMotion();

  return (
    <div className="nexus-motion-field" aria-hidden="true">
      {connections.map(([fromIndex, toIndex], index) => {
        const from = nodes[fromIndex];
        const to = nodes[toIndex];
        const width = Math.hypot(to.x - from.x, to.y - from.y);
        const angle = Math.atan2(to.y - from.y, to.x - from.x) * (180 / Math.PI);

        return (
          <motion.span
            key={`${from.id}-${to.id}`}
            className="nexus-connection"
            style={{ left: `${from.x}%`, top: `${from.y}%`, width: `${width}%`, rotate: angle }}
            initial={false}
            animate={reduced ? undefined : { opacity: [0.08, index % 3 === 0 ? 0.38 : 0.2, 0.08], scaleX: [0.72, 1, 0.72] }}
            transition={{ duration: 5.5 + index * 0.35, delay: index * 0.22, repeat: Infinity, ease: "easeInOut" }}
          />
        );
      })}

      {nodes.map((node, index) => (
        <motion.span
          key={node.id}
          className={`nexus-node ${index === 2 || index === 7 ? "nexus-node-primary" : ""}`}
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
          initial={false}
          animate={reduced ? undefined : {
            x: [0, node.driftX, 0],
            y: [0, node.driftY, 0],
            scale: [1, index === 2 || index === 7 ? 1.28 : 1.12, 1],
          }}
          transition={{ duration: 6.5 + index * 0.4, delay: node.delay, repeat: Infinity, ease: "easeInOut" }}
        >
          <span />
        </motion.span>
      ))}
    </div>
  );
}
