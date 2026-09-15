import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';

export type SavedAssessment = { id: string; assessment_type: string; entity_id: string; result: any; model: string; created_at: string };
export function useAssessmentHistory(type: string, entityId: string) {
  const { currentUser } = useApp();
  const [rows, setRows] = useState<SavedAssessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  const epoch = useRef(0);
  useEffect(() => {
    const run = ++epoch.current;
    setRows([]); setError(false); setLoading(false);
    if (!currentUser?.uid || !entityId) return;
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(() => controller.abort(), 15_000);
    void fetch(`/api/ai/assessments?type=${encodeURIComponent(type)}&entityId=${encodeURIComponent(entityId)}`, { signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error('HISTORY_UNAVAILABLE'); return response.json(); })
      .then(body => { if (epoch.current === run) setRows(Array.isArray(body.data) ? body.data : []); })
      .catch(() => { if (epoch.current === run) setError(true); })
      .finally(() => { clearTimeout(timer); if (epoch.current === run) setLoading(false); });
    return () => { epoch.current += 1; controller.abort(); };
  }, [currentUser?.uid, type, entityId, revision]);
  return { rows, loading, error, reload: () => setRevision(value => value + 1) };
}
