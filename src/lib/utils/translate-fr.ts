// Traductions francaises pour les types et status
// Utilise partout dans l'app pour afficher en francais

export const TRUCK_TYPES_FR: Record<string, string> = {
  'flatbed': 'Plateau',
  'van': 'Fourgon',
  'reefer': 'Frigorifique',
  'tanker': 'Citerne',
  'container': 'Conteneur',
  'lowboy': 'Surbaisse',
  'step-deck': 'Plateau surbaisse',
  'benne': 'Benne',
  'porte-char': 'Porte-char',
  '53ft': '53 pieds',
};

export const TRUCK_STATUS_FR: Record<string, string> = {
  'available': 'Disponible',
  'booked': 'Reserve',
  'in-transit': 'En transit',
  'maintenance': 'Maintenance',
  'inactive': 'Inactif',
};

export const LOAD_STATUS_FR: Record<string, string> = {
  'available': 'Disponible',
  'booked': 'Reserve',
  'in-transit': 'En transit',
  'delivered': 'Livre',
  'cancelled': 'Annule',
  'pending': 'En attente',
};

export const CARGO_TYPES_FR: Record<string, string> = {
  'general': 'Marchandises générales',
  'fragile': 'Fragile',
  'hazardous': 'Matieres dangereuses',
  'perishable': 'Perissable',
  'livestock': 'Betail',
  'minerals': 'Minerais',
  'fuel': 'Carburant',
  'construction': 'Materiaux de construction',
  'agricultural': 'Produits agricoles',
  'equipment': 'Equipements',
  'minerai_cuivre': 'Minerai / Concentré de cuivre',
  'cobalt': 'Cobalt',
  'ciment': 'Ciment',
  'bois_grumes': 'Bois / Grumes',
  'machines': 'Machines / Équipements',
  'conteneurs': 'Conteneurs',
  'agricole': 'Produits agricoles',
  'carburant': 'Carburant / Hydrocarbures',
  'acier_metaux': 'Acier / Métaux',
  'autre': 'Autre',
};

export function truckTypeFr(type: string): string {
  if (!type) return 'N/A';
  return TRUCK_TYPES_FR[type.toLowerCase()] || type;
}

export function truckStatusFr(status: string): string {
  if (!status) return 'N/A';
  return TRUCK_STATUS_FR[status.toLowerCase()] || status;
}

export function loadStatusFr(status: string): string {
  if (!status) return 'N/A';
  return LOAD_STATUS_FR[status.toLowerCase()] || status;
}

export function cargoTypeFr(type: string): string {
  if (!type) return 'N/A';
  return CARGO_TYPES_FR[type.toLowerCase()] || type;
}
