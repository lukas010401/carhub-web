import { useI18n } from '@/lib/i18n';

export default function ContactPage() {
  const { tr } = useI18n();

  return (
    <section className="grid" style={{ gap: '1rem', maxWidth: '900px', margin: '0 auto' }}>
      <header className="card cardBody grid" style={{ gap: '0.45rem' }}>
        <h1 style={{ margin: 0 }}>{tr('Contact', 'Fifandraisana')}</h1>
        <p className="muted" style={{ margin: 0 }}>
          {tr(
            'Besoin d’assistance sur une annonce, un compte ou la plateforme CarHub ? Notre équipe est disponible.',
            'Mila fanampiana momba ny filazana, kaonty na sehatra CarHub ve ianao? Vonona ny ekipanay.'
          )}
        </p>
      </header>

      <section className="card cardBody grid" style={{ gap: '0.8rem' }}>
        <h2 style={{ margin: 0 }}>{tr('Canaux de contact', 'Lalana hifandraisana')}</h2>
        <div className="formGrid">
          <article className="sellerTrustPanel">
            <h3>{tr('Email support', 'Email fanampiana')}</h3>
            <p>Pour toute demande générale et assistance compte.</p>
            <p><a href="mailto:contact@carhub-mg.com" style={{ color: '#1d4ed8', fontWeight: 700 }}>contact@carhub-mg.com</a></p>
          </article>

          <article className="sellerTrustPanel">
            <h3>{tr('Téléphone', 'Telefaona')}</h3>
            <p>Pour les urgences opérationnelles.</p>
            <p><a href="tel:+261341234567" style={{ color: '#1d4ed8', fontWeight: 700 }}>+261 34 12 345 67</a></p>
          </article>

          <article className="sellerTrustPanel">
            <h3>WhatsApp</h3>
            <p>Pour une réponse rapide en heures ouvrables.</p>
            <p><a href="https://wa.me/261341234567" target="_blank" rel="noreferrer" style={{ color: '#1d4ed8', fontWeight: 700 }}>+261 34 12 345 67</a></p>
          </article>

          <article className="sellerTrustPanel">
            <h3>Signalement</h3>
            <p>Annonce suspecte, fraude, abus ou contenu illicite.</p>
            <p><a href="mailto:abuse@carhub-mg.com" style={{ color: '#1d4ed8', fontWeight: 700 }}>abuse@carhub-mg.com</a></p>
          </article>
        </div>
      </section>
    </section>
  );
}
