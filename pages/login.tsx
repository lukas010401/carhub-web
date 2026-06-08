import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { apiFetch } from '@/lib/api';
import { saveTokens } from '@/lib/auth';
import AuthPricingCard from '@/components/AuthPricingCard';
import { useI18n } from '@/lib/i18n';
import { isBetaMode } from '@/lib/beta';

export default function LoginPage() {
  const { tr } = useI18n();
  const betaMode = isBetaMode();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [resending, setResending] = useState(false);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);

  const registeredInfo = useMemo(() => {
    if (!router.isReady) return '';
    const registered = typeof router.query.registered === 'string' ? router.query.registered : '';
    const qEmail = typeof router.query.email === 'string' ? router.query.email : '';
    if (registered !== '1') return '';
    return qEmail
      ? `Compte créé pour ${qEmail}. Confirmez votre email puis connectez-vous.`
      : 'Compte créé. Confirmez votre email puis connectez-vous.';
  }, [router.isReady, router.query.email, router.query.registered]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setEmailNotConfirmed(false);
    try {
      const tokens = await apiFetch<any>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      saveTokens(tokens);
      const payload = JSON.parse(atob(tokens.accessToken.split('.')[1]));
      const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      router.push(role === 'Admin' ? '/admin' : '/dashboard');
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (msg.includes('Email not confirmed')) {
        setError('Email non confirmé. Vérifiez votre boîte email puis réessayez.');
        setEmailNotConfirmed(true);
      } else {
        setError(e.message || tr('Échec de la connexion.', 'Tsy tafiditra ny kaonty.'));
      }
    }
  };

  const resendConfirmation = async () => {
    if (!email.trim()) {
      setError('Entrez votre email pour renvoyer le lien de confirmation.');
      return;
    }
    setResending(true);
    setError('');
    setInfo('');
    try {
      const result = await apiFetch<any>('/api/auth/resend-confirmation', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() })
      });
      setInfo(result?.message || 'Email de confirmation renvoyé.');
    } catch (e: any) {
      setError(e.message || 'Impossible de renvoyer l’email de confirmation.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="authSplitLayout">
      <section className="card cardBody authFormCard">
        <div className="grid" style={{ gap: '0.35rem' }}>
          <h1 className="text-2xl font-bold" style={{ margin: 0 }}>{tr('Connexion', 'Hiditra')}</h1>
          <p className="muted" style={{ margin: 0 }}>
            {tr('Connectez-vous pour gérer vos annonces et suivre vos actions.', 'Midira hanaraha-maso ny filazanao sy ny hetsikao.')}
          </p>
          <p className="muted" style={{ margin: 0 }}>
            <Link href="/pricing">
              <a style={{ color: '#1d4ed8', fontWeight: 600 }}>
                {betaMode
                  ? tr('Voir les conditions bêta de lancement', 'Jereo ny fepetra bêta amin’ny fanombohana')
                  : tr('Voir le détail des offres particulier/professionnel', 'Jereo ny antsipirihan’ny tolotra olon-tsotra/matihanina')}
              </a>
            </Link>
          </p>
        </div>

        {registeredInfo && <p className="sellerNotice sellerNoticeOk" style={{ margin: 0 }}>{registeredInfo}</p>}

        <form className="grid" style={{ gap: '0.85rem' }} onSubmit={submit}>
          <div className="formField">
            <label className="formLabel" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="formField">
            <label className="formLabel" htmlFor="login-password">{tr('Mot de passe', 'Teny miafina')}</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="primaryBtn" type="submit">{tr('Se connecter', 'Hiditra')}</button>
        </form>

        {info && <p className="sellerNotice sellerNoticeOk" style={{ margin: 0 }}>{info}</p>}
        {error && <p className="sellerNotice sellerNoticeError" style={{ margin: 0 }}>{error}</p>}
        {emailNotConfirmed && (
          <button type="button" className="ghostBtn" onClick={resendConfirmation} disabled={resending}>
            {resending ? 'Envoi...' : 'Renvoyer l’email de confirmation'}
          </button>
        )}

        <p className="muted" style={{ margin: 0 }}>
          {tr("Vous n'avez pas encore de compte ?", 'Tsy mbola manana kaonty ve ianao?')}{' '}
          <Link href="/register"><a style={{ color: '#1d4ed8', fontWeight: 600 }}>{tr('Créer un compte', 'Mamorona kaonty')}</a></Link>
        </p>
      </section>

      <AuthPricingCard />
    </div>
  );
}
