// Routes principales en RDC (Haut-Katanga et Lualaba)
export const ROUTES_RDC = [
  { from: 'Lubumbashi', to: 'Likasi', distance: '120 km', duration: '2h30' },
  { from: 'Lubumbashi', to: 'Kolwezi', distance: '300 km', duration: '6h' },
  { from: 'Lubumbashi', to: 'Kipushi', distance: '30 km', duration: '45min' },
  { from: 'Kolwezi', to: 'Fungurume', distance: '95 km', duration: '2h' },
  { from: 'Likasi', to: 'Kambove', distance: '35 km', duration: '50min' },
  { from: 'Lubumbashi', to: 'Kasumbalesa', distance: '80 km', duration: '1h45' },
  { from: 'Lubumbashi', to: 'Kalemie', distance: '870 km', duration: '18h' },
  { from: 'Kolwezi', to: 'Likasi', distance: '180 km', duration: '4h' },
  { from: 'Lubumbashi', to: 'Jadotville', distance: '110 km', duration: '2h15' },
  { from: 'Kolwezi', to: 'Lubumbashi', distance: '300 km', duration: '6h' },
];

export const CARGO_TYPES = [
  'Minerais',
  'Ciment',
  'Carburant',
  'Marchandises',
  'Équipements',
  'Alimentaire',
  'Bois',
  'Conteneur',
  'Matériaux de construction',
  'Produits chimiques',
];

export const TRUCK_TYPES = [
  'Semi-remorque',
  'Benne',
  'Citerne',
  'Plateau',
  'Frigorifique',
  'Porte-conteneur',
  'Camion-citerne',
  'Camion-grue',
];

export type UrgencyType = 'express' | 'urgent' | 'normal';

export interface Route {
  from: string;
  to: string;
  distance: string;
  duration: string;
}


