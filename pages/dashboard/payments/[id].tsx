import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import BackLink from '@/components/ui/back-link';
import BetaBanner from '@/components/BetaBanner';
import { apiFetch } from '@/lib/api';
import { isBetaMode } from '@/lib/beta';

type SellerPayment = {
  id: string;
  type: string;
  status: string;
  internalReference: string;
  expectedAmount: number;
  requestedMonths?: number;
  requestedMonthlyPrice?: number;
  expiresAtUtc: string;
};

function formatDate(value?: string): string {
  if (!value) return '-';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '-';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(dt);
}

function paymentTypeLabel(value?: string): string {
  switch (String(value || '')) {
    case 'ListingPublication':
      return 'Publication annonce';
    case 'ProfessionalSubscriptionRenewal':
      return 'Abonnement professionnel';
    default:
      return String(value || '-');
  }
}

function paymentStatusLabel(value?: string): string {
  switch (String(value || '')) {
    case 'Initiated':
      return 'En attente de soumission';
    case 'UnderReview':
      return 'En cours de validation';
    case 'Approved':
      return 'Approuvé';
    case 'Rejected':
      return 'Rejeté';
    case 'Expired':
      return 'Expiré';
    case 'Cancelled':
      return 'Annulé';
    default:
      return String(value || '-');
  }
}

function paymentStatusClass(value?: string): string {
  switch (String(value || '')) {
    case 'Approved':
      return 'paymentBadgeSuccess';
    case 'Rejected':
      return 'paymentBadgeDanger';
    case 'Expired':
    case 'Cancelled':
      return 'paymentBadgeMuted';
    case 'UnderReview':
      return 'paymentBadgeWarn';
    default:
      return 'paymentBadgeInfo';
  }
}

export default function SellerPaymentPage() {
  const router = useRouter();
  const { id } = router.query;
  const betaMode = isBetaMode();
  const [payment, setPayment] = useState<SellerPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (paymentId: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch<any>(`/api/seller/payments/${paymentId}`, {}, true);
      const data = res?.data || res;
      setPayment(data);
    } catch (e: any) {
      setError(e?.message || 'Impossible de charger le paiement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (betaMode) {
      setLoading(false);
      return;
    }
    if (!id || typeof id !== 'string') return;
    load(id);
  }, [id, betaMode]);

  return (
    <div className="grid" style={{ gap: '1rem', maxWidth: 920 }}>
      <BackLink href="/dashboard" />
      <h1 className="text-2xl font-bold" style={{ margin: 0 }}>{betaMode ? 'Phase bêta' : 'Paiement publication'}</h1>

      {betaMode ? (
        <>
          <BetaBanner showPricingLink />
          <section className="card cardBody betaInfoCard">
            <h2 className="betaInfoTitle">Paiements désactivés pendant la bêta</h2>
            <p className="betaInfoText">
              Cette page reste en place pour la suite du projet, mais la publication est actuellement gratuite pendant la phase bêta.
            </p>
          </section>
        </>
      ) : (
        <>
          {loading && <p className="muted">Chargement...</p>}
          {error && <p className="sellerNotice sellerNoticeError">{error}</p>}

          {payment && (
            <section className="card cardBody grid" style={{ gap: '0.55rem' }}>
              <p style={{ margin: 0 }}><strong>Référence CarHub:</strong> {payment.internalReference}</p>
              <p style={{ margin: 0 }}>
                <strong>Type:</strong>{' '}
                <span className="paymentBadge paymentBadgeInfo">{paymentTypeLabel(payment.type)}</span>
              </p>
              <p style={{ margin: 0 }}>
                <strong>Statut:</strong>{' '}
                <span className={`paymentBadge ${paymentStatusClass(payment.status)}`}>{paymentStatusLabel(payment.status)}</span>
              </p>
              <p style={{ margin: 0 }}><strong>Montant à payer:</strong> {Number(payment.expectedAmount || 0).toLocaleString()} Ar</p>
              <p style={{ margin: 0 }}><strong>Expiration:</strong> {formatDate(payment.expiresAtUtc)}</p>
              {payment.type === 'ProfessionalSubscriptionRenewal' && (
                <p style={{ margin: 0 }}>
                  <strong>Renouvellement:</strong> {payment.requestedMonths || 1} mois
                  {typeof payment.requestedMonthlyPrice === 'number' ? ` à ${Number(payment.requestedMonthlyPrice).toLocaleString()} Ar/mois` : ''}
                </p>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
