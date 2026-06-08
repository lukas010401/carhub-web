import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

export default function PricingPage() {
  const { tr } = useI18n();

  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <section className="card cardBody tarifsHero">
        <p className="tarifsBadge">{tr('Offres CarHub', 'Tolotra CarHub')}</p>
        <h1 className="tarifsTitle">{tr('Particulier ou professionnel: choisissez la formule adaptée', 'Olon-tsotra sa matihanina: fidio ny tolotra mety aminao')}</h1>
        <p className="tarifsLead">
          {tr(
            'CarHub propose deux modes simples. Particulier: paiement à la publication. Professionnel: abonnement mensuel avec publication continue.',
            'Manolotra fomba roa tsotra i CarHub. Olon-tsotra: mandoa rehefa mamoaka. Matihanina: famandrihana isam-bolana miaraka amin’ny famoahana mitohy.'
          )}
        </p>
      </section>

      <section className="tarifsGrid">
        <article className="card cardBody tarifsPlan tarifsPlanIndividual">
          <p className="tarifsPlanTop">{tr('Particulier', 'Olon-tsotra')}</p>
          <h2 className="tarifsPlanPrice">20 000 Ar / {tr('annonce', 'filazana')}</h2>
          <p className="tarifsPlanSub">{tr('Vous payez uniquement quand vous mettez une annonce en ligne.', 'Mandoa ianao rehefa mampiditra filazana an-tserasera.')}</p>
          <ul className="tarifsList">
            <li>{tr('Idéal pour vendre un véhicule de temps en temps.', 'Mety raha mivarotra fiara indraindray.')}</li>
            <li>{tr('Aucun abonnement mensuel.', 'Tsy misy famandrihana isam-bolana.')}</li>
            <li>{tr('Paiement déclenché au moment de la publication.', 'Fandoavana atao rehefa avoaka ny filazana.')}</li>
          </ul>
          <Link href="/register"><a className="primaryBtn">{tr('Créer un compte particulier', 'Hamorona kaonty olon-tsotra')}</a></Link>
        </article>

        <article className="card cardBody tarifsPlan tarifsPlanPro">
          <p className="tarifsPlanTop">⭐ {tr('Professionnel', 'Matihanina')}</p>
          <h2 className="tarifsPlanPrice">150 000 Ar / {tr('mois', 'volana')}</h2>
          <p className="tarifsPlanSub">{tr('Abonnement mensuel pour vendeurs actifs.', 'Famandrihana isam-bolana ho an’ny mpivarotra mavitrika.')}</p>
          <ul className="tarifsList">
            <li>{tr('Annonces illimitées pendant abonnement actif.', 'Filazana tsy voafetra mandritra ny famandrihana mavitrika.')}</li>
            <li>{tr('Badge ⭐ PRO visible sur vos annonces.', 'Badge ⭐ PRO hita amin’ny filazanao.')}</li>
            <li>{tr('Meilleure visibilité dans la recherche avec "Pros d’abord".', 'Fahitana tsara kokoa amin’ny fikarohana miaraka amin’ny "Matihanina aloha".')}</li>
            <li>{tr('Sans abonnement actif, les nouvelles annonces pro ne sont pas mises en ligne.', 'Raha tsy mavitrika ny famandrihana dia tsy avoaka an-tserasera ny filazana pro vaovao.')}</li>
            <li>{tr('Si l’abonnement est suspendu, les annonces déjà publiées restent visibles.', 'Raha miato ny famandrihana dia mbola hita ireo filazana efa navoaka.')}</li>
          </ul>
          <Link href="/register"><a className="primaryBtn">{tr('Créer un compte professionnel', 'Hamorona kaonty matihanina')}</a></Link>
        </article>
      </section>

      <section className="card cardBody tarifsFooterCta">
        <p style={{ margin: 0 }}>
          {tr('Besoin d’aide pour choisir ?', 'Mila fanampiana amin’ny fisafidianana?')} <Link href="/contact"><a>{tr('Contactez CarHub', 'Mifandraisa amin’i CarHub')}</a></Link>.
        </p>
      </section>
    </div>
  );
}
