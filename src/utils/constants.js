const RACES = {
  HUMAIN: {
    name: 'Humain',
    bonus: { choice: 5 },
    description: 'Race équilibrée avec +5 à un attribut au choix'
  },
  HOMME_POISSON: {
    name: 'Homme-poisson',
    bonus: { force: 10 },
    special: 'respiration_aquatique',
    description: 'Maîtres des mers, +10 Force'
  },
  GEANT: {
    name: 'Géant',
    bonus: { force: 20, vitesse: -10 },
    description: 'Titan naturel, +20 Force, -10 Vitesse'
  },
  MINK: {
    name: 'Mink',
    bonus: { vitesse: 10 },
    special: 'electro',
    description: 'Sens animaux, +10 Vitesse, capacité Electro'
  },
  SKYPEIEN: {
    name: 'Skypéien',
    bonus: { reflexe: 10 },
    special: 'vol_dial',
    description: 'Vivant des îles célestes, +10 Réflexe, peut voler avec Dial'
  },
  CYBORG: {
    name: 'Cyborg',
    bonus: { endurance: 10 },
    special: 'pieces_mecaniques',
    description: 'Mi-homme, mi-machine, +10 Endurance'
  }
};

const ALIGNMENTS = {
  PIRATE: {
    name: 'Pirate',
    description: 'Prime élevée, liberté totale',
    effects: { reputation: 'negative', freedom: 'high' }
  },
  MARINE: {
    name: 'Marine',
    description: 'Salaire régulier, soutien du Gouvernement',
    effects: { salary: 200, support: 'government' }
  },
  REVOLUTIONNAIRE: {
    name: 'Révolutionnaire',
    description: 'Soutien populaire, mais traqué',
    effects: { popularity: 'high', hunted: true }
  },
  CIVIL: {
    name: 'Civil',
    description: 'Neutre, peut commercer partout',
    effects: { trade: 'free', neutral: true }
  }
};

const STYLES = {
  EPEISTE: {
    name: 'Épéiste',
    unlockLevel: 5,
    bonus: { precision: 15, reflexe: 10 },
    description: 'Maîtrise des sabres, précision et vitesse'
  },
  COMBATTANT: {
    name: 'Combattant',
    unlockLevel: 5,
    bonus: { force: 20, endurance: 10 },
    description: 'Corps à corps brut et arts martiaux'
  },
  TIREUR: {
    name: 'Tireur',
    unlockLevel: 5,
    bonus: { precision: 20, intelligence: 5 },
    description: 'Combat à distance avec pistolets ou arcs'
  },
  ARTISTE_MARTIAL: {
    name: 'Artiste Martial',
    unlockLevel: 5,
    bonus: { vitesse: 10, reflexe: 10 },
    description: 'Maîtrise technique et équilibre'
  },
  STRATEGE: {
    name: 'Stratège',
    unlockLevel: 5,
    bonus: { intelligence: 15, endurance: 5 },
    description: 'Combat cérébral, pièges, plans'
  },
  FRUIT_USER: {
    name: 'Fruit User',
    unlockLevel: 5,
    bonus: { endurance: -10 },
    special: 'fruit_power',
    description: 'Maîtrise d\'un pouvoir unique mais -10% Endurance'
  }
};

const XP_LEVELS = [
  { level: 1, xpRequired: 0, points: 30, unlock: 'Création du personnage' },
  { level: 2, xpRequired: 100, points: 10, unlock: '+10 points d\'attributs' },
  { level: 3, xpRequired: 250, points: 10, unlock: '+10 points d\'attributs' },
  { level: 4, xpRequired: 450, points: 10, unlock: '+10 points d\'attributs' },
  { level: 5, xpRequired: 700, points: 10, unlock: 'Débloque les styles de combat' },
  { level: 6, xpRequired: 1000, points: 10, unlock: '+10 points d\'attributs' },
  { level: 7, xpRequired: 1350, points: 10, unlock: '+10 points d\'attributs' },
  { level: 8, xpRequired: 1750, points: 10, unlock: '+10 points d\'attributs' },
  { level: 9, xpRequired: 2200, points: 10, unlock: '+10 points d\'attributs' },
  { level: 10, xpRequired: 2700, points: 15, unlock: 'Accès à la Grand Line + Haki Observation' },
  { level: 15, xpRequired: 5700, points: 15, unlock: 'Accès au Haki de l\'Armement' },
  { level: 20, xpRequired: 10200, points: 20, unlock: 'Fruits rares, Haki Royal' },
  { level: 25, xpRequired: 16200, points: 20, unlock: 'Accès au Nouveau Monde' },
  { level: 30, xpRequired: 24200, points: 25, unlock: 'Niveau élite / supernova' }
];

const XP_GAINS = {
  combat_win: 100,
  combat_loss: 30,
  training: { min: 50, max: 150 },
  side_quest: { min: 100, max: 300 },
  main_mission: 500,
  discovery: 200,
  boss_event: { min: 1000, max: 3000 }
};

const ENERGY_COSTS = {
  basic_attack: 2,
  quick_dodge: 4,
  special_technique: 10,
  ultimate_move: 20,
  prolonged_defense: 5
};

const ZONES = {
  EAST_BLUE: {
    name: 'East Blue',
    minLevel: 1,
    maxLevel: 10,
    description: 'Zone d\'apprentissage',
    dangerLevel: 'low'
  },
  GRAND_LINE: {
    name: 'Grand Line',
    minLevel: 10,
    maxLevel: 25,
    description: 'Dangers climatiques, haki',
    dangerLevel: 'medium'
  },
  NOUVEAU_MONDE: {
    name: 'Nouveau Monde',
    minLevel: 25,
    maxLevel: 50,
    description: 'Pirates puissants, fruits rares',
    dangerLevel: 'high'
  },
  EAUX_INTERDITES: {
    name: 'Eaux Interdites',
    minLevel: 50,
    maxLevel: 100,
    description: 'Ennemis mythiques, dieux des mers',
    dangerLevel: 'extreme'
  }
};

const METIERS = {
  FORGERON: {
    name: 'Forgeron',
    salary: 200,
    bonus: { weapon_damage: 10 },
    description: 'Crée des armes'
  },
  MEDECIN: {
    name: 'Médecin',
    salary: 180,
    bonus: { regen: 15 },
    description: 'Soigne les alliés'
  },
  CUISINIER: {
    name: 'Cuisinier',
    salary: 150,
    bonus: { max_energy: 10 },
    description: 'Buff via repas'
  },
  NAVIGATEUR: {
    name: 'Navigateur',
    salary: 170,
    bonus: { maritime_speed: 10 },
    description: 'Dirige les voyages'
  },
  CHASSEUR: {
    name: 'Chasseur de primes',
    salary: 0,
    bonus: { xp: 15, berry: 20 },
    description: 'Capture pirates, gains variables'
  }
};

module.exports = {
  RACES,
  ALIGNMENTS,
  STYLES,
  XP_LEVELS,
  XP_GAINS,
  ENERGY_COSTS,
  ZONES,
  METIERS
};
