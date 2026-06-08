import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import ListingCard from '@/components/ListingCard';
import { apiFetch } from '@/lib/api';
import { FuelType, MetadataItem, PublicListing, TransmissionType } from '@/lib/types';
import { fuelTypeLabel, transmissionTypeLabel } from '@/lib/vehicle-labels';
import { useI18n } from '@/lib/i18n';

const PAGE_SIZE = 20;

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function qv(value: string | string[] | undefined): string {
  if (!value) return '';
  return Array.isArray(value) ? value[0] || '' : value;
}

export default function CarsPage() {
  const { tr, lang } = useI18n();
  const router = useRouter();
  const [items, setItems] = useState<PublicListing[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [brands, setBrands] = useState<MetadataItem[]>([]);
  const [models, setModels] = useState<MetadataItem[]>([]);
  const [categories, setCategories] = useState<MetadataItem[]>([]);

  const [modelId, setModelId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [brandSlug, setBrandSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minYear, setMinYear] = useState('');
  const [maxYear, setMaxYear] = useState('');
  const [maxMileage, setMaxMileage] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [transmissionType, setTransmissionType] = useState('');
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [prosFirst, setProsFirst] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [filtersReady, setFiltersReady] = useState(false);
  const requestSeq = useRef(0);
  const prevFilterSig = useRef('');

  useEffect(() => {
    apiFetch<MetadataItem[]>('/api/metadata/brands').then(setBrands).catch(() => setBrands([]));
    apiFetch<MetadataItem[]>('/api/metadata/categories').then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!brandId) {
      setModels([]);
      setModelId('');
      return;
    }
    apiFetch<MetadataItem[]>(`/api/metadata/brands/${brandId}/models`).then(setModels).catch(() => setModels([]));
  }, [brandId]);

  useEffect(() => {
    if (!router.isReady) return;

    const q = router.query;
    setBrandId(qv((q.BrandId as any) ?? (q.brandId as any)));
    setBrandSlug(qv((q.Brand as any) ?? (q.brand as any)));
    setModelId(qv((q.ModelId as any) ?? (q.modelId as any)));
    setCategoryId(qv((q.CategoryId as any) ?? (q.categoryId as any)));
    setCategorySlug(qv((q.Category as any) ?? (q.category as any)));
    setMinPrice(qv((q.MinPrice as any) ?? (q.minPrice as any)));
    setMaxPrice(qv((q.MaxPrice as any) ?? (q.maxPrice as any)));
    setMinYear(qv((q.MinYear as any) ?? (q.minYear as any)));
    setMaxYear(qv((q.MaxYear as any) ?? (q.maxYear as any)));
    setMaxMileage(qv((q.MaxMileage as any) ?? (q.maxMileage as any)));
    setFuelType(qv((q.FuelType as any) ?? (q.fuelType as any)));
    setTransmissionType(qv((q.TransmissionType as any) ?? (q.transmissionType as any)));
    setKeyword(qv((q.Keyword as any) ?? (q.keyword as any)));
    setSortBy(qv((q.Sort as any) ?? (q.sort as any)) || 'newest');
    const rawProsFirst = qv((q.ProsFirst as any) ?? (q.prosFirst as any));
    setProsFirst(rawProsFirst ? rawProsFirst.toLowerCase() !== 'false' : true);
    const p = Number(qv((q.p as any) ?? (q.P as any)) || '1');
    setCurrentPage(Number.isFinite(p) && p > 0 ? p : 1);
    setFiltersReady(true);
  }, [router.isReady, router.query]);

  useEffect(() => {
    if (!brandId && brandSlug && brands.length > 0) {
      const matched = brands.find((b) => b.slug === brandSlug || slugify(b.name) === brandSlug);
      if (matched) setBrandId(matched.id);
    }
  }, [brandId, brandSlug, brands]);

  useEffect(() => {
    if (!categoryId && categorySlug && categories.length > 0) {
      const matched = categories.find(c => c.slug === categorySlug || slugify(c.name) === categorySlug);
      if (matched) setCategoryId(matched.id);
    }
  }, [categoryId, categorySlug, categories]);

  const serverQuery = useMemo(() => {
    const params = new URLSearchParams();
    params.set('Page', String(currentPage));
    params.set('PageSize', String(PAGE_SIZE));
    if (modelId) params.set('ModelId', modelId);
    if (brandId) params.set('BrandId', brandId);
    if (categoryId) params.set('CategoryId', categoryId);
    if (minPrice) params.set('MinPrice', minPrice);
    if (maxPrice) params.set('MaxPrice', maxPrice);
    if (minYear) params.set('MinYear', minYear);
    if (maxYear) params.set('MaxYear', maxYear);
    if (maxMileage) params.set('MaxMileage', maxMileage);
    if (fuelType) params.set('FuelType', fuelType);
    if (transmissionType) params.set('TransmissionType', transmissionType);
    if (keyword) params.set('Keyword', keyword);
    if (sortBy && sortBy !== 'newest') params.set('SortBy', sortBy);
    params.set('ProsFirst', prosFirst ? 'true' : 'false');
    return params.toString();
  }, [modelId, brandId, categoryId, minPrice, maxPrice, minYear, maxYear, maxMileage, fuelType, transmissionType, keyword, sortBy, prosFirst, currentPage]);

  useEffect(() => {
    if (!filtersReady) return;

    const seq = ++requestSeq.current;
    apiFetch<{ items: PublicListing[]; total?: number; totalCount?: number }>(`/api/public/listings?${serverQuery}`)
      .then(r => {
        if (seq !== requestSeq.current) return;
        setItems(r.items || []);
        const total = typeof r.totalCount === 'number'
          ? r.totalCount
          : typeof r.total === 'number'
            ? r.total
            : (r.items || []).length;
        setTotalCount(Math.max(0, total));
      })
      .catch(() => {
        if (seq !== requestSeq.current) return;
        setItems([]);
        setTotalCount(0);
      });
  }, [serverQuery, filtersReady]);

  const filterSignature = useMemo(
    () => JSON.stringify([modelId, brandId, categoryId, minPrice, maxPrice, minYear, maxYear, maxMileage, fuelType, transmissionType, keyword, sortBy, prosFirst]),
    [modelId, brandId, categoryId, minPrice, maxPrice, minYear, maxYear, maxMileage, fuelType, transmissionType, keyword, sortBy, prosFirst]
  );

  useEffect(() => {
    if (!filtersReady) return;
    if (prevFilterSig.current && prevFilterSig.current !== filterSignature) {
      setCurrentPage(1);
    }
    prevFilterSig.current = filterSignature;
  }, [filtersReady, filterSignature]);

  useEffect(() => {
    if (!filtersReady) return;
    const t = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (modelId) params.set('ModelId', modelId);
      if (brandId) params.set('BrandId', brandId);
      if (categoryId) params.set('CategoryId', categoryId);
      if (minPrice) params.set('MinPrice', minPrice);
      if (maxPrice) params.set('MaxPrice', maxPrice);
      if (minYear) params.set('MinYear', minYear);
      if (maxYear) params.set('MaxYear', maxYear);
      if (maxMileage) params.set('MaxMileage', maxMileage);
      if (fuelType) params.set('FuelType', fuelType);
      if (transmissionType) params.set('TransmissionType', transmissionType);
      if (keyword) params.set('Keyword', keyword);
      if (sortBy && sortBy !== 'newest') params.set('Sort', sortBy);
      if (!prosFirst) params.set('ProsFirst', 'false');
      if (currentPage > 1) params.set('p', String(currentPage));
      const next = `/cars${params.toString() ? `?${params.toString()}` : ''}`;
      if (router.asPath !== next) router.replace(next, undefined, { shallow: true });
    }, 200);

    return () => window.clearTimeout(t);
  }, [
    filtersReady,
    modelId,
    brandId,
    categoryId,
    minPrice,
    maxPrice,
    minYear,
    maxYear,
    maxMileage,
    fuelType,
    transmissionType,
    keyword,
    sortBy,
    prosFirst,
    currentPage,
    router
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);

  useEffect(() => {
    if (currentPage !== safePage) setCurrentPage(safePage);
  }, [currentPage, safePage]);

  const pagedItems = items;
  const pageNumbers = (() => {
    const start = Math.max(1, safePage - 2);
    const end = Math.min(totalPages, start + 4);
    const adjustedStart = Math.max(1, end - 4);
    return Array.from({ length: end - adjustedStart + 1 }, (_, i) => adjustedStart + i);
  })();

  const resetFilters = () => {
    setModelId('');
    setBrandId('');
    setBrandSlug('');
    setCategoryId('');
    setCategorySlug('');
    setMinPrice('');
    setMaxPrice('');
    setMinYear('');
    setMaxYear('');
    setMaxMileage('');
    setFuelType('');
    setTransmissionType('');
    setKeyword('');
    setSortBy('newest');
    setProsFirst(true);
    setCurrentPage(1);
    router.replace('/cars', undefined, { shallow: true });
  };

  const fuelOptions: FuelType[] = ['Gasoline', 'Diesel', 'Hybrid', 'Electric'];
  const transmissionOptions: TransmissionType[] = ['Manual', 'Automatic'];

  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <section className="carsHeader">
        <h1 className="carsPageTitle">{tr('Trouvez votre prochaine voiture', 'Mitadiava ny fiaranao manaraka')}</h1>
        <p className="carsPageSubtitle">{tr('Filtrez par catégorie, marque, modèle, carburant, année et budget.', 'Sivano araka ny sokajy, marika, modely, solika, taona ary teti-bola.')}</p>
      </section>

      <div className="card cardBody formGrid">
        <select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
          <option value="">{tr('Toutes les catégories', 'Sokajy rehetra')}</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select value={brandId} onChange={e => setBrandId(e.target.value)}>
          <option value="">{tr('Toutes les marques', 'Marika rehetra')}</option>
          {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>

        <select value={modelId} onChange={e => setModelId(e.target.value)} disabled={!brandId}>
          <option value="">{tr('Tous les modèles', 'Modely rehetra')}</option>
          {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>

        <input type="number" placeholder={tr('Prix min', 'Vidiny farany ambany')} value={minPrice} onChange={e => setMinPrice(e.target.value)} />
        <input type="number" placeholder={tr('Prix max', 'Vidiny farany ambony')} value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />

        <input type="number" placeholder="Année min" value={minYear} onChange={e => setMinYear(e.target.value)} />
        <input type="number" placeholder="Année max" value={maxYear} onChange={e => setMaxYear(e.target.value)} />
        <input type="number" placeholder="Kilométrage max" value={maxMileage} onChange={e => setMaxMileage(e.target.value)} />

        <select value={fuelType} onChange={e => setFuelType(e.target.value)}>
          <option value="">{tr('Tous carburants', 'Karazan-tsolika rehetra')}</option>
          {fuelOptions.map(x => <option key={x} value={x}>{fuelTypeLabel(x, lang)}</option>)}
        </select>

        <select value={transmissionType} onChange={e => setTransmissionType(e.target.value)}>
          <option value="">{tr('Toutes transmissions', 'Karazana boîte rehetra')}</option>
          {transmissionOptions.map(x => <option key={x} value={x}>{transmissionTypeLabel(x, lang)}</option>)}
        </select>

        <input type="text" placeholder={tr('Mot-clé (marque, modèle...)', 'Teny fikarohana (marika, modely...)')} value={keyword} onChange={e => setKeyword(e.target.value)} />

        <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="newest">{tr('Tri: plus récent', 'Filaharana: vao indrindra')}</option>
          <option value="price-asc">{tr('Prix croissant', 'Vidiny miakatra')}</option>
          <option value="price-desc">{tr('Prix décroissant', 'Vidiny midina')}</option>
          <option value="year-desc">{tr('Année récente', 'Taona akaiky')}</option>
          <option value="year-asc">{tr('Année ancienne', 'Taona taloha')}</option>
          <option value="mileage-asc">{tr('Kilométrage faible', 'Kilometatra kely')}</option>
          <option value="mileage-desc">{tr('Kilométrage élevé', 'Kilometatra be')}</option>
        </select>

        <div className="carsFilterActions">
          {/* <span className="muted">{tr('Filtres appliqués automatiquement', 'Sivana ampiharina ho azy')}</span> */}
          <button className="ghostBtn" type="button" onClick={resetFilters}>{tr('Réinitialiser', 'Averina')}</button>
          <label className="carsProsFirstToggle">
            <input
              type="checkbox"
              checked={prosFirst}
              onChange={(e) => setProsFirst(e.target.checked)}
            />
            <span>{tr('Pros d’abord', 'Matihanina aloha')}</span>
          </label>
        </div>
      </div>

      <p className="carsResultsMeta">{totalCount} {totalCount > 1 ? tr('résultats', 'valiny') : tr('résultat', 'valiny')}</p>

      <div className="grid cards carsCardsGrid">
        {pagedItems.map(x => <ListingCard key={x.id} listing={x} />)}
      </div>

      <nav className="carsPagination" aria-label={tr('Pagination annonces', 'Pejy filazana')}>
        <button className="ghostBtn" type="button" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}>
          {tr('Précédent', 'Teo aloha')}
        </button>
        <div className="carsPaginationPages">
          {pageNumbers.map((p) => (
            <button
              key={p}
              type="button"
              className={p === safePage ? 'primaryBtn carsPageBtn active' : 'ghostBtn carsPageBtn'}
              onClick={() => setCurrentPage(p)}
            >
              {p}
            </button>
          ))}
        </div>
        <button className="ghostBtn" type="button" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}>
          {tr('Suivant', 'Manaraka')}
        </button>
      </nav>
    </div>
  );
}
