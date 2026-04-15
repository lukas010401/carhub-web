import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { apiFetch } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import AdminSectionNav from '@/components/admin/AdminSectionNav';
import type { ApiResponse, PagedResult } from '@/lib/types';

type AdminProSubscriptionItem = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  companyName?: string;
  companyVerified: boolean;
  hasActiveSubscription: boolean;
  latestSubscription?: {
    id: string;
    status: string;
    planCode: string;
    monthlyPrice: number;
    startsAtUtc: string;
    endsAtUtc: string;
    notes?: string;
  } | null;
};

type SubscriptionAction = 'activate' | 'suspend' | 'renew';

async function fetchWrapped<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch<ApiResponse<T>>(path, init, true);
  if (!res?.success) {
    throw new Error(res?.message || 'Requête admin en échec.');
  }
  return res.data as T;
}

function formatDate(value?: string): string {
  if (!value) return '-';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '-';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(dt);
}

function statusUi(rawStatus: string, active: boolean): { label: string; bg: string; color: string } {
  if (active) return { label: 'Actif', bg: '#e8f8ef', color: '#166534' };

  const s = String(rawStatus || '').trim().toLowerCase();
  if (s === 'suspended') return { label: 'Suspendu', bg: '#fff7e6', color: '#92400e' };
  if (s === 'cancelled' || s === 'canceled') return { label: 'Annulé', bg: '#feecec', color: '#991b1b' };
  if (s === 'expired') return { label: 'Expiré', bg: '#f3f4f6', color: '#374151' };
  if (!s) return { label: 'Aucun', bg: '#f3f4f6', color: '#374151' };
  return { label: rawStatus, bg: '#eef2ff', color: '#3730a3' };
}

export default function AdminSubscriptionsPage() {
  const router = useRouter();
  const [items, setItems] = useState<AdminProSubscriptionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [months, setMonths] = useState(1);
  const [monthlyPrice, setMonthlyPrice] = useState(150000);
  const [loading, setLoading] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const load = async (targetPage = page, targetKeyword = keyword) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', String(targetPage));
      params.set('pageSize', String(pageSize));
      if (targetKeyword.trim()) params.set('keyword', targetKeyword.trim());

      const data = await fetchWrapped<PagedResult<AdminProSubscriptionItem>>(`/api/admin/subscriptions?${params.toString()}`);
      setItems(data.items || []);
      setTotal(data.total || 0);
      setPage(data.page || targetPage);

      const firstPrice = data.items?.find((x) => typeof x.latestSubscription?.monthlyPrice === 'number')?.latestSubscription?.monthlyPrice;
      if (typeof firstPrice === 'number' && firstPrice >= 0) {
        setMonthlyPrice(firstPrice);
      }
    } catch (e: any) {
      setError(e?.message || 'Impossible de charger les abonnements pros.');
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
    load(1, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      load(1, keyword);
    }, 300);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  const runAction = async (userId: string, action: SubscriptionAction) => {
    setBusyUserId(userId);
    setError('');
    setSuccess('');
    try {
      const res = await fetchWrapped<any>(`/api/admin/subscriptions/${userId}/${action}`, {
        method: 'POST',
        body: JSON.stringify({ months, monthlyPrice })
      });
      setSuccess(res?.message || 'Action enregistrée.');
      await load(page, keyword);
    } catch (e: any) {
      setError(e?.message || 'Action impossible.');
    } finally {
      setBusyUserId(null);
    }
  };

  const getAllowedActions = (item: AdminProSubscriptionItem): SubscriptionAction[] => {
    const raw = String(item.latestSubscription?.status || '').trim().toLowerCase();
    const isActive = item.hasActiveSubscription || raw === 'active';

    if (isActive) return ['renew', 'suspend'];
    if (raw === 'suspended') return ['activate', 'renew'];
    if (raw === 'cancelled' || raw === 'canceled' || raw === 'expired' || raw === '') return ['activate'];
    return ['activate'];
  };

  return (
    <div className="grid gap-4">
      <AdminSectionNav active="subscriptions" />
      <div className="inlineActions items-center justify-between">
        <h1 className="text-2xl font-bold">Abonnements professionnels</h1>
        <span className="ghostBtn" style={{ pointerEvents: 'none' }}>Comptes: {total}</span>
      </div>

      <div className="card cardBody" style={{ display: 'grid', gap: '0.65rem' }}>
        <div className="formGrid">
          <div className="formField">
            <label className="formLabel">Recherche</label>
            <input
              type="text"
              placeholder="Nom, email, entreprise"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div className="formField">
            <label className="formLabel">Durée (mois)</label>
            <input type="number" min={1} max={24} value={months} onChange={(e) => setMonths(Math.max(1, Math.min(24, Number(e.target.value) || 1)))} />
          </div>
          <div className="formField">
            <label className="formLabel">Prix mensuel (Ar)</label>
            <input type="number" min={0} value={monthlyPrice} onChange={(e) => setMonthlyPrice(Math.max(0, Number(e.target.value) || 0))} />
          </div>
        </div>
      </div>

      {error && <p className="sellerNotice sellerNoticeError">{error}</p>}
      {success && <p className="sellerNotice sellerNoticeSuccess">{success}</p>}
      {loading && <p className="muted">Chargement...</p>}

      <div className="card cardBody" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: 1160, borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th align="left" style={{ padding: '12px 10px' }}>Vendeur</th>
              <th align="left" style={{ padding: '12px 10px' }}>Entreprise</th>
              <th align="left" style={{ padding: '12px 10px' }}>Statut</th>
              <th align="left" style={{ padding: '12px 10px' }}>Début</th>
              <th align="left" style={{ padding: '12px 10px' }}>Fin</th>
              <th align="left" style={{ padding: '12px 10px' }}>Prix mensuel</th>
              <th align="left" style={{ padding: '12px 10px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length ? items.map((x, idx) => {
              const st = statusUi(String(x.latestSubscription?.status || ''), x.hasActiveSubscription);
              const actions = getAllowedActions(x);
              return (
                <tr key={x.id} style={{ background: idx % 2 === 0 ? 'white' : '#fbfdff' }}>
                  <td style={{ padding: '12px 10px', borderTop: '1px solid #e5edf6' }}>
                    <div style={{ fontWeight: 700 }}>{x.fullName}</div>
                    <div className="muted" style={{ fontSize: '0.85rem' }}>{x.email}</div>
                    {x.phoneNumber ? <div className="muted" style={{ fontSize: '0.85rem' }}>{x.phoneNumber}</div> : null}
                  </td>
                  <td style={{ padding: '12px 10px', borderTop: '1px solid #e5edf6' }}>
                    <div>{x.companyName || '-'}</div>
                    {x.companyVerified ? (
                      <span style={{ background: '#e8f8ef', color: '#166534', borderRadius: 999, padding: '3px 9px', fontSize: '0.78rem', fontWeight: 700 }}>
                        Vérifiée
                      </span>
                    ) : (
                      <span className="muted" style={{ fontSize: '0.82rem' }}>Non vérifiée</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 10px', borderTop: '1px solid #e5edf6' }}>
                    <span style={{ background: st.bg, color: st.color, borderRadius: 999, padding: '4px 10px', fontWeight: 700, fontSize: '0.82rem' }}>
                      {st.label}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px', borderTop: '1px solid #e5edf6' }}>{formatDate(x.latestSubscription?.startsAtUtc)}</td>
                  <td style={{ padding: '12px 10px', borderTop: '1px solid #e5edf6' }}>{formatDate(x.latestSubscription?.endsAtUtc)}</td>
                  <td style={{ padding: '12px 10px', borderTop: '1px solid #e5edf6', fontWeight: 800, color: '#1d4ed8' }}>
                    {typeof x.latestSubscription?.monthlyPrice === 'number' ? `${x.latestSubscription.monthlyPrice.toLocaleString()} Ar` : '-'}
                  </td>
                  <td style={{ padding: '12px 10px', borderTop: '1px solid #e5edf6' }}>
                    <div className="inlineActions">
                      {actions.includes('activate') && (
                        <button type="button" className="primaryBtn" disabled={busyUserId === x.id} onClick={() => runAction(x.id, 'activate')}>
                          Activer
                        </button>
                      )}
                      {actions.includes('renew') && (
                        <button type="button" className="ghostBtn" disabled={busyUserId === x.id} onClick={() => runAction(x.id, 'renew')}>
                          Renouveler
                        </button>
                      )}
                      {actions.includes('suspend') && (
                        <button type="button" className="ghostBtn" disabled={busyUserId === x.id} onClick={() => runAction(x.id, 'suspend')}>
                          Suspendre
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={7} className="muted" style={{ padding: '14px 10px' }}>Aucun vendeur professionnel trouvé.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="carsPagination">
        <button className="ghostBtn carsPageBtn" type="button" onClick={() => load(page - 1, keyword)} disabled={page <= 1 || loading}>Précédent</button>
        <div className="carsPaginationPages">
          <button className="primaryBtn carsPageBtn active" type="button">{page}</button>
          <span className="muted">/ {totalPages}</span>
        </div>
        <button className="ghostBtn carsPageBtn" type="button" onClick={() => load(page + 1, keyword)} disabled={page >= totalPages || loading}>Suivant</button>
      </div>
    </div>
  );
}
