import { useI18n } from '@/lib/i18n';
import { isBetaMode } from '@/lib/beta';

export default function AuthPricingCard() {
  const { tr } = useI18n();
  const betaMode = isBetaMode();

  if (betaMode) {
    return (
      <section className="authPricingCard" aria-label="Lancement bêta CarHub">
        <div className="authPricingBadge">{tr('Lancement bêta', 'Fanombohana bêta')}</div>
        <h2 className="authPricingTitle">{tr('Publiez gratuitement pendant notre phase bêta', 'Mamoaha filazana maimaim-poana mandritra ny dingana bêta')}</h2>
        <p className="authPricingLead">
          {tr(
            'CarHub ouvre sa version bêta. Les annonces sont gratuites pendant la période de lancement pour les particuliers comme pour les professionnels.',
            'Misokatra amin’ny kinova bêta i CarHub. Maimaim-poana ny filazana mandritra ny vanim-potoana fanombohana ho an’ny olon-tsotra sy ny matihanina.'
          )}
        </p>

        <div className="authPricingPlans">
          <article className="authPricingPlan authPricingPlanIndividual">
            <p className="authPricingPlanLabel">{tr('Particulier', 'Olon-tsotra')}</p>
            <p className="authPricingPlanPrice">{tr('Gratuit pendant la bêta', 'Maimaim-poana mandritra ny bêta')}</p>
            <p className="authPricingPlanText">{tr('Créez votre compte et publiez sans frais de lancement.', 'Mamorona kaonty ary avoahy tsy misy sarany fanombohana ny filazanao.')}</p>
          </article>

          <article className="authPricingPlan authPricingPlanProfessional">
            <span className="authPricingProPill">PRO</span>
            <p className="authPricingPlanLabel">{tr('Professionnel', 'Matihanina')}</p>
            <p className="authPricingPlanPrice">{tr('Activation bêta gratuite', 'Activation bêta maimaim-poana')}</p>
            <ul className="authPricingPlanList">
              <li>{tr('Le badge PRO reste visible sur vos annonces.', 'Mbola hita amin’ny filazanao ny badge PRO.')}</li>
              <li>{tr('Les comptes professionnels restent identifiés pendant la bêta.', 'Mbola fantatra tsara ny kaonty matihanina mandritra ny bêta.')}</li>
              <li>{tr('Les conditions commerciales définitives seront communiquées plus tard.', 'Hambara aoriana ny fepetra ara-barotra farany.')}</li>
            </ul>
          </article>
        </div>

        <p className="authPricingNote">
          {tr(
            'Choisissez simplement votre type de compte à l’inscription. Les paiements sont désactivés pendant cette phase bêta.',
            'Fidio fotsiny ny karazana kaonty amin’ny fisoratana anarana. Tsy mandeha ny fandoavana mandritra izao dingana bêta izao.'
          )}
        </p>
      </section>
    );
  }

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
          <span className="authPricingProPill">PRO</span>
          <p className="authPricingPlanLabel">{tr('Professionnel', 'Matihanina')}</p>
          <p className="authPricingPlanPrice">{tr('150 000 Ar / mois', '150 000 Ar / volana')}</p>
          <ul className="authPricingPlanList">
            <li>{tr('Montant fixe par mois.', 'Sanda raikitra isam-bolana.')}</li>
            <li>{tr('Annonces illimitées pendant abonnement actif.', 'Filazana tsy voafetra mandritra ny famandrihana mavitrika.')}</li>
            <li>{tr('Badge PRO et visibilité renforcée.', 'Badge PRO sy fahitana matanjaka kokoa.')}</li>
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
