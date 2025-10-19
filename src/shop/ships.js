// Boutique de bateaux
const SHIP_TYPES = {
  SLOOP: {
    name: 'Sloop',
    basePrice: 50000,
    capacity: 10,
    speed: 8,
    cannons: 4,
    description: 'Petit navire rapide, idéal pour débuter'
  },
  BRIGANTINE: {
    name: 'Brigantine',
    basePrice: 150000,
    capacity: 30,
    speed: 7,
    cannons: 12,
    description: 'Navire équilibré entre vitesse et puissance'
  },
  GALLEON: {
    name: 'Galion',
    basePrice: 500000,
    capacity: 100,
    speed: 5,
    cannons: 32,
    description: 'Grand navire de guerre avec beaucoup de canons'
  },
  FRIGATE: {
    name: 'Frégate',
    basePrice: 300000,
    capacity: 50,
    speed: 6,
    cannons: 20,
    description: 'Navire de guerre rapide et maniable'
  },
  CARAVEL: {
    name: 'Caravelle',
    basePrice: 80000,
    capacity: 20,
    speed: 7,
    cannons: 8,
    description: 'Navire d\'exploration agile'
  }
};

const SHIP_QUALITIES = [
  { name: 'Vieux', multiplier: 0.7, emoji: '🟤', durability: 60 },
  { name: 'Standard', multiplier: 1, emoji: '⚪', durability: 100 },
  { name: 'Renforcé', multiplier: 1.5, emoji: '🟢', durability: 150 },
  { name: 'Légendaire', multiplier: 2.5, emoji: '🟣', durability: 200 },
  { name: 'Mythique', multiplier: 4, emoji: '🔴', durability: 300 }
];

const SHIP_UPGRADES = [
  { name: 'Voiles Renforcées', effect: 'speed', bonus: 2, price: 20000, emoji: '⛵' },
  { name: 'Coque Blindée', effect: 'durability', bonus: 50, price: 30000, emoji: '🛡️' },
  { name: 'Canons Supplémentaires', effect: 'cannons', bonus: 4, price: 25000, emoji: '💣' },
  { name: 'Stockage Étendu', effect: 'capacity', bonus: 20, price: 15000, emoji: '📦' },
  { name: 'Ram de Proue', effect: 'damage', bonus: 30, price: 35000, emoji: '🔱' },
  { name: 'Gouvernail Amélioré', effect: 'maneuverability', bonus: 3, price: 18000, emoji: '🎯' }
];

const SHIP_THEMES = [
  { name: 'Pirate', emoji: '🏴‍☠️', multiplier: 1.2 },
  { name: 'Marine', emoji: '⚓', multiplier: 1.3 },
  { name: 'Révolutionnaire', emoji: '🔥', multiplier: 1.25 },
  { name: 'Marchand', emoji: '💰', multiplier: 0.9 },
  { name: 'Chasseur', emoji: '🎯', multiplier: 1.15 }
];

function generateShip(typeKey, qualityIndex, themeIndex) {
  const type = SHIP_TYPES[typeKey];
  const quality = SHIP_QUALITIES[qualityIndex];
  const theme = SHIP_THEMES[themeIndex];
  
  const shipId = `SHIP_${typeKey}_${quality.name}_${theme.name}`.replace(/\s+/g, '_').toUpperCase();
  
  const price = Math.floor(type.basePrice * quality.multiplier * theme.multiplier);
  const capacity = Math.floor(type.capacity * quality.multiplier);
  const speed = Math.floor(type.speed * quality.multiplier);
  const cannons = Math.floor(type.cannons * quality.multiplier);
  const durability = quality.durability;
  
  return {
    id: shipId,
    name: `${theme.emoji} ${quality.emoji} ${quality.name} ${type.name} ${theme.name}`,
    type: type.name,
    quality: quality.name,
    theme: theme.name,
    price,
    capacity,
    speed,
    cannons,
    durability,
    maxDurability: durability,
    upgrades: [],
    level: qualityIndex + 1,
    description: `${quality.name} ${type.name} de style ${theme.name}. ${type.description}`
  };
}

function getAllShips() {
  const ships = [];
  
  Object.keys(SHIP_TYPES).forEach(typeKey => {
    SHIP_QUALITIES.forEach((quality, qualityIndex) => {
      SHIP_THEMES.forEach((theme, themeIndex) => {
        ships.push(generateShip(typeKey, qualityIndex, themeIndex));
      });
    });
  });
  
  return ships;
}

function getShipsByPage(page = 1, perPage = 10) {
  const allShips = getAllShips();
  const start = (page - 1) * perPage;
  const end = start + perPage;
  
  return {
    ships: allShips.slice(start, end),
    totalShips: allShips.length,
    totalPages: Math.ceil(allShips.length / perPage),
    currentPage: page
  };
}

function searchShips(query) {
  const allShips = getAllShips();
  const lowerQuery = query.toLowerCase();
  
  return allShips.filter(ship => 
    ship.name.toLowerCase().includes(lowerQuery) ||
    ship.type.toLowerCase().includes(lowerQuery) ||
    ship.theme.toLowerCase().includes(lowerQuery)
  );
}

function getShipById(shipId) {
  const allShips = getAllShips();
  return allShips.find(s => s.id === shipId);
}

module.exports = {
  getAllShips,
  getShipsByPage,
  searchShips,
  getShipById,
  SHIP_TYPES,
  SHIP_QUALITIES,
  SHIP_UPGRADES,
  SHIP_THEMES
};
