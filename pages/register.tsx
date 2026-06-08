import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/router';
import { apiFetch } from '@/lib/api';
import AuthPricingCard from '@/components/AuthPricingCard';
import { useI18n } from '@/lib/i18n';
import { isBetaMode } from '@/lib/beta';

export default function RegisterPage() {
  const { tr } = useI18n();
  const betaMode = isBetaMode();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsAppNumber, setWhatsAppNumber] = useState('');
  const [accountType, setAccountType] = useState<'Individual' | 'Professional'>('Individual');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const withCountryCode = (value: string): string => {
    const raw = value.trim();
    if (!raw) return '';
    const digits = raw.replace(/\D/g, '').replace(/^0+/, '');
    return digits ? `+261${digits}` : '';
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const result = await apiFetch<any>('/api/auth/register-seller', {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          email,
          phoneNumber: withCountryCode(phoneNumber),
          whatsAppNumber: withCountryCode(whatsAppNumber),
          accountType,
          password
        })
      });

      setSuccess(result?.message || tr('Compte créé. Confirmez votre email pour vous connecter.', "Voasoratra ny kaonty. Hamarino ny email alohan'ny hidirana."));
      router.push(`/login?registered=1&email=${encodeURIComponent(email.trim())}`);
    } catch (e: any) {
      setError(e.message || tr("Échec de l'inscription.", 'Tsy tafavoaka ny fisoratana anarana.'));
    }
  };

  return (
    <div className="authSplitLayout authSplitWide">
      <section className="card cardBody authFormCard">
        <div className="grid" style={{ gap: '0.35rem' }}>
          <h1 className="text-2xl font-bold" style={{ margin: 0 }}>{tr('Inscription vendeur', 'Fisoratana anarana mpivarotra')}</h1>
          <p className="muted" style={{ margin: 0 }}>
            {tr('Créez votre compte pour publier vos annonces auto sur CarHub.', 'Mamorona kaonty hamoahanao filazana fiara ao CarHub.')}
          </p>
          <p className="muted" style={{ margin: 0 }}>
            <Link href="/pricing"><a style={{ color: '#1d4ed8', fontWeight: 600 }}>{tr('Voir les conditions de lancement', 'Jereo ny fepetra fanombohana')}</a></Link>
          </p>
        </div>

        <form className="grid" style={{ gap: '0.85rem' }} onSubmit={submit}>
          <div className="formField">
            <label className="formLabel">{tr('Type de compte', 'Karazana kaonty')}</label>
            <div className="inlineActions">
              <button
                type="button"
                className={accountType === 'Individual' ? 'primaryBtn' : 'ghostBtn'}
                onClick={() => setAccountType('Individual')}
              >
                {tr('Particulier', 'Olon-tsotra')}
              </button>
              <button
                type="button"
                className={accountType === 'Professional' ? 'primaryBtn' : 'ghostBtn'}
                onClick={() => setAccountType('Professional')}
              >
                {tr('Professionnel', 'Matihanina')}
              </button>
            </div>
            <p className="muted" style={{ margin: 0 }}>
              {accountType === 'Professional'
                ? (betaMode
                  ? tr('Compte pro disponible dès maintenant, sans facturation active pendant la bêta.', 'Efa azo isafidianana ny kaonty pro, nefa tsy mbola misy fandoavana mavitrika mandritra ny bêta.')
                  : tr('Offre pro : 150 000 Ar/mois, annonces illimitées pendant abonnement actif.', 'Tolotra pro: 150 000 Ar/volana, filazana tsy voafetra mandritra ny famandrihana mavitrika.'))
                : (betaMode
                  ? tr('Publication gratuite pendant la bêta pour les comptes particuliers.', 'Maimaim-poana mandritra ny bêta ny famoahana ho an’ny kaonty olon-tsotra.')
                  : tr("Tarif particulier : 20 000 Ar par annonce publiée.", "Vidin'olon-tsotra: 20 000 Ar isaky ny filazana avoaka."))}
            </p>
          </div>

          <div className="formField">
            <label className="formLabel" htmlFor="register-fullName">{tr('Nom complet ou nom professionnel', 'Anarana feno na anarana matihanina')}</label>
            <input
              id="register-fullName"
              value={fullName}
              autoComplete="name"
              onChange={e => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="formGrid">
            <div className="formField">
              <label className="formLabel" htmlFor="register-email">Email</label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="formField">
              <label className="formLabel" htmlFor="register-phone">{tr('Téléphone', 'Telefaona')}</label>
              <div style={{ display: 'grid', gridTemplateColumns: '74px 1fr', gap: '0.5rem' }}>
                <input value="+261" readOnly aria-label="Indicatif pays" />
                <input
                  id="register-phone"
                  value={phoneNumber}
                  autoComplete="tel-national"
                  inputMode="numeric"
                  placeholder="Ex: 34 12 345 67"
                  onChange={e => setPhoneNumber(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="formGrid">
            <div className="formField">
              <label className="formLabel" htmlFor="register-whatsapp">WhatsApp</label>
              <div style={{ display: 'grid', gridTemplateColumns: '74px 1fr', gap: '0.5rem' }}>
                <input value="+261" readOnly aria-label="Indicatif pays WhatsApp" />
                <input
                  id="register-whatsapp"
                  value={whatsAppNumber}
                  autoComplete="tel-national"
                  inputMode="numeric"
                  placeholder="Ex: 34 12 345 67"
                  onChange={e => setWhatsAppNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="formField">
              <label className="formLabel" htmlFor="register-password">{tr('Mot de passe', 'Teny miafina')}</label>
              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button className="primaryBtn" type="submit">{tr('Créer mon compte', 'Mamorona kaontiko')}</button>
        </form>

        {success && <p className="sellerNotice sellerNoticeOk" style={{ margin: 0 }}>{success}</p>}
        {error && <p className="sellerNotice sellerNoticeError" style={{ margin: 0 }}>{error}</p>}

        <p className="muted" style={{ margin: 0 }}>
          {tr('Déjà inscrit ?', 'Efa nisoratra anarana?')}{' '}
          <Link href="/login"><a style={{ color: '#1d4ed8', fontWeight: 600 }}>{tr('Se connecter', 'Hiditra')}</a></Link>
        </p>
      </section>

      <AuthPricingCard />
    </div>
  );
}
