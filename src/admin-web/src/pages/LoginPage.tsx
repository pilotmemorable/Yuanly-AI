import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { ApiError } from '../api';
import { useAuth } from '../auth';
import { InlineNotice } from '../components/ui';
import { tr } from '../tr';

export default function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const { login, authNotice, clearAuthNotice } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const helperMessage = useMemo(
    () => 'Yalnızca sunucu tarafında yetkilendirilmiş yönetici hesabı bu panele giriş yapabilir.',
    [],
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    clearAuthNotice();

    try {
      const ok = await login(email.trim(), password);
      if (ok) {
        navigate('/', { replace: true });
      }
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.errorCode === 'ERR_INVALID_CREDENTIALS') {
          setErrorMessage(tr.auth.invalidCredentials);
        } else if (error.status === 429) {
          setErrorMessage(tr.auth.tooManyAttempts);
        } else {
          setErrorMessage(error.message);
        }
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Giriş yapılamadı.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card card">
        <div className="brand-pill">缘</div>
        <p className="eyebrow">Yuanly yönetim paneli</p>
        <h1>Yönetici girişi</h1>
        <p className="muted-text">
          Kullanıcı kaydı veya rol seçimi bu ekranda sunulmaz. Tek yetkili hesap: <strong>pilotmemorable@gmail.com</strong>.
        </p>

        {authNotice ? <InlineNotice title={authNotice} tone="warning" /> : null}
        {errorMessage ? <InlineNotice title={errorMessage} tone="danger" /> : null}
        <InlineNotice title="Bilgi" description={helperMessage} tone="info" />

        <form className="stack-md" onSubmit={onSubmit}>
          <label className="field">
            <span>E-posta</span>
            <input
              autoComplete="username"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="pilotmemorable@gmail.com"
              required
            />
          </label>

          <label className="field">
            <span>Şifre</span>
            <input
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Şifrenizi girin"
              required
            />
          </label>

          <button className="button button-primary button-block" type="submit" disabled={submitting}>
            {submitting ? 'Giriş yapılıyor…' : 'Giriş yap'}
          </button>
        </form>
      </div>
    </div>
  );
}
