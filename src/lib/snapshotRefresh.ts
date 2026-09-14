// Coalesce bursts and serialize loads so an older response cannot overwrite a newer one.
export function createSnapshotRefresh<T>(load: () => Promise<T>, next: (value: T) => void, error?: (cause: unknown) => void) {
  let active = true;
  let pending = false;
  let running = false;
  const refresh = async () => {
    if (!active) return;
    pending = true;
    if (running) return;
    running = true;
    try {
      while (active && pending) {
        pending = false;
        try { const result = await load(); if (active) next(result); }
        catch (cause) { if (active) error?.(cause); }
      }
    } finally { running = false; }
  };
  return { refresh, stop: () => { active = false; pending = false; } };
}
