import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/media';
import { PublicListing } from '@/lib/types';
import BackLink from '@/components/ui/back-link';
import { fuelTypeLabel, transmissionTypeLabel } from '@/lib/vehicle-labels';
import { useI18n } from '@/lib/i18n';

type ListingImage = { url?: string; id?: string };

function isProfessionalValue(value: unknown): boolean {
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'professional' || normalized === 'pro' || normalized === '1' || normalized === 'true';
}

function getSellerInitials(name?: string): string {
  const source = String(name || '').trim();
  if (!source) return 'V';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

export default function CarDetailsPage() {
  const { tr, lang } = useI18n();
  const router = useRouter();
  const { id } = router.query;
  const [item, setItem] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [relatedItems, setRelatedItems] = useState<PublicListing[]>([]);
  const [shareNotice, setShareNotice] = useState('');

  useEffect(() => {
    if (!id || typeof id !== 'string') return;
    setSelectedImage('');
    setItem(null);
    apiFetch<any>(`/api/public/listings/${id}`).then(setItem).catch(() => setItem(null));
  }, [id]);

  useEffect(() => {
    if (!item || !item.brand) {
      setRelatedItems([]);
      return;
    }

    const currentId = String(item.id || id || '');
    const brandName = String(item.brand || '').trim().toLowerCase();
    if (!brandName) {
      setRelatedItems([]);
      return;
    }

    const params = new URLSearchParams();
    params.set('Page', '1');
    params.set('PageSize', '24');
    params.set('Keyword', String(item.brand));
    if (item.brandId) params.set('BrandId', String(item.brandId));

    apiFetch<{ items: PublicListing[] }>(`/api/public/listings?${params.toString()}`)
      .then((r) => {
        const list = (r?.items || [])
          .filter((x) => String(x.id) !== currentId)
          .filter((x) => String(x.brand || '').trim().toLowerCase() === brandName)
          .slice(0, 3);
        setRelatedItems(list);
      })
      .catch(() => setRelatedItems([]));
  }, [item, id]);

  const gallery = useMemo(() => {
    if (!item) return [] as string[];
    const raw = [ ...((item.images || []) as ListingImage[]).map(x => x.url), item.coverImage ]
      .filter(Boolean)
      .map(x => resolveMediaUrl(String(x)));
    return Array.from(new Set(raw));
  }, [item]);

  useEffect(() => {
    if (gallery.length === 0) {
      if (selectedImage) setSelectedImage('');
      return;
    }

    if (!gallery.includes(selectedImage)) {
      setSelectedImage(gallery[0]);
    }
  }, [gallery, selectedImage]);

  if (!item) return <p className="muted">{tr('Chargement...', 'Mampiditra...')}</p>;

  const sellerName = String(item.seller?.fullName || item.sellerName || item.seller?.name || '').trim();
  const sellerProfileImage = resolveMediaUrl(item.seller?.profileImageUrl || item.sellerProfileImageUrl || '');
  const sellerInitials = getSellerInitials(sellerName);
  const isProfessionalSeller = isProfessionalValue(
    item.seller?.accountType
    || item.seller?.AccountType
    || item.sellerAccountType
    || item.SellerAccountType
    || item.accountType
    || item.AccountType
    || item.seller?.isProfessional
    || item.seller?.IsProfessional
    || item.isProfessionalSeller
    || item.IsProfessionalSeller
  );
  const phone = item.seller?.phoneNumber || item.phoneNumber || '';
  const whatsapp = item.seller?.whatsAppNumber || item.whatsAppNumber || '';
  const whatsappDigits = String(whatsapp).replace(/\D/g, '');
  const whatsappMessage = encodeURIComponent([
    'Bonjour, je suis intéressé par ce véhicule :',
    `${item.title}`,
    `Marque/Modèle: ${item.brand} ${item.model}`,
    `Année: ${item.year}`,
    `Prix: ${Number(item.price || 0).toLocaleString()} Ar`,
    `Kilométrage: ${Number(item.mileage || 0).toLocaleString()} km`,
    `Ville: ${item.city}`
  ].filter(Boolean).join('\n'));
  const whatsappHref = whatsappDigits ? `https://wa.me/${whatsappDigits}?text=${whatsappMessage}` : '';
  const publishedText = item.publishedAt
    ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(item.publishedAt))
    : '';
  const shareUrl = typeof window !== 'undefined' ? window.location.href : `${process.env.NEXT_PUBLIC_SITE_URL || ''}/cars/${item.id}`;

  const shareListing = async () => {
    const payload = {
      title: item.title,
      text: `${item.brand} ${item.model} - ${Number(item.price || 0).toLocaleString()} Ar`,
      url: shareUrl
    };
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share(payload);
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setShareNotice(tr('Lien copié', 'Rohy voadika'));
        window.setTimeout(() => setShareNotice(''), 1800);
      }
    } catch {
      // Ignore share cancellation/errors.
    }
  };

  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <BackLink href="/cars" />
      <section className="carDetailHeader">
        <h1 className="carDetailTitle">{item.title}</h1>
        <p className="carDetailSubtitle">{item.brand} {item.model} - {item.year} - {Number(item.mileage || 0).toLocaleString()} km - {item.city}</p>
      </section>

      <section className="carDetailLayout">
        <article className="card carGalleryCard">
          <div className="carMainImageWrap">
            {selectedImage ? (
              <a href={selectedImage} target="_blank" rel="noreferrer" className="carMainImageLink">
                <img src={selectedImage} alt={item.title} className="carMainImage" />
              </a>
            ) : (
              <div className="imgFallback">Pas de photo</div>
            )}
          </div>
          {selectedImage && <p className="carImageHint">Cliquez sur l’image pour l’ouvrir en taille originale</p>}

          {gallery.length > 0 && (
            <div className="carThumbsRow">
              {gallery.map((src, idx) => (
                <button
                  key={`${src}-${idx}`}
                  type="button"
                  className={src === selectedImage ? 'carThumbBtn active' : 'carThumbBtn'}
                  onClick={() => setSelectedImage(src)}
                  aria-label={`Photo ${idx + 1}`}
                >
                  <img src={src} alt={`Aperçu ${idx + 1}`} className="carThumbImg" />
                </button>
              ))}
            </div>
          )}
        </article>

        <div className="carRightColumn">
          <aside className="card cardBody carInfoCard">
            <button type="button" className="carShareLink" onClick={shareListing}>
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="carShareIcon">
                <path fill="currentColor" d="M18 16a3 3 0 0 0-2.39 1.2L8.91 13.7a3.05 3.05 0 0 0 0-3.4l6.7-3.5A3 3 0 1 0 15 5a2.9 2.9 0 0 0 .06.58l-6.7 3.5a3 3 0 1 0 0 4.84l6.7 3.5A2.9 2.9 0 0 0 15 19a3 3 0 1 0 3-3Z" />
              </svg>
              <span>{tr('Partager', 'Zaraina')}</span>
            </button>
            {shareNotice && <p className="carShareNotice">{shareNotice}</p>}
            <p className="price carDetailPrice">{Number(item.price).toLocaleString()} Ar</p>

            <div className="carInfoList">
              <p><strong>{tr('Marque', 'Marika')}:</strong> {item.brand}</p>
              <p><strong>{tr('Modèle', 'Modely')}:</strong> {item.model}</p>
              <p><strong>{tr('Année', 'Taona')}:</strong> {item.year}</p>
              <p><strong>{tr('Kilométrage', 'Kilometatra')}:</strong> {Number(item.mileage || 0).toLocaleString()} km</p>
              <p><strong>{tr('Carburant', 'Solika')}:</strong> {fuelTypeLabel(String(item.fuelType || ''), lang)}</p>
              <p><strong>{tr('Transmission', 'Boîte de vitesse')}:</strong> {transmissionTypeLabel(String(item.transmissionType || ''), lang)}</p>
              <p><strong>{tr('Ville', 'Tanàna')}:</strong> {item.city}</p>
              {publishedText && <p><strong>{tr('Publiée le', 'Navoaka tamin’ny')} :</strong> {publishedText}</p>}
            </div>

            {item.description && <p className="carDetailDesc">{item.description}</p>}
            {sellerName && (
              <div className="carSellerLine">
                {sellerProfileImage ? (
                  <img src={sellerProfileImage} alt={`Profil vendeur ${sellerName}`} className="carSellerAvatarImg" />
                ) : (
                  <span className="carSellerAvatarFallback" aria-label={`Initiales ${sellerInitials}`}>{sellerInitials}</span>
                )}
                <p className="carSellerNameRow" style={{ margin: 0 }}>
                  <strong>{tr('Vendeur', 'Mpivarotra')}:</strong> {sellerName}
                  {isProfessionalSeller && <span className="carProfessionalBadge">⭐ PRO</span>}
                </p>
              </div>
            )}

            <div className="inlineActions carContactActions">
              {whatsapp && (
                <a
                  className="primaryBtn carWhatsappBtn"
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg
                    className="carWhatsappIcon"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      fill="currentColor"
                      d="M12.04 2C6.62 2 2.24 6.38 2.24 11.8c0 1.73.45 3.42 1.31 4.91L2 22l5.45-1.52a9.75 9.75 0 0 0 4.59 1.17h.01c5.41 0 9.8-4.38 9.8-9.8C21.85 6.38 17.46 2 12.04 2Zm0 17.96h-.01a8.1 8.1 0 0 1-4.12-1.13l-.3-.18-3.23.9.86-3.15-.2-.32a8.1 8.1 0 0 1-1.24-4.28 8.24 8.24 0 1 1 8.24 8.16Zm4.52-6.14c-.25-.13-1.48-.73-1.71-.81-.22-.08-.38-.13-.54.12-.16.24-.62.8-.76.96-.14.16-.28.18-.53.06-.25-.13-1.04-.38-1.98-1.22-.73-.65-1.22-1.44-1.36-1.68-.14-.25-.01-.38.11-.5.11-.11.25-.28.37-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.07-.12-.54-1.3-.74-1.79-.2-.48-.4-.41-.54-.42l-.46-.01c-.16 0-.42.06-.65.3-.22.24-.85.83-.85 2.03 0 1.19.87 2.35.99 2.51.12.16 1.71 2.61 4.14 3.66.58.25 1.03.4 1.38.51.58.18 1.11.15 1.52.09.46-.07 1.48-.6 1.69-1.18.21-.58.21-1.08.15-1.18-.06-.1-.22-.16-.47-.29Z"
                    />
                  </svg>
                  WhatsApp
                </a>
              )}
              {phone && (
                <button type="button" className="ghostBtn carCallBtnDisabled" disabled>
                  {tr('Appeler', 'Antsoy')} {phone}
                </button>
              )}
            </div>
          </aside>

          <section className="card cardBody carRelatedCard">
            <h3 className="carRelatedTitle">{tr('Autres', 'Hafa')} {item.brand}</h3>
            {relatedItems.length > 0 ? (
              <div className="carRelatedList">
                {relatedItems.map((x) => (
                  <Link key={x.id} href={`/cars/${x.id}`}>
                    <a className="carRelatedItem">
                      <div className="carRelatedThumbWrap">
                        {x.coverImage ? (
                          <img src={resolveMediaUrl(x.coverImage)} alt={x.title} className="carRelatedThumb" />
                        ) : (
                          <div className="imgFallback">Pas de photo</div>
                        )}
                      </div>
                      <div className="carRelatedMeta">
                        <p className="carRelatedName">{x.model} {x.year}</p>
                        <p className="carRelatedPrice">{Number(x.price || 0).toLocaleString()} Ar</p>
                        <p className="carRelatedSub">{Number(x.mileage || 0).toLocaleString()} km - {x.city}</p>
                      </div>
                    </a>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="muted carRelatedEmpty">{tr('Aucune autre annonce de cette marque pour le moment.', 'Tsy misy filazana hafa amin’ity marika ity amin’izao fotoana izao.')}</p>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

