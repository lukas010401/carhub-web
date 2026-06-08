import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ListingCard from '@/components/ListingCard';
import { apiFetch } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { isBetaMode } from '@/lib/beta';
import { MetadataItem, PopularBrand, PublicListing } from '@/lib/types';
import { useI18n } from '@/lib/i18n';

function getBrandMonogram(name: string): string {
  const chunks = name.trim().split(/\s+/).filter(Boolean);
  if (chunks.length === 0) return '?';
  if (chunks.length === 1) return chunks[0].slice(0, 2).toUpperCase();
  return `${chunks[0][0] || ''}${chunks[1][0] || ''}`.toUpperCase();
}

function slugifyCategory(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getCategoryImageSrc(category: MetadataItem | undefined, fallbackName: string): string {
  if (category?.imageUrl) return category.imageUrl;
  const slug = category?.slug || slugifyCategory(fallbackName);
  return `/category-images/${slug}.svg`;
}

export default function HomePage() {
  const { tr } = useI18n();
  const betaMode = isBetaMode();
  const router = useRouter();
  const [items, setItems] = useState<PublicListing[]>([]);
  const [visibleRecentCount, setVisibleRecentCount] = useState(8);
  const [brands, setBrands] = useState<MetadataItem[]>([]);
  const [popularBrands, setPopularBrands] = useState<PopularBrand[]>([]);
  const [cities, setCities] = useState<MetadataItem[]>([]);
  const [categories, setCategories] = useState<MetadataItem[]>([]);
  const [brandId, setBrandId] = useState('');
  const [cityId, setCityId] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sellHref, setSellHref] = useState('/login');
  const [authSellHref, setAuthSellHref] = useState('/register');
  const [heroResultCount, setHeroResultCount] = useState(0);
  const [heroCountLoading, setHeroCountLoading] = useState(false);
  const [sellSlideIndex, setSellSlideIndex] = useState(0);
  const heroCountSeq = useRef(0);

  useEffect(() => {
    apiFetch<{ items: PublicListing[] }>('/api/public/listings?Page=1&PageSize=12')
      .then(r => {
        setItems(r.items);
        setVisibleRecentCount(Math.min(8, r.items.length));
      })
      .catch(() => {
        setItems([]);
        setVisibleRecentCount(0);
      });

    apiFetch<MetadataItem[]>('/api/metadata/brands').then(setBrands).catch(() => setBrands([]));
    apiFetch<MetadataItem[]>('/api/metadata/cities').then(setCities).catch(() => setCities([]));
    apiFetch<MetadataItem[]>('/api/metadata/categories').then(setCategories).catch(() => setCategories([]));

    apiFetch<PopularBrand[]>('/api/public/listings/brands/popular?limit=10')
      .then(setPopularBrands)
      .catch(() => setPopularBrands([]));

    const user = getCurrentUser();
    if (!user) {
      setSellHref('/login');
      setAuthSellHref('/register');
    } else if (user.role === 'Admin') {
      setSellHref('/admin');
      setAuthSellHref('/admin');
    } else {
      setSellHref('/dashboard');
      setAuthSellHref('/dashboard');
    }
  }, []);

  useEffect(() => {
    const seq = ++heroCountSeq.current;
    const timer = window.setTimeout(() => {
      setHeroCountLoading(true);
      const params = new URLSearchParams();
      params.set('Page', '1');
      params.set('PageSize', '1');
      if (brandId) params.set('BrandId', brandId);
      if (cityId) params.set('CityId', cityId);
      if (minPrice) params.set('MinPrice', minPrice);
      if (maxPrice) params.set('MaxPrice', maxPrice);

      apiFetch<any>(`/api/public/listings?${params.toString()}`)
        .then((r) => {
          if (seq !== heroCountSeq.current) return;
          const count = typeof r?.totalCount === 'number'
            ? r.totalCount
            : typeof r?.total === 'number'
              ? r.total
              : typeof r?.count === 'number'
                ? r.count
                : Array.isArray(r?.items)
                  ? r.items.length
                  : 0;
          setHeroResultCount(Math.max(0, count));
        })
        .catch(() => {
          if (seq !== heroCountSeq.current) return;
          setHeroResultCount(0);
        })
        .finally(() => {
          if (seq !== heroCountSeq.current) return;
          setHeroCountLoading(false);
        });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [brandId, cityId, minPrice, maxPrice]);

  const onHeroSearch = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (brandId) params.set('BrandId', brandId);
    if (cityId) params.set('CityId', cityId);
    if (minPrice) params.set('MinPrice', minPrice);
    if (maxPrice) params.set('MaxPrice', maxPrice);
    router.push(`/cars${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const brandsToShow = popularBrands.length > 0
    ? popularBrands
    : brands.slice(0, 10).map(x => ({ ...x, listingsCount: 0 }));

  const visibleRecentItems = useMemo(
    () => items.slice(0, visibleRecentCount),
    [items, visibleRecentCount]
  );

  const heroResultsLabel = heroCountLoading
    ? tr('Recherche...', 'Mitady...')
    : `${heroResultCount.toLocaleString()} ${heroResultCount > 1 ? tr('résultats', 'valiny') : tr('résultat', 'valiny')}`;

  const canExpandRecent = items.length > 8 && visibleRecentCount < items.length;
  const canGoToCars = items.length > 8 && visibleRecentCount >= items.length;

  const sellSlides = useMemo(() => ([
    {
      title: tr('Vends ta voiture rapidement', 'Amidio haingana ny fiaranao'),
      description: tr(
        'Publie ton annonce en quelques minutes et commence à recevoir des contacts d’acheteurs.',
        'Avoahy ao anatin’ny minitra vitsy ny filazanao ary manomboka mandray fifandraisana avy amin’ny mpividy.'
      ),
      href: sellHref,
      cta: tr('Vendre une voiture', 'Hivarotra fiara')
    },
    {
      title: tr('Annonce particulier', 'Filazana ho an’ny olon-tsotra'),
      description: tr(
        betaMode
          ? 'Pendant la bêta, les particuliers publient gratuitement leurs annonces.'
          : 'Pour les particuliers, vous payez 20 000 Ar uniquement quand vous mettez une annonce en ligne.',
        betaMode
          ? 'Mandritra ny bêta, maimaim-poana ny famoahan’ny olon-tsotra ny filazany.'
          : 'Ho an’ny olon-tsotra, mandoa 20 000 Ar ianao rehefa mampakatra filazana amin’ny aterineto.'
      ),
      href: authSellHref,
      cta: tr('Publier en particulier', 'Hamoaka ho olon-tsotra')
    },
    {
      title: tr('Offre vendeur professionnel', 'Tolotra mpivarotra matihanina'),
      description: tr(
        betaMode
          ? 'Les vendeurs professionnels sont identifiÉs pendant la bêta, sans facturation active pour le lancement.'
          : 'Abonnement pro à 150 000 Ar/mois: annonces illimitées pendant la période active, badge PRO et meilleure visibilité dans les recherches.',
        betaMode
          ? 'Fantatra mazava ny mpivarotra matihanina mandritra ny bêta, nefa tsy mbola misy fandoavana mavitrika.'
          : 'Famandrihana pro 150 000 Ar/volana: filazana tsy voafetra mandritra ny fotoana mavitrika, badge PRO ary hita kokoa amin’ny fikarohana.'
      ),
      href: authSellHref,
      cta: tr('Découvrir l’offre pro', 'Hijery ny tolotra pro')
    }
  ]), [sellHref, authSellHref, tr]);

  useEffect(() => {
    if (sellSlides.length <= 1) return;
    const timer = window.setInterval(() => {
      setSellSlideIndex((prev) => (prev + 1) % sellSlides.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [sellSlides.length]);

  useEffect(() => {
    setSellSlideIndex((prev) => Math.min(prev, sellSlides.length - 1));
  }, [sellSlides.length]);

  const activeSellSlide = sellSlides[sellSlideIndex] || sellSlides[0];

  const goToSellSlide = (index: number) => {
    if (sellSlides.length <= 0) return;
    const safe = ((index % sellSlides.length) + sellSlides.length) % sellSlides.length;
    setSellSlideIndex(safe);
  };

  return (
    <div className="grid" style={{ gap: '1.2rem' }}>
      <section className="hero heroSearchBanner">
        <div className="heroStrip">{tr('Découvrez notre sélection de voitures à Madagascar', 'Jereo ny safidinay fiara eto Madagasikara')}</div>
        <h1>{tr('Votre marché automobile à Madagascar', 'Tsena fiara eto Madagasikara')}</h1>
        <p>{tr('Trouvez rapidement une voiture selon votre budget, marque et ville.', 'Mitadiava fiara haingana araka ny teti-bola, marika ary tanàna.')}</p>

        <form className="heroSearchPanel" onSubmit={onHeroSearch}>
          <div className="heroSearchGrid">
            <select value={brandId} onChange={e => setBrandId(e.target.value)}>
              <option value="">{tr('Marque', 'Marika')}</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select value={cityId} onChange={e => setCityId(e.target.value)}>
              <option value="">{tr('Ville', 'Tanàna')}</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="number" placeholder={tr('Prix min', 'Vidiny farany ambany')} value={minPrice} onChange={e => setMinPrice(e.target.value)} />
            <input type="number" placeholder={tr('Prix max', 'Vidiny farany ambony')} value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
          </div>
          <div className="heroSearchActions">
            <button className="primaryBtn heroResultsBtn" type="submit">{heroResultsLabel}</button>
          </div>
        </form>
      </section>

      <section className="popularBrandsSection">
        <h2>{tr('Rechercher par marque populaire', 'Hitady amin’ny marika malaza')}</h2>
        <div className="popularBrandsChips">
          {brandsToShow.map(b => (
            <Link key={b.id} href={`/cars?BrandId=${b.id}`}>
              <a className="ghostBtn popularBrandChip">
                <span className="popularBrandName">{b.name}</span>
                {b.logoUrl ? (
                  <img className="popularBrandLogoImg" src={b.logoUrl || '/brand-logos/default.svg'} alt={`Logo ${b.name}`} loading="lazy" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/brand-logos/default.svg'; }} />
                ) : (
                  <span className="popularBrandLogo" aria-hidden="true">{getBrandMonogram(b.name)}</span>
                )}
              </a>
            </Link>
          ))}
        </div>
      </section>

      <section className="homeDualCards">
        <article className="homeInfoCard">
          <h3>{tr('Trouver par catégorie', 'Hitady araka ny sokajy')}</h3>
          <div className="homeCategoryGrid">
            {[
              { slug: 'break', label: 'Break' },
              { slug: 'citadine', label: 'Citadine' },
              { slug: 'suv', label: 'SUV' },
              { slug: '4x4', label: '4x4' }
            ].map(({ slug, label }) => {
              const category = categories.find(c => c.slug === slug || slugifyCategory(c.name) === slug);
              const href = category ? `/cars?CategoryId=${category.id}` : `/cars?Category=${encodeURIComponent(slug)}`;
              return (
                <Link key={slug} href={href}>
                  <a className="homeCategoryItem">
                    <span className="homeCategoryIconWrap" aria-hidden="true">
                      <img
                        className="homeCategoryIconImg"
                        src={getCategoryImageSrc(category, slug)}
                        alt={`Illustration ${label}`}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/category-images/default.svg';
                        }}
                      />
                    </span>
                    <span>{label}</span>
                  </a>
                </Link>
              );
            })}
          </div>
        </article>

        <article className="homeSellCard">
          <div className="homeSellCarousel">
            <div className="homeSellSlide">
              <h3>{activeSellSlide.title}</h3>
              <p>{activeSellSlide.description}</p>
              <Link href={activeSellSlide.href}><a className="primaryBtn">{activeSellSlide.cta}</a></Link>
            </div>
            <div className="homeSellCarouselNav">
              <button
                type="button"
                className="homeSellArrow"
                onClick={() => goToSellSlide(sellSlideIndex - 1)}
                aria-label={tr('Slide précédent', 'Pejy teo aloha')}
              >
                ‹
              </button>
              <div className="homeSellDots">
                {sellSlides.map((_, idx) => (
                  <button
                    key={`sell-slide-${idx}`}
                    type="button"
                    className={idx === sellSlideIndex ? 'homeSellDot active' : 'homeSellDot'}
                    onClick={() => goToSellSlide(idx)}
                    aria-label={`${tr('Aller au slide', 'Mankanesa amin ny pejy')} ${idx + 1}`}
                  />
                ))}
              </div>
              <button
                type="button"
                className="homeSellArrow"
                onClick={() => goToSellSlide(sellSlideIndex + 1)}
                aria-label={tr('Slide suivant', 'Pejy manaraka')}
              >
                ›
              </button>
            </div>
            <p className="homeSellPricingLink" style={{ margin: 0 }}>
              <Link href="/pricing"><a>{tr('Comparer les offres particulier et professionnel', 'Ampitahao ny tolotra olon-tsotra sy matihanina')}</a></Link>
            </p>
          </div>
        </article>
      </section>

      <section>
        <h2 className="recentSectionTitle">{tr('Annonces récentes', 'Filazana vao haingana')}</h2>
        <div className="grid cards">
          {visibleRecentItems.map(x => <ListingCard key={x.id} listing={x} />)}
        </div>

        {(canExpandRecent || canGoToCars) && (
          <div className="recentCtaWrap">
            {canExpandRecent ? (
              <button
                type="button"
                className="recentCtaBtn"
                onClick={() => setVisibleRecentCount(items.length)}
              >
                <span className="recentCtaPlus" aria-hidden="true">+</span>
                {tr('Plus de véhicules', 'Fiara maro kokoa')}
              </button>
            ) : (
              <Link href="/cars">
                <a className="recentCtaBtn">{tr('Rien trouvé ? Commencer une nouvelle recherche', 'Tsy nahita ve? Atombohy ny fikarohana vaovao')}</a>
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}


