import { useCallback, useEffect, useState } from 'react';

import { api, type AdminStats } from '../api';
import { Badge, EmptyState, ErrorState, LoadingState, StatCard } from '../components/ui';
import { bookingStatusLabels } from '../tr';
import { bookingStatusTone, displayCustomerName, displayExperienceTitle, formatCny, formatIstanbulDateTime, formatNumber, getErrorMessage } from '../utils';

export default function DashboardPage(): JSX.Element {
  const [data, setData] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.getAdminStats();
      setData(response);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <LoadingState label="Panel verileri yükleniyor…" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  if (!data) {
    return <EmptyState title="Veri bulunamadı" description="Yönetim istatistikleri henüz hazır değil." />;
  }

  const statusEntries = Object.entries(data.bookingsByStatus);
  const maxCount = Math.max(1, ...statusEntries.map(([, count]) => count));

  return (
    <div className="page-stack">
      <section className="page-header-row">
        <div>
          <p className="eyebrow">Anlık özet</p>
          <h2>Operasyon durumu</h2>
          <p className="muted-text">Kullanıcı, firma, deneyim ve rezervasyon akışının tek ekrandaki görünümü.</p>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard label="Toplam kullanıcı" value={formatNumber(data.totals.users)} />
        <StatCard label="Firma yetkilisi" value={formatNumber(data.totals.merchantUsers)} />
        <StatCard label="Firma" value={formatNumber(data.totals.merchants)} detail={`${formatNumber(data.totals.pendingMerchants)} beklemede`} />
        <StatCard label="Deneyim" value={formatNumber(data.totals.experiences)} />
        <StatCard label="Rezervasyon" value={formatNumber(data.totals.bookings)} detail={`${formatNumber(data.totals.pendingBookings)} bekleyen rezervasyon`} />
      </section>

      <section className="two-column-grid">
        <article className="card">
          <div className="card-header-row">
            <div>
              <h3>Rezervasyon durumları</h3>
              <p className="muted-text">Duruma göre toplam rezervasyon dağılımı.</p>
            </div>
          </div>

          <div className="status-bars">
            {statusEntries.map(([status, count]) => (
              <div key={status} className="status-bar-row">
                <div className="status-bar-head">
                  <Badge
                    label={bookingStatusLabels[status as keyof typeof bookingStatusLabels] ?? status}
                    tone={bookingStatusTone(status)}
                  />
                  <strong>{formatNumber(count)}</strong>
                </div>
                <div className="status-bar-track">
                  <div className="status-bar-fill" style={{ width: `${(count / maxCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <div className="card-header-row">
            <div>
              <h3>Kısa notlar</h3>
              <p className="muted-text">Yönetim tarafında öncelik verilmesi gereken alanlar.</p>
            </div>
          </div>
          <div className="info-list">
            <div className="info-list-item">
              <span>Bekleyen rezervasyon</span>
              <strong>{formatNumber(data.totals.pendingBookings)}</strong>
            </div>
            <div className="info-list-item">
              <span>Bekleyen firma</span>
              <strong>{formatNumber(data.totals.pendingMerchants)}</strong>
            </div>
            <div className="info-list-item">
              <span>Toplam aktif envanter</span>
              <strong>{formatNumber(data.totals.experiences)}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="card">
        <div className="card-header-row">
          <div>
            <h3>Son rezervasyonlar</h3>
            <p className="muted-text">Yakın zamanda oluşturulan veya güncellenen rezervasyonlar.</p>
          </div>
        </div>

        {data.recentBookings.length === 0 ? (
          <EmptyState title="Rezervasyon yok" description="Son rezervasyonlar burada görünecek." />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Deneyim</th>
                  <th>Müşteri</th>
                  <th>Tutar</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {data.recentBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>{formatIstanbulDateTime(booking.slotTime)}</td>
                    <td>
                      <div className="table-primary">{displayExperienceTitle(booking.experience)}</div>
                      <div className="table-secondary">{booking.experience.merchant?.businessName || '—'}</div>
                    </td>
                    <td>
                      <div className="table-primary">{displayCustomerName(booking)}</div>
                      <div className="table-secondary">{booking.user?.email || booking.guestPhone || '—'}</div>
                    </td>
                    <td>{formatCny(booking.totalAmount)}</td>
                    <td>
                      <Badge
                        label={bookingStatusLabels[booking.status] ?? booking.status}
                        tone={bookingStatusTone(booking.status)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
