import { useEffect, useRef } from "react";

/**
 * Marks an element `data-paused="true"` while it is outside the viewport so the
 * landing CSS can pause its repeating animations. The attribute is toggled
 * directly on the node, so scrolling never triggers a React render.
 */
export function usePauseOffscreen<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    useEffect(() => {
        const node = ref.current;
        if (!node || typeof IntersectionObserver === "undefined")
            return;
        const observer = new IntersectionObserver(([entry]) => {
            node.dataset.paused = entry.isIntersecting ? "false" : "true";
        }, { rootMargin: "80px" });
        observer.observe(node);
        return () => observer.disconnect();
    }, []);
    return ref;
}
