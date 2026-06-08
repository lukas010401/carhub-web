import { useI18n } from '@/lib/i18n';

export default function TermsPage() {
  const { tr } = useI18n();

  return (
    <section className="card cardBody" style={{ maxWidth: '920px', margin: '0 auto', display: 'grid', gap: '1rem' }}>
      <header className="grid" style={{ gap: '0.4rem' }}>
        <h1 style={{ margin: 0 }}>{tr("Conditions d'utilisation", 'Fepetra fampiasana')}</h1>
        <p className="muted" style={{ margin: 0 }}>
          {tr('Dernière mise à jour : 8 juin 2026', 'Nohavaozina farany: 8 Jona 2026')}
        </p>
      </header>

      <section className="grid" style={{ gap: '0.45rem' }}>
        <h2 style={{ margin: 0 }}>{tr('1. Nature du service', '1. Karazana tolotra')}</h2>
        <p style={{ margin: 0 }}>
          {tr(
            'CarHub Madagascar est une plateforme de mise en relation dans le secteur automobile. CarHub ne devient pas partie au contrat de vente entre vendeur et acheteur.',
            'CarHub Madagascar dia sehatra mampifandray amin’ny sehatry ny fiara. Tsy lasa antoko amin’ny fifanarahana fivarotana eo amin’ny mpivarotra sy mpividy i CarHub.'
          )}
        </p>
      </section>

      <section className="grid" style={{ gap: '0.45rem' }}>
        <h2 style={{ margin: 0 }}>{tr('2. Publication des annonces', '2. Famoahana filazana')}</h2>
        <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'grid', gap: '0.25rem' }}>
          <li>{tr('Le vendeur garantit la légalité, l’exactitude et la disponibilité du véhicule annoncé.', 'Ny mpivarotra no miantoka ny maha ara-dalàna sy marina ny filazana ary ny fisian’ny fiara.')}</li>
          <li>{tr('Sont interdits : contenus trompeurs, illégaux, diffamatoires, doublons abusifs et spam.', 'Voarara ny votoaty mamitaka, tsy ara-dalàna, manaratsy, famerenana tafahoatra ary spam.')}</li>
          <li>{tr('CarHub peut refuser, suspendre, dépublier ou supprimer une annonce non conforme.', 'Afaka mandà, mampiato, manaisotra na mamafa filazana tsy manaraka fitsipika i CarHub.')}</li>
        </ul>
      </section>

      <section className="grid" style={{ gap: '0.45rem' }}>
        <h2 style={{ margin: 0 }}>{tr('3. Conditions de lancement bêta', '3. Fepetra amin’ny fanombohana bêta')}</h2>
        <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'grid', gap: '0.25rem' }}>
          <li>{tr('Pendant la bêta, la publication des annonces est gratuite.', 'Maimaim-poana ny famoahana filazana mandritra ny bêta.')}</li>
          <li>{tr('Les paiements et abonnements pourront être activés plus tard selon la version commerciale finale.', 'Azo averina aoriana ny fandoavana sy famandrihana arakaraka ny kinova ara-barotra farany.')}</li>
          <li>{tr('CarHub peut ajuster les conditions de lancement, les limites ou les modules actifs pendant cette période.', 'Afaka manitsy ny fepetra fanombohana, ny fetra na ny modules mavitrika mandritra izao vanim-potoana izao i CarHub.')}</li>
        </ul>
      </section>
    </section>
  );
}
