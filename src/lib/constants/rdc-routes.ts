// Routes principales — RDC (Haut-Katanga, Lualaba, Tanganyika, Grands Lacs) + corridor Zambie (Copperbelt, Lusaka)
// Distances indicatives route (fret), pour estimateurs uniquement.
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
  { from: 'Likasi', to: 'Kipushi', distance: '70 km', duration: '1h30' },
  { from: 'Lubumbashi', to: 'Sakania', distance: '42 km', duration: '1h' },
  { from: 'Kasumbalesa', to: 'Sakania', distance: '40 km', duration: '50min' },
  { from: 'Kolwezi', to: 'Mutshatsha', distance: '88 km', duration: '2h' },
  { from: 'Kolwezi', to: 'Tenke', distance: '92 km', duration: '2h' },
  { from: 'Fungurume', to: 'Tenke', distance: '25 km', duration: '40min' },
  { from: 'Kalemie', to: 'Kongolo', distance: '195 km', duration: '4h' },
  { from: 'Kongolo', to: 'Kaniama', distance: '120 km', duration: '2h30' },
  { from: 'Kalemie', to: 'Manono', distance: '410 km', duration: '8h' },
  { from: 'Manono', to: 'Moba', distance: '180 km', duration: '4h' },
  { from: 'Bukavu', to: 'Goma', distance: '210 km', duration: '4h' },
  { from: 'Bukavu', to: 'Uvira', distance: '25 km', duration: '45min' },
  { from: 'Uvira', to: 'Kalemie', distance: '380 km', duration: '8h' },
  // Transfrontalier RDC — Zambie (Kasumbalesa / Sakania)
  { from: 'Kasumbalesa', to: 'Chililabombwe', distance: '8 km', duration: '15min' },
  { from: 'Kasumbalesa', to: 'Chingola', distance: '24 km', duration: '35min' },
  { from: 'Sakania', to: 'Chingola', distance: '58 km', duration: '1h15' },
  { from: 'Lubumbashi', to: 'Chingola', distance: '98 km', duration: '2h' },
  { from: 'Lubumbashi', to: 'Kitwe', distance: '168 km', duration: '3h30' },
  { from: 'Lubumbashi', to: 'Ndola', distance: '205 km', duration: '4h' },
  { from: 'Lubumbashi', to: 'Lusaka', distance: '525 km', duration: '10h' },
  { from: 'Kolwezi', to: 'Ndola', distance: '498 km', duration: '10h' },
  { from: 'Kolwezi', to: 'Kitwe', distance: '468 km', duration: '9h30' },
  // Zambie — Copperbelt & interne
  { from: 'Chililabombwe', to: 'Chingola', distance: '14 km', duration: '20min' },
  { from: 'Chingola', to: 'Kitwe', distance: '52 km', duration: '1h' },
  { from: 'Kitwe', to: 'Ndola', distance: '63 km', duration: '1h15' },
  { from: 'Kitwe', to: 'Mufulira', distance: '42 km', duration: '50min' },
  { from: 'Ndola', to: 'Lusaka', distance: '325 km', duration: '6h' },
  { from: 'Ndola', to: 'Solwezi', distance: '285 km', duration: '5h30' },
  { from: 'Kitwe', to: 'Solwezi', distance: '335 km', duration: '6h30' },
  { from: 'Lusaka', to: 'Livingstone', distance: '480 km', duration: '9h' },
  { from: 'Lusaka', to: 'Chipata', distance: '570 km', duration: '11h' },
  { from: 'Ndola', to: 'Chipata', distance: '620 km', duration: '12h' },
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


