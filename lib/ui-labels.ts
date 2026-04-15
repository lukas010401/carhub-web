type AppLang = 'fr' | 'mg';

export function listingStatusLabel(value: string, lang: AppLang = 'fr'): string {
  const mg = lang === 'mg';
  switch (value) {
    case 'Draft':
      return mg ? 'Drafitra' : 'Brouillon';
    case 'PendingReview':
      return mg ? 'Miandry fanamarinana' : 'En attente de validation';
    case 'Published':
    case 'Approved':
      return mg ? 'Navoaka' : 'Publiée';
    case 'Rejected':
      return mg ? 'Nolavina' : 'Rejetée';
    case 'Archived':
      return mg ? 'Voatahiry' : 'Archivée';
    case 'Sold':
      return mg ? 'Lafo' : 'Vendue';
    default:
      return value;
  }
}

export function roleLabel(value: string, lang: AppLang = 'fr'): string {
  const mg = lang === 'mg';
  switch (value) {
    case 'Seller':
      return mg ? 'Mpivarotra' : 'Vendeur';
    case 'Admin':
      return mg ? 'Mpitantana' : 'Administrateur';
    default:
      return value;
  }
}
