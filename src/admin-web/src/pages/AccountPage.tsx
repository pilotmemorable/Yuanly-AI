import { useState, type FormEvent } from 'react';

import { api } from '../api';
import { useAuth } from '../auth';
import { InlineNotice, useToast } from '../components/ui';
import { roleLabels } from '../tr';
import { formatIstanbulDate, getErrorMessage } from '../utils';

export default function AccountPage(): JSX.Element {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (newPassword.length < 8) {
      setFormError('Yeni şifre en az 8 karakter olmalıdır.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('Yeni şifre ile tekrar alanı aynı olmalıdır.');
      return;
    }

    setSaving(true);
    try {
      const response = await api.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      addToast({ title: response.message, tone: 'success' });
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-stack two-column-grid">
      <section className="card">
        <div className="card-header-row">
          <div>
            <p className="eyebrow">Hesap özeti</p>
            <h2>Yönetici bilgileri</h2>
          </div>
        </div>

        <div className="info-list">
          <div className="info-list-item">
            <span>Ad soyad</span>
            <strong>{user?.fullName || '—'}</strong>
          </div>
          <div className="info-list-item">
            <span>E-posta</span>
            <strong>{user?.email || '—'}</strong>
          </div>
          <div className="info-list-item">
            <span>Rol</span>
            <strong>{user?.role ? roleLabels[user.role] : '—'}</strong>
          </div>
          <div className="info-list-item">
            <span>Oluşturulma</span>
            <strong>{formatIstanbulDate(user?.createdAt)}</strong>
          </div>
        </div>

        <button className="button button-secondary" type="button" onClick={() => logout()}>
          Çıkış yap
        </button>
      </section>

      <section className="card">
        <div className="card-header-row">
          <div>
            <p className="eyebrow">Güvenlik</p>
            <h2>Şifre değiştir</h2>
          </div>
        </div>

        {formError ? <InlineNotice title={formError} tone="danger" /> : null}

        <form className="stack-md" onSubmit={onSubmit}>
          <label className="field">
            <span>Mevcut şifre</span>
            <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
          </label>

          <label className="field">
            <span>Yeni şifre</span>
            <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={8} required />
          </label>

          <label className="field">
            <span>Yeni şifre (tekrar)</span>
            <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} required />
          </label>

          <button className="button button-primary" type="submit" disabled={saving}>
            {saving ? 'Güncelleniyor…' : 'Şifreyi güncelle'}
          </button>
        </form>
      </section>
    </div>
  );
}
