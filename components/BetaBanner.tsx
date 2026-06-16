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
    'Pendant la bêta, il n’y a pas encore de différence tarifaire entre compte particulier et compte professionnel : la publication est gratuite pour tous. Le compte professionnel reste proposé dès maintenant, car il sera ensuite lié à une formule d’abonnement mensuel.',
    'Mandritra ny bêta, mbola tsy misy fahasamihafana ara-tarifa eo amin’ny kaonty tsotra sy ny kaonty matihanina: maimaim-poana ho an’ny rehetra ny famoahana filazana. Atolotra sahady ny kaonty matihanina, satria hifandray amin’ny famandrihana isam-bolana izy io ao aoriana ao.'
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
