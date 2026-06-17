import { useI18n } from '@/lib/i18n';

export default function ContactPage() {
  const { tr } = useI18n();

  return (
    <section className="grid" style={{ gap: '1rem', maxWidth: '900px', margin: '0 auto' }}>
      <header className="card cardBody grid" style={{ gap: '0.45rem' }}>
        <h1 style={{ margin: 0 }}>{tr('Contact', 'Fifandraisana')}</h1>
        <p className="muted" style={{ margin: 0 }}>
          {tr(
            'Besoin d’assistance sur une annonce, un compte ou la plateforme CarHub ? Nos canaux de contact seront disponibles bientôt.',
            'Mila fanampiana momba ny filazana, kaonty na sehatra CarHub ve ianao? Ho azo ampiasaina tsy ho ela ny lalanay hifandraisana.'
          )}
        </p>
      </header>

      <section className="card cardBody grid" style={{ gap: '0.8rem' }}>
        <h2 style={{ margin: 0 }}>{tr('Canaux de contact', 'Lalana hifandraisana')}</h2>
        <div className="formGrid">
          <article className="sellerTrustPanel">
            <h3>{tr('Email support', 'Email fanampiana')}</h3>
            <p>Pour toute demande générale et assistance compte.</p>
            <p style={{ color: '#1d4ed8', fontWeight: 700 }}>Disponible bientôt</p>
          </article>

          <article className="sellerTrustPanel">
            <h3>{tr('Téléphone', 'Telefaona')}</h3>
            <p>Pour les urgences opérationnelles.</p>
            <p style={{ color: '#1d4ed8', fontWeight: 700 }}>Disponible bientôt</p>
          </article>

          <article className="sellerTrustPanel">
            <h3>WhatsApp</h3>
            <p>Pour une réponse rapide en heures ouvrables.</p>
            <p style={{ color: '#1d4ed8', fontWeight: 700 }}>Disponible bientôt</p>
          </article>

          <article className="sellerTrustPanel">
            <h3>Signalement</h3>
            <p>Annonce suspecte, fraude, abus ou contenu illicite.</p>
            <p style={{ color: '#1d4ed8', fontWeight: 700 }}>Disponible bientôt</p>
          </article>
        </div>
      </section>
    </section>
  );
}
