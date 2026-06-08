import { useI18n } from '@/lib/i18n';

export default function PrivacyPage() {
  const { tr } = useI18n();

  return (
    <section className="card cardBody" style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gap: '1rem' }}>
      <header className="grid" style={{ gap: '0.4rem' }}>
        <h1 style={{ margin: 0 }}>{tr('Politique de confidentialité', 'Politikan’ny tsiambaratelo')}</h1>
        <p className="muted" style={{ margin: 0 }}>
          {tr('Dernière mise à jour : 8 juin 2026', 'Nohavaozina farany: 8 Jona 2026')}
        </p>
      </header>

      <section className="grid" style={{ gap: '0.45rem' }}>
        <h2 style={{ margin: 0 }}>1. Données collectées</h2>
        <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'grid', gap: '0.25rem' }}>
          <li>Données de compte : nom, email, numéro de téléphone, numéro WhatsApp, mot de passe chiffré.</li>
          <li>Données d’annonces : titre, description, prix, localisation, caractéristiques du véhicule, photos.</li>
          <li>Données techniques : adresse IP, type d’appareil, navigateur, journaux de connexion et d’activité.</li>
        </ul>
      </section>

      <section className="grid" style={{ gap: '0.45rem' }}>
        <h2 style={{ margin: 0 }}>2. Finalités de traitement</h2>
        <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'grid', gap: '0.25rem' }}>
          <li>Créer et gérer votre compte.</li>
          <li>Publier, modérer et diffuser vos annonces automobiles.</li>
          <li>Faciliter la mise en relation entre acheteurs et vendeurs.</li>
          <li>Assurer la sécurité de la plateforme et prévenir la fraude.</li>
        </ul>
      </section>
    </section>
  );
}
