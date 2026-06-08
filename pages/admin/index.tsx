import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import AdminSectionNav from '@/components/admin/AdminSectionNav';
import { resolveMediaUrl } from '@/lib/media';
import { listingStatusLabel, roleLabel } from '@/lib/ui-labels';
import { useI18n } from '@/lib/i18n';
import type {
  AdminDecisionItem,
  AdminKpis,
  AdminListingDetail,
  AdminListingItem,
  AdminLogItem,
  AdminUserItem,
  ApiResponse,
  PagedResult
} from '@/lib/types';

type AdminTab = 'validation' | 'users' | 'moderation' | 'pilotage' | 'referentiel' | 'sales';
type MetadataTab = 'brands' | 'categories' | 'cities' | 'models';

type MetadataItem = {
  id: string;
  name: string;
  slug?: string;
  isActive: boolean;
};

type MetadataModelItem = MetadataItem & {
  brandId: string;
  brandName?: string;
};

type AdminSoldListingItem = AdminListingItem & {
  city?: string;
  category?: string;
  updatedAt?: string;
  sellerPhoneNumber?: string;
};

type AdminSalesNotificationItem = AdminSoldListingItem & {
  isRead?: boolean;
};

type SalesNotificationsResult = {
  page: number;
  pageSize: number;
  total: number;
  unreadCount: number;
  items: AdminSalesNotificationItem[];
};

type SalesSummary = {
  totalSold: number;
  totalAmount: number;
  averagePrice: number;
  byBrand: Array<{
    brandId: string;
    brand: string;
    soldCount: number;
    totalAmount: number;
    averagePrice: number;
    minPrice: number;
    maxPrice: number;
  }>;
};

const PAGE_SIZE = 10;
const METADATA_PAGE_SIZE = 10;
const NOTIFICATION_PAGE_SIZE = 10;

function getAdminCardCoverSrc(item: any): string {
  if (!item) return '';
  return resolveMediaUrl(
    item?.coverImage
    || item?.coverImageUrl
    || item?.imageUrl
    || item?.thumbnailUrl
    || item?.firstImage
    || item?.firstImageUrl
    || (typeof item?.images?.[0] === 'string' ? item.images[0] : '')
    || item?.images?.[0]?.url
    || item?.images?.[0]?.Url
    || (typeof item?.photos?.[0] === 'string' ? item.photos[0] : '')
    || item?.photos?.[0]?.url
    || item?.photos?.[0]?.Url
    || ''
  );
}

function getCoverFromAdminListingDetails(data: any): string {
  const direct = getAdminCardCoverSrc(data || {});
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

  const photos = Array.isArray(data?.photos) ? data.photos : [];
  for (const photo of photos) {
    const candidate = resolveMediaUrl(
      (typeof photo === 'string' ? photo : '')
      || photo?.url
      || photo?.Url
      || photo?.imageUrl
      || ''
    );
    if (candidate) return candidate;
  }

  return '';
}

function toErrorMessage(error: any): string {
  const fallback = 'Opération impossible.';
  if (!error?.message) return fallback;

  try {
    const parsed = JSON.parse(String(error.message));
    if (typeof parsed?.message === 'string' && parsed.message.trim()) {
      return translateApiMessage(parsed.message);
    }
  } catch {
    return translateApiMessage(String(error.message));
  }

  return translateApiMessage(String(error.message));
}

function translateApiMessage(message: string): string {
  const m = message.trim();
  switch (m) {
    case 'Listing not found.':
      return 'Annonce introuvable.';
    case 'Listing approved.':
      return 'Annonce approuvée.';
    case 'Listing rejected.':
      return 'Annonce rejetée.';
    case 'Listing restored to pending review.':
      return 'Annonce remise en attente de validation.';
    case 'Listing already archived.':
      return 'Annonce déjà archivée.';
    case 'Rejection reason is required.':
      return 'Le motif de rejet est obligatoire.';
    case 'Listing cannot be approved.':
      return 'Cette annonce ne peut pas être approuvée.';
    case 'Listing cannot be rejected.':
      return 'Cette annonce ne peut pas être rejetée.';
    case 'Listing cannot be restored.':
      return 'Cette annonce ne peut pas être restaurée.';
    case 'Only archived listings can be restored.':
      return 'Seules les annonces archivées peuvent être restaurées.';
    case 'Only pending listings can be approved.':
      return 'Seules les annonces en attente peuvent être approuvées.';
    case 'Only pending listings can be rejected.':
      return 'Seules les annonces en attente peuvent être rejetées.';
    default:
      return m;
  }
}

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
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(dt);
}

function formatDaysBetween(from?: string, to?: string): string {
  if (!from || !to) return '-';
  const fromDate = new Date(from);
  const toDate = new Date(to);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) return '-';
  const diffMs = toDate.getTime() - fromDate.getTime();
  const days = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  return `${days} j`;
}

function Pagination({
  page,
  total,
  pageSize,
  onChange
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (next: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pages = useMemo(() => {
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    const finalStart = Math.max(1, end - 4);
    return Array.from({ length: end - finalStart + 1 }, (_, i) => finalStart + i);
  }, [page, totalPages]);

  return (
    <div className="carsPagination">
      <button className="ghostBtn carsPageBtn" type="button" onClick={() => onChange(page - 1)} disabled={page <= 1}>
        Précédent
      </button>
      <div className="carsPaginationPages">
        {pages.map((p) => (
          <button
            key={p}
            className={p === page ? 'primaryBtn carsPageBtn active' : 'ghostBtn carsPageBtn'}
            type="button"
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        ))}
      </div>
      <button className="ghostBtn carsPageBtn" type="button" onClick={() => onChange(page + 1)} disabled={page >= totalPages}>
        Suivant
      </button>
    </div>
  );
}

export default function AdminPage() {
  const { tr, lang } = useI18n();
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>('sales');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [kpis, setKpis] = useState<AdminKpis | null>(null);
  const [logs, setLogs] = useState<PagedResult<AdminLogItem> | null>(null);
  const [logsPage, setLogsPage] = useState(1);

  const [pending, setPending] = useState<PagedResult<AdminListingItem> | null>(null);
  const [pendingPage, setPendingPage] = useState(1);
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const [moderation, setModeration] = useState<PagedResult<AdminListingItem> | null>(null);
  const [moderationPage, setModerationPage] = useState(1);
  const [moderationFilters, setModerationFilters] = useState({
    keyword: '',
    sellerId: '',
    status: '',
    dateFromUtc: '',
    dateToUtc: ''
  });
  const [selectedListing, setSelectedListing] = useState<AdminListingDetail | null>(null);
  const [decisions, setDecisions] = useState<PagedResult<AdminDecisionItem> | null>(null);

  const [users, setUsers] = useState<PagedResult<AdminUserItem> | null>(null);
  const [usersPage, setUsersPage] = useState(1);
  const [usersFilters, setUsersFilters] = useState({ keyword: '', role: '', isActive: '' });
  const [coverByListingId, setCoverByListingId] = useState<Record<string, string>>({});
  const [sales, setSales] = useState<PagedResult<AdminSoldListingItem> | null>(null);
  const [salesPage, setSalesPage] = useState(1);
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [salesNotifications, setSalesNotifications] = useState<AdminSalesNotificationItem[]>([]);
  const [salesNotifOpen, setSalesNotifOpen] = useState(false);
  const [salesNotifPage, setSalesNotifPage] = useState(1);
  const [salesNotifHasMore, setSalesNotifHasMore] = useState(true);
  const [salesNotifLoadingMore, setSalesNotifLoadingMore] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [salesFilters, setSalesFilters] = useState({
    keyword: '',
    brandId: '',
    modelId: '',
    categoryId: '',
    cityId: '',
    dateFromUtc: '',
    dateToUtc: ''
  });
  const [salesBrands, setSalesBrands] = useState<MetadataItem[]>([]);
  const [salesCategories, setSalesCategories] = useState<MetadataItem[]>([]);
  const [salesCities, setSalesCities] = useState<MetadataItem[]>([]);
  const [salesModels, setSalesModels] = useState<MetadataItem[]>([]);
  const [brandsMeta, setBrandsMeta] = useState<PagedResult<MetadataItem> | null>(null);
  const [categoriesMeta, setCategoriesMeta] = useState<PagedResult<MetadataItem> | null>(null);
  const [citiesMeta, setCitiesMeta] = useState<PagedResult<MetadataItem> | null>(null);
  const [modelsMeta, setModelsMeta] = useState<PagedResult<MetadataModelItem> | null>(null);
  const [brandOptions, setBrandOptions] = useState<MetadataItem[]>([]);
  const [metadataBusy, setMetadataBusy] = useState(false);
  const [metadataTab, setMetadataTab] = useState<MetadataTab>('brands');
  const [brandsMetaPage, setBrandsMetaPage] = useState(1);
  const [categoriesMetaPage, setCategoriesMetaPage] = useState(1);
  const [citiesMetaPage, setCitiesMetaPage] = useState(1);
  const [modelsMetaPage, setModelsMetaPage] = useState(1);

  const [newBrandName, setNewBrandName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCityName, setNewCityName] = useState('');
  const [newModelName, setNewModelName] = useState('');
  const [newModelBrandId, setNewModelBrandId] = useState('');

  const [brandDrafts, setBrandDrafts] = useState<Record<string, string>>({});
  const [categoryDrafts, setCategoryDrafts] = useState<Record<string, string>>({});
  const [cityDrafts, setCityDrafts] = useState<Record<string, string>>({});
  const [modelDrafts, setModelDrafts] = useState<Record<string, string>>({});
  const [modelBrandDrafts, setModelBrandDrafts] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [metadataLoaded, setMetadataLoaded] = useState(false);

  const loadDashboard = async (page = logsPage) => {
    const [kpiData, logsData] = await Promise.all([
      fetchWrapped<AdminKpis>('/api/admin/dashboard'),
      fetchWrapped<PagedResult<AdminLogItem>>(`/api/admin/logs?page=${page}&pageSize=${PAGE_SIZE}`)
    ]);
    setKpis(kpiData);
    setLogs(logsData);
  };

  const hydrateCovers = async (items: Array<{ id: string; coverImage?: string }>) => {
    const missingIds = items
      .filter((x) => !getAdminCardCoverSrc(x))
      .map((x) => x.id);

    if (missingIds.length === 0) return;

    const results = await Promise.all(
      missingIds.map(async (id) => {
        try {
          const detail = await fetchWrapped<AdminListingDetail>(`/api/admin/listings/${id}`);
          return [id, getCoverFromAdminListingDetails(detail)] as const;
        } catch {
          return [id, ''] as const;
        }
      })
    );

    const next: Record<string, string> = {};
    for (const [id, url] of results) {
      if (url) next[id] = url;
    }
    if (Object.keys(next).length > 0) {
      setCoverByListingId((prev) => ({ ...prev, ...next }));
    }
  };

  const loadPending = async (page = pendingPage) => {
    const data = await fetchWrapped<PagedResult<AdminListingItem>>(
      `/api/admin/listings/pending?page=${page}&pageSize=${PAGE_SIZE}`
    );
    setPending(data);
    await hydrateCovers(data.items || []);
  };

  const loadModeration = async (page = moderationPage) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(PAGE_SIZE));
    if (moderationFilters.keyword.trim()) params.set('keyword', moderationFilters.keyword.trim());
    if (moderationFilters.sellerId.trim()) params.set('sellerId', moderationFilters.sellerId.trim());
    if (moderationFilters.status.trim()) params.set('status', moderationFilters.status.trim());
    if (moderationFilters.dateFromUtc) params.set('dateFromUtc', moderationFilters.dateFromUtc);
    if (moderationFilters.dateToUtc) params.set('dateToUtc', moderationFilters.dateToUtc);

    const data = await fetchWrapped<PagedResult<AdminListingItem>>(`/api/admin/listings?${params.toString()}`);
    setModeration(data);
    await hydrateCovers(data.items || []);
  };

  const loadUsers = async (page = usersPage) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(PAGE_SIZE));
    if (usersFilters.keyword.trim()) params.set('keyword', usersFilters.keyword.trim());
    if (usersFilters.role.trim()) params.set('role', usersFilters.role.trim());
    if (usersFilters.isActive === 'true' || usersFilters.isActive === 'false') params.set('isActive', usersFilters.isActive);

    const data = await fetchWrapped<PagedResult<AdminUserItem>>(`/api/admin/users?${params.toString()}`);
    setUsers(data);
  };

  const buildSalesQuery = (page?: number, filters = salesFilters) => {
    const params = new URLSearchParams();
    if (typeof page === 'number') {
      params.set('page', String(page));
      params.set('pageSize', String(PAGE_SIZE));
    }
    params.set('status', 'Sold');
    if (filters.keyword.trim()) params.set('keyword', filters.keyword.trim());
    if (filters.brandId.trim()) params.set('brandId', filters.brandId.trim());
    if (filters.modelId.trim()) params.set('modelId', filters.modelId.trim());
    if (filters.categoryId.trim()) params.set('categoryId', filters.categoryId.trim());
    if (filters.cityId.trim()) params.set('cityId', filters.cityId.trim());
    if (filters.dateFromUtc) params.set('dateFromUtc', filters.dateFromUtc);
    if (filters.dateToUtc) params.set('dateToUtc', filters.dateToUtc);
    return params.toString();
  };

  const loadSales = async (page = salesPage, filters = salesFilters) => {
    const data = await fetchWrapped<PagedResult<AdminSoldListingItem>>(`/api/admin/listings?${buildSalesQuery(page, filters)}`);
    setSales(data);
    await hydrateCovers(data.items || []);
  };

  const loadSalesSummary = async (filters = salesFilters) => {
    const data = await fetchWrapped<SalesSummary>(`/api/admin/listings/sales-summary?${buildSalesQuery(undefined, filters)}`);
    setSalesSummary(data);
  };

  const loadSalesNotifications = async (reset = false) => {
    const page = reset ? 1 : salesNotifPage;
    const data = await fetchWrapped<SalesNotificationsResult>(`/api/admin/listings/sales-notifications?page=${page}&pageSize=${NOTIFICATION_PAGE_SIZE}`);
    const items = data.items || [];
    setUnreadNotificationsCount(data.unreadCount || 0);

    if (reset) {
      setSalesNotifications(items);
      setSalesNotifPage(2);
    } else {
      setSalesNotifications((prev) => {
        const map = new Map<string, AdminSalesNotificationItem>();
        for (const item of prev) map.set(item.id, item);
        for (const item of items) map.set(item.id, item);
        return Array.from(map.values());
      });
      setSalesNotifPage((prev) => prev + 1);
    }

    setSalesNotifHasMore(page * (data.pageSize || NOTIFICATION_PAGE_SIZE) < (data.total || 0));
  };

  const loadSalesLookups = async () => {
    const [brandsData, categoriesData, citiesData] = await Promise.all([
      apiFetch<MetadataItem[]>('/api/metadata/brands'),
      apiFetch<MetadataItem[]>('/api/metadata/categories'),
      apiFetch<MetadataItem[]>('/api/metadata/cities')
    ]);
    setSalesBrands(brandsData || []);
    setSalesCategories(categoriesData || []);
    setSalesCities(citiesData || []);
  };

  const loadBrandOptions = async () => {
    const items = await fetchWrapped<MetadataItem[]>('/api/admin/metadata/brands/options');
    setBrandOptions(items || []);
    if (!newModelBrandId && (items || []).length > 0) {
      setNewModelBrandId(items[0].id);
    }
  };

  const loadMetadataBrands = async (page = brandsMetaPage) => {
    const data = await fetchWrapped<PagedResult<MetadataItem>>(`/api/admin/metadata/brands?page=${page}&pageSize=${METADATA_PAGE_SIZE}`);
    setBrandsMeta(data);
    setBrandDrafts((prev) => {
      const next = { ...prev };
      for (const item of data.items || []) next[item.id] = item.name || '';
      return next;
    });
  };

  const loadMetadataCategories = async (page = categoriesMetaPage) => {
    const data = await fetchWrapped<PagedResult<MetadataItem>>(`/api/admin/metadata/categories?page=${page}&pageSize=${METADATA_PAGE_SIZE}`);
    setCategoriesMeta(data);
    setCategoryDrafts((prev) => {
      const next = { ...prev };
      for (const item of data.items || []) next[item.id] = item.name || '';
      return next;
    });
  };

  const loadMetadataCities = async (page = citiesMetaPage) => {
    const data = await fetchWrapped<PagedResult<MetadataItem>>(`/api/admin/metadata/cities?page=${page}&pageSize=${METADATA_PAGE_SIZE}`);
    setCitiesMeta(data);
    setCityDrafts((prev) => {
      const next = { ...prev };
      for (const item of data.items || []) next[item.id] = item.name || '';
      return next;
    });
  };

  const loadMetadataModels = async (page = modelsMetaPage) => {
    const data = await fetchWrapped<PagedResult<MetadataModelItem>>(`/api/admin/metadata/models?page=${page}&pageSize=${METADATA_PAGE_SIZE}`);
    setModelsMeta(data);
    setModelDrafts((prev) => {
      const next = { ...prev };
      for (const item of data.items || []) next[item.id] = item.name || '';
      return next;
    });
    setModelBrandDrafts((prev) => {
      const next = { ...prev };
      for (const item of data.items || []) next[item.id] = item.brandId || '';
      return next;
    });
  };

  const loadListingDetail = async (id: string) => {
    const [detail, decisionData] = await Promise.all([
      fetchWrapped<AdminListingDetail>(`/api/admin/listings/${id}`),
      fetchWrapped<PagedResult<AdminDecisionItem>>(`/api/admin/listings/${id}/decisions?page=1&pageSize=20`)
    ]);
    setSelectedListing(detail);
    setDecisions(decisionData);
  };

  const guardedLoad = async (fn: () => Promise<void>) => {
    setLoading(true);
    setError('');
    try {
      await fn();
    } catch (e: any) {
      setError(toErrorMessage(e));
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
    guardedLoad(async () => {
      await Promise.all([
        loadDashboard(1),
        loadModeration(1),
        loadUsers(1),
        loadSalesLookups(),
        loadSales(1),
        loadSalesSummary(),
        loadSalesNotifications(true)
      ]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    if (!router.isReady) return;
    const qTab = typeof router.query.tab === 'string' ? router.query.tab : '';
    if (qTab === 'sales') setTab('sales');
    const listingId = typeof router.query.listingId === 'string' ? router.query.listingId : '';
    if (listingId) {
      guardedLoad(() => loadListingDetail(listingId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query.tab, router.query.listingId]);

  useEffect(() => {
    if (!salesFilters.brandId) {
      setSalesModels([]);
      setSalesFilters((prev) => ({ ...prev, modelId: '' }));
      return;
    }

    apiFetch<MetadataItem[]>(`/api/metadata/brands/${salesFilters.brandId}/models`)
      .then((data) => setSalesModels(data || []))
      .catch(() => setSalesModels([]));
  }, [salesFilters.brandId]);

  useEffect(() => {
    if (tab !== 'referentiel' || metadataLoaded) return;
    guardedLoad(async () => {
      await Promise.all([
        loadBrandOptions(),
        loadMetadataBrands(1),
        loadMetadataCategories(1),
        loadMetadataCities(1),
        loadMetadataModels(1)
      ]);
      setMetadataLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, metadataLoaded]);

  const handleNotificationClick = async (listingId: string) => {
    const markResult = await fetchWrapped<{ marked: number; unreadCount: number }>('/api/admin/listings/sales-notifications/read', {
      method: 'POST',
      body: JSON.stringify({ listingIds: [listingId] })
    });
    setSalesNotifications((prev) => prev.map((item) => (item.id === listingId ? { ...item, isRead: true } : item)));
    setUnreadNotificationsCount(typeof markResult.unreadCount === 'number' ? markResult.unreadCount : 0);
    setSalesNotifOpen(false);
    router.push(`/admin?tab=sales&listingId=${listingId}`);
  };

  const handleNotificationScroll = async (e: any) => {
    const el = e.currentTarget;
    if (!salesNotifHasMore || salesNotifLoadingMore) return;
    if (el.scrollTop + el.clientHeight < el.scrollHeight - 24) return;
    setSalesNotifLoadingMore(true);
    try {
      await loadSalesNotifications(false);
    } finally {
      setSalesNotifLoadingMore(false);
    }
  };

  const approve = async (id: string) => {
    setBusyId(id);
    setError('');
    setSuccess('');
    try {
      await fetchWrapped(`/api/admin/listings/${id}/approve`, { method: 'POST' });
      setSuccess('Annonce approuvée.');
      await Promise.all([loadPending(pendingPage), loadModeration(moderationPage), loadDashboard(logsPage)]);
      if (selectedListing?.id === id) await loadListingDetail(id);
    } catch (e: any) {
      setError(toErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id: string) => {
    const reason = (rejectReasons[id] || '').trim();
    if (!reason) {
      setError('Le motif de rejet est obligatoire.');
      return;
    }

    setBusyId(id);
    setError('');
    setSuccess('');
    try {
      await fetchWrapped(`/api/admin/listings/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      setSuccess('Annonce rejetée.');
      await Promise.all([loadPending(pendingPage), loadModeration(moderationPage), loadDashboard(logsPage)]);
      if (selectedListing?.id === id) await loadListingDetail(id);
    } catch (e: any) {
      setError(toErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const listingAction = async (id: string, action: 'archive' | 'hide' | 'restore') => {
    setBusyId(id);
    setError('');
    setSuccess('');
    try {
      await fetchWrapped(`/api/admin/listings/${id}/${action}`, { method: 'POST' });
      if (action === 'archive') {
        setSuccess('Annonce archivée.');
      } else if (action === 'restore') {
        setSuccess('Annonce remise en ligne.');
      } else {
        setSuccess('Action effectuée.');
      }
      await Promise.all([loadModeration(moderationPage), loadDashboard(logsPage)]);
      if (selectedListing?.id === id) await loadListingDetail(id);
    } catch (e: any) {
      setError(toErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const setActivation = async (id: string, isActive: boolean) => {
    setBusyId(id);
    setError('');
    setSuccess('');
    try {
      await fetchWrapped(`/api/admin/users/${id}/activation`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive })
      });
      setSuccess('État du compte mis à jour.');
      await Promise.all([loadUsers(usersPage), loadDashboard(logsPage)]);
    } catch (e: any) {
      setError(toErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const setRole = async (id: string, role: 'Admin' | 'Seller') => {
    setBusyId(id);
    setError('');
    setSuccess('');
    try {
      await fetchWrapped(`/api/admin/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role })
      });
      setSuccess('Rôle utilisateur mis à jour.');
      await Promise.all([loadUsers(usersPage), loadDashboard(logsPage)]);
    } catch (e: any) {
      setError(toErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const mutateMetadata = async (path: string, init: RequestInit, successMessage: string) => {
    setMetadataBusy(true);
    setError('');
    setSuccess('');
    try {
      await fetchWrapped(path, init);
      setSuccess(successMessage);
      await Promise.all([
        loadDashboard(logsPage),
        loadBrandOptions(),
        loadMetadataBrands(brandsMetaPage),
        loadMetadataCategories(categoriesMetaPage),
        loadMetadataCities(citiesMetaPage),
        loadMetadataModels(modelsMetaPage)
      ]);
    } catch (e: any) {
      setError(toErrorMessage(e));
    } finally {
      setMetadataBusy(false);
    }
  };

  const brandsTotal = brandsMeta?.total || 0;
  const categoriesTotal = categoriesMeta?.total || 0;
  const citiesTotal = citiesMeta?.total || 0;
  const modelsTotal = modelsMeta?.total || 0;

  const brandsVisible = brandsMeta?.items || [];
  const categoriesVisible = categoriesMeta?.items || [];
  const citiesVisible = citiesMeta?.items || [];
  const modelsVisible = modelsMeta?.items || [];

  return (
    <div className="grid gap-4">
      <AdminSectionNav active="overview" />
      <div className="inlineActions" style={{ justifyContent: 'space-between' }}>
        <h1 className="text-2xl font-bold">{tr('Administration CarHub', 'Fitantanana CarHub')}</h1>
        <div className="inlineActions" style={{ position: 'relative' }}>
          <button
            className="ghostBtn"
            type="button"
            onClick={() => {
              const next = !salesNotifOpen;
              setSalesNotifOpen(next);
              if (next && salesNotifications.length === 0) {
                guardedLoad(() => loadSalesNotifications(true));
              }
            }}
            title="Notifications ventes"
            style={{ position: 'relative' }}
          >
            <span aria-hidden="true">🔔</span>
            {unreadNotificationsCount > 0 && (
              <>
                <span
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    width: 10,
                    height: 10,
                    backgroundColor: '#e11d48',
                    borderRadius: '9999px'
                  }}
                />
                <span style={{ marginLeft: 6 }}>{unreadNotificationsCount}</span>
              </>
            )}
          </button>
          {salesNotifOpen && (
            <div className="card cardBody" style={{ position: 'absolute', right: 0, top: '110%', zIndex: 20, width: 420, maxWidth: '90vw' }}>
              <div style={{ marginTop: 0, marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #dbe4f0' }}>
                <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#2563eb' }}>
                  Notifications
                </p>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  Dernières ventes
                </h3>
              </div>
              {salesNotifications.length ? (
                <div className="grid gap-2" style={{ maxHeight: 360, overflowY: 'auto' }} onScroll={handleNotificationScroll}>
                  {salesNotifications.map((x) => (
                    <button
                      key={x.id}
                      type="button"
                      className="card cardBody"
                      style={{
                        padding: '0.6rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        background: x.isRead ? 'white' : '#eff6ff',
                        border: x.isRead ? '1px solid #dbe4f0' : '1px solid #93c5fd'
                      }}
                      onClick={() => guardedLoad(() => handleNotificationClick(x.id))}
                    >
                      <p style={{ margin: 0, fontWeight: 700 }}>{x.brand} {x.model} ({x.year})</p>
                      <p style={{ margin: 0 }}>{x.title}</p>
                      <p className="muted" style={{ margin: 0 }}>
                        {formatDate(x.updatedAt || x.createdAt)} • Vendeur: {x.sellerName}
                        {!x.isRead && <span style={{ color: '#e11d48', marginLeft: 6 }}>•</span>}
                      </p>
                    </button>
                  ))}
                  {salesNotifLoadingMore && <p className="muted" style={{ margin: 0 }}>Chargement...</p>}
                </div>
              ) : (
                <p className="muted" style={{ margin: 0 }}>Aucune notification pour le moment.</p>
              )}
            </div>
          )}
          <button
            className="ghostBtn"
            type="button"
            onClick={() => guardedLoad(async () => {
              await Promise.all([
                loadDashboard(logsPage),
                loadModeration(moderationPage),
              loadUsers(usersPage),
              loadSalesLookups(),
              loadSales(salesPage),
              loadSalesSummary(),
              loadSalesNotifications(true)
            ]);
          })}
            disabled={loading}
          >
            {tr('Rafraîchir', 'Havaozy')}
          </button>
        </div>
      </div>

      <div className="inlineActions">
        <button type="button" className={tab === 'users' ? 'primaryBtn' : 'ghostBtn'} onClick={() => setTab('users')}>{tr('Gestion utilisateurs', 'Fitantanana mpampiasa')}</button>
        <button type="button" className={tab === 'moderation' ? 'primaryBtn' : 'ghostBtn'} onClick={() => setTab('moderation')}>{tr('Modération', 'Fanarahamaso')}</button>
        <button type="button" className={tab === 'pilotage' ? 'primaryBtn' : 'ghostBtn'} onClick={() => setTab('pilotage')}>{tr('Pilotage', 'Fanaraha-maso')}</button>
        <button type="button" className={tab === 'sales' ? 'primaryBtn' : 'ghostBtn'} onClick={() => setTab('sales')}>Ventes</button>
        <button type="button" className={tab === 'referentiel' ? 'primaryBtn' : 'ghostBtn'} onClick={() => setTab('referentiel')}>Référentiel</button>
      </div>

      {error && <p className="sellerNotice sellerNoticeError">{error}</p>}
      {success && <p className="sellerNotice sellerNoticeSuccess">{success}</p>}
      {loading && <p className="muted">Chargement...</p>}

      {tab === 'validation' && (
        <section className="grid gap-3">
          <h2 className="text-xl font-semibold">File en attente</h2>
          {pending?.items?.length ? (
            <>
              <div className="grid cards">
                {pending.items.map((item) => (
                  <article key={item.id} className="card cardBody adminReviewCard">
                    <div className="adminReviewMedia">
                      {getAdminCardCoverSrc(item) || coverByListingId[item.id] ? (
                        <img
                          src={getAdminCardCoverSrc(item) || coverByListingId[item.id]}
                          alt={item.title}
                          loading="lazy"
                        />
                      ) : (
                        <span>Pas de photo</span>
                      )}
                    </div>
                    <div className="adminReviewContent">
                      <h3>{item.title}</h3>
                      <p className="price">{item.price.toLocaleString()} Ar</p>
                      <p>{item.brand} {item.model} - {item.year}</p>
                      <p className="muted">Vendeur: {item.sellerEmail}</p>
                      <p className="muted">Créée: {formatDate(item.createdAt)}</p>
                      <textarea
                        className="adminRejectTextarea"
                        placeholder="Motif de rejet"
                        required
                        value={rejectReasons[item.id] || ''}
                        onChange={(e) => setRejectReasons((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      />
                      <div className="inlineActions">
                        <button className="primaryBtn" type="button" disabled={busyId === item.id} onClick={() => approve(item.id)}>
                          {busyId === item.id ? 'Traitement...' : 'Approuver'}
                        </button>
                        <button
                          className="ghostBtn"
                          type="button"
                          disabled={busyId === item.id || !(rejectReasons[item.id] || '').trim()}
                          onClick={() => reject(item.id)}
                          title={!(rejectReasons[item.id] || '').trim() ? 'Ajoute un motif de rejet avant de continuer.' : undefined}
                        >
                          Rejeter
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              <Pagination
                page={pending.page}
                total={pending.total}
                pageSize={pending.pageSize}
                onChange={(next) => {
                  setPendingPage(next);
                  guardedLoad(() => loadPending(next));
                }}
              />

              {selectedListing && (
                <div className="card cardBody grid gap-3">
                  <h3>Détail annonce</h3>
                  <p><strong>{selectedListing.title}</strong> - {selectedListing.brand} {selectedListing.model}</p>
                  <p>{selectedListing.description}</p>
                  <p className="muted">{tr('Statut', 'Sata')}: {listingStatusLabel(String(selectedListing.status || ''), lang)} | {tr('Créée', 'Noforonina')}: {formatDate(selectedListing.createdAt)}</p>
                  <p className="muted">Vendeur: {selectedListing.seller.fullName} ({selectedListing.seller.email})</p>
                  <div className="listingImagesGrid">
                    {selectedListing.photos?.map((photo) => (
                      <div key={photo.id} className="listingImageThumb">
                        <img src={resolveMediaUrl(photo.url)} alt="Annonce" />
                      </div>
                    ))}
                  </div>

                  <div>
                    <h4>Historique décisions</h4>
                    {decisions?.items?.length ? (
                      <ul>
                        {decisions.items.map((d) => (
                          <li key={d.id}>
                            {d.action} par {d.adminEmail} ({formatDate(d.createdAt)})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="muted">Aucune décision enregistrée.</p>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card cardBody"><p className="muted">Aucune annonce en attente.</p></div>
          )}
        </section>
      )}

      {tab === 'users' && (
        <section className="grid gap-3">
          <h2 className="text-xl font-semibold">Utilisateurs</h2>
          <div className="card cardBody sellerToolbar">
            <input
              type="text"
              placeholder="Recherche email/nom"
              value={usersFilters.keyword}
              onChange={(e) => setUsersFilters((s) => ({ ...s, keyword: e.target.value }))}
            />
            <select value={usersFilters.role} onChange={(e) => setUsersFilters((s) => ({ ...s, role: e.target.value }))}>
              <option value="">Tous rôles</option>
              <option value="Seller">Vendeur</option>
              <option value="Admin">Administrateur</option>
            </select>
            <select value={usersFilters.isActive} onChange={(e) => setUsersFilters((s) => ({ ...s, isActive: e.target.value }))}>
              <option value="">Actif + Inactif</option>
              <option value="true">Actifs</option>
              <option value="false">Inactifs</option>
            </select>
            <button type="button" className="primaryBtn" onClick={() => guardedLoad(() => loadUsers(1))}>Filtrer</button>
          </div>

          <div className="card cardBody" style={{ overflowX: 'auto' }}>
            <table className="adminDataTable" style={{ width: '100%', minWidth: 900 }}>
              <thead>
                <tr>
                  <th align="left">Nom</th><th align="left">Email</th><th align="left">Rôle</th><th align="left">État</th><th align="left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users?.items?.map((u) => (
                  <tr key={u.id}>
                    <td>{u.fullName}</td>
                    <td>{u.email}</td>
                    <td>{roleLabel(String(u.role || ''), lang)}</td>
                    <td>{u.isActive ? 'Actif' : 'Inactif'}</td>
                    <td>
                      <div className="inlineActions">
                        <button className="ghostBtn" type="button" disabled={busyId === u.id} onClick={() => setActivation(u.id, !u.isActive)}>
                          {u.isActive ? 'Désactiver' : 'Activer'}
                        </button>
                        {u.role === 'Seller' ? (
                          <button className="ghostBtn" type="button" disabled={busyId === u.id} onClick={() => setRole(u.id, 'Admin')}>
                            Passer en administrateur
                          </button>
                        ) : (
                          <button className="ghostBtn" type="button" disabled={busyId === u.id} onClick={() => setRole(u.id, 'Seller')}>
                            Passer en vendeur
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users && (
            <Pagination
              page={users.page}
              total={users.total}
              pageSize={users.pageSize}
              onChange={(next) => {
                setUsersPage(next);
                guardedLoad(() => loadUsers(next));
              }}
            />
          )}
        </section>
      )}

      {tab === 'moderation' && (
        <section className="grid gap-3">
          <h2 className="text-xl font-semibold">Recherche et modération annonces</h2>
          <div className="card cardBody sellerToolbar">
            <input
              type="text"
              placeholder="Mot-clé / titre / marque / email vendeur"
              value={moderationFilters.keyword}
              onChange={(e) => setModerationFilters((s) => ({ ...s, keyword: e.target.value }))}
            />
            <input
              type="text"
              placeholder="SellerId (optionnel)"
              value={moderationFilters.sellerId}
              onChange={(e) => setModerationFilters((s) => ({ ...s, sellerId: e.target.value }))}
            />
            <select value={moderationFilters.status} onChange={(e) => setModerationFilters((s) => ({ ...s, status: e.target.value }))}>
              <option value="">Tous statuts</option>
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
              <option value="Rejected">Rejected</option>
              <option value="Archived">Archived</option>
              <option value="Sold">Sold</option>
            </select>
            <input type="date" value={moderationFilters.dateFromUtc} onChange={(e) => setModerationFilters((s) => ({ ...s, dateFromUtc: e.target.value }))} />
            <input type="date" value={moderationFilters.dateToUtc} onChange={(e) => setModerationFilters((s) => ({ ...s, dateToUtc: e.target.value }))} />
            <button type="button" className="primaryBtn" onClick={() => guardedLoad(() => loadModeration(1))}>Filtrer</button>
          </div>

          <div className="grid cards">
            {moderation?.items?.map((item) => (
              <article key={item.id} className="card cardBody adminModerationCard">
                <div className="adminModerationMedia">
                  {getAdminCardCoverSrc(item) || coverByListingId[item.id] ? (
                    <img
                      src={getAdminCardCoverSrc(item) || coverByListingId[item.id]}
                      alt={item.title}
                      loading="lazy"
                    />
                  ) : (
                    <span>Pas de photo</span>
                  )}
                </div>
                <div className="adminModerationContent">
                  <h3>{item.title}</h3>
                  <p className="price">{item.price.toLocaleString()} Ar</p>
                  <p>{item.brand} {item.model} - {item.year}</p>
                  <p className="muted">{tr('Statut', 'Sata')}: {listingStatusLabel(String(item.status || ''), lang)}</p>
                  <p className="muted">Vendeur: {item.sellerEmail}</p>
                  <div className="inlineActions">
                    <button className="ghostBtn" type="button" onClick={() => guardedLoad(() => loadListingDetail(item.id))}>Voir détail</button>
                    {String(item.status) !== 'Archived' ? (
                      <button className="ghostBtn" type="button" disabled={busyId === item.id} onClick={() => listingAction(item.id, 'archive')}>
                        Archiver
                      </button>
                    ) : (
                      <button className="ghostBtn" type="button" disabled={busyId === item.id} onClick={() => listingAction(item.id, 'restore')}>
                        Restaurer
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>

          {moderation && (
            <Pagination
              page={moderation.page}
              total={moderation.total}
              pageSize={moderation.pageSize}
              onChange={(next) => {
                setModerationPage(next);
                guardedLoad(() => loadModeration(next));
              }}
            />
          )}

          {selectedListing && (
            <div className="card cardBody grid gap-3">
              <h3>Détail annonce</h3>
              <p><strong>{selectedListing.title}</strong> - {selectedListing.brand} {selectedListing.model}</p>
              <p>{selectedListing.description}</p>
              <p className="muted">{tr('Statut', 'Sata')}: {listingStatusLabel(String(selectedListing.status || ''), lang)} | {tr('Créée', 'Noforonina')}: {formatDate(selectedListing.createdAt)}</p>
              <p className="muted">Vendeur: {selectedListing.seller.fullName} ({selectedListing.seller.email})</p>
              <div className="listingImagesGrid">
                {selectedListing.photos?.map((photo) => (
                  <div key={photo.id} className="listingImageThumb">
                    <img src={resolveMediaUrl(photo.url)} alt="Annonce" />
                  </div>
                ))}
              </div>

              <div>
                <h4>Historique décisions</h4>
                {decisions?.items?.length ? (
                  <ul>
                    {decisions.items.map((d) => (
                      <li key={d.id}>
                        {d.action} par {d.adminEmail} ({formatDate(d.createdAt)})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">Aucune décision enregistrée.</p>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {tab === 'pilotage' && (
        <section className="grid gap-3">
          <h2 className="text-xl font-semibold">Dashboard admin</h2>
            <div className="sellerStatsGrid">
              <article className="sellerStatCard"><p className="sellerStatLabel">En attente</p><p className="sellerStatValue">{kpis?.pending ?? 0}</p></article>
              <article className="sellerStatCard"><p className="sellerStatLabel">Publiées</p><p className="sellerStatValue">{kpis?.published ?? 0}</p></article>
              <article className="sellerStatCard"><p className="sellerStatLabel">Rejetées</p><p className="sellerStatValue">{kpis?.rejected ?? 0}</p></article>
              <article className="sellerStatCard"><p className="sellerStatLabel">Vendues</p><p className="sellerStatValue">{kpis?.sold ?? 0}</p></article>
              <article className="sellerStatCard"><p className="sellerStatLabel">Visites site</p><p className="sellerStatValue">{kpis?.siteVisits ?? 0}</p></article>
              <article className="sellerStatCard"><p className="sellerStatLabel">Vendeurs inscrits</p><p className="sellerStatValue">{kpis?.sellerSignups ?? 0}</p></article>
            </div>

          <div className="card cardBody" style={{ overflowX: 'auto' }}>
            <h3>Logs actions admin</h3>
            <table className="adminDataTable" style={{ width: '100%', minWidth: 900 }}>
              <thead>
                <tr>
                  <th align="left">Date</th><th align="left">Admin</th><th align="left">Action</th><th align="left">Entité</th><th align="left">EntityId</th>
                </tr>
              </thead>
              <tbody>
                {logs?.items?.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDate(log.createdAt)}</td>
                    <td>{log.adminEmail}</td>
                    <td>{log.action}</td>
                    <td>{log.entityType}</td>
                    <td>{log.entityId || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {logs && (
            <Pagination
              page={logs.page}
              total={logs.total}
              pageSize={logs.pageSize}
              onChange={(next) => {
                setLogsPage(next);
                guardedLoad(() => loadDashboard(next));
              }}
            />
          )}
        </section>
      )}

      {tab === 'sales' && (
        <section className="grid gap-3">
          <div style={{ marginTop: 0, marginBottom: 4, paddingBottom: 10, borderBottom: '1px solid #dbe4f0' }}>
            <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#2563eb' }}>
              Backoffice
            </p>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>Suivi des ventes</h2>
          </div>

          <div className="card cardBody sellerToolbar">
            <input
              type="text"
              placeholder="Mot-clé (titre, marque, modèle, vendeur)"
              value={salesFilters.keyword}
              onChange={(e) => setSalesFilters((s) => ({ ...s, keyword: e.target.value }))}
            />
            <select value={salesFilters.categoryId} onChange={(e) => setSalesFilters((s) => ({ ...s, categoryId: e.target.value }))}>
              <option value="">Toutes catégories</option>
              {salesCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={salesFilters.brandId} onChange={(e) => setSalesFilters((s) => ({ ...s, brandId: e.target.value, modelId: '' }))}>
              <option value="">Toutes marques</option>
              {salesBrands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select value={salesFilters.modelId} onChange={(e) => setSalesFilters((s) => ({ ...s, modelId: e.target.value }))} disabled={!salesFilters.brandId}>
              <option value="">Tous modèles</option>
              {salesModels.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <select value={salesFilters.cityId} onChange={(e) => setSalesFilters((s) => ({ ...s, cityId: e.target.value }))}>
              <option value="">Toutes villes</option>
              {salesCities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="date" value={salesFilters.dateFromUtc} onChange={(e) => setSalesFilters((s) => ({ ...s, dateFromUtc: e.target.value }))} />
            <input type="date" value={salesFilters.dateToUtc} onChange={(e) => setSalesFilters((s) => ({ ...s, dateToUtc: e.target.value }))} />
            <button type="button" className="primaryBtn" onClick={() => guardedLoad(async () => {
              setSalesPage(1);
              await Promise.all([loadSales(1), loadSalesSummary()]);
            })}>
              Filtrer
            </button>
            <button type="button" className="ghostBtn" onClick={() => guardedLoad(async () => {
              const cleared = {
                keyword: '',
                brandId: '',
                modelId: '',
                categoryId: '',
                cityId: '',
                dateFromUtc: '',
                dateToUtc: ''
              };
              setSalesFilters(cleared);
              setSalesPage(1);
              await Promise.all([loadSales(1, cleared), loadSalesSummary(cleared)]);
            })}>
              Réinitialiser
            </button>
          </div>

          <div className="sellerStatsGrid">
            <article className="sellerStatCard"><p className="sellerStatLabel">Total vendues</p><p className="sellerStatValue">{salesSummary?.totalSold ?? 0}</p></article>
            <article className="sellerStatCard"><p className="sellerStatLabel">Marques vendues</p><p className="sellerStatValue">{salesSummary?.byBrand?.length ?? 0}</p></article>
            <article className="sellerStatCard"><p className="sellerStatLabel">Dernière vente</p><p className="sellerStatValue" style={{ fontSize: '1rem' }}>{formatDate(sales?.items?.[0]?.updatedAt || sales?.items?.[0]?.createdAt)}</p></article>
          </div>

          <div className="card cardBody" style={{ overflowX: 'auto' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Annonces vendues</h3>
            <table className="adminDataTable" style={{ width: '100%', minWidth: 1300 }}>
              <thead>
                <tr>
                  <th align="left">Date vente</th>
                  <th align="left">Référence</th>
                  {/* <th align="left">Annonce</th> */}
                  <th align="left">Marque / Modèle</th>
                  <th align="left">Ville / Catégorie</th>
                  <th align="left">Vendeur</th>
                  <th align="left">Publication</th>
                  <th align="left">Délai</th>
                </tr>
              </thead>
              <tbody>
                {sales?.items?.length ? sales.items.map((x) => (
                  <tr key={x.id}>
                    <td>{formatDate(x.updatedAt || x.createdAt)}</td>
                    <td>{String(x.id || '').slice(0, 8).toUpperCase()}</td>
                    {/* <td>{x.title} ({x.year})</td> */}
                    <td>{x.brand} / {x.model}</td>
                    <td>{x.city || '-'} / {x.category || '-'}</td>
                    <td>{x.sellerName || '-'}<br />{x.sellerEmail || '-'}{x.sellerPhoneNumber ? ` / ${x.sellerPhoneNumber}` : ''}</td>
                    <td>{formatDate(x.publishedAt)}</td>
                    <td>{formatDaysBetween(x.publishedAt, x.updatedAt || x.createdAt)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={8} className="muted">Aucune vente sur ces critères.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {sales && (
            <Pagination
              page={sales.page}
              total={sales.total}
              pageSize={sales.pageSize}
              onChange={(next) => {
                setSalesPage(next);
                guardedLoad(() => loadSales(next));
              }}
            />
          )}

          <div className="card cardBody" style={{ overflowX: 'auto' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Performance par marque</h3>
            <table className="adminDataTable" style={{ width: '100%', minWidth: 900 }}>
              <thead>
                <tr>
                  <th align="left">Marque</th>
                  <th align="left">Nb vendues</th>
                  <th align="left">% du total</th>
                </tr>
              </thead>
              <tbody>
                {salesSummary?.byBrand?.length ? salesSummary.byBrand.map((x) => (
                  <tr key={x.brandId}>
                    <td>{x.brand}</td>
                    <td>{x.soldCount}</td>
                    <td>{salesSummary.totalSold > 0 ? `${Math.round((x.soldCount / salesSummary.totalSold) * 100)}%` : '0%'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={3} className="muted">Aucune donnée.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {selectedListing && (
            <div className="card cardBody grid gap-3">
              <h3>Détail vente</h3>
              <p><strong>{selectedListing.title}</strong> - {selectedListing.brand} {selectedListing.model}</p>
              <p>{selectedListing.description}</p>
              <p className="muted">{tr('Statut', 'Sata')}: {listingStatusLabel(String(selectedListing.status || ''), lang)} | {tr('Créée', 'Noforonina')}: {formatDate(selectedListing.createdAt)}</p>
              <p className="muted">Vendeur: {selectedListing.seller.fullName} ({selectedListing.seller.email})</p>
              <div className="listingImagesGrid">
                {selectedListing.photos?.map((photo) => (
                  <div key={photo.id} className="listingImageThumb">
                    <img src={resolveMediaUrl(photo.url)} alt="Annonce" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {tab === 'referentiel' && (
        <section className="grid gap-3">
          <div style={{ marginTop: 0, marginBottom: 2, paddingBottom: 10, borderBottom: '1px solid #dbe4f0' }}>
            <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#2563eb' }}>
              Backoffice
            </p>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>Référentiel</h2>
          </div>
          <p className="muted">Gérez les données de base utilisées dans les formulaires et filtres du site.</p>

          <div className="inlineActions">
            <button type="button" className={metadataTab === 'brands' ? 'primaryBtn' : 'ghostBtn'} onClick={() => setMetadataTab('brands')}>Marques</button>
            <button type="button" className={metadataTab === 'categories' ? 'primaryBtn' : 'ghostBtn'} onClick={() => setMetadataTab('categories')}>Catégories</button>
            <button type="button" className={metadataTab === 'cities' ? 'primaryBtn' : 'ghostBtn'} onClick={() => setMetadataTab('cities')}>Villes</button>
            <button type="button" className={metadataTab === 'models' ? 'primaryBtn' : 'ghostBtn'} onClick={() => setMetadataTab('models')}>Modèles</button>
          </div>

          {metadataTab === 'brands' && (
          <>
          <article className="card cardBody grid gap-3" style={{ overflowX: 'auto' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Marques</h3>
            <table className="adminDataTable" style={{ width: '100%', minWidth: 860 }}>
              <thead>
                <tr>
                  <th align="left">Nom</th><th align="left">Slug</th><th align="left">État</th><th align="left">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><input type="text" placeholder="Nouvelle marque" value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)} /></td>
                  <td>-</td>
                  <td>-</td>
                  <td><button className="primaryBtn" type="button" disabled={metadataBusy || !newBrandName.trim()} onClick={() => mutateMetadata('/api/admin/metadata/brands', { method: 'POST', body: JSON.stringify({ name: newBrandName.trim() }) }, 'Marque créée.').then(() => setNewBrandName(''))}>Ajouter</button></td>
                </tr>
                {brandsVisible.map((item) => (
                  <tr key={item.id}>
                    <td><input type="text" value={brandDrafts[item.id] ?? item.name} onChange={(e) => setBrandDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))} /></td>
                    <td>{item.slug || '-'}</td>
                    <td>{item.isActive ? 'Active' : 'Inactive'}</td>
                    <td>
                      <div className="inlineActions">
                        <button type="button" className="ghostBtn" disabled={metadataBusy || !(brandDrafts[item.id] || '').trim()} onClick={() => mutateMetadata(`/api/admin/metadata/brands/${item.id}`, { method: 'PUT', body: JSON.stringify({ name: (brandDrafts[item.id] || '').trim() }) }, 'Marque mise à jour.')}>Enregistrer</button>
                        <button type="button" className="ghostBtn" disabled={metadataBusy} onClick={() => mutateMetadata(`/api/admin/metadata/brands/${item.id}/activation`, { method: 'PATCH', body: JSON.stringify({ isActive: !item.isActive }) }, item.isActive ? 'Marque désactivée.' : 'Marque activée.')}>{item.isActive ? 'Désactiver' : 'Activer'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
          <Pagination
            page={brandsMetaPage}
            total={brandsTotal}
            pageSize={METADATA_PAGE_SIZE}
            onChange={(next) => {
              setBrandsMetaPage(next);
              guardedLoad(() => loadMetadataBrands(next));
            }}
          />
          </>
          )}

          {metadataTab === 'categories' && (
          <>
          <article className="card cardBody grid gap-3" style={{ overflowX: 'auto' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Catégories</h3>
            <table className="adminDataTable" style={{ width: '100%', minWidth: 860 }}>
              <thead>
                <tr>
                  <th align="left">Nom</th><th align="left">Slug</th><th align="left">État</th><th align="left">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><input type="text" placeholder="Nouvelle catégorie" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} /></td>
                  <td>-</td>
                  <td>-</td>
                  <td><button className="primaryBtn" type="button" disabled={metadataBusy || !newCategoryName.trim()} onClick={() => mutateMetadata('/api/admin/metadata/categories', { method: 'POST', body: JSON.stringify({ name: newCategoryName.trim() }) }, 'Catégorie créée.').then(() => setNewCategoryName(''))}>Ajouter</button></td>
                </tr>
                {categoriesVisible.map((item) => (
                  <tr key={item.id}>
                    <td><input type="text" value={categoryDrafts[item.id] ?? item.name} onChange={(e) => setCategoryDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))} /></td>
                    <td>{item.slug || '-'}</td>
                    <td>{item.isActive ? 'Active' : 'Inactive'}</td>
                    <td>
                      <div className="inlineActions">
                        <button type="button" className="ghostBtn" disabled={metadataBusy || !(categoryDrafts[item.id] || '').trim()} onClick={() => mutateMetadata(`/api/admin/metadata/categories/${item.id}`, { method: 'PUT', body: JSON.stringify({ name: (categoryDrafts[item.id] || '').trim() }) }, 'Catégorie mise à jour.')}>Enregistrer</button>
                        <button type="button" className="ghostBtn" disabled={metadataBusy} onClick={() => mutateMetadata(`/api/admin/metadata/categories/${item.id}/activation`, { method: 'PATCH', body: JSON.stringify({ isActive: !item.isActive }) }, item.isActive ? 'Catégorie désactivée.' : 'Catégorie activée.')}>{item.isActive ? 'Désactiver' : 'Activer'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
          <Pagination
            page={categoriesMetaPage}
            total={categoriesTotal}
            pageSize={METADATA_PAGE_SIZE}
            onChange={(next) => {
              setCategoriesMetaPage(next);
              guardedLoad(() => loadMetadataCategories(next));
            }}
          />
          </>
          )}

          {metadataTab === 'cities' && (
          <>
          <article className="card cardBody grid gap-3" style={{ overflowX: 'auto' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Villes</h3>
            <table className="adminDataTable" style={{ width: '100%', minWidth: 860 }}>
              <thead>
                <tr>
                  <th align="left">Nom</th><th align="left">Slug</th><th align="left">État</th><th align="left">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><input type="text" placeholder="Nouvelle ville" value={newCityName} onChange={(e) => setNewCityName(e.target.value)} /></td>
                  <td>-</td>
                  <td>-</td>
                  <td><button className="primaryBtn" type="button" disabled={metadataBusy || !newCityName.trim()} onClick={() => mutateMetadata('/api/admin/metadata/cities', { method: 'POST', body: JSON.stringify({ name: newCityName.trim() }) }, 'Ville créée.').then(() => setNewCityName(''))}>Ajouter</button></td>
                </tr>
                {citiesVisible.map((item) => (
                  <tr key={item.id}>
                    <td><input type="text" value={cityDrafts[item.id] ?? item.name} onChange={(e) => setCityDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))} /></td>
                    <td>{item.slug || '-'}</td>
                    <td>{item.isActive ? 'Active' : 'Inactive'}</td>
                    <td>
                      <div className="inlineActions">
                        <button type="button" className="ghostBtn" disabled={metadataBusy || !(cityDrafts[item.id] || '').trim()} onClick={() => mutateMetadata(`/api/admin/metadata/cities/${item.id}`, { method: 'PUT', body: JSON.stringify({ name: (cityDrafts[item.id] || '').trim() }) }, 'Ville mise à jour.')}>Enregistrer</button>
                        <button type="button" className="ghostBtn" disabled={metadataBusy} onClick={() => mutateMetadata(`/api/admin/metadata/cities/${item.id}/activation`, { method: 'PATCH', body: JSON.stringify({ isActive: !item.isActive }) }, item.isActive ? 'Ville désactivée.' : 'Ville activée.')}>{item.isActive ? 'Désactiver' : 'Activer'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
          <Pagination
            page={citiesMetaPage}
            total={citiesTotal}
            pageSize={METADATA_PAGE_SIZE}
            onChange={(next) => {
              setCitiesMetaPage(next);
              guardedLoad(() => loadMetadataCities(next));
            }}
          />
          </>
          )}

          {metadataTab === 'models' && (
          <>
          <article className="card cardBody grid gap-3" style={{ overflowX: 'auto' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Modèles</h3>
            <table className="adminDataTable" style={{ width: '100%', minWidth: 980 }}>
              <thead>
                <tr>
                  <th align="left">Marque</th><th align="left">Modèle</th><th align="left">Slug</th><th align="left">État</th><th align="left">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <select value={newModelBrandId} onChange={(e) => setNewModelBrandId(e.target.value)}>
                      {(brandOptions || []).map((brand) => (
                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                      ))}
                    </select>
                  </td>
                  <td><input type="text" placeholder="Nouveau modèle" value={newModelName} onChange={(e) => setNewModelName(e.target.value)} /></td>
                  <td>-</td>
                  <td>-</td>
                  <td><button className="primaryBtn" type="button" disabled={metadataBusy || !newModelName.trim() || !newModelBrandId} onClick={() => mutateMetadata('/api/admin/metadata/models', { method: 'POST', body: JSON.stringify({ name: newModelName.trim(), brandId: newModelBrandId }) }, 'Modèle créé.').then(() => setNewModelName(''))}>Ajouter</button></td>
                </tr>
                {modelsVisible.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <select value={modelBrandDrafts[item.id] ?? item.brandId} onChange={(e) => setModelBrandDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}>
                        {(brandOptions || []).map((brand) => (
                          <option key={brand.id} value={brand.id}>{brand.name}</option>
                        ))}
                      </select>
                    </td>
                    <td><input type="text" value={modelDrafts[item.id] ?? item.name} onChange={(e) => setModelDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))} /></td>
                    <td>{item.slug || '-'}</td>
                    <td>{item.isActive ? 'Active' : 'Inactive'}</td>
                    <td>
                      <div className="inlineActions">
                        <button type="button" className="ghostBtn" disabled={metadataBusy || !(modelDrafts[item.id] || '').trim() || !(modelBrandDrafts[item.id] || '').trim()} onClick={() => mutateMetadata(`/api/admin/metadata/models/${item.id}`, { method: 'PUT', body: JSON.stringify({ name: (modelDrafts[item.id] || '').trim(), brandId: (modelBrandDrafts[item.id] || '').trim() }) }, 'Modèle mis à jour.')}>Enregistrer</button>
                        <button type="button" className="ghostBtn" disabled={metadataBusy} onClick={() => mutateMetadata(`/api/admin/metadata/models/${item.id}/activation`, { method: 'PATCH', body: JSON.stringify({ isActive: !item.isActive }) }, item.isActive ? 'Modèle désactivé.' : 'Modèle activé.')}>{item.isActive ? 'Désactiver' : 'Activer'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
          <Pagination
            page={modelsMetaPage}
            total={modelsTotal}
            pageSize={METADATA_PAGE_SIZE}
            onChange={(next) => {
              setModelsMetaPage(next);
              guardedLoad(() => loadMetadataModels(next));
            }}
          />
          </>
          )}
        </section>
      )}
    </div>
  );
}

