type AppLang = 'fr' | 'mg';

export function fuelTypeLabel(value: string, lang: AppLang = 'fr'): string {
  const mg = lang === 'mg';
  switch (value) {
    case 'Gasoline':
      return mg ? 'Lasantsy' : 'Essence';
    case 'Diesel':
      return 'Diesel';
    case 'Hybrid':
      return mg ? 'Mifangaro' : 'Hybride';
    case 'Electric':
      return mg ? 'Herinaratra' : 'Électrique';
    default:
      return value;
  }
}

export function transmissionTypeLabel(value: string, lang: AppLang = 'fr'): string {
  const mg = lang === 'mg';
  switch (value) {
    case 'Manual':
      return mg ? 'Tanana' : 'Manuelle';
    case 'Automatic':
      return mg ? 'Mandeha ho azy' : 'Automatique';
    default:
      return value;
  }
}
