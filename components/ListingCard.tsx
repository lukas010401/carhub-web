import Link from 'next/link';
import { PublicListing } from '@/lib/types';
import { resolveMediaUrl } from '@/lib/media';

interface Props {
  listing: PublicListing;
}

function isProfessionalValue(value: unknown): boolean {
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'professional' || normalized === 'pro' || normalized === '1' || normalized === 'true';
}

function slugifyBrand(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function ListingCard({ listing }: Props) {
  const logoSrc = `/brand-logos/${slugifyBrand(listing.brand)}.svg`;
  const coverSrc = resolveMediaUrl(listing.coverImage);
  const isProfessionalSeller = isProfessionalValue(
    listing.seller?.accountType
    || (listing as any).seller?.AccountType
    || listing.sellerAccountType
    || (listing as any).SellerAccountType
    || listing.accountType
    || (listing as any).AccountType
    || (listing as any).isProfessionalSeller
    || (listing as any).IsProfessionalSeller
  );

  return (
    <Link href={`/cars/${listing.id}`}>
      <a className="listingCardLink">
        <article className="card listingCard">
          <div className="imgWrap">
            {coverSrc ? <img src={coverSrc} alt={listing.title} /> : <div className="imgFallback">Pas de photo</div>}
          </div>
          <div className="cardBody listingCardBody">
            <h3 className="listingTitle">{listing.title}</h3>
            <p className="price listingPrice">{listing.price.toLocaleString()} Ar</p>

            <p className="listingBrandLine">
              <img
                className="listingBrandLogo"
                src={logoSrc}
                alt={`Logo ${listing.brand}`}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/brand-logos/default.svg';
                }}
              />
              <span>{listing.brand} {listing.model} - {listing.year}</span>
              {isProfessionalSeller && <span className="listingProBadge">⭐ PRO</span>}
            </p>

            <p className="listingMeta">{listing.mileage.toLocaleString()} km - {listing.city}</p>
          </div>
        </article>
      </a>
    </Link>
  );
}
