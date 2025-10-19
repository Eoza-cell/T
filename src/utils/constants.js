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

const DEVIL_FRUITS = {
  // PARAMECIA - Communs (1000-3000 Berrys)
  GOMU_GOMU: {
    name: 'Gomu Gomu no Mi',
    type: 'Paramecia',
    price: 2500,
    rarity: 'commun',
    bonus: { force: 15, endurance: 10 },
    description: 'Corps en caoutchouc, immunité électricité',
    user: 'Luffy'
  },
  BARA_BARA: {
    name: 'Bara Bara no Mi',
    type: 'Paramecia',
    price: 1500,
    rarity: 'commun',
    bonus: { reflexe: 10 },
    description: 'Séparer son corps en morceaux',
    user: 'Baggy'
  },
  SUBE_SUBE: {
    name: 'Sube Sube no Mi',
    type: 'Paramecia',
    price: 1000,
    rarity: 'commun',
    bonus: { vitesse: 5, reflexe: 5 },
    description: 'Peau ultra-lisse, esquive améliorée',
    user: 'Alvida'
  },
  BOMU_BOMU: {
    name: 'Bomu Bomu no Mi',
    type: 'Paramecia',
    price: 2000,
    rarity: 'commun',
    bonus: { force: 20 },
    description: 'Corps explosif',
    user: 'Mr. 5'
  },
  
  // PARAMECIA - Rares (3000-8000 Berrys)
  MERA_MERA: {
    name: 'Mera Mera no Mi',
    type: 'Logia',
    price: 8000,
    rarity: 'rare',
    bonus: { force: 30, intelligence: 10 },
    description: 'Contrôle du feu, intangibilité',
    user: 'Ace/Sabo'
  },
  HANA_HANA: {
    name: 'Hana Hana no Mi',
    type: 'Paramecia',
    price: 3500,
    rarity: 'rare',
    bonus: { intelligence: 15, precision: 10 },
    description: 'Faire pousser des membres partout',
    user: 'Nico Robin'
  },
  SUNA_SUNA: {
    name: 'Suna Suna no Mi',
    type: 'Logia',
    price: 7000,
    rarity: 'rare',
    bonus: { force: 20, endurance: 15 },
    description: 'Contrôle du sable, intangibilité',
    user: 'Crocodile'
  },
  BARI_BARI: {
    name: 'Bari Bari no Mi',
    type: 'Paramecia',
    price: 4000,
    rarity: 'rare',
    bonus: { endurance: 25 },
    description: 'Barrières indestructibles',
    user: 'Bartolomeo'
  },
  ITO_ITO: {
    name: 'Ito Ito no Mi',
    type: 'Paramecia',
    price: 5500,
    rarity: 'rare',
    bonus: { precision: 20, intelligence: 15 },
    description: 'Contrôle des fils',
    user: 'Doflamingo'
  },
  
  // ZOAN - Communs (2000-4000 Berrys)
  UMA_UMA: {
    name: 'Uma Uma no Mi',
    type: 'Zoan',
    price: 2000,
    rarity: 'commun',
    bonus: { vitesse: 15, endurance: 10 },
    description: 'Transformation en cheval',
    user: 'Pierre'
  },
  NEKO_NEKO_LEOPARD: {
    name: 'Neko Neko no Mi (Léopard)',
    type: 'Zoan',
    price: 3000,
    rarity: 'commun',
    bonus: { force: 15, vitesse: 15 },
    description: 'Transformation en léopard',
    user: 'Lucci'
  },
  INU_INU_LOUP: {
    name: 'Inu Inu no Mi (Loup)',
    type: 'Zoan',
    price: 2500,
    rarity: 'commun',
    bonus: { force: 10, vitesse: 10, reflexe: 10 },
    description: 'Transformation en loup',
    user: 'Jabra'
  },
  
  // ZOAN - Mythiques (15000-30000 Berrys)
  HITO_HITO_DAIBUTSU: {
    name: 'Hito Hito no Mi (Daibutsu)',
    type: 'Zoan Mythique',
    price: 20000,
    rarity: 'mythique',
    bonus: { force: 40, endurance: 30, intelligence: 20 },
    description: 'Transformation en Bouddha géant',
    user: 'Sengoku'
  },
  TORI_TORI_PHOENIX: {
    name: 'Tori Tori no Mi (Phoenix)',
    type: 'Zoan Mythique',
    price: 25000,
    rarity: 'mythique',
    bonus: { endurance: 50, vitesse: 20 },
    description: 'Transformation en Phoenix, régénération',
    user: 'Marco'
  },
  INU_INU_OKUCHI: {
    name: 'Inu Inu no Mi (Okuchi no Makami)',
    type: 'Zoan Mythique',
    price: 30000,
    rarity: 'mythique',
    bonus: { force: 50, vitesse: 30 },
    description: 'Transformation en loup divin',
    user: 'Yamato'
  },
  
  // LOGIA - Très rares (10000-50000 Berrys)
  MOKU_MOKU: {
    name: 'Moku Moku no Mi',
    type: 'Logia',
    price: 10000,
    rarity: 'tres_rare',
    bonus: { force: 20, reflexe: 20 },
    description: 'Contrôle de la fumée, intangibilité',
    user: 'Smoker'
  },
  GORO_GORO: {
    name: 'Goro Goro no Mi',
    type: 'Logia',
    price: 35000,
    rarity: 'legendaire',
    bonus: { force: 45, vitesse: 40, precision: 30 },
    description: 'Contrôle de la foudre, intangibilité',
    user: 'Enel'
  },
  HIE_HIE: {
    name: 'Hie Hie no Mi',
    type: 'Logia',
    price: 30000,
    rarity: 'legendaire',
    bonus: { force: 40, endurance: 25 },
    description: 'Contrôle de la glace, intangibilité',
    user: 'Kuzan (Aokiji)'
  },
  PIKA_PIKA: {
    name: 'Pika Pika no Mi',
    type: 'Logia',
    price: 40000,
    rarity: 'legendaire',
    bonus: { force: 40, vitesse: 50, precision: 35 },
    description: 'Contrôle de la lumière, vitesse lumière',
    user: 'Kizaru'
  },
  MAGU_MAGU: {
    name: 'Magu Magu no Mi',
    type: 'Logia',
    price: 45000,
    rarity: 'legendaire',
    bonus: { force: 55, endurance: 30 },
    description: 'Contrôle du magma, intangibilité',
    user: 'Akainu'
  },
  YAMI_YAMI: {
    name: 'Yami Yami no Mi',
    type: 'Logia',
    price: 50000,
    rarity: 'legendaire',
    bonus: { force: 50, intelligence: 40 },
    description: 'Contrôle des ténèbres, annule autres fruits',
    user: 'Barbe Noire'
  },
  
  // PARAMECIA - Légendaires (20000-60000 Berrys)
  GURA_GURA: {
    name: 'Gura Gura no Mi',
    type: 'Paramecia',
    price: 60000,
    rarity: 'legendaire',
    bonus: { force: 60, endurance: 40 },
    description: 'Fruit le plus puissant (Paramecia), séismes',
    user: 'Barbe Blanche/Barbe Noire'
  },
  OPE_OPE: {
    name: 'Ope Ope no Mi',
    type: 'Paramecia',
    price: 50000,
    rarity: 'legendaire',
    bonus: { intelligence: 50, precision: 40 },
    description: 'Manipulation spatiale, immortalité possible',
    user: 'Trafalgar Law'
  },
  NIKYU_NIKYU: {
    name: 'Nikyu Nikyu no Mi',
    type: 'Paramecia',
    price: 40000,
    rarity: 'legendaire',
    bonus: { force: 40, vitesse: 35 },
    description: 'Repousser n\'importe quoi avec coussinets',
    user: 'Kuma'
  },
  HOBI_HOBI: {
    name: 'Hobi Hobi no Mi',
    type: 'Paramecia',
    price: 35000,
    rarity: 'legendaire',
    bonus: { intelligence: 30 },
    description: 'Transformer en jouets, immortalité',
    user: 'Sugar'
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
  METIERS,
  DEVIL_FRUITS
};
