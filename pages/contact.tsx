import { useI18n } from '@/lib/i18n';

export default function ContactPage() {
  const { tr } = useI18n();
  return (
    <section className="grid" style={{ gap: '1rem', maxWidth: '900px', margin: '0 auto' }}>
      <header className="card cardBody grid" style={{ gap: '0.45rem' }}>
        <h1 style={{ margin: 0 }}>{tr('Contact', 'Fifandraisana')}</h1>
        <p className="muted" style={{ margin: 0 }}>
          {tr("Besoin d’assistance sur une annonce, un compte ou un paiement de publication? Notre équipe est disponible.", "Mila fanampiana momba ny filazana, kaonty na fandoavana famoahana? Vonona ny ekipanay.")}
        </p>
      </header>

      <section className="card cardBody grid" style={{ gap: '0.8rem' }}>
        <h2 style={{ margin: 0 }}>{tr('Canaux de contact', 'Làlana hifandraisana')}</h2>
        <div className="formGrid">
          <article className="sellerTrustPanel">
            <h3>{tr('Email support', 'Email fanampiana')}</h3>
            <p>Pour toute demande générale et assistance compte.</p>
            <p><a href="mailto:contact@carhub.mg" style={{ color: '#1d4ed8', fontWeight: 700 }}>contact@carhub.mg</a></p>
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
            <p><a href="mailto:abuse@carhub.mg" style={{ color: '#1d4ed8', fontWeight: 700 }}>abuse@carhub.mg</a></p>
          </article>
        </div>
      </section>

      <section className="card cardBody grid" style={{ gap: '0.65rem' }}>
        <h2 style={{ margin: 0 }}>{tr('Informations utiles', 'Fanazavana ilaina')}</h2>
        <div className="grid" style={{ gap: '0.3rem' }}>
          <p style={{ margin: 0 }}><strong>Horaires support:</strong> du lundi au vendredi, 08:30 - 17:30 (heure de Madagascar).</p>
          <p style={{ margin: 0 }}><strong>Délai de réponse moyen:</strong> moins de 24h ouvrables.</p>
          <p style={{ margin: 0 }}><strong>Langues:</strong> français et malagasy.</p>
        </div>
      </section>

      <section className="card cardBody grid" style={{ gap: '0.65rem' }}>
        <h2 style={{ margin: 0 }}>{tr('Avant de nous écrire', 'Alohan’ny hanoratanao')}</h2>
        <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'grid', gap: '0.25rem' }}>
          <li>Précisez l’objet de la demande (compte, annonce, paiement, modération).</li>
          <li>Ajoutez l’identifiant de l’annonce si applicable.</li>
          <li>Partagez des captures ou détails pour accélérer le traitement.</li>
        </ul>
      </section>
    </section>
  );
}
