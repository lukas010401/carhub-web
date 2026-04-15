import { useI18n } from '@/lib/i18n';

export default function AuthPricingCard() {
  const { tr } = useI18n();

  return (
    <section className="authPricingCard" aria-label="Tarification CarHub">
      <div className="authPricingBadge">{tr('Tarification vendeur', "Vidin'ny mpivarotra")}</div>
      <h2 className="authPricingTitle">{tr('Simple, claire et adaptée à votre profil', "Tsotra, mazava ary mifanaraka amin'ny kaontinao")}</h2>
      <p className="authPricingLead">
        {tr(
          'Choisissez votre type de compte à l’inscription pour appliquer la bonne règle.',
          "Fidio ny karazana kaonty amin'ny fisoratana anarana mba hampiharana ny fitsipika mety."
        )}
      </p>

      <div className="authPricingPlans">
        <article className="authPricingPlan authPricingPlanIndividual">
          <p className="authPricingPlanLabel">{tr('Particulier', 'Olon-tsotra')}</p>
          <p className="authPricingPlanPrice">{tr('20 000 Ar / annonce', '20 000 Ar / filazana')}</p>
          <p className="authPricingPlanText">{tr('Vous payez uniquement quand vous mettez une annonce en ligne.', 'Mandoa ianao rehefa mampiditra filazana an-tserasera.')}</p>
        </article>

        <article className="authPricingPlan authPricingPlanProfessional">
          <span className="authPricingProPill">⭐ PRO</span>
          <p className="authPricingPlanLabel">{tr('Professionnel', 'Matihanina')}</p>
          <p className="authPricingPlanPrice">{tr('150 000 Ar / mois', '150 000 Ar / volana')}</p>
          <ul className="authPricingPlanList">
            <li>{tr('Montant fixe par mois.', 'Sanda raikitra isam-bolana.')}</li>
            <li>{tr('Annonces illimitées pendant abonnement actif.', 'Filazana tsy voafetra mandritra ny famandrihana mavitrika.')}</li>
            <li>{tr('Badge PRO et visibilité renforcée.', 'Badge PRO sy fahitana matanjaka kokoa.')}</li>
            {/* <li>{tr('Si l’abonnement est suspendu, vos annonces déjà publiées restent visibles.', 'Raha miato ny famandrihana dia mbola hita ireo filazana efa navoaka.')}</li> */}
          </ul>
        </article>
      </div>

      <p className="authPricingNote">
        {tr(
          'Sans abonnement pro actif, les nouvelles annonces professionnelles ne sont pas mises en ligne. Aucun paiement à l’ouverture de compte.',
          "Raha tsy mavitrika ny famandrihana pro dia tsy avoaka ny filazana matihanina vaovao. Tsy mandoa vola amin'ny fanokafana kaonty."
        )}
      </p>
    </section>
  );
}
