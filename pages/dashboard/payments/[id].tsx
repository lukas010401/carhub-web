import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import BackLink from '@/components/ui/back-link';
import { apiFetch } from '@/lib/api';

type SellerPayment = {
  id: string;
  type: string;
  status: string;
  internalReference: string;
  expectedAmount: number;
  requestedMonths?: number;
  requestedMonthlyPrice?: number;
  expiresAtUtc: string;
  submittedAtUtc?: string;
  providerTransactionReference?: string;
  senderNumber?: string;
  senderName?: string;
  paidAtLocal?: string;
  notes?: string;
  proofFileUrl?: string;
  listingId?: string;
  receiverNumbers?: {
    yas?: string;
    orange?: string;
    airtel?: string;
  };
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
  const [payment, setPayment] = useState<SellerPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [provider, setProvider] = useState<'Yas' | 'Orange' | 'Airtel'>('Yas');
  const [txRef, setTxRef] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [senderName, setSenderName] = useState('');
  const [paidAtLocal, setPaidAtLocal] = useState('');
  const [notes, setNotes] = useState('');
  const isSubmissionLocked = !!payment && ['UnderReview', 'Approved', 'Cancelled', 'Expired'].includes(payment.status);

  const load = async (paymentId: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch<any>(`/api/seller/payments/${paymentId}`, {}, true);
      const data = res?.data || res;
      setPayment(data);
      if (!paidAtLocal) {
        const now = new Date();
        const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setPaidAtLocal(local);
      }
    } catch (e: any) {
      setError(e?.message || 'Impossible de charger le paiement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id || typeof id !== 'string') return;
    load(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const submitProof = async (e: FormEvent) => {
    e.preventDefault();
    if (!payment) return;
    if (saving || isSubmissionLocked) return;

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const formData = new FormData();
      formData.append('provider', provider);
      formData.append('providerTransactionReference', txRef.trim());
      formData.append('senderNumber', senderNumber.trim());
      if (senderName.trim()) formData.append('senderName', senderName.trim());
      formData.append('paidAtLocal', paidAtLocal);
      if (notes.trim()) formData.append('notes', notes.trim());

      const res = await apiFetch<any>(`/api/seller/payments/${payment.id}/submit-proof`, { method: 'POST', body: formData }, true);
      const data = res?.data || res;
      setPayment(data);
      setSuccess('Confirmation envoyée. Votre paiement est en cours de validation admin.');
    } catch (e: any) {
      setError(e?.message || 'Envoi de confirmation impossible.');
    } finally {
      setSaving(false);
    }
  };

  const receiver = payment?.receiverNumbers
    ? ({
        Yas: payment.receiverNumbers.yas || '-',
        Orange: payment.receiverNumbers.orange || '-',
        Airtel: payment.receiverNumbers.airtel || '-'
      } as const)[provider]
    : '-';

  return (
    <div className="grid" style={{ gap: '1rem', maxWidth: 920 }}>
      <BackLink href="/dashboard" />
      <h1 className="text-2xl font-bold" style={{ margin: 0 }}>Paiement publication</h1>

      {loading && <p className="muted">Chargement...</p>}
      {error && <p className="sellerNotice sellerNoticeError">{error}</p>}
      {success && <p className="sellerNotice sellerNoticeSuccess">{success}</p>}

      {payment && (
        <>
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

          <section className="card cardBody grid" style={{ gap: '0.65rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Étapes paiement mobile money</h2>
            <ol style={{ margin: 0, paddingLeft: '1.05rem', lineHeight: 1.45 }}>
              <li>Choisissez l’opérateur.</li>
              <li>Envoyez le montant vers le numéro CarHub affiché.</li>
              <li>Mettez la référence CarHub dans le libellé si possible.</li>
              <li>Soumettez ensuite le formulaire de confirmation ci-dessous.</li>
            </ol>

            <div className="formGrid">
              <div className="formField">
                <label className="formLabel" htmlFor="pay-provider">Opérateur</label>
                <select id="pay-provider" value={provider} onChange={(e) => setProvider(e.target.value as any)} disabled={saving || isSubmissionLocked}>
                  <option value="Yas">Yas</option>
                  <option value="Orange">Orange Money</option>
                  <option value="Airtel">Airtel Money</option>
                </select>
              </div>
              <div className="formField">
                <label className="formLabel">Numéro destinataire CarHub</label>
                <input value={receiver} readOnly />
              </div>
            </div>
          </section>

          <form className="card cardBody grid" style={{ gap: '0.75rem' }} onSubmit={submitProof}>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Confirmation de paiement</h2>
            <div className="formGrid">
              <div className="formField">
                <label className="formLabel" htmlFor="pay-tx-ref">Référence transaction</label>
                <input id="pay-tx-ref" value={txRef} onChange={(e) => setTxRef(e.target.value)} required disabled={saving || isSubmissionLocked} />
              </div>
              <div className="formField">
                <label className="formLabel" htmlFor="pay-sender-number">Numéro sender</label>
                <input id="pay-sender-number" value={senderNumber} onChange={(e) => setSenderNumber(e.target.value)} required disabled={saving || isSubmissionLocked} />
              </div>
              <div className="formField">
                <label className="formLabel" htmlFor="pay-sender-name">Nom sender (optionnel)</label>
                <input id="pay-sender-name" value={senderName} onChange={(e) => setSenderName(e.target.value)} disabled={saving || isSubmissionLocked} />
              </div>
              <div className="formField">
                <label className="formLabel" htmlFor="pay-paid-at">Date/heure paiement</label>
                <input id="pay-paid-at" type="datetime-local" value={paidAtLocal} onChange={(e) => setPaidAtLocal(e.target.value)} required disabled={saving || isSubmissionLocked} />
              </div>
            </div>
            <div className="formField">
              <label className="formLabel" htmlFor="pay-note">Note (optionnel)</label>
              <textarea id="pay-note" value={notes} onChange={(e) => setNotes(e.target.value)} disabled={saving || isSubmissionLocked} />
            </div>
            <button type="submit" className="primaryBtn" disabled={saving || isSubmissionLocked}>
              {saving ? 'Envoi...' : isSubmissionLocked ? 'Confirmation envoyée' : 'Envoyer la confirmation'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
