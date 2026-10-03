import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  api,
  type CreateMerchantInput,
  type CreateUserInput,
  type Merchant,
  type MerchantCategory,
  type User,
} from '../api';
import { Badge, ConfirmModal, CopyBox, EmptyState, ErrorState, InlineNotice, LoadingState, Modal, PaginationControls, useToast } from '../components/ui';
import { categoryLabels, roleLabels } from '../tr';
import {
  copyText,
  formatIstanbulDate,
  formatNumber,
  generateStrongPassword,
  getErrorMessage,
  roleTone,
  toOptionalNumber,
  toOptionalText,
} from '../utils';

type CompanyMode = 'existing' | 'new';

type MerchantDraft = {
  businessName: string;
  category: MerchantCategory;
  location: string;
  description: string;
  contactPhone: string;
  contactEmail: string;
  commissionRate: string;
};

type CreateUserFormState = {
  email: string;
  password: string;
  fullName: string;
  role: 'USER' | 'MERCHANT';
  companyMode: CompanyMode;
  merchantId: string;
  merchant: MerchantDraft;
};

type RoleModalState = {
  user: User;
  role: 'USER' | 'MERCHANT';
  companyMode: CompanyMode;
  merchantId: string;
  merchant: MerchantDraft;
};

type ResetPasswordState = {
  user: User;
  password: string;
};

type CreatedCredentials = {
  email: string;
  password: string;
  fullName: string;
  role: 'USER' | 'MERCHANT';
  companyName?: string;
};

function createEmptyMerchantDraft(): MerchantDraft {
  return {
    businessName: '',
    category: 'TOUR',
    location: '',
    description: '',
    contactPhone: '',
    contactEmail: '',
    commissionRate: '',
  };
}

function buildMerchantPayload(draft: MerchantDraft): CreateMerchantInput {
  return {
    businessName: draft.businessName.trim(),
    category: draft.category,
    location: draft.location.trim(),
    description: toOptionalText(draft.description),
    contactPhone: toOptionalText(draft.contactPhone),
    contactEmail: toOptionalText(draft.contactEmail),
    commissionRate: toOptionalNumber(draft.commissionRate),
  };
}

function createEmptyUserForm(merchants: Merchant[]): CreateUserFormState {
  const availableMerchant = merchants.find((merchant) => !merchant.representative);
  return {
    email: '',
    password: generateStrongPassword(),
    fullName: '',
    role: 'USER',
    companyMode: 'existing',
    merchantId: availableMerchant?.id || '',
    merchant: createEmptyMerchantDraft(),
  };
}

function merchantDraftFromMerchant(merchant: Merchant | null): MerchantDraft {
  if (!merchant) return createEmptyMerchantDraft();
  return {
    businessName: merchant.businessName,
    category: (merchant.category as MerchantCategory) || 'TOUR',
    location: merchant.location,
    description: merchant.description || '',
    contactPhone: merchant.contactPhone || '',
    contactEmail: merchant.contactEmail || '',
    commissionRate: merchant.commissionRate?.toString() || '',
  };
}

function buildRoleModalState(user: User, merchants: Merchant[]): RoleModalState {
  const currentMerchant = user.merchant;
  const fallbackMerchant = merchants.find((merchant) => !merchant.representative);
  return {
    user,
    role: user.role === 'MERCHANT' ? 'MERCHANT' : 'USER',
    companyMode: currentMerchant ? 'existing' : 'existing',
    merchantId: currentMerchant?.id || fallbackMerchant?.id || '',
    merchant: merchantDraftFromMerchant(currentMerchant),
  };
}

function MerchantDraftFields({
  draft,
  onChange,
}: {
  draft: MerchantDraft;
  onChange: <K extends keyof MerchantDraft>(key: K, value: MerchantDraft[K]) => void;
}): JSX.Element {
  return (
    <div className="form-grid two-columns nested-panel">
      <label className="field">
        <span>Firma adı</span>
        <input value={draft.businessName} onChange={(event) => onChange('businessName', event.target.value)} />
      </label>
      <label className="field">
        <span>Kategori</span>
        <select value={draft.category} onChange={(event) => onChange('category', event.target.value as MerchantCategory)}>
          {Object.entries(categoryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Konum</span>
        <input value={draft.location} onChange={(event) => onChange('location', event.target.value)} />
      </label>
      <label className="field">
        <span>Komisyon oranı (%)</span>
        <input value={draft.commissionRate} onChange={(event) => onChange('commissionRate', event.target.value)} placeholder="Örn. 12" />
      </label>
      <label className="field field-span-2">
        <span>Açıklama</span>
        <textarea rows={3} value={draft.description} onChange={(event) => onChange('description', event.target.value)} />
      </label>
      <label className="field">
        <span>Telefon</span>
        <input value={draft.contactPhone} onChange={(event) => onChange('contactPhone', event.target.value)} />
      </label>
      <label className="field">
        <span>E-posta</span>
        <input type="email" value={draft.contactEmail} onChange={(event) => onChange('contactEmail', event.target.value)} />
      </label>
    </div>
  );
}

export default function UsersPage(): JSX.Element {
  const { addToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<{ q: string; role: '' | 'USER' | 'MERCHANT'; page: number }>({
    q: '',
    role: '',
    page: 1,
  });
  const [reloadKey, setReloadKey] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserFormState>(createEmptyUserForm([]));
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<CreatedCredentials | null>(null);
  const [savingCreate, setSavingCreate] = useState(false);
  const [roleModal, setRoleModal] = useState<RoleModalState | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [savingRole, setSavingRole] = useState(false);
  const [resetModal, setResetModal] = useState<ResetPasswordState | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [savingReset, setSavingReset] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [userResponse, merchantResponse] = await Promise.all([
        api.getAdminUsers({
          q: filters.q || undefined,
          role: filters.role || undefined,
          page: filters.page,
          limit: 10,
        }),
        api.getAdminMerchants(),
      ]);
      setUsers(userResponse.users);
      setPagination(userResponse.pagination);
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

  const availableMerchants = useMemo(() => merchants.filter((merchant) => !merchant.representative), [merchants]);
  const createCompanyOptions = useMemo(() => availableMerchants.map((merchant) => ({ id: merchant.id, label: merchant.businessName })), [availableMerchants]);

  const roleCompanyOptions = useMemo(() => {
    if (!roleModal) return createCompanyOptions;
    return merchants
      .filter((merchant) => !merchant.representative || merchant.id === roleModal.user.merchant?.id)
      .map((merchant) => ({ id: merchant.id, label: merchant.businessName }));
  }, [createCompanyOptions, merchants, roleModal]);

  const openCreateModal = () => {
    setCreateForm(createEmptyUserForm(merchants));
    setCreateError(null);
    setCreatedCredentials(null);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    if (savingCreate) return;
    setIsCreateModalOpen(false);
    setCreateError(null);
    setCreatedCredentials(null);
  };

  const updateCreateMerchantField = <K extends keyof MerchantDraft>(key: K, value: MerchantDraft[K]) => {
    setCreateForm((current) => ({ ...current, merchant: { ...current.merchant, [key]: value } }));
  };

  const updateRoleMerchantField = <K extends keyof MerchantDraft>(key: K, value: MerchantDraft[K]) => {
    setRoleModal((current) => (current ? { ...current, merchant: { ...current.merchant, [key]: value } } : current));
  };

  const saveCreate = async () => {
    setCreateError(null);
    const email = createForm.email.trim();
    const fullName = createForm.fullName.trim();

    if (!email || createForm.password.length < 8) {
      setCreateError('E-posta ve en az 8 karakterlik geçici şifre zorunludur.');
      return;
    }

    const payload: CreateUserInput = {
      email,
      password: createForm.password,
      fullName: fullName || undefined,
      role: createForm.role,
    };

    if (createForm.role === 'MERCHANT') {
      if (createForm.companyMode === 'existing') {
        if (!createForm.merchantId) {
          setCreateError('Firma yetkilisi için mevcut bir firma seçin veya yeni firma oluşturun.');
          return;
        }
        payload.merchantId = createForm.merchantId;
      } else {
        if (!createForm.merchant.businessName.trim() || !createForm.merchant.location.trim()) {
          setCreateError('Yeni firma oluştururken firma adı ve konum zorunludur.');
          return;
        }
        payload.merchant = buildMerchantPayload(createForm.merchant);
      }
    }

    setSavingCreate(true);
    try {
      await api.createAdminUser(payload);
      const selectedMerchantName =
        createForm.role === 'MERCHANT'
          ? createForm.companyMode === 'existing'
            ? merchants.find((merchant) => merchant.id === createForm.merchantId)?.businessName
            : createForm.merchant.businessName.trim()
          : undefined;

      setCreatedCredentials({
        email,
        password: createForm.password,
        fullName,
        role: createForm.role,
        companyName: selectedMerchantName,
      });
      setCreateForm(createEmptyUserForm(merchants));
      addToast({ title: 'Kullanıcı oluşturuldu.', tone: 'success' });
      setReloadKey((value) => value + 1);
    } catch (saveError) {
      setCreateError(getErrorMessage(saveError));
    } finally {
      setSavingCreate(false);
    }
  };

  const openRoleModal = (user: User) => {
    setRoleModal(buildRoleModalState(user, merchants));
    setRoleError(null);
  };

  const closeRoleModal = () => {
    if (savingRole) return;
    setRoleModal(null);
    setRoleError(null);
  };

  const saveRole = async () => {
    if (!roleModal) return;
    setRoleError(null);

    setSavingRole(true);
    try {
      if (roleModal.role === 'USER') {
        await api.updateAdminUserRole(roleModal.user.id, { role: 'USER' });
      } else {
        let merchantId = roleModal.merchantId;
        if (roleModal.companyMode === 'new') {
          if (!roleModal.merchant.businessName.trim() || !roleModal.merchant.location.trim()) {
            setRoleError('Yeni firma oluştururken firma adı ve konum zorunludur.');
            setSavingRole(false);
            return;
          }
          const created = await api.createAdminMerchant(buildMerchantPayload(roleModal.merchant));
          merchantId = created.merchant.id;
        }

        if (!merchantId) {
          setRoleError('Firma yetkilisi için firma seçin.');
          setSavingRole(false);
          return;
        }

        await api.updateAdminUserRole(roleModal.user.id, { role: 'MERCHANT', merchantId });
      }

      addToast({ title: 'Kullanıcı rolü güncellendi.', tone: 'success' });
      closeRoleModal();
      setReloadKey((value) => value + 1);
    } catch (saveError) {
      setRoleError(getErrorMessage(saveError));
    } finally {
      setSavingRole(false);
    }
  };

  const openResetModal = (user: User) => {
    setResetModal({ user, password: generateStrongPassword() });
    setResetError(null);
  };

  const closeResetModal = () => {
    if (savingReset) return;
    setResetModal(null);
    setResetError(null);
  };

  const saveReset = async () => {
    if (!resetModal) return;
    if (resetModal.password.length < 8) {
      setResetError('Yeni şifre en az 8 karakter olmalıdır.');
      return;
    }

    setSavingReset(true);
    setResetError(null);
    try {
      await api.resetAdminUserPassword(resetModal.user.id, resetModal.password);
      addToast({ title: 'Şifre sıfırlandı.', tone: 'success' });
      closeResetModal();
    } catch (saveError) {
      setResetError(getErrorMessage(saveError));
    } finally {
      setSavingReset(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteAdminUser(deleteTarget.id);
      addToast({ title: 'Kullanıcı silindi.', tone: 'success' });
      setDeleteTarget(null);
      setReloadKey((value) => value + 1);
    } catch (deleteError) {
      addToast({ title: getErrorMessage(deleteError), tone: 'danger' });
    } finally {
      setDeleting(false);
    }
  };

  const copyCreatedCredentials = async () => {
    if (!createdCredentials) return;
    const copied = await copyText(
      `E-posta: ${createdCredentials.email}\nGeçici şifre: ${createdCredentials.password}\nRol: ${roleLabels[createdCredentials.role]}${createdCredentials.companyName ? `\nFirma: ${createdCredentials.companyName}` : ''}`,
    );
    addToast({ title: copied ? 'Kimlik bilgileri kopyalandı.' : 'Kopyalama başarısız oldu.', tone: copied ? 'success' : 'warning' });
  };

  return (
    <div className="page-stack">
      <section className="page-header-row">
        <div>
          <p className="eyebrow">Erişim yönetimi</p>
          <h2>Kullanıcılar</h2>
          <p className="muted-text">Son kullanıcı ve firma yetkilisi rollerini yönetin. ADMIN rolü yalnızca <strong>pilotmemorable@gmail.com</strong> için sunucu tarafında tanımlıdır.</p>
        </div>
        <button className="button button-primary" type="button" onClick={openCreateModal}>
          Yeni kullanıcı / Firma yetkilisi ekle
        </button>
      </section>

      <section className="card">
        <div className="filters-grid four-columns">
          <label className="field">
            <span>Arama</span>
            <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Ad, e-posta" />
          </label>

          <label className="field">
            <span>Rol</span>
            <select value={filters.role} onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value as '' | 'USER' | 'MERCHANT', page: 1 }))}>
              <option value="">Tümü</option>
              <option value="USER">Son kullanıcı</option>
              <option value="MERCHANT">Firma yetkilisi</option>
            </select>
          </label>

          <div className="filter-actions">
            <button className="button button-secondary" type="button" onClick={() => setFilters((current) => ({ ...current, q: searchInput.trim(), page: 1 }))}>
              Filtreyi uygula
            </button>
          </div>
        </div>
      </section>

      <section className="card">
        {loading ? <LoadingState label="Kullanıcılar yükleniyor…" /> : null}
        {!loading && error ? <ErrorState message={error} onRetry={load} /> : null}
        {!loading && !error && users.length === 0 ? (
          <EmptyState title="Kullanıcı bulunamadı" description="Seçili filtrelere uyan kayıt yok." />
        ) : null}

        {!loading && !error && users.length > 0 ? (
          <>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ad</th>
                    <th>E-posta</th>
                    <th>Rol</th>
                    <th>Firma</th>
                    <th>Rezervasyon</th>
                    <th>Oluşturulma</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.fullName || '—'}</td>
                      <td>{user.email}</td>
                      <td>
                        <Badge label={roleLabels[user.role] ?? user.role} tone={roleTone(user.role)} />
                      </td>
                      <td>{user.merchant?.businessName || '—'}</td>
                      <td>{formatNumber(user._count?.bookings ?? 0)}</td>
                      <td>{formatIstanbulDate(user.createdAt)}</td>
                      <td>
                        <div className="inline-actions wrap-actions">
                          <button className="button button-secondary button-small" type="button" onClick={() => openRoleModal(user)}>
                            Rol değiştir
                          </button>
                          <button className="button button-secondary button-small" type="button" onClick={() => openResetModal(user)}>
                            Şifre sıfırla
                          </button>
                          <button className="button button-danger button-small" type="button" onClick={() => setDeleteTarget(user)}>
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <PaginationControls pagination={pagination} onPageChange={(page) => setFilters((current) => ({ ...current, page }))} />
          </>
        ) : null}
      </section>

      <Modal
        open={isCreateModalOpen}
        title="Yeni kullanıcı / firma yetkilisi ekle"
        onClose={closeCreateModal}
        size="lg"
        footer={
          <>
            <button className="button button-secondary" type="button" onClick={closeCreateModal} disabled={savingCreate}>
              Kapat
            </button>
            <button className="button button-primary" type="button" onClick={saveCreate} disabled={savingCreate}>
              {savingCreate ? 'Kaydediliyor…' : 'Kullanıcı oluştur'}
            </button>
          </>
        }
      >
        <div className="stack-md">
          <InlineNotice title="ADMIN rolü atanamaz" description="Bu panelden yalnızca USER veya MERCHANT oluşturabilirsiniz. ADMIN hesabı sunucu tarafında bootstrap edilir." tone="info" />
          {createError ? <InlineNotice title={createError} tone="danger" /> : null}
          {createdCredentials ? (
            <CopyBox
              title="Geçici giriş bilgileri"
              value={`E-posta: ${createdCredentials.email}\nGeçici şifre: ${createdCredentials.password}\nRol: ${roleLabels[createdCredentials.role]}${createdCredentials.companyName ? `\nFirma: ${createdCredentials.companyName}` : ''}`}
              onCopy={() => {
                void copyCreatedCredentials();
              }}
            />
          ) : null}

          <div className="form-grid two-columns">
            <label className="field">
              <span>E-posta</span>
              <input type="email" value={createForm.email} onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value }))} />
            </label>
            <label className="field">
              <span>Ad soyad</span>
              <input value={createForm.fullName} onChange={(event) => setCreateForm((current) => ({ ...current, fullName: event.target.value }))} />
            </label>
            <label className="field">
              <span>Rol</span>
              <select
                value={createForm.role}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    role: event.target.value as 'USER' | 'MERCHANT',
                  }))
                }
              >
                <option value="USER">Son kullanıcı</option>
                <option value="MERCHANT">Firma yetkilisi</option>
              </select>
            </label>
            <label className="field">
              <span>Geçici şifre</span>
              <div className="field-with-action">
                <input value={createForm.password} onChange={(event) => setCreateForm((current) => ({ ...current, password: event.target.value }))} />
                <button className="button button-secondary button-small" type="button" onClick={() => setCreateForm((current) => ({ ...current, password: generateStrongPassword() }))}>
                  Oluştur
                </button>
              </div>
            </label>
          </div>

          {createForm.role === 'MERCHANT' ? (
            <div className="stack-md nested-panel">
              <div className="stack-xs">
                <strong>Firma bağlantısı</strong>
                <p className="muted-text small-text">Mevcut temsilcisi olmayan bir firmayı seçebilir veya yeni firma oluşturabilirsiniz.</p>
              </div>

              <div className="segmented-control">
                <button
                  className={createForm.companyMode === 'existing' ? 'segment is-active' : 'segment'}
                  type="button"
                  onClick={() => setCreateForm((current) => ({ ...current, companyMode: 'existing' }))}
                >
                  Mevcut firma
                </button>
                <button
                  className={createForm.companyMode === 'new' ? 'segment is-active' : 'segment'}
                  type="button"
                  onClick={() => setCreateForm((current) => ({ ...current, companyMode: 'new' }))}
                >
                  Yeni firma oluştur
                </button>
              </div>

              {createForm.companyMode === 'existing' ? (
                <label className="field">
                  <span>Firma seçin</span>
                  <select value={createForm.merchantId} onChange={(event) => setCreateForm((current) => ({ ...current, merchantId: event.target.value }))}>
                    <option value="">Firma seçin</option>
                    {createCompanyOptions.map((merchant) => (
                      <option key={merchant.id} value={merchant.id}>
                        {merchant.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <MerchantDraftFields draft={createForm.merchant} onChange={updateCreateMerchantField} />
              )}
            </div>
          ) : null}
        </div>
      </Modal>

      <Modal
        open={Boolean(roleModal)}
        title={roleModal ? `${roleModal.user.fullName || roleModal.user.email} için rol güncelle` : 'Rol güncelle'}
        onClose={closeRoleModal}
        size="lg"
        footer={
          <>
            <button className="button button-secondary" type="button" onClick={closeRoleModal} disabled={savingRole}>
              Vazgeç
            </button>
            <button className="button button-primary" type="button" onClick={saveRole} disabled={savingRole}>
              {savingRole ? 'Güncelleniyor…' : 'Rolü güncelle'}
            </button>
          </>
        }
      >
        <div className="stack-md">
          {roleError ? <InlineNotice title={roleError} tone="danger" /> : null}

          <label className="field">
            <span>Rol</span>
            <select
              value={roleModal?.role || 'USER'}
              onChange={(event) =>
                setRoleModal((current) =>
                  current
                    ? {
                        ...current,
                        role: event.target.value as 'USER' | 'MERCHANT',
                      }
                    : current,
                )
              }
            >
              <option value="USER">Son kullanıcı</option>
              <option value="MERCHANT">Firma yetkilisi</option>
            </select>
          </label>

          {roleModal?.role === 'MERCHANT' ? (
            <div className="stack-md nested-panel">
              <div className="segmented-control">
                <button
                  className={roleModal.companyMode === 'existing' ? 'segment is-active' : 'segment'}
                  type="button"
                  onClick={() => setRoleModal((current) => (current ? { ...current, companyMode: 'existing' } : current))}
                >
                  Mevcut firma
                </button>
                <button
                  className={roleModal.companyMode === 'new' ? 'segment is-active' : 'segment'}
                  type="button"
                  onClick={() => setRoleModal((current) => (current ? { ...current, companyMode: 'new' } : current))}
                >
                  Yeni firma oluştur
                </button>
              </div>

              {roleModal.companyMode === 'existing' ? (
                <label className="field">
                  <span>Firma seçin</span>
                  <select
                    value={roleModal.merchantId}
                    onChange={(event) =>
                      setRoleModal((current) =>
                        current
                          ? { ...current, merchantId: event.target.value }
                          : current,
                      )
                    }
                  >
                    <option value="">Firma seçin</option>
                    {roleCompanyOptions.map((merchant) => (
                      <option key={merchant.id} value={merchant.id}>
                        {merchant.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <MerchantDraftFields draft={roleModal.merchant} onChange={updateRoleMerchantField} />
              )}
            </div>
          ) : (
            <InlineNotice title="Firma bağlantısı kaldırılacak" description="Kullanıcı USER rolüne döndüğünde firma temsilciliği bağlantısı kaldırılır." tone="warning" />
          )}
        </div>
      </Modal>

      <Modal
        open={Boolean(resetModal)}
        title={resetModal ? `${resetModal.user.fullName || resetModal.user.email} için şifre sıfırla` : 'Şifre sıfırla'}
        onClose={closeResetModal}
        size="sm"
        footer={
          <>
            <button className="button button-secondary" type="button" onClick={closeResetModal} disabled={savingReset}>
              Vazgeç
            </button>
            <button className="button button-primary" type="button" onClick={saveReset} disabled={savingReset}>
              {savingReset ? 'Kaydediliyor…' : 'Şifreyi sıfırla'}
            </button>
          </>
        }
      >
        <div className="stack-md">
          {resetError ? <InlineNotice title={resetError} tone="danger" /> : null}
          <label className="field">
            <span>Yeni şifre</span>
            <div className="field-with-action">
              <input
                value={resetModal?.password || ''}
                onChange={(event) => setResetModal((current) => (current ? { ...current, password: event.target.value } : current))}
              />
              <button className="button button-secondary button-small" type="button" onClick={() => setResetModal((current) => (current ? { ...current, password: generateStrongPassword() } : current))}>
                Oluştur
              </button>
            </div>
          </label>
          <InlineNotice title="Şifre en az 8 karakter olmalıdır" tone="info" />
        </div>
      </Modal>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Kullanıcıyı sil"
        description={
          <p>
            <strong>{deleteTarget?.email}</strong> hesabını kalıcı olarak silmek istediğinize emin misiniz?
          </p>
        }
        confirmLabel="Kullanıcıyı sil"
        busy={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          void confirmDelete();
        }}
      />
    </div>
  );
}
