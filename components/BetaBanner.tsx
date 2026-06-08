import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

type Props = {
  compact?: boolean;
  showPricingLink?: boolean;
  title?: string;
  message?: string;
};

export default function BetaBanner({ compact = false, showPricingLink = true, title, message }: Props) {
  const { tr } = useI18n();

  const resolvedTitle = title || tr('CarHub.MG est actuellement en phase bêta.', 'CarHub.MG dia mbola ao anatin’ny dingana bêta.');
  const resolvedMessage = message || tr(
    'La publication des annonces est gratuite pendant notre période de lancement.',
    'Maimaim-poana ny famoahana filazana mandritra ny vanim-potoanan’ny fanombohana.'
  );

  return (
    <section className={compact ? 'betaBanner betaBannerCompact' : 'betaBanner'} aria-label="Information bêta">
      <div className="betaBannerBody">
        <p className="betaBannerEyebrow">BETA</p>
        <h2 className="betaBannerTitle">{resolvedTitle}</h2>
        <p className="betaBannerText">{resolvedMessage}</p>
      </div>
      {showPricingLink && (
        <Link href="/pricing">
          <a className="betaBannerLink">
            {tr('Voir les conditions de lancement', 'Hijery ny fepetra fanombohana')}
          </a>
        </Link>
      )}
    </section>
  );
}
