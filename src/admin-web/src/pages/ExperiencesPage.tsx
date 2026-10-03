import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  api,
  type CreateBulkSlotsInput,
  type CreateExperienceInput,
  type Experience,
  type Merchant,
  type UpdateExperienceInput,
} from '../api';
import { Badge, EmptyState, ErrorState, InlineNotice, LoadingState, Modal, useToast } from '../components/ui';
import { displayExperienceTitle, formatCny, getErrorMessage, joinComma, joinLines, splitCommaList, splitLines, toOptionalInteger, toOptionalNumber, toOptionalText } from '../utils';

type ExperienceFormState = {
  merchantId: string;
  title: string;
  titleCn: string;
  titleTr: string;
  description: string;
  descriptionCn: string;
  descriptionTr: string;
  priceCny: string;
  duration: string;
  capacity: string;
  imagesText: string;
  tagsText: string;
  isActive: boolean;
};

type SlotFormState = {
  startDate: string;
  endDate: string;
  timesText: string;
  capacity: string;
  priceCny: string;
};

function createEmptyExperienceForm(merchants: Merchant[]): ExperienceFormState {
  return {
    merchantId: merchants[0]?.id || '',
    title: '',
    titleCn: '',
    titleTr: '',
    description: '',
    descriptionCn: '',
    descriptionTr: '',
    priceCny: '',
    duration: '',
    capacity: '',
    imagesText: '',
    tagsText: '',
    isActive: true,
  };
}

function createEmptySlotForm(): SlotFormState {
  return {
    startDate: '',
    endDate: '',
    timesText: '',
    capacity: '',
    priceCny: '',
  };
}

function experienceToForm(experience: Experience): ExperienceFormState {
  return {
    merchantId: experience.merchantId,
    title: experience.title,
    titleCn: experience.titleCn || '',
    titleTr: experience.titleTr || '',
    description: experience.description,
    descriptionCn: experience.descriptionCn || '',
    descriptionTr: experience.descriptionTr || '',
    priceCny: experience.priceCny.toString(),
    duration: experience.duration || '',
    capacity: experience.capacity?.toString() || '',
    imagesText: joinLines(experience.images),
    tagsText: joinComma(experience.tags),
    isActive: experience.isActive,
  };
}

function buildExperiencePayload(form: ExperienceFormState): CreateExperienceInput {
  return {
    merchantId: form.merchantId,
    title: form.title.trim(),
    titleCn: toOptionalText(form.titleCn),
    titleTr: toOptionalText(form.titleTr),
    description: form.description.trim(),
    descriptionCn: toOptionalText(form.descriptionCn),
    descriptionTr: toOptionalText(form.descriptionTr),
    priceCny: Number(form.priceCny),
    duration: toOptionalText(form.duration),
    capacity: toOptionalInteger(form.capacity),
    images: splitLines(form.imagesText),
    tags: splitCommaList(form.tagsText),
  };
}

export default function ExperiencesPage(): JSX.Element {
  const { addToast } = useToast();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queryInput, setQueryInput] = useState('');
  const [filters, setFilters] = useState<{ q: string; merchantId: string }>({ q: '', merchantId: '' });
  const [reloadKey, setReloadKey] = useState(0);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [isExperienceModalOpen, setIsExperienceModalOpen] = useState(false);
  const [experienceForm, setExperienceForm] = useState<ExperienceFormState>(createEmptyExperienceForm([]));
  const [experienceError, setExperienceError] = useState<string | null>(null);
  const [savingExperience, setSavingExperience] = useState(false);
  const [slotExperience, setSlotExperience] = useState<Experience | null>(null);
  const [slotForm, setSlotForm] = useState<SlotFormState>(createEmptySlotForm());
  const [slotError, setSlotError] = useState<string | null>(null);
  const [savingSlots, setSavingSlots] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [experienceResponse, merchantResponse] = await Promise.all([
        api.getAdminExperiences({
          q: filters.q || undefined,
          merchantId: filters.merchantId || undefined,
        }),
        api.getAdminMerchants(),
      ]);
      setExperiences(experienceResponse.experiences);
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

  const openCreateModal = () => {
    setEditingExperience(null);
    setExperienceForm(createEmptyExperienceForm(merchants));
    setExperienceError(null);
    setIsExperienceModalOpen(true);
  };

  const openEditModal = (experience: Experience) => {
    setEditingExperience(experience);
    setExperienceForm(experienceToForm(experience));
    setExperienceError(null);
    setIsExperienceModalOpen(true);
  };

  const closeExperienceModal = () => {
    if (savingExperience) return;
    setIsExperienceModalOpen(false);
    setEditingExperience(null);
    setExperienceError(null);
  };

  const saveExperience = async () => {
    setExperienceError(null);

    if (!experienceForm.merchantId) {
      setExperienceError('Lütfen bir firma seçin.');
      return;
    }

    if (!experienceForm.title.trim() || !experienceForm.description.trim() || !experienceForm.priceCny.trim()) {
      setExperienceError('Firma, başlık, açıklama ve fiyat zorunludur.');
      return;
    }

    if (Number.isNaN(Number(experienceForm.priceCny))) {
      setExperienceError('Fiyat sayısal olmalıdır.');
      return;
    }

    setSavingExperience(true);
    try {
      const payload = buildExperiencePayload(experienceForm);
      if (editingExperience) {
        const updatePayload: UpdateExperienceInput = {
          ...payload,
          isActive: experienceForm.isActive,
        };
        await api.updateAdminExperience(editingExperience.id, updatePayload);
        addToast({ title: 'Deneyim güncellendi.', tone: 'success' });
      } else {
        const created = await api.createAdminExperience(payload);
        if (!experienceForm.isActive) {
          await api.updateAdminExperience(created.experience.id, { isActive: false });
        }
        addToast({ title: 'Deneyim oluşturuldu.', tone: 'success' });
      }
      setIsExperienceModalOpen(false);
      setReloadKey((value) => value + 1);
    } catch (saveError) {
      setExperienceError(getErrorMessage(saveError));
    } finally {
      setSavingExperience(false);
    }
  };

  const openSlotModal = (experience: Experience) => {
    setSlotExperience(experience);
    setSlotForm(createEmptySlotForm());
    setSlotError(null);
  };

  const closeSlotModal = () => {
    if (savingSlots) return;
    setSlotExperience(null);
    setSlotForm(createEmptySlotForm());
    setSlotError(null);
  };

  const saveSlots = async () => {
    if (!slotExperience) return;
    setSlotError(null);

    const times = slotForm.timesText
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (!slotForm.startDate || !slotForm.endDate || times.length === 0) {
      setSlotError('Başlangıç tarihi, bitiş tarihi ve en az bir saat girin.');
      return;
    }

    const payload: CreateBulkSlotsInput = {
      startDate: slotForm.startDate,
      endDate: slotForm.endDate,
      times,
      capacity: toOptionalInteger(slotForm.capacity),
      priceCny: toOptionalNumber(slotForm.priceCny),
    };

    setSavingSlots(true);
    try {
      const response = await api.createAdminExperienceSlotsBulk(slotExperience.id, payload);
      addToast({ title: `${response.created} müsaitlik kaydı oluşturuldu.`, tone: 'success' });
      closeSlotModal();
      setReloadKey((value) => value + 1);
    } catch (saveError) {
      setSlotError(getErrorMessage(saveError));
    } finally {
      setSavingSlots(false);
    }
  };

  return (
    <div className="page-stack">
      <section className="page-header-row">
        <div>
          <p className="eyebrow">Envanter</p>
          <h2>Deneyimler</h2>
          <p className="muted-text">Firmalara bağlı deneyimleri, içeriklerini ve toplu müsaitliklerini yönetin.</p>
        </div>
        <button className="button button-primary" type="button" onClick={openCreateModal} disabled={merchants.length === 0}>
          Yeni deneyim
        </button>
      </section>

      {merchants.length === 0 ? (
        <InlineNotice title="Önce firma oluşturun" description="Deneyim ekleyebilmek için önce en az bir firma kaydı oluşturmanız gerekir." tone="warning" />
      ) : null}

      <section className="card">
        <div className="filters-grid three-columns">
          <label className="field">
            <span>Arama</span>
            <input value={queryInput} onChange={(event) => setQueryInput(event.target.value)} placeholder="Başlık veya etiket" />
          </label>

          <label className="field">
            <span>Firma</span>
            <select value={filters.merchantId} onChange={(event) => setFilters((current) => ({ ...current, merchantId: event.target.value }))}>
              <option value="">Tüm firmalar</option>
              {merchantOptions.map((merchant) => (
                <option key={merchant.id} value={merchant.id}>
                  {merchant.label}
                </option>
              ))}
            </select>
          </label>

          <div className="filter-actions">
            <button className="button button-secondary" type="button" onClick={() => setFilters((current) => ({ ...current, q: queryInput.trim() }))}>
              Filtreyi uygula
            </button>
          </div>
        </div>
      </section>

      <section className="card">
        {loading ? <LoadingState label="Deneyimler yükleniyor…" /> : null}
        {!loading && error ? <ErrorState message={error} onRetry={load} /> : null}
        {!loading && !error && experiences.length === 0 ? (
          <EmptyState title="Deneyim bulunamadı" description="Filtrelere uyan deneyim kaydı yok." />
        ) : null}

        {!loading && !error && experiences.length > 0 ? (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Deneyim</th>
                  <th>Firma</th>
                  <th>Fiyat</th>
                  <th>Süre / kapasite</th>
                  <th>Etiketler</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {experiences.map((experience) => (
                  <tr key={experience.id}>
                    <td>
                      <div className="table-primary">{displayExperienceTitle(experience)}</div>
                      <div className="table-secondary">{experience.titleCn || 'Çince başlık yok'}</div>
                    </td>
                    <td>{experience.merchant?.businessName || '—'}</td>
                    <td>{formatCny(experience.priceCny)}</td>
                    <td>
                      <div className="table-primary">{experience.duration || '—'}</div>
                      <div className="table-secondary">Kapasite: {experience.capacity ?? '—'}</div>
                    </td>
                    <td>
                      <div className="chip-list">
                        {experience.tags.length > 0 ? experience.tags.map((tag) => <span key={tag} className="chip">{tag}</span>) : <span className="table-secondary">Etiket yok</span>}
                      </div>
                    </td>
                    <td>
                      <Badge label={experience.isActive ? 'Aktif' : 'Pasif'} tone={experience.isActive ? 'success' : 'neutral'} />
                    </td>
                    <td>
                      <div className="inline-actions wrap-actions">
                        <button className="button button-secondary button-small" type="button" onClick={() => openEditModal(experience)}>
                          Düzenle
                        </button>
                        <button className="button button-secondary button-small" type="button" onClick={() => openSlotModal(experience)}>
                          Müsaitlik oluştur
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
        open={isExperienceModalOpen}
        title={editingExperience ? 'Deneyimi düzenle' : 'Yeni deneyim oluştur'}
        onClose={closeExperienceModal}
        size="lg"
        footer={
          <>
            <button className="button button-secondary" type="button" onClick={closeExperienceModal} disabled={savingExperience}>
              Vazgeç
            </button>
            <button className="button button-primary" type="button" onClick={saveExperience} disabled={savingExperience}>
              {savingExperience ? 'Kaydediliyor…' : editingExperience ? 'Kaydet' : 'Deneyimi oluştur'}
            </button>
          </>
        }
      >
        <div className="stack-md">
          {experienceError ? <InlineNotice title={experienceError} tone="danger" /> : null}
          <div className="form-grid two-columns">
            <label className="field">
              <span>Firma</span>
              <select value={experienceForm.merchantId} onChange={(event) => setExperienceForm((current) => ({ ...current, merchantId: event.target.value }))}>
                <option value="">Firma seçin</option>
                {merchantOptions.map((merchant) => (
                  <option key={merchant.id} value={merchant.id}>
                    {merchant.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Fiyat (CNY)</span>
              <input value={experienceForm.priceCny} onChange={(event) => setExperienceForm((current) => ({ ...current, priceCny: event.target.value }))} />
            </label>

            <label className="field">
              <span>Başlık (EN)</span>
              <input value={experienceForm.title} onChange={(event) => setExperienceForm((current) => ({ ...current, title: event.target.value }))} />
            </label>

            <label className="field">
              <span>Başlık (TR)</span>
              <input value={experienceForm.titleTr} onChange={(event) => setExperienceForm((current) => ({ ...current, titleTr: event.target.value }))} />
            </label>

            <label className="field field-span-2">
              <span>Başlık (CN)</span>
              <input value={experienceForm.titleCn} onChange={(event) => setExperienceForm((current) => ({ ...current, titleCn: event.target.value }))} />
            </label>

            <label className="field field-span-2">
              <span>Açıklama (EN)</span>
              <textarea rows={4} value={experienceForm.description} onChange={(event) => setExperienceForm((current) => ({ ...current, description: event.target.value }))} />
            </label>

            <label className="field">
              <span>Açıklama (TR)</span>
              <textarea rows={4} value={experienceForm.descriptionTr} onChange={(event) => setExperienceForm((current) => ({ ...current, descriptionTr: event.target.value }))} />
            </label>

            <label className="field">
              <span>Açıklama (CN)</span>
              <textarea rows={4} value={experienceForm.descriptionCn} onChange={(event) => setExperienceForm((current) => ({ ...current, descriptionCn: event.target.value }))} />
            </label>

            <label className="field">
              <span>Süre</span>
              <input value={experienceForm.duration} onChange={(event) => setExperienceForm((current) => ({ ...current, duration: event.target.value }))} placeholder="Örn. 3 saat" />
            </label>

            <label className="field">
              <span>Kapasite</span>
              <input value={experienceForm.capacity} onChange={(event) => setExperienceForm((current) => ({ ...current, capacity: event.target.value }))} placeholder="Örn. 12" />
            </label>

            <label className="field">
              <span>Görsel URL'leri (satır başına bir)</span>
              <textarea rows={5} value={experienceForm.imagesText} onChange={(event) => setExperienceForm((current) => ({ ...current, imagesText: event.target.value }))} />
            </label>

            <label className="field">
              <span>Etiketler (virgülle ayırın)</span>
              <textarea rows={5} value={experienceForm.tagsText} onChange={(event) => setExperienceForm((current) => ({ ...current, tagsText: event.target.value }))} placeholder="doğa, aile, balon" />
            </label>
          </div>

          <label className="toggle-row">
            <input type="checkbox" checked={experienceForm.isActive} onChange={(event) => setExperienceForm((current) => ({ ...current, isActive: event.target.checked }))} />
            <span>Deneyim aktif</span>
          </label>
        </div>
      </Modal>

      <Modal
        open={Boolean(slotExperience)}
        title={slotExperience ? `${displayExperienceTitle(slotExperience)} için müsaitlik oluştur` : 'Müsaitlik oluştur'}
        onClose={closeSlotModal}
        size="md"
        footer={
          <>
            <button className="button button-secondary" type="button" onClick={closeSlotModal} disabled={savingSlots}>
              Vazgeç
            </button>
            <button className="button button-primary" type="button" onClick={saveSlots} disabled={savingSlots}>
              {savingSlots ? 'Oluşturuluyor…' : 'Müsaitlik oluştur'}
            </button>
          </>
        }
      >
        <div className="stack-md">
          {slotError ? <InlineNotice title={slotError} tone="danger" /> : null}
          <div className="form-grid two-columns">
            <label className="field">
              <span>Başlangıç tarihi</span>
              <input type="date" value={slotForm.startDate} onChange={(event) => setSlotForm((current) => ({ ...current, startDate: event.target.value }))} />
            </label>
            <label className="field">
              <span>Bitiş tarihi</span>
              <input type="date" value={slotForm.endDate} onChange={(event) => setSlotForm((current) => ({ ...current, endDate: event.target.value }))} />
            </label>
            <label className="field field-span-2">
              <span>Saatler</span>
              <textarea rows={3} value={slotForm.timesText} onChange={(event) => setSlotForm((current) => ({ ...current, timesText: event.target.value }))} placeholder="08:00, 14:00" />
            </label>
            <label className="field">
              <span>Kapasite (opsiyonel)</span>
              <input value={slotForm.capacity} onChange={(event) => setSlotForm((current) => ({ ...current, capacity: event.target.value }))} />
            </label>
            <label className="field">
              <span>Fiyat (CNY, opsiyonel)</span>
              <input value={slotForm.priceCny} onChange={(event) => setSlotForm((current) => ({ ...current, priceCny: event.target.value }))} />
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
