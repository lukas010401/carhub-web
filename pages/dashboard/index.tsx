import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { apiFetch } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { resolveMediaUrl } from '@/lib/media';
import { ListingStatus, SellerListing } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { listingStatusLabel } from '@/lib/ui-labels';
import { useI18n } from '@/lib/i18n';

type SellerStats = {
  total: number;
  approved: number;
  pending: number;
  sold: number;
  draft: number;
  rejected: number;
  archived: number;
};
type NoticeTone = 'info' | 'success' | 'error';
type SellerSubscriptionInfo = {
  accountType: 'Individual' | 'Professional' | string;
  isProfessional: boolean;
  hasActiveSubscription: boolean;
  canPublish: boolean;
  message?: string;
  latestSubscription?: {
    status?: string;
    startsAtUtc?: string;
    endsAtUtc?: string;
    monthlyPrice?: number;
  } | null;
};

const PAGE_SIZE = 8;

function formatPublishedDate(value?: string): string {
  if (!value) return 'Non publiée';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return 'Non publiée';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(dt);
}

function formatDate(value?: string): string {
  if (!value) return '-';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '-';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(dt);
}

function paymentStatusLabel(value?: string): string {
  switch (String(value || '').trim()) {
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
      return String(value || '').trim() || '-';
  }
}

function paymentStatusClass(value?: string): string {
  switch (String(value || '').trim()) {
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


function getSellerCardCoverSrc(item: SellerListing): string {
  const raw = item as any;
  return resolveMediaUrl(
    raw?.coverImage
    || raw?.coverImageUrl
    || raw?.imageUrl
    || raw?.thumbnailUrl
    || raw?.firstImage
    || raw?.firstImageUrl
    || (typeof raw?.images?.[0] === 'string' ? raw.images[0] : '')
    || raw?.images?.[0]?.url
    || raw?.images?.[0]?.Url
    || ''
  );
}

function getCoverFromListingDetails(data: any): string {
  const direct = getSellerCardCoverSrc(data || {});
  if (direct) return direct;

  const images = Array.isArray(data?.images) ? data.images : [];
  for (const image of images) {
    const candidate = resolveMediaUrl(
      (typeof image === 'string' ? image : '')
      || image?.url
      || image?.Url
      || image?.imageUrl
      || image?.path
      || image?.filePath
      || ''
    );
    if (candidate) return candidate;
  }

  return '';
}

export default function DashboardPage() {
  const { tr, lang } = useI18n();
  const router = useRouter();
  const [items, setItems] = useState<SellerListing[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<SellerStats>({
    total: 0,
    approved: 0,
    pending: 0,
    sold: 0,
    draft: 0,
    rejected: 0,
    archived: 0
  });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<{ tone: NoticeTone; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'All' | ListingStatus>('All');
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [fallbackCovers, setFallbackCovers] = useState<Record<string, string>>({});
  const [subscriptionInfo, setSubscriptionInfo] = useState<SellerSubscriptionInfo | null>(null);
  const resolvedCoverIdsRef = useRef<Set<string>>(new Set());

  const loadPage = async (page: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(PAGE_SIZE));
      if (statusFilter !== 'All') params.set('status', statusFilter);
      if (keyword.trim()) params.set('keyword', keyword.trim());
      if (sortBy && sortBy !== 'newest') params.set('sortBy', sortBy);

      const response = await apiFetch<{
        items: SellerListing[];
        total?: number;
        totalCount?: number;
        stats?: Partial<SellerStats>;
      }>(`/api/seller/listings?${params.toString()}`, {}, true);

      const nextItems = response.items || [];
      setItems(nextItems);

      const total = typeof response.totalCount === 'number'
        ? response.totalCount
        : typeof response.total === 'number'
          ? response.total
          : nextItems.length;
      setTotalCount(Math.max(0, total));
      setStats({
        total: Number(response.stats?.total || 0),
        approved: Number(response.stats?.approved || 0),
        pending: Number(response.stats?.pending || 0),
        sold: Number(response.stats?.sold || 0),
        draft: Number(response.stats?.draft || 0),
        rejected: Number(response.stats?.rejected || 0),
        archived: Number(response.stats?.archived || 0)
      });
      setError('');
    } catch (e: any) {
      setItems([]);
      setTotalCount(0);
      setStats({ total: 0, approved: 0, pending: 0, sold: 0, draft: 0, rejected: 0, archived: 0 });
      setError(e?.message || "Impossible de charger les annonces.");
      setNotice({ tone: 'error', text: tr("Impossible de charger les annonces. Vérifie ta connexion puis réessaie.", "Tsy afaka nampiditra ny filazana. Jereo ny fifandraisana dia andramo indray.") });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== 'Seller') {
      router.replace('/login');
      return;
    }
    loadPage(currentPage);
    apiFetch<SellerSubscriptionInfo>('/api/seller/subscription', {}, true)
      .then(setSubscriptionInfo)
      .catch(() => setSubscriptionInfo(null));
  }, [router, currentPage, statusFilter, sortBy]);

  useEffect(() => {
    const raw = router.query.notice;
    if (raw === 'created') {
      setNotice({ tone: 'success', text: 'Annonce créée avec succès.' });
    } else if (raw === 'updated') {
      setNotice({ tone: 'success', text: 'Annonce mise à jour avec succès.' });
    }
  }, [router.query.notice]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setCurrentPage(1);
      loadPage(1);
    }, 250);
    return () => window.clearTimeout(t);
  }, [keyword]);

  useEffect(() => {
    const missingIds = items
      .filter((x) => !!x.id)
      .filter((x) => !resolvedCoverIdsRef.current.has(x.id))
      .filter((x) => !fallbackCovers[x.id] && !getSellerCardCoverSrc(x))
      .map((x) => x.id);

    if (missingIds.length === 0) return;
    missingIds.forEach((id) => resolvedCoverIdsRef.current.add(id));

    let cancelled = false;
    (async () => {
      const pairs = await Promise.all(
        missingIds.map(async (id) => {
          try {
            const detail = await apiFetch<any>(`/api/seller/listings/${id}`, {}, true);
            return [id, getCoverFromListingDetails(detail)] as const;
          } catch {
            return [id, ''] as const;
          }
        })
      );

      if (cancelled) return;

      const next: Record<string, string> = {};
      for (const [id, src] of pairs) {
        if (src) next[id] = src;
      }
      if (Object.keys(next).length === 0) return;
      setFallbackCovers((prev) => ({ ...prev, ...next }));
    })();

    return () => {
      cancelled = true;
    };
  }, [items, fallbackCovers]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const pageNumbers = useMemo(() => {
    const start = Math.max(1, safePage - 2);
    const end = Math.min(totalPages, start + 4);
    const adjustedStart = Math.max(1, end - 4);
    return Array.from({ length: end - adjustedStart + 1 }, (_, i) => adjustedStart + i);
  }, [safePage, totalPages]);

  const runCardAction = async (id: string, action: 'submit' | 'mark-sold') => {
    if (action === 'mark-sold') {
      const ok = window.confirm('Marquer cette annonce comme vendue ?');
      if (!ok) return;
    }
    if (action === 'submit') {
      const ok = window.confirm('Remettre cette annonce en ligne ?');
      if (!ok) return;
    }

    setBusyId(id);
    setError('');
    try {
      const suffix = action === 'mark-sold' ? 'mark-sold' : 'submit';
      await apiFetch(`/api/seller/listings/${id}/${suffix}`, { method: 'POST' }, true);
      await loadPage(safePage);
      setNotice({
        tone: 'success',
        text: action === 'mark-sold'
          ? 'Annonce marquée comme vendue.'
          : 'Annonce publiée avec succès.'
      });
    } catch (e: any) {
      setError(e?.message || 'Opération impossible.');
      setNotice({ tone: 'error', text: e?.message || 'Opération impossible.' });
    } finally {
      setBusyId(null);
    }
  };

  const initiateListingPayment = async (listingId: string) => {
    setBusyId(listingId);
    setError('');
    try {
      const res = await apiFetch<any>('/api/seller/payments/initiate-listing', {
        method: 'POST',
        body: JSON.stringify({ listingId })
      }, true);
      const data = res?.data || res;
      const paymentId = data?.id || data?.Id;
      if (!paymentId) throw new Error('Réponse paiement invalide.');
      router.push(`/dashboard/payments/${paymentId}`);
    } catch (e: any) {
      setNotice({ tone: 'error', text: e?.message || 'Impossible d’initier le paiement.' });
      setError(e?.message || 'Impossible d’initier le paiement.');
    } finally {
      setBusyId(null);
    }
  };

  const statusTabs: Array<{ key: 'All' | ListingStatus; label: string; count: number }> = [
    { key: 'All', label: tr('Tous', 'Rehetra'), count: stats.total },
    { key: 'Draft', label: tr('Brouillons', 'Drafitra'), count: stats.draft },
    { key: 'Published', label: tr('Publiées', 'Navoaka'), count: stats.approved },
    { key: 'Rejected', label: tr('Rejetées', 'Nolavina'), count: stats.rejected },
    { key: 'Sold', label: tr('Vendues', 'Lafo'), count: stats.sold }
  ];

  return (
    <div className="grid gap-4">
      <div className="inlineActions items-center justify-between">
        <h1 className="text-2xl font-bold">{tr('Espace vendeur', 'Faritra mpivarotra')}</h1>
        <Link href="/dashboard/listings/new"><a className="primaryBtn">{tr('Nouvelle annonce', 'Filazana vaovao')}</a></Link>
      </div>

      <section className="card cardBody" style={{ display: 'grid', gap: '0.4rem' }}>
        <p className="sellerStatLabel" style={{ margin: 0 }}>Type de compte</p>
        <p style={{ margin: 0, fontWeight: 800, color: '#123564' }}>
          {subscriptionInfo?.accountType === 'Professional' ? 'Professionnel' : 'Particulier'}
          {subscriptionInfo?.accountType === 'Professional' && (
            <span style={{ marginLeft: 8, color: subscriptionInfo.hasActiveSubscription ? '#166534' : '#b45309', fontWeight: 700 }}>
              {subscriptionInfo.hasActiveSubscription ? 'Abonnement actif' : 'Abonnement inactif'}
            </span>
          )}
        </p>
        {subscriptionInfo?.message && <p className="muted" style={{ margin: 0 }}>{subscriptionInfo.message}</p>}
        <div className="inlineActions">
          <Link href="/dashboard/subscription"><a className="ghostBtn">Mon abonnement</a></Link>
        </div>
      </section>

      <section className="sellerStatsGrid">
        <article className="sellerStatCard"><p className="sellerStatLabel">Total annonces</p><p className="sellerStatValue">{stats.total}</p></article>
        <article className="sellerStatCard"><p className="sellerStatLabel">En ligne</p><p className="sellerStatValue">{stats.approved}</p></article>
        <article className="sellerStatCard"><p className="sellerStatLabel">En attente</p><p className="sellerStatValue">{stats.pending}</p></article>
        <article className="sellerStatCard"><p className="sellerStatLabel">Vendu</p><p className="sellerStatValue">{stats.sold}</p></article>
      </section>

      <div className="sellerTabsRow">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={statusFilter === tab.key ? 'primaryBtn sellerTabBtn' : 'ghostBtn sellerTabBtn'}
            onClick={() => { setStatusFilter(tab.key); setCurrentPage(1); }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <div className="card cardBody sellerToolbar">
        <input
          type="text"
          placeholder="Rechercher une annonce (titre, marque, modèle)"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}>
          <option value="newest">Tri: plus récent</option>
          <option value="price-asc">Prix croissant</option>
          <option value="price-desc">Prix décroissant</option>
          <option value="year-desc">Année récente</option>
          <option value="year-asc">Année ancienne</option>
          <option value="mileage-asc">Kilométrage faible</option>
          <option value="mileage-desc">Kilométrage élevé</option>
        </select>
        <button
          type="button"
          className="ghostBtn"
          onClick={() => { setKeyword(''); setSortBy('newest'); setStatusFilter('All'); setCurrentPage(1); }}
        >
          Réinitialiser
        </button>
      </div>

      {notice && (
        <p className={`sellerNotice ${notice.tone === 'success' ? 'sellerNoticeSuccess' : notice.tone === 'error' ? 'sellerNoticeError' : 'sellerNoticeInfo'}`}>
          {notice.text}
        </p>
      )}
      {error && !notice && <p className="text-red-400">{error}</p>}

      {loading ? <p className="muted">Chargement...</p> : null}

      {!loading && items.length === 0 ? (
        <div className="card cardBody sellerEmptyState">
          <h3>{stats.total === 0 ? 'Aucune annonce pour le moment' : 'Aucune annonce pour ce filtre'}</h3>
          <p className="muted">
            {stats.total === 0
              ? 'Crée une première annonce avec des photos pour accélérer la validation.'
              : 'Essaie un autre statut, change la recherche ou crée une nouvelle annonce.'}
          </p>
          <div className="inlineActions">
            <button type="button" className="ghostBtn" onClick={() => { setKeyword(''); setSortBy('newest'); setStatusFilter('All'); setCurrentPage(1); }}>
              Afficher toutes mes annonces
            </button>
            <Link href="/dashboard/listings/new"><a className="primaryBtn">Créer une annonce</a></Link>
          </div>
        </div>
      ) : (
        <div className="grid cards sellerCardsGrid">
          {items.map(x => {
            const latestPayment = (x as any)?.latestManualPayment;
            const latestPaymentStatus = String(latestPayment?.status || '').trim();
            const isIndividual = subscriptionInfo?.accountType !== 'Professional';
            const canSubmit = x.status === 'Draft' && (!isIndividual || latestPaymentStatus === 'Approved');
            const canMarkSold = x.status === 'Published' || x.status === 'Approved';
            const canRelist = x.status === 'Archived' || x.status === 'Sold';
            const isBusy = busyId === x.id;
            const canPayPublication = x.status === 'Draft' && isIndividual && latestPaymentStatus !== 'UnderReview' && latestPaymentStatus !== 'Approved';
            const coverSrc = getSellerCardCoverSrc(x) || fallbackCovers[x.id] || '';
            return (
              <Card
                key={x.id}
                className="sellerListingCard sellerListingCardClickable"
                role="link"
                tabIndex={0}
                onClick={() => router.push(`/dashboard/listings/${x.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push(`/dashboard/listings/${x.id}`);
                  }
                }}
              >
                <div className="sellerListingCoverWrap">
                  {coverSrc ? (
                    <img src={coverSrc} alt={x.title} loading="lazy" />
                  ) : (
                    <div className="sellerListingImageFallback">Pas de photo</div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="sellerCardHeader">
                    <span>{x.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="sellerListingCardBody">
                  <div className="sellerListingTop">
                    <div className="sellerListingInfo">
                      <p className="price sellerListingPrice">{x.price.toLocaleString()} Ar</p>
                      <p className="text-sm text-muted-foreground">{x.brand} {x.model} - {x.year}</p>
                      <p className="text-sm">{tr('Statut', 'Sata')}: <strong>{listingStatusLabel(String(x.status || ''), lang)}</strong></p>
                      <p className="text-sm text-muted-foreground">{tr('Publication', 'Famoahana')}: {formatPublishedDate(x.publishedAt)}</p>
                      <p className="text-sm text-muted-foreground">{tr('Mise à jour', 'Nohavaozina')}: {formatDate(x.updatedAt || x.createdAt)}</p>
                      <p className="text-sm text-muted-foreground">{tr('Référence', 'Fanondroana')}: {x.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                  </div>

                  <div className="sellerCardActions" onClick={(e) => e.stopPropagation()}>
                    {canPayPublication && (
                      <button
                        type="button"
                        className="primaryBtn"
                        onClick={() => initiateListingPayment(x.id)}
                        disabled={isBusy}
                      >
                        Payer
                      </button>
                    )}
                    {x.status === 'Draft' && latestPaymentStatus && (
                      <span className={`paymentBadge ${paymentStatusClass(latestPaymentStatus)}`} style={{ fontSize: '0.78rem' }}>
                        Paiement: {paymentStatusLabel(latestPaymentStatus)}
                      </span>
                    )}
                    {x.status === 'Rejected' && (
                      <span
                        className="sellerRejectedBadge"
                        title={x.rejectionReason || 'Aucune raison spécifiée par l\'admin.'}
                      >
                        Annonce rejetée
                      </span>
                    )}
                    {canSubmit && (
                      <button
                        type="button"
                        className="ghostBtn"
                        onClick={() => runCardAction(x.id, 'submit')}
                        disabled={isBusy}
                      >
                        {tr('Mettre en ligne', 'Alefa hohamarinina')}
                      </button>
                    )}
                    {x.status === 'Sold' && (
                      <img
                        src={lang === 'mg' ? '/status-badges/lafo.png' : '/status-badges/vendu.png'}
                        alt={lang === 'mg' ? 'Lafo' : 'Vendu'}
                        className="soldBadgeImg"
                        loading="lazy"
                      />
                    )}
                    {canRelist && (
                      <button
                        type="button"
                        className="ghostBtn"
                        onClick={() => runCardAction(x.id, 'submit')}
                        disabled={isBusy}
                      >
                        {tr('Remettre en ligne', 'Averina an-tserasera')}
                      </button>
                    )}
                    {canMarkSold && (
                      <button
                        type="button"
                        className="ghostBtn"
                        onClick={() => runCardAction(x.id, 'mark-sold')}
                        disabled={isBusy}
                      >
                        {tr('Marquer vendu', 'Mariho ho lafo')}
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="carsPagination">
        <button
          className="ghostBtn carsPageBtn"
          type="button"
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={safePage <= 1}
        >
          Précédent
        </button>
        <div className="carsPaginationPages">
          {pageNumbers.map((page) => (
            <button
              key={page}
              className={page === safePage ? 'primaryBtn carsPageBtn active' : 'ghostBtn carsPageBtn'}
              type="button"
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}
        </div>
        <button
          className="ghostBtn carsPageBtn"
          type="button"
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={safePage >= totalPages}
        >
          Suivant
        </button>
      </div>
    </div>
  );
}










