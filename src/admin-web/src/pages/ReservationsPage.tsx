import { useCallback, useEffect, useMemo, useState } from 'react';

import { api, type Booking, type BookingStatus, type Merchant } from '../api';
import { Badge, EmptyState, ErrorState, InlineNotice, LoadingState, Modal, PaginationControls, useToast } from '../components/ui';
import { bookingStatusLabels, sourceLabels } from '../tr';
import { bookingStatusTone, displayCustomerName, displayExperienceTitle, formatCny, formatIstanbulDateTime, formatNumber, getErrorMessage } from '../utils';

const bookingStatuses = Object.keys(bookingStatusLabels) as BookingStatus[];

type StatusModalState = {
  booking: Booking;
  status: BookingStatus;
  reason: string;
};

export default function ReservationsPage(): JSX.Element {
  const { addToast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<{ q: string; status: '' | BookingStatus; merchantId: string; page: number }>({
    q: '',
    status: '',
    merchantId: '',
    page: 1,
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [reloadKey, setReloadKey] = useState(0);
  const [statusModal, setStatusModal] = useState<StatusModalState | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [bookingResponse, merchantResponse] = await Promise.all([
        api.getAdminBookings({
          status: filters.status || undefined,
          merchantId: filters.merchantId || undefined,
          q: filters.q || undefined,
          page: filters.page,
          limit: 10,
        }),
        api.getAdminMerchants(),
      ]);
      setBookings(bookingResponse.bookings);
      setPagination(bookingResponse.pagination);
      setMerchants(merchantResponse.merchants);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [filters, reloadKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const merchantOptions = useMemo(() => merchants.map((merchant) => ({ id: merchant.id, label: merchant.businessName })), [merchants]);

  const openStatusModal = (booking: Booking) => {
    setStatusModal({
      booking,
      status: booking.status,
      reason: booking.cancelReason || '',
    });
    setStatusError(null);
  };

  const closeStatusModal = () => {
    if (savingStatus) return;
    setStatusModal(null);
    setStatusError(null);
  };

  const saveStatus = async () => {
    if (!statusModal) return;

    if (statusModal.status === statusModal.booking.status) {
      setStatusError('Lütfen mevcut durumdan farklı bir durum seçin.');
      return;
    }

    if ((statusModal.status === 'REJECTED' || statusModal.status === 'CANCELLED') && !statusModal.reason.trim()) {
      setStatusError('Reddetme veya iptal işlemleri için sebep girin.');
      return;
    }

    setSavingStatus(true);
    setStatusError(null);
    try {
      await api.updateAdminBookingStatus(statusModal.booking.id, {
        status: statusModal.status,
        reason: statusModal.reason.trim() || undefined,
      });
      addToast({ title: 'Rezervasyon durumu güncellendi.', tone: 'success' });
      closeStatusModal();
      setReloadKey((value) => value + 1);
    } catch (saveError) {
      setStatusError(getErrorMessage(saveError));
    } finally {
      setSavingStatus(false);
    }
  };

  return (
    <div className="page-stack">
      <section className="page-header-row">
        <div>
          <p className="eyebrow">Rezervasyon operasyonları</p>
          <h2>Rezervasyonlar</h2>
          <p className="muted-text">Rezervasyon akışını firma, durum ve müşteri bazında izleyin; gerektiğinde durumu güncelleyin.</p>
        </div>
      </section>

      <section className="card">
        <div className="filters-grid four-columns">
          <label className="field">
            <span>Arama</span>
            <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Müşteri, e-posta veya deneyim" />
          </label>

          <label className="field">
            <span>Durum</span>
            <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as '' | BookingStatus, page: 1 }))}>
              <option value="">Tümü</option>
              {bookingStatuses.map((status) => (
                <option key={status} value={status}>
                  {bookingStatusLabels[status]}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Firma</span>
            <select value={filters.merchantId} onChange={(event) => setFilters((current) => ({ ...current, merchantId: event.target.value, page: 1 }))}>
              <option value="">Tüm firmalar</option>
              {merchantOptions.map((merchant) => (
                <option key={merchant.id} value={merchant.id}>
                  {merchant.label}
                </option>
              ))}
            </select>
          </label>

          <div className="filter-actions">
            <button
              className="button button-secondary"
              type="button"
              onClick={() => setFilters((current) => ({ ...current, q: searchInput.trim(), page: 1 }))}
            >
              Filtreyi uygula
            </button>
          </div>
        </div>
      </section>

      <section className="card">
        {loading ? <LoadingState label="Rezervasyonlar yükleniyor…" /> : null}
        {!loading && error ? <ErrorState message={error} onRetry={load} /> : null}
        {!loading && !error && bookings.length === 0 ? (
          <EmptyState title="Rezervasyon bulunamadı" description="Seçili filtrelere uygun rezervasyon kaydı yok." />
        ) : null}

        {!loading && !error && bookings.length > 0 ? (
          <>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tarih / saat</th>
                    <th>Deneyim</th>
                    <th>Firma</th>
                    <th>Müşteri</th>
                    <th>Kişi</th>
                    <th>Tutar</th>
                    <th>Kaynak</th>
                    <th>Durum</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => {
                    const companyName = booking.merchant?.businessName || booking.experience.merchant?.businessName || '—';
                    const phone = booking.guestPhone || booking.user?.phone || '—';
                    return (
                      <tr key={booking.id}>
                        <td>{formatIstanbulDateTime(booking.slotTime)}</td>
                        <td>
                          <div className="table-primary">{displayExperienceTitle(booking.experience)}</div>
                          <div className="table-secondary">Oluşturulma: {formatIstanbulDateTime(booking.createdAt)}</div>
                        </td>
                        <td>{companyName}</td>
                        <td>
                          <div className="table-primary">{displayCustomerName(booking)}</div>
                          <div className="table-secondary">{booking.user?.email || '—'} · {phone}</div>
                        </td>
                        <td>{formatNumber(booking.guestCount)}</td>
                        <td>{formatCny(booking.totalAmount)}</td>
                        <td>{sourceLabels[booking.source as keyof typeof sourceLabels] ?? booking.source}</td>
                        <td>
                          <Badge label={bookingStatusLabels[booking.status] ?? booking.status} tone={bookingStatusTone(booking.status)} />
                        </td>
                        <td>
                          <button className="button button-secondary button-small" type="button" onClick={() => openStatusModal(booking)}>
                            Durum değiştir
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <PaginationControls pagination={pagination} onPageChange={(page) => setFilters((current) => ({ ...current, page }))} />
          </>
        ) : null}
      </section>

      <Modal
        open={Boolean(statusModal)}
        title={statusModal ? `Durumu güncelle · ${displayExperienceTitle(statusModal.booking.experience)}` : 'Durumu güncelle'}
        onClose={closeStatusModal}
        size="sm"
        footer={
          <>
            <button className="button button-secondary" type="button" onClick={closeStatusModal} disabled={savingStatus}>
              Vazgeç
            </button>
            <button className="button button-primary" type="button" onClick={saveStatus} disabled={savingStatus}>
              {savingStatus ? 'Kaydediliyor…' : 'Güncelle'}
            </button>
          </>
        }
      >
        <div className="stack-md">
          {statusError ? <InlineNotice title={statusError} tone="danger" /> : null}

          <label className="field">
            <span>Yeni durum</span>
            <select
              value={statusModal?.status || ''}
              onChange={(event) =>
                setStatusModal((current) =>
                  current
                    ? { ...current, status: event.target.value as BookingStatus }
                    : current,
                )
              }
            >
              {bookingStatuses.map((status) => (
                <option key={status} value={status}>
                  {bookingStatusLabels[status]}
                </option>
              ))}
            </select>
          </label>

          {(statusModal?.status === 'REJECTED' || statusModal?.status === 'CANCELLED') ? (
            <label className="field">
              <span>Sebep</span>
              <textarea rows={4} value={statusModal.reason} onChange={(event) => setStatusModal((current) => (current ? { ...current, reason: event.target.value } : current))} placeholder="Kısa açıklama girin" />
            </label>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
