import { useCallback, useEffect, useState } from 'react';

import { api, type AuditLog } from '../api';
import { EmptyState, ErrorState, LoadingState } from '../components/ui';
import { formatIstanbulDateTime, getErrorMessage, summarizeUnknown } from '../utils';

export default function AuditLogsPage(): JSX.Element {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.getAdminAuditLogs(page);
      setLogs(response.logs);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="page-stack">
      <section className="page-header-row">
        <div>
          <p className="eyebrow">İzlenebilirlik</p>
          <h2>Denetim kayıtları</h2>
          <p className="muted-text">Yönetici işlemleri ve önemli sistem olayları burada listelenir.</p>
        </div>
      </section>

      <section className="card">
        <div className="card-header-row">
          <div>
            <h3>Kayıt listesi</h3>
            <p className="muted-text">Sayfa {page}</p>
          </div>
          <div className="inline-actions">
            <button className="button button-secondary button-small" type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>
              Önceki sayfa
            </button>
            <button className="button button-secondary button-small" type="button" disabled={loading || logs.length === 0} onClick={() => setPage((value) => value + 1)}>
              Sonraki sayfa
            </button>
          </div>
        </div>

        {loading ? <LoadingState label="Kayıtlar yükleniyor…" /> : null}
        {!loading && error ? <ErrorState message={error} onRetry={load} /> : null}
        {!loading && !error && logs.length === 0 ? (
          <EmptyState title="Kayıt bulunamadı" description="Seçili sayfada denetim kaydı yok." />
        ) : null}

        {!loading && !error && logs.length > 0 ? (
          <div className="audit-list">
            {logs.map((log) => (
              <article key={log.id} className="audit-item">
                <div className="audit-item-head">
                  <div>
                    <strong>{log.action}</strong>
                    <span>{log.entityType} · {log.entityId}</span>
                  </div>
                  <time>{formatIstanbulDateTime(log.createdAt)}</time>
                </div>
                <div className="audit-item-meta">
                  <span>Yapan: {log.actorLabel}</span>
                </div>
                <p className="audit-item-details">{log.details}</p>
                <details>
                  <summary>Ham kayıt</summary>
                  <pre>{summarizeUnknown(log.raw)}</pre>
                </details>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
