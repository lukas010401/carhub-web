import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { apiFetch } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import BetaBanner from '@/components/BetaBanner';
import { isBetaMode } from '@/lib/beta';

function formatDate(value?: string): string {
  if (!value) return '-';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '-';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(dt);
}

export default function SellerSubscriptionPage() {
  const router = useRouter();
  const betaMode = isBetaMode();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<any>(null);
  const [months, setMonths] = useState(1);
  const [renewing, setRenewing] = useState(false);

  const monthlyPrice = Number(data?.professionalMonthlyFee || 0);
  const totalAmount = useMemo(() => monthlyPrice * Math.max(1, months), [monthlyPrice, months]);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== 'Seller') {
      router.replace('/login');
      return;
    }

    if (betaMode) {
      setData({
        accountType: user.accountType || 'Individual',
        message: 'Le module abonnement est dÉsactivÉ pendant la bêta.'
      });
      setLoading(false);
      return;
    }

    apiFetch<any>('/api/seller/subscription', {}, true)
      .then(setData)
      .catch((e: any) => setError(e?.message || 'Impossible de charger votre abonnement.'))
      .finally(() => setLoading(false));
  }, [router, betaMode]);

  if (loading) return <p className="muted">Chargement...</p>;

  const initiateRenewalPayment = async () => {
    setRenewing(true);
    setError('');
    try {
      const res = await apiFetch<any>('/api/seller/payments/initiate-subscription', {
        method: 'POST',
        body: JSON.stringify({ months, monthlyPrice })
      }, true);
      const payload = res?.data || res;
      const paymentId = payload?.id || payload?.Id;
      if (!paymentId) throw new Error('Réponse paiement invalide.');
      router.push(`/dashboard/payments/${paymentId}`);
    } catch (e: any) {
      setError(e?.message || 'Impossible d’initier le paiement de renouvellement.');
    } finally {
      setRenewing(false);
    }
  };

  if (betaMode) {
    return (
      <div className="grid gap-4" style={{ maxWidth: 860 }}>
        <div className="inlineActions items-center justify-between">
          <h1 className="text-2xl font-bold">Mon abonnement</h1>
          <Link href="/dashboard"><a className="ghostBtn">Retour espace vendeur</a></Link>
        </div>
        <BetaBanner showPricingLink />
        <section className="card cardBody betaInfoCard">
          <h2 className="betaInfoTitle">Module abonnement en pause pendant la bêta</h2>
          <p className="betaInfoText">
            Les paiements et renouvellements sont temporairement dÉsactivÉs dans cette interface.
            Les vendeurs professionnels restent identifiÉs sur la plateforme, mais la facturation n’est pas active pendant la pÉriode de lancement.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="grid gap-4" style={{ maxWidth: 860 }}>
      <div className="inlineActions items-center justify-between">
        <h1 className="text-2xl font-bold">Mon abonnement</h1>
        <Link href="/dashboard"><a className="ghostBtn">Retour espace vendeur</a></Link>
      </div>

      {error && <p className="sellerNotice sellerNoticeError">{error}</p>}

      {!error && data && (
        <>
          <section className="card cardBody grid gap-3">
            <p className="sellerStatLabel" style={{ margin: 0 }}>Type de compte</p>
            <p className="sellerStatValue" style={{ margin: 0, fontSize: '1.35rem' }}>
              {data.accountType === 'Professional' ? 'Professionnel' : 'Particulier'}
            </p>
            <p className="muted" style={{ margin: 0 }}>{data.message}</p>
          </section>

          {data.accountType === 'Professional' ? (
            <section className="card cardBody grid gap-3">
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Statut abonnement</h2>
              <p style={{ margin: 0 }}><strong>Statut:</strong> {data.latestSubscription?.status || 'Aucun'}</p>
              <p style={{ margin: 0 }}><strong>Début:</strong> {formatDate(data.latestSubscription?.startsAtUtc)}</p>
              <p style={{ margin: 0 }}><strong>Fin:</strong> {formatDate(data.latestSubscription?.endsAtUtc)}</p>
              <p style={{ margin: 0 }}><strong>Prix mensuel:</strong> {monthlyPrice.toLocaleString()} Ar</p>
              {!data.hasActiveSubscription && (
                <p className="sellerNotice sellerNoticeInfo" style={{ margin: 0 }}>
                  Votre abonnement n'est pas actif. Contactez l'administration pour activation/renouvellement.
                </p>
              )}
              <div className="formGrid">
                <div className="formField">
                  <label className="formLabel" htmlFor="renew-months">Durée (mois)</label>
                  <input
                    id="renew-months"
                    type="number"
                    min={1}
                    max={24}
                    value={months}
                    onChange={(e) => setMonths(Math.max(1, Math.min(24, Number(e.target.value) || 1)))}
                  />
                </div>
                <div className="formField">
                  <label className="formLabel">Prix mensuel appliqué</label>
                  <input readOnly value={`${monthlyPrice.toLocaleString()} Ar`} />
                </div>
                <div className="formField">
                  <label className="formLabel">Montant total à payer</label>
                  <input readOnly value={`${totalAmount.toLocaleString()} Ar`} />
                </div>
              </div>
              <div className="inlineActions">
                <button type="button" className="primaryBtn" onClick={initiateRenewalPayment} disabled={renewing}>
                  {renewing ? 'Redirection...' : 'Payer le renouvellement'}
                </button>
              </div>
            </section>
          ) : (
            <section className="card cardBody grid gap-2">
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Tarification particulier</h2>
              <p style={{ margin: 0 }}>20 000 Ar par annonce publiée.</p>
              <p className="muted" style={{ margin: 0 }}>Le paiement s'applique uniquement au moment de la mise en ligne.</p>
            </section>
          )}
        </>
      )}
    </div>
  );
}
