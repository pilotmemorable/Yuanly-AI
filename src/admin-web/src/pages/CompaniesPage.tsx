import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  api,
  type CreateMerchantInput,
  type Merchant,
  type MerchantCategory,
  type UpdateMerchantInput,
} from '../api';
import { Badge, EmptyState, ErrorState, InlineNotice, LoadingState, Modal, useToast } from '../components/ui';
import { categoryLabels } from '../tr';
import {
  formatNumber,
  getErrorMessage,
  merchantActiveTone,
  merchantVerificationTone,
  toOptionalNumber,
  toOptionalText,
} from '../utils';

type MerchantFormState = {
  businessName: string;
  category: MerchantCategory;
  location: string;
  description: string;
  contactPhone: string;
  contactEmail: string;
  commissionRate: string;
  isVerified: boolean;
  isActive: boolean;
};

function createEmptyMerchantForm(): MerchantFormState {
  return {
    businessName: '',
    category: 'TOUR',
    location: '',
    description: '',
    contactPhone: '',
    contactEmail: '',
    commissionRate: '',
    isVerified: true,
    isActive: true,
  };
}

function merchantToForm(merchant: Merchant): MerchantFormState {
  return {
    businessName: merchant.businessName,
    category: (merchant.category as MerchantCategory) || 'TOUR',
    location: merchant.location,
    description: merchant.description || '',
    contactPhone: merchant.contactPhone || '',
    contactEmail: merchant.contactEmail || '',
    commissionRate: merchant.commissionRate?.toString() || '',
    isVerified: merchant.isVerified,
    isActive: merchant.isActive,
  };
}

function buildMerchantPayload(form: MerchantFormState): CreateMerchantInput {
  return {
    businessName: form.businessName.trim(),
    category: form.category,
    location: form.location.trim(),
    description: toOptionalText(form.description),
    contactPhone: toOptionalText(form.contactPhone),
    contactEmail: toOptionalText(form.contactEmail),
    commissionRate: toOptionalNumber(form.commissionRate),
  };
}

export default function CompaniesPage(): JSX.Element {
  const { addToast } = useToast();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queryInput, setQueryInput] = useState('');
  const [filters, setFilters] = useState<{ q: string; verified: '' | 'true' | 'false' }>({ q: '', verified: '' });
  const [reloadKey, setReloadKey] = useState(0);
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<MerchantFormState>(createEmptyMerchantForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.getAdminMerchants({
        q: filters.q || undefined,
        verified: filters.verified === '' ? undefined : filters.verified === 'true',
      });
      setMerchants(response.merchants);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [filters, reloadKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreateModal = () => {
    setEditingMerchant(null);
    setForm(createEmptyMerchantForm());
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (merchant: Merchant) => {
    setEditingMerchant(merchant);
    setForm(merchantToForm(merchant));
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false);
    setEditingMerchant(null);
    setFormError(null);
  };

  const onSave = async () => {
    setFormError(null);

    if (!form.businessName.trim() || !form.location.trim()) {
      setFormError('Firma adı ve konum zorunludur.');
      return;
    }

    setSaving(true);
    try {
      const payload = buildMerchantPayload(form);
      if (editingMerchant) {
        const updatePayload: UpdateMerchantInput = {
          ...payload,
          isVerified: form.isVerified,
          isActive: form.isActive,
        };
        await api.updateAdminMerchant(editingMerchant.id, updatePayload);
        addToast({ title: 'Firma güncellendi.', tone: 'success' });
      } else {
        await api.createAdminMerchant(payload);
        addToast({ title: 'Firma oluşturuldu.', tone: 'success' });
      }
      setIsModalOpen(false);
      setReloadKey((value) => value + 1);
    } catch (saveError) {
      setFormError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const toggleMerchant = async (merchant: Merchant, changes: UpdateMerchantInput, successMessage: string) => {
    setTogglingId(merchant.id);
    try {
      await api.updateAdminMerchant(merchant.id, changes);
      addToast({ title: successMessage, tone: 'success' });
      setReloadKey((value) => value + 1);
    } catch (toggleError) {
      addToast({ title: getErrorMessage(toggleError), tone: 'danger' });
    } finally {
      setTogglingId(null);
    }
  };

  const hasRows = merchants.length > 0;
  const headerDescription = useMemo(
    () => 'Firmaları oluşturun, onay durumlarını yönetin, aktif/pasif akışını kontrol edin ve komisyon oranlarını güncelleyin.',
    [],
  );

  return (
    <div className="page-stack">
      <section className="page-header-row">
        <div>
          <p className="eyebrow">Tedarik ağı</p>
          <h2>Firmalar</h2>
          <p className="muted-text">{headerDescription}</p>
        </div>
        <button className="button button-primary" type="button" onClick={openCreateModal}>
          Yeni firma oluştur
        </button>
      </section>

      <section className="card">
        <div className="filters-grid">
          <label className="field">
            <span>Arama</span>
            <input value={queryInput} onChange={(event) => setQueryInput(event.target.value)} placeholder="Firma adı veya konum" />
          </label>

          <label className="field">
            <span>Doğrulama</span>
            <select value={filters.verified} onChange={(event) => setFilters((current) => ({ ...current, verified: event.target.value as '' | 'true' | 'false', }))}>
              <option value="">Tümü</option>
              <option value="true">Onaylı</option>
              <option value="false">Beklemede</option>
            </select>
          </label>

          <div className="filter-actions">
            <button
              className="button button-secondary"
              type="button"
              onClick={() => setFilters((current) => ({ ...current, q: queryInput.trim() }))}
            >
              Filtreyi uygula
            </button>
          </div>
        </div>
      </section>

      <section className="card">
        {loading ? <LoadingState label="Firmalar yükleniyor…" /> : null}
        {!loading && error ? <ErrorState message={error} onRetry={load} /> : null}
        {!loading && !error && !hasRows ? (
          <EmptyState title="Firma bulunamadı" description="Seçili filtrelere uygun firma kaydı yok." />
        ) : null}

        {!loading && !error && hasRows ? (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Firma</th>
                  <th>Temsilci</th>
                  <th>Deneyim</th>
                  <th>Komisyon</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {merchants.map((merchant) => (
                  <tr key={merchant.id}>
                    <td>
                      <div className="table-primary">{merchant.businessName}</div>
                      <div className="table-secondary">{categoryLabels[merchant.category as MerchantCategory] ?? merchant.category} · {merchant.location}</div>
                    </td>
                    <td>
                      <div className="table-primary">{merchant.representative?.fullName || 'Atanmamış'}</div>
                      <div className="table-secondary">{merchant.representative?.email || '—'}</div>
                    </td>
                    <td>{formatNumber(merchant._count?.experiences ?? 0)}</td>
                    <td>{merchant.commissionRate !== null && merchant.commissionRate !== undefined ? `%${merchant.commissionRate}` : '—'}</td>
                    <td>
                      <div className="stack-inline-wrap">
                        <Badge label={merchant.isVerified ? 'Onaylı' : 'Beklemede'} tone={merchantVerificationTone(merchant.isVerified)} />
                        <Badge label={merchant.isActive ? 'Aktif' : 'Pasif'} tone={merchantActiveTone(merchant.isActive)} />
                      </div>
                    </td>
                    <td>
                      <div className="inline-actions wrap-actions">
                        <button className="button button-secondary button-small" type="button" onClick={() => openEditModal(merchant)}>
                          Düzenle
                        </button>
                        {!merchant.isVerified ? (
                          <button
                            className="button button-secondary button-small"
                            type="button"
                            disabled={togglingId === merchant.id}
                            onClick={() => toggleMerchant(merchant, { isVerified: true }, 'Firma onaylandı.')}
                          >
                            Onayla
                          </button>
                        ) : null}
                        <button
                          className="button button-secondary button-small"
                          type="button"
                          disabled={togglingId === merchant.id}
                          onClick={() =>
                            toggleMerchant(
                              merchant,
                              { isActive: !merchant.isActive },
                              merchant.isActive ? 'Firma pasif yapıldı.' : 'Firma tekrar aktif edildi.',
                            )
                          }
                        >
                          {merchant.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <Modal
        open={isModalOpen}
        title={editingMerchant ? 'Firma düzenle' : 'Yeni firma oluştur'}
        onClose={closeModal}
        size="lg"
        footer={
          <>
            <button className="button button-secondary" type="button" onClick={closeModal} disabled={saving}>
              Vazgeç
            </button>
            <button className="button button-primary" type="button" onClick={onSave} disabled={saving}>
              {saving ? 'Kaydediliyor…' : editingMerchant ? 'Değişiklikleri kaydet' : 'Firmayı oluştur'}
            </button>
          </>
        }
      >
        <div className="stack-md">
          <InlineNotice
            title="Not"
            description="Yeni oluşturulan firmalar varsayılan olarak onaylı ve aktif başlatılır. Dilerseniz daha sonra durumu güncelleyebilirsiniz."
            tone="info"
          />
          {formError ? <InlineNotice title={formError} tone="danger" /> : null}

          <div className="form-grid two-columns">
            <label className="field">
              <span>Firma adı</span>
              <input value={form.businessName} onChange={(event) => setForm((current) => ({ ...current, businessName: event.target.value }))} required />
            </label>

            <label className="field">
              <span>Kategori</span>
              <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as MerchantCategory }))}>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Konum</span>
              <input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} required />
            </label>

            <label className="field">
              <span>Komisyon oranı (%)</span>
              <input value={form.commissionRate} onChange={(event) => setForm((current) => ({ ...current, commissionRate: event.target.value }))} placeholder="Örn. 12" />
            </label>

            <label className="field field-span-2">
              <span>Açıklama</span>
              <textarea rows={4} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
            </label>

            <label className="field">
              <span>İletişim telefonu</span>
              <input value={form.contactPhone} onChange={(event) => setForm((current) => ({ ...current, contactPhone: event.target.value }))} />
            </label>

            <label className="field">
              <span>İletişim e-postası</span>
              <input type="email" value={form.contactEmail} onChange={(event) => setForm((current) => ({ ...current, contactEmail: event.target.value }))} />
            </label>
          </div>

          {editingMerchant ? (
            <div className="toggle-grid">
              <label className="toggle-row">
                <input type="checkbox" checked={form.isVerified} onChange={(event) => setForm((current) => ({ ...current, isVerified: event.target.checked }))} />
                <span>Onaylı</span>
              </label>
              <label className="toggle-row">
                <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />
                <span>Aktif</span>
              </label>
            </div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
