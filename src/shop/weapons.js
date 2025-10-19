// Générateur d'armes pour la boutique
const WEAPON_TYPES = {
  SWORD: {
    name: 'Épée',
    basePrice: 1000,
    baseDamage: 20,
    variants: ['Courte', 'Longue', 'Bâtarde', 'Légendaire', 'Maudite', 'Sacrée']
  },
  KATANA: {
    name: 'Katana',
    basePrice: 2500,
    baseDamage: 25,
    variants: ['Standard', 'Tranchant', 'Démoniaque', 'Céleste', 'Ancestral']
  },
  PISTOL: {
    name: 'Pistolet',
    basePrice: 1500,
    baseDamage: 18,
    variants: ['Simple', 'Double', 'Révolver', 'Automatique', 'Marine']
  },
  RIFLE: {
    name: 'Fusil',
    basePrice: 3000,
    baseDamage: 30,
    variants: ['Sniper', 'Assault', 'Pompe', 'Marine', 'Pirate']
  },
  CANNON: {
    name: 'Canon',
    basePrice: 5000,
    baseDamage: 50,
    variants: ['Léger', 'Lourd', 'Marine', 'Pirate', 'Explosif']
  },
  AXE: {
    name: 'Hache',
    basePrice: 800,
    baseDamage: 22,
    variants: ['Simple', 'Double', 'de Guerre', 'de Géant', 'Enflammée']
  },
  SPEAR: {
    name: 'Lance',
    basePrice: 700,
    baseDamage: 19,
    variants: ['Simple', 'Trident', 'Hast', 'Naginata', 'Divine']
  },
  BOW: {
    name: 'Arc',
    basePrice: 1200,
    baseDamage: 17,
    variants: ['Court', 'Long', 'Composite', 'Chasseur', 'Elfique']
  },
  HAMMER: {
    name: 'Marteau',
    basePrice: 900,
    baseDamage: 24,
    variants: ['de Forgeron', 'de Guerre', 'Massif', 'Écrasant', 'Tonnerre']
  },
  DAGGER: {
    name: 'Dague',
    basePrice: 500,
    baseDamage: 15,
    variants: ['Simple', 'Empoisonnée', 'Assassin', 'Voleur', 'Sournoise']
  }
};

const QUALITIES = [
  { name: 'Ordinaire', multiplier: 1, emoji: '⚪' },
  { name: 'Bon', multiplier: 1.5, emoji: '🟢' },
  { name: 'Rare', multiplier: 2, emoji: '🔵' },
  { name: 'Épique', multiplier: 3, emoji: '🟣' },
  { name: 'Légendaire', multiplier: 5, emoji: '🟠' },
  { name: 'Mythique', multiplier: 8, emoji: '🔴' }
];

const SPECIAL_EFFECTS = [
  'Feu', 'Glace', 'Foudre', 'Poison', 'Vampirique',
  'Critique+', 'Vitesse+', 'Force+', 'Haki', 'Maudit',
  'Béni', 'Élémentaire', 'Draconique', 'Marin', 'Pirate'
];

function generateWeaponId(type, variant, quality, effect) {
  return `${type}_${variant}_${quality}_${effect}`.replace(/\s+/g, '_').toUpperCase();
}

function generateWeapon(typeKey, variantIndex, qualityIndex, effectIndex) {
  const type = WEAPON_TYPES[typeKey];
  const variant = type.variants[variantIndex];
  const quality = QUALITIES[qualityIndex];
  const effect = effectIndex !== null ? SPECIAL_EFFECTS[effectIndex] : null;
  
  const weaponId = generateWeaponId(typeKey, variant, quality.name, effect || 'NONE');
  
  let price = Math.floor(type.basePrice * quality.multiplier);
  let damage = Math.floor(type.baseDamage * quality.multiplier);
  
  if (effect) {
    price = Math.floor(price * 1.5);
    damage = Math.floor(damage * 1.2);
  }
  
  const name = `${quality.emoji} ${variant} ${type.name}${effect ? ` (${effect})` : ''}`;
  
  return {
    id: weaponId,
    name,
    type: type.name,
    variant,
    quality: quality.name,
    effect,
    price,
    damage,
    level: qualityIndex + 1,
    description: `${quality.name} ${variant} ${type.name}${effect ? ` avec effet ${effect}` : ''}`
  };
}

function getAllWeapons() {
  const weapons = [];
  
  Object.keys(WEAPON_TYPES).forEach(typeKey => {
    const type = WEAPON_TYPES[typeKey];
    
    type.variants.forEach((variant, variantIndex) => {
      QUALITIES.forEach((quality, qualityIndex) => {
        // Arme sans effet spécial
        weapons.push(generateWeapon(typeKey, variantIndex, qualityIndex, null));
        
        // Armes avec effets spéciaux (seulement pour qualités Rare+)
        if (qualityIndex >= 2) {
          SPECIAL_EFFECTS.forEach((effect, effectIndex) => {
            weapons.push(generateWeapon(typeKey, variantIndex, qualityIndex, effectIndex));
          });
        }
      });
    });
  });
  
  return weapons;
}

function getWeaponsByPage(page = 1, perPage = 10) {
  const allWeapons = getAllWeapons();
  const start = (page - 1) * perPage;
  const end = start + perPage;
  
  return {
    weapons: allWeapons.slice(start, end),
    totalWeapons: allWeapons.length,
    totalPages: Math.ceil(allWeapons.length / perPage),
    currentPage: page
  };
}

function searchWeapons(query) {
  const allWeapons = getAllWeapons();
  const lowerQuery = query.toLowerCase();
  
  return allWeapons.filter(weapon => 
    weapon.name.toLowerCase().includes(lowerQuery) ||
    weapon.type.toLowerCase().includes(lowerQuery) ||
    weapon.variant.toLowerCase().includes(lowerQuery)
  );
}

function getWeaponById(weaponId) {
  const allWeapons = getAllWeapons();
  return allWeapons.find(w => w.id === weaponId);
}

module.exports = {
  getAllWeapons,
  getWeaponsByPage,
  searchWeapons,
  getWeaponById,
  WEAPON_TYPES,
  QUALITIES
};
