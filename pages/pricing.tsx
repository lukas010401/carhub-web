import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { isBetaMode } from '@/lib/beta';

export default function PricingPage() {
  const { tr } = useI18n();
  const betaMode = isBetaMode();

  if (betaMode) {
    return (
      <div className="grid" style={{ gap: '1rem' }}>
        <section className="tarifsGrid">
          <article className="card cardBody tarifsPlan tarifsPlanIndividual">
            <p className="tarifsPlanTop">{tr('Particulier', 'Olon-tsotra')}</p>
            <h2 className="tarifsPlanPrice">{tr('Publication gratuite', 'Famoahana maimaim-poana')}</h2>
            <p className="tarifsPlanSub">{tr('Vous pouvez publier vos annonces sans frais pendant la bêta.', 'Afaka mamoaka filazana tsy misy sarany ianao mandritra ny bêta.')}</p>
            <ul className="tarifsList">
              <li>{tr('Aucun paiement demandé pendant la période de lancement.', 'Tsy misy fandoavana angatahina mandritra ny fanombohana.')}</li>
              <li>{tr('Création de compte et mise en ligne simplifiées.', 'Tsotra kokoa ny famoronana kaonty sy ny famoahana.')}</li>
              <li>{tr('Les conditions commerciales définitives seront communiquées plus tard.', 'Hambara aoriana ny fepetra ara-barotra farany.')}</li>
            </ul>
            <Link href="/register"><a className="primaryBtn">{tr('Créer un compte', 'Hamorona kaonty')}</a></Link>
          </article>

          <article className="card cardBody tarifsPlan tarifsPlanPro">
            <p className="tarifsPlanTop">PRO {tr('Professionnel', 'Matihanina')}</p>
            <h2 className="tarifsPlanPrice">{tr('Activation bêta gratuite', 'Activation bêta maimaim-poana')}</h2>
            <p className="tarifsPlanSub">{tr('Les vendeurs professionnels restent identifiés pendant la bêta, sans facturation active.', 'Mbola fantatra ny mpivarotra matihanina mandritra ny bêta, nefa tsy mbola misy fandoavana mavitrika.')}</p>
            <ul className="tarifsList">
              <li>{tr('Badge PRO toujours visible sur les annonces.', 'Mbola hita amin’ny filazana ny badge PRO.')}</li>
              <li>{tr('La publication est gratuite pendant le lancement.', 'Maimaim-poana ny famoahana mandritra ny fanombohana.')}</li>
              <li>{tr('Les conditions commerciales définitives pour les professionnels seront communiquées plus tard.', 'Hambara aoriana ny fepetra ara-barotra farany ho an’ny matihanina.')}</li>
            </ul>
            <Link href="/register"><a className="primaryBtn">{tr('Créer un compte professionnel', 'Hamorona kaonty matihanina')}</a></Link>
          </article>
        </section>
      </div>
    );
  }

  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <section className="card cardBody tarifsHero">
        <p className="tarifsBadge">{tr('Offres CarHub', 'Tolotra CarHub')}</p>
        <h1 className="tarifsTitle">{tr('Particulier ou professionnel : choisissez la formule adaptée', 'Olon-tsotra sa matihanina: fidio ny tolotra mety aminao')}</h1>
        <p className="tarifsLead">
          {tr(
            'CarHub propose deux modes simples. Particulier : paiement à la publication. Professionnel : abonnement mensuel avec publication continue.',
            'Manolotra fomba roa tsotra i CarHub. Olon-tsotra: mandoa rehefa mamoaka. Matihanina: famandrihana isam-bolana miaraka amin’ny famoahana mitohy.'
          )}
        </p>
      </section>
    </div>
  );
}
