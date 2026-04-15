import { useI18n } from '@/lib/i18n';

export default function PrivacyPage() {
  const { tr } = useI18n();

  return (
    <section className="card cardBody" style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gap: '1rem' }}>
      <header className="grid" style={{ gap: '0.4rem' }}>
        <h1 style={{ margin: 0 }}>{tr('Politique de confidentialité', 'Politikan’ny tsiambaratelo')}</h1>
        <p className="muted" style={{ margin: 0 }}>
          {tr('Dernière mise à jour: 23 mars 2026', 'Nohavaozina farany: 23 Martsa 2026')}
        </p>
        <p style={{ margin: 0 }}>
          {tr(
            'Cette politique explique comment CarHub Madagascar collecte, utilise, protège et conserve vos données personnelles lorsque vous utilisez la plateforme.',
            "Ity politika ity dia manazava ny fomba angonina, ampiasaina, arovana ary tehirizin’i CarHub Madagascar ny angon-drakitrao manokana rehefa mampiasa ny sehatra ianao."
          )}
        </p>
      </header>

      <section className="grid" style={{ gap: '0.45rem' }}>
        <h2 style={{ margin: 0 }}>1. Données collectées</h2>
        <p style={{ margin: 0 }}>Nous pouvons collecter les catégories de données suivantes:</p>
        <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'grid', gap: '0.25rem' }}>
          <li>Données de compte: nom, email, numéro de téléphone, numéro WhatsApp, mot de passe chiffré.</li>
          <li>Données d’annonces: titre, description, prix, localisation, caractéristiques du véhicule, photos.</li>
          <li>Données techniques: adresse IP, type d’appareil, navigateur, journaux de connexion et d’activité.</li>
          <li>Données transactionnelles: informations liées aux paiements de publication.</li>
        </ul>
      </section>

      <section className="grid" style={{ gap: '0.45rem' }}>
        <h2 style={{ margin: 0 }}>2. Finalités de traitement</h2>
        <p style={{ margin: 0 }}>Vos données sont traitées pour:</p>
        <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'grid', gap: '0.25rem' }}>
          <li>Créer et gérer votre compte.</li>
          <li>Publier, modérer et diffuser vos annonces automobiles.</li>
          <li>Faciliter la mise en relation entre acheteurs et vendeurs.</li>
          <li>Assurer la sécurité de la plateforme et prévenir la fraude.</li>
          <li>Améliorer nos services, notre support et notre expérience utilisateur.</li>
        </ul>
      </section>

      <section className="grid" style={{ gap: '0.45rem' }}>
        <h2 style={{ margin: 0 }}>3. Partage des données</h2>
        <p style={{ margin: 0 }}>
          Nous ne vendons pas vos données personnelles. Certaines données peuvent être partagées uniquement avec:
        </p>
        <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'grid', gap: '0.25rem' }}>
          <li>Nos prestataires techniques (hébergement, sécurité, maintenance).</li>
          <li>Nos prestataires de paiement pour le traitement des frais de publication.</li>
          <li>Les autorités compétentes lorsque la loi l’exige.</li>
        </ul>
      </section>

      <section className="grid" style={{ gap: '0.45rem' }}>
        <h2 style={{ margin: 0 }}>4. Durée de conservation</h2>
        <p style={{ margin: 0 }}>
          Les données sont conservées pendant la durée nécessaire aux finalités prévues, puis archivées ou supprimées
          selon nos obligations légales et opérationnelles.
        </p>
      </section>

      <section className="grid" style={{ gap: '0.45rem' }}>
        <h2 style={{ margin: 0 }}>5. Vos droits</h2>
        <p style={{ margin: 0 }}>
          Vous pouvez demander l’accès, la rectification ou la suppression de vos données, ainsi que vous opposer à
          certains traitements lorsque cela est applicable.
        </p>
        <p style={{ margin: 0 }}>
          Pour exercer vos droits: <a href="mailto:contact@carhub.mg" style={{ color: '#1d4ed8', fontWeight: 600 }}>contact@carhub.mg</a>.
        </p>
      </section>

      <section className="grid" style={{ gap: '0.45rem' }}>
        <h2 style={{ margin: 0 }}>6. Cookies et sécurité</h2>
        <p style={{ margin: 0 }}>
          Nous utilisons des cookies et technologies similaires pour l’authentification, la mesure d’audience et
          l’amélioration des performances. Des mesures techniques et organisationnelles sont mises en place pour protéger
          vos données contre l’accès non autorisé, la perte ou l’altération.
        </p>
      </section>

      <section className="grid" style={{ gap: '0.45rem' }}>
        <h2 style={{ margin: 0 }}>7. Mise à jour de la politique</h2>
        <p style={{ margin: 0 }}>
          Cette politique peut être modifiée à tout moment pour refléter les évolutions de la plateforme ou des
          obligations légales. La date de mise à jour est indiquée en haut de page.
        </p>
      </section>
    </section>
  );
}

