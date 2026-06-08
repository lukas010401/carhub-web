import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { apiFetch } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import AdminSectionNav from '@/components/admin/AdminSectionNav';
import BetaBanner from '@/components/BetaBanner';
import { isBetaMode } from '@/lib/beta';

type AdminPaymentItem = {
  id: string;
  type: string;
  status: string;
  internalReference: string;
  expectedAmount: number;
  submittedAtUtc?: string;
  provider?: string;
  providerTransactionReference?: string;
  senderNumber?: string;
  proofFileUrl?: string;
  seller?: {
    fullName: string;
    email: string;
    phoneNumber?: string;
    whatsAppNumber?: string;
  } | null;
  listing?: {
    id: string;
    title: string;
    status: string;
  } | null;
};

function formatDate(value?: string): string {
  if (!value) return '-';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '-';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(dt);
}

function statusUi(status: string): { label: string; bg: string; color: string } {
  switch (String(status || '').trim()) {
    case 'UnderReview':
      return { label: 'À valider', bg: '#fff7e6', color: '#92400e' };
    case 'Approved':
      return { label: 'Approuvé', bg: '#e8f8ef', color: '#166534' };
    case 'Rejected':
      return { label: 'Rejeté', bg: '#feecec', color: '#991b1b' };
    case 'Initiated':
      return { label: 'Initié', bg: '#eef2ff', color: '#3730a3' };
    default:
      return { label: status || '-', bg: '#f3f4f6', color: '#374151' };
  }
}

function typeUi(type: string): { label: string; bg: string; color: string } {
  if (type === 'ListingPublication') {
    return { label: 'Publication', bg: '#e0f2fe', color: '#0c4a6e' };
  }
  if (type === 'ProfessionalSubscriptionRenewal') {
    return { label: 'Abonnement pro', bg: '#ede9fe', color: '#5b21b6' };
  }
  return { label: type || '-', bg: '#f3f4f6', color: '#374151' };
}

export default function AdminPaymentsPage() {
  const router = useRouter();
  const betaMode = isBetaMode();
  const [items, setItems] = useState<AdminPaymentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('UnderReview');
  const [keyword, setKeyword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const pendingCount = useMemo(() => items.filter((x) => x.status === 'UnderReview').length, [items]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('pageSize', '50');
      if (statusFilter) params.set('status', statusFilter);
      if (keyword.trim()) params.set('keyword', keyword.trim());
      const res = await apiFetch<any>(`/api/admin/payments?${params.toString()}`, {}, true);
      const data = res?.data || res;
      setItems(data?.items || []);
    } catch (e: any) {
      setError(e?.message || 'Impossible de charger les paiements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'Admin') {
      router.replace('/');
      return;
    }
    if (betaMode) {
      setLoading(false);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, statusFilter]);

  const review = async (id: string, action: 'approve' | 'reject') => {
    const note = action === 'reject'
      ? window.prompt('Motif du rejet (obligatoire):', '') || ''
      : window.prompt('Note de validation (optionnel):', '') || '';

    if (action === 'reject' && !note.trim()) return;

    setBusyId(id);
    setError('');
    setSuccess('');
    try {
      const res = await apiFetch<any>(`/api/admin/payments/${id}/${action}`, {
        method: 'POST',
        body: JSON.stringify({ note: note.trim() || undefined })
      }, true);
      setSuccess(res?.message || (action === 'approve' ? 'Paiement approuvé.' : 'Paiement rejeté.'));
      await load();
    } catch (e: any) {
      setError(e?.message || 'Action impossible.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="grid gap-4">
      <AdminSectionNav active="payments" />

      {betaMode ? (
        <>
          <BetaBanner showPricingLink={false} />
          <section className="card cardBody betaInfoCard">
            <h1 className="text-2xl font-bold" style={{ margin: 0 }}>Paiements manuels</h1>
            <p className="betaInfoText">
              Le module paiements est masqué pendant la bêta. Les annonces sont publiées gratuitement pendant la période de lancement.
            </p>
          </section>
        </>
      ) : (
        <>

          <div className="inlineActions items-center justify-between">
            <h1 className="text-2xl font-bold">Paiements manuels</h1>
            <span className="ghostBtn" style={{ pointerEvents: 'none' }}>À valider: {pendingCount}</span>
          </div>

          <div className="card cardBody sellerToolbar">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="UnderReview">À valider</option>
              <option value="Initiated">Initiés</option>
              <option value="Approved">Approuvés</option>
              <option value="Rejected">Rejetés</option>
              <option value="">Tous</option>
            </select>
            <input
              type="text"
              placeholder="Référence, vendeur, transaction..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <button type="button" className="ghostBtn" onClick={load}>Rafraîchir</button>
          </div>

          {error && <p className="sellerNotice sellerNoticeError">{error}</p>}
          {success && <p className="sellerNotice sellerNoticeSuccess">{success}</p>}
          {loading && <p className="muted">Chargement...</p>}

          <div className="card cardBody" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 1220, borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th align="left" style={{ padding: '12px 10px' }}>Réf CarHub</th>
              <th align="left" style={{ padding: '12px 10px' }}>Type</th>
              <th align="left" style={{ padding: '12px 10px' }}>Vendeur</th>
              <th align="left" style={{ padding: '12px 10px' }}>Montant</th>
              <th align="left" style={{ padding: '12px 10px' }}>Transaction</th>
              <th align="left" style={{ padding: '12px 10px' }}>Soumis le</th>
              <th align="left" style={{ padding: '12px 10px' }}>Statut</th>
              <th align="left" style={{ padding: '12px 10px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length ? items.map((x, idx) => {
              const status = statusUi(x.status);
              const type = typeUi(x.type);
              return (
                <tr key={x.id} style={{ background: idx % 2 === 0 ? 'white' : '#fbfdff' }}>
                  <td style={{ padding: '12px 10px', borderTop: '1px solid #e5edf6' }}>
                    <div style={{ fontWeight: 700 }}>{x.internalReference}</div>
                    {x.listing?.title ? <div className="muted" style={{ fontSize: '0.85rem' }}>{x.listing.title}</div> : null}
                  </td>
                  <td style={{ padding: '12px 10px', borderTop: '1px solid #e5edf6' }}>
                    <span style={{ background: type.bg, color: type.color, borderRadius: 999, padding: '4px 10px', fontWeight: 700, fontSize: '0.82rem' }}>
                      {type.label}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px', borderTop: '1px solid #e5edf6' }}>
                    <div style={{ fontWeight: 700 }}>{x.seller?.fullName || '-'}</div>
                    <div className="muted" style={{ fontSize: '0.85rem' }}>{x.seller?.email || '-'}</div>
                    {x.seller?.phoneNumber ? <div className="muted" style={{ fontSize: '0.85rem' }}>{x.seller.phoneNumber}</div> : null}
                  </td>
                  <td style={{ padding: '12px 10px', borderTop: '1px solid #e5edf6', fontWeight: 800, color: '#1d4ed8' }}>
                    {Number(x.expectedAmount || 0).toLocaleString()} Ar
                  </td>
                  <td style={{ padding: '12px 10px', borderTop: '1px solid #e5edf6' }}>
                    <div>{x.provider || '-'}</div>
                    <div className="muted" style={{ fontSize: '0.85rem' }}>{x.providerTransactionReference || '-'}</div>
                    <div className="muted" style={{ fontSize: '0.85rem' }}>{x.senderNumber || '-'}</div>
                  </td>
                  <td style={{ padding: '12px 10px', borderTop: '1px solid #e5edf6' }}>{formatDate(x.submittedAtUtc)}</td>
                  <td style={{ padding: '12px 10px', borderTop: '1px solid #e5edf6' }}>
                    <span style={{ background: status.bg, color: status.color, borderRadius: 999, padding: '4px 10px', fontWeight: 700, fontSize: '0.82rem' }}>
                      {status.label}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px', borderTop: '1px solid #e5edf6' }}>
                    {x.status === 'UnderReview' ? (
                      <div className="inlineActions">
                        <button type="button" className="primaryBtn" disabled={busyId === x.id} onClick={() => review(x.id, 'approve')}>
                          Approuver
                        </button>
                        <button type="button" className="ghostBtn" disabled={busyId === x.id} onClick={() => review(x.id, 'reject')}>
                          Rejeter
                        </button>
                      </div>
                    ) : (
                      <span className="muted">-</span>
                    )}
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={8} className="muted" style={{ padding: '14px 10px' }}>Aucun paiement trouvé.</td>
              </tr>
            )}
          </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
