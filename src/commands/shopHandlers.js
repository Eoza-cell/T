const { getPlayer, updatePlayer } = require('../game/playerManager');
const { getWeaponsByPage, searchWeapons, getWeaponById } = require('../shop/weapons');
const { getShipsByPage, searchShips, getShipById } = require('../shop/ships');

async function handleWeaponShop(args, sender) {
  const player = await getPlayer(sender);
  if (!player) {
    return '⚠️ Tu n\'as pas encore de personnage !';
  }

  const page = parseInt(args[1]) || 1;
  const data = getWeaponsByPage(page, 10);

  let message = `
⚔️ *BOUTIQUE D'ARMES*

💰 Ton argent: ${player.berrys} Berrys

📦 *Armes disponibles (Page ${data.currentPage}/${data.totalPages}):*

`;

  data.weapons.forEach((weapon, index) => {
    const number = (data.currentPage - 1) * 10 + index + 1;
    message += `${number}. ${weapon.name}
   💰 ${weapon.price} Berrys | ⚔️ +${weapon.damage} dégâts
   📝 ${weapon.description}

`;
  });

  message += `
━━━━━━━━━━━━━━━━━━━━

📄 Total: ${data.totalWeapons} armes disponibles

*Pour acheter:* !achetararme [numéro]
*Page suivante:* !boutiquearmes ${page + 1}
`.trim();

  return message;
}

async function handleShipShop(args, sender) {
  const player = await getPlayer(sender);
  if (!player) {
    return '⚠️ Tu n\'as pas encore de personnage !';
  }

  const page = parseInt(args[1]) || 1;
  const data = getShipsByPage(page, 10);

  let message = `
⛵ *BOUTIQUE DE BATEAUX*

💰 Ton argent: ${player.berrys} Berrys

🚢 *Bateaux disponibles (Page ${data.currentPage}/${data.totalPages}):*

`;

  data.ships.forEach((ship, index) => {
    const number = (data.currentPage - 1) * 10 + index + 1;
    message += `${number}. ${ship.name}
   💰 ${ship.price} Berrys
   ⚡ Vitesse: ${ship.speed} | 💣 Canons: ${ship.cannons}
   👥 Capacité: ${ship.capacity} | 🛡️ Durabilité: ${ship.durability}

`;
  });

  message += `
━━━━━━━━━━━━━━━━━━━━

📄 Total: ${data.totalShips} bateaux disponibles

*Pour acheter:* !acheterb [numéro]
*Page suivante:* !boutiquebateaux ${page + 1}
`.trim();

  return message;
}

async function handleBuyWeapon(args, sender) {
  const player = await getPlayer(sender);
  if (!player) {
    return '⚠️ Tu n\'as pas encore de personnage !';
  }

  if (args.length < 2) {
    return '❌ Usage: !achetararme [numéro]\n\nUtilise !boutiquearmes pour voir les armes disponibles.';
  }

  const weaponNumber = parseInt(args[1]);
  if (isNaN(weaponNumber) || weaponNumber < 1) {
    return '❌ Numéro d\'arme invalide !';
  }

  const allWeapons = getWeaponsByPage(Math.ceil(weaponNumber / 10), 10);
  const weaponIndex = (weaponNumber - 1) % 10;
  const weapon = allWeapons.weapons[weaponIndex];

  if (!weapon) {
    return '❌ Arme introuvable ! Utilise !boutiquearmes pour voir les armes disponibles.';
  }

  if (player.berrys < weapon.price) {
    return `❌ Tu n'as pas assez d'argent !\n\n💰 Prix: ${weapon.price} Berrys\n💰 Ton argent: ${player.berrys} Berrys\n💰 Manque: ${weapon.price - player.berrys} Berrys`;
  }

  if (!player.weapons) player.weapons = [];
  player.weapons.push(weapon);
  player.berrys -= weapon.price;

  await updatePlayer(sender, player);

  return `
✅ *ARME ACHETÉE !*

${weapon.name}
⚔️ Dégâts: +${weapon.damage}
💰 Prix: ${weapon.price} Berrys

💰 Argent restant: ${player.berrys} Berrys

📦 Tu as maintenant ${player.weapons.length} arme(s)
Utilise !mesarmes pour voir ton arsenal
Utilise !equipearme [numéro] pour équiper une arme
`.trim();
}

async function handleBuyShip(args, sender) {
  const player = await getPlayer(sender);
  if (!player) {
    return '⚠️ Tu n\'as pas encore de personnage !';
  }

  if (args.length < 2) {
    return '❌ Usage: !acheterb [numéro]\n\nUtilise !boutiquebateaux pour voir les bateaux disponibles.';
  }

  const shipNumber = parseInt(args[1]);
  if (isNaN(shipNumber) || shipNumber < 1) {
    return '❌ Numéro de bateau invalide !';
  }

  const allShips = getShipsByPage(Math.ceil(shipNumber / 10), 10);
  const shipIndex = (shipNumber - 1) % 10;
  const ship = allShips.ships[shipIndex];

  if (!ship) {
    return '❌ Bateau introuvable ! Utilise !boutiquebateaux pour voir les bateaux disponibles.';
  }

  if (player.berrys < ship.price) {
    return `❌ Tu n'as pas assez d'argent !\n\n💰 Prix: ${ship.price} Berrys\n💰 Ton argent: ${player.berrys} Berrys\n💰 Manque: ${ship.price - player.berrys} Berrys`;
  }

  if (!player.ships) player.ships = [];
  player.ships.push(ship);
  player.berrys -= ship.price;

  await updatePlayer(sender, player);

  return `
✅ *BATEAU ACHETÉ !*

${ship.name}
⚡ Vitesse: ${ship.speed}
💣 Canons: ${ship.cannons}
👥 Capacité: ${ship.capacity}
🛡️ Durabilité: ${ship.durability}

💰 Prix: ${ship.price} Berrys
💰 Argent restant: ${player.berrys} Berrys

⛵ Tu as maintenant ${player.ships.length} bateau(x)
Utilise !mesbateaux pour voir ta flotte
Utilise !equipebateau [numéro] pour naviguer avec un bateau
`.trim();
}

async function handleMyWeapons(sender) {
  const player = await getPlayer(sender);
  if (!player) {
    return '⚠️ Tu n\'as pas encore de personnage !';
  }

  if (!player.weapons || player.weapons.length === 0) {
    return '❌ Tu n\'as aucune arme !\n\nUtilise !boutiquearmes pour acheter des armes.';
  }

  let message = `
⚔️ *TON ARSENAL*

`;

  player.weapons.forEach((weapon, index) => {
    const isEquipped = player.currentWeapon === index;
    message += `${index + 1}. ${weapon.name} ${isEquipped ? '✅ *ÉQUIPÉE*' : ''}
   ⚔️ +${weapon.damage} dégâts
   💎 Qualité: ${weapon.quality}

`;
  });

  message += `
━━━━━━━━━━━━━━━━━━━━

📦 Total: ${player.weapons.length} arme(s)

*Pour équiper:* !equipearme [numéro]
`.trim();

  return message;
}

async function handleMyShips(sender) {
  const player = await getPlayer(sender);
  if (!player) {
    return '⚠️ Tu n\'as pas encore de personnage !';
  }

  if (!player.ships || player.ships.length === 0) {
    return '❌ Tu n\'as aucun bateau !\n\nUtilise !boutiquebateaux pour acheter des bateaux.';
  }

  let message = `
⛵ *TA FLOTTE*

`;

  player.ships.forEach((ship, index) => {
    const isEquipped = player.currentShip === index;
    message += `${index + 1}. ${ship.name} ${isEquipped ? '✅ *ACTIF*' : ''}
   ⚡ Vitesse: ${ship.speed} | 💣 Canons: ${ship.cannons}
   👥 Capacité: ${ship.capacity} | 🛡️ ${ship.durability}/${ship.maxDurability}

`;
  });

  message += `
━━━━━━━━━━━━━━━━━━━━

⛵ Total: ${player.ships.length} bateau(x)

*Pour naviguer avec:* !equipebateau [numéro]
`.trim();

  return message;
}

async function handleEquipWeapon(args, sender) {
  const player = await getPlayer(sender);
  if (!player) {
    return '⚠️ Tu n\'as pas encore de personnage !';
  }

  if (args.length < 2) {
    return '❌ Usage: !equipearme [numéro]\n\nUtilise !mesarmes pour voir tes armes.';
  }

  const weaponIndex = parseInt(args[1]) - 1;
  if (isNaN(weaponIndex) || weaponIndex < 0 || !player.weapons || weaponIndex >= player.weapons.length) {
    return '❌ Arme invalide ! Utilise !mesarmes pour voir tes armes.';
  }

  player.currentWeapon = weaponIndex;
  await updatePlayer(sender, player);

  const weapon = player.weapons[weaponIndex];

  return `
✅ *ARME ÉQUIPÉE !*

${weapon.name}
⚔️ Dégâts: +${weapon.damage}

Cette arme est maintenant active en combat !
`.trim();
}

async function handleEquipShip(args, sender) {
  const player = await getPlayer(sender);
  if (!player) {
    return '⚠️ Tu n\'as pas encore de personnage !';
  }

  if (args.length < 2) {
    return '❌ Usage: !equipebateau [numéro]\n\nUtilise !mesbateaux pour voir tes bateaux.';
  }

  const shipIndex = parseInt(args[1]) - 1;
  if (isNaN(shipIndex) || shipIndex < 0 || !player.ships || shipIndex >= player.ships.length) {
    return '❌ Bateau invalide ! Utilise !mesbateaux pour voir ta flotte.';
  }

  player.currentShip = shipIndex;
  await updatePlayer(sender, player);

  const ship = player.ships[shipIndex];

  return `
✅ *BATEAU ÉQUIPÉ !*

${ship.name}
⚡ Vitesse: ${ship.speed}
💣 Canons: ${ship.cannons}
👥 Capacité: ${ship.capacity}

Tu navigues maintenant avec ce bateau !
`.trim();
}

module.exports = {
  handleWeaponShop,
  handleShipShop,
  handleBuyWeapon,
  handleBuyShip,
  handleMyWeapons,
  handleMyShips,
  handleEquipWeapon,
  handleEquipShip
};
