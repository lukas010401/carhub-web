import { useI18n } from '@/lib/i18n';

export default function TermsPage() {
  const { tr } = useI18n();

  return (
    <section className="card cardBody" style={{ maxWidth: '920px', margin: '0 auto', display: 'grid', gap: '1rem' }}>
      <header className="grid" style={{ gap: '0.4rem' }}>
        <h1 style={{ margin: 0 }}>{tr("Conditions d'utilisation", 'Fepetra fampiasana')}</h1>
        <p className="muted" style={{ margin: 0 }}>
          {tr('Dernière mise à jour: 15 avril 2026', 'Nohavaozina farany: 15 Aprily 2026')}
        </p>
        <p style={{ margin: 0 }}>
          {tr(
            "Les présentes conditions encadrent l'accès, l'inscription et l'utilisation de CarHub Madagascar par les visiteurs, vendeurs et administrateurs.",
            "Ireo fepetra ireo no mifehy ny fidirana sy ny fampiasana an'i CarHub Madagascar ho an'ny mpitsidika, mpivarotra ary mpitantana."
          )}
        </p>
      </header>

      <section className="grid" style={{ gap: '0.45rem' }}>
        <h2 style={{ margin: 0 }}>{tr('1. Nature du service', '1. Karazana tolotra')}</h2>
        <p style={{ margin: 0 }}>
          {tr(
            "CarHub Madagascar est une plateforme de mise en relation dans le secteur automobile. CarHub ne devient pas partie au contrat de vente entre vendeur et acheteur.",
            "CarHub Madagascar dia sehatra mampifandray amin'ny sehatry ny fiara. Tsy lasa antoko amin'ny fifanarahana fivarotana eo amin'ny mpivarotra sy mpividy i CarHub."
          )}
        </p>
      </section>

      <section className="grid" style={{ gap: '0.45rem' }}>
        <h2 style={{ margin: 0 }}>{tr('2. Compte utilisateur', '2. Kaonty mpampiasa')}</h2>
        <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'grid', gap: '0.25rem' }}>
          <li>{tr('Les informations de compte doivent être exactes et à jour.', 'Tokony ho marina sy havaozina ny mombamomba ny kaonty.')}</li>
          <li>{tr("Vous êtes responsable de la sécurité de vos identifiants.", 'Ianao no tomponandraikitra amin ny fiarovana ny kaody fidiranao.')}</li>
          <li>{tr('Tout usage effectué depuis votre compte est sous votre responsabilité.', 'Ny fampiasana rehetra atao avy amin ny kaontinao dia andraikitrao.')}</li>
        </ul>
      </section>

      <section className="grid" style={{ gap: '0.45rem' }}>
        <h2 style={{ margin: 0 }}>{tr('3. Publication des annonces', '3. Famoahana filazana')}</h2>
        <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'grid', gap: '0.25rem' }}>
          <li>{tr('Le vendeur garantit la légalité, l exactitude et la disponibilité du véhicule annoncé.', 'Ny mpivarotra no miantoka ny maha ara-dalàna sy marina ny filazana ary ny fisian ny fiara.')}</li>
          <li>{tr('Sont interdits: contenus trompeurs, illégaux, diffamatoires, doublons abusifs et spam.', 'Voarara ny votoaty mamitaka, tsy ara-dalàna, manaratsy, famerenana tafahoatra ary spam.')}</li>
          <li>{tr('CarHub peut refuser, suspendre, dépublier ou supprimer une annonce non conforme.', 'Afaka mandà, mampiato, manaisotra amin ny publication na mamafa filazana tsy manaraka fitsipika i CarHub.')}</li>
        </ul>
      </section>

      <section className="grid" style={{ gap: '0.45rem' }}>
        <h2 style={{ margin: 0 }}>{tr('4. Tarification et paiements', '4. Vidiny sy fandoavana')}</h2>
        <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'grid', gap: '0.25rem' }}>
          <li>{tr('Particulier: 20 000 Ar par annonce mise en ligne.', 'Kaonty tsotra: 20 000 Ar isaky ny filazana avoaka.')}</li>
          <li>{tr('Professionnel: abonnement mensuel selon offre active.', 'Kaonty matihanina: famandrihana isam-bolana araka ny tolotra miasa.')}</li>
          <li>{tr('Le paiement peut être soumis à vérification et validation administrative avant activation.', 'Ny fandoavana dia mety hohamarinin ny admin alohan ny fampandehanana.')}</li>
          <li>{tr('Sauf mention contraire, les frais validés ne sont pas remboursables après activation/publication.', 'Raha tsy misy fepetra mifanohitra, tsy averina ny sarany voamarina rehefa tafapetraka ny activation/publication.')}</li>
        </ul>
      </section>

      <section className="grid" style={{ gap: '0.45rem' }}>
        <h2 style={{ margin: 0 }}>{tr('5. Durée de visibilité', '5. Faharetan ny fisehoan ny filazana')}</h2>
        <p style={{ margin: 0 }}>
          {tr(
            "La durée de publication d'une annonce peut être limitée et configurable par CarHub (ex: 10 jours), avec possibilité de renouvellement selon les règles en vigueur.",
            "Mety ho voafetra sy azo ovaina ny faharetan ny publication ny filazana (ohatra: 10 andro), ary azo havaozina araka ny fitsipika manan-kery."
          )}
        </p>
      </section>

      <section className="grid" style={{ gap: '0.45rem' }}>
        <h2 style={{ margin: 0 }}>{tr('6. Responsabilités', '6. Andraikitra')}</h2>
        <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'grid', gap: '0.25rem' }}>
          <li>{tr('Le vendeur reste seul responsable du contenu, du prix et de la transaction finale.', 'Ny mpivarotra irery no tomponandraikitra amin ny votoaty, vidiny ary fifanakalozana farany.')}</li>
          <li>{tr('L acheteur doit effectuer ses vérifications avant toute décision d achat.', 'Ny mpividy dia tsy maintsy manao fanamarinana alohan ny fanapahan-kevitra hividy.')}</li>
          <li>{tr('CarHub n offre pas de garantie sur la conclusion effective de la vente.', 'Tsy manome antoka amin ny fahatanterahan ny varotra i CarHub.')}</li>
        </ul>
      </section>

      <section className="grid" style={{ gap: '0.45rem' }}>
        <h2 style={{ margin: 0 }}>{tr('7. Propriété intellectuelle', '7. Fananana ara-tsaina')}</h2>
        <p style={{ margin: 0 }}>
          {tr(
            "La marque CarHub, ses visuels, son interface et ses contenus sont protégés. Toute reproduction non autorisée est interdite.",
            "Voaaro ny marika CarHub, ny endrika hita maso, ny interface ary ny votoaty. Voarara ny fampiasana tsy nahazoana alalana."
          )}
        </p>
      </section>

      <section className="grid" style={{ gap: '0.45rem' }}>
        <h2 style={{ margin: 0 }}>{tr('8. Loi applicable et litiges', '8. Lalàna manan-kery sy ady')}</h2>
        <p style={{ margin: 0 }}>
          {tr(
            "Les présentes conditions sont soumises aux lois applicables à Madagascar, sans préjudice des règles impératives éventuellement applicables.",
            "Ireo fepetra ireo dia fehezin ny lalàna manan-kery eto Madagasikara, ankoatra ireo fitsipika tsy maintsy ampiharina raha misy."
          )}
        </p>
      </section>

      <section className="grid" style={{ gap: '0.45rem' }}>
        <h2 style={{ margin: 0 }}>{tr('9. Contact', '9. Fifandraisana')}</h2>
        <p style={{ margin: 0 }}>
          {tr("Pour toute question relative aux présentes conditions:", 'Ho an ny fanontaniana rehetra momba ireo fepetra ireo:')}{' '}
          <a href="mailto:contact@carhub.mg" style={{ color: '#1d4ed8', fontWeight: 600 }}>contact@carhub.mg</a>
        </p>
      </section>
    </section>
  );
}
