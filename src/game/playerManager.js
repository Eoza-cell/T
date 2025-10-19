const fs = require('fs-extra');
const path = require('path');
const { RACES, ALIGNMENTS } = require('../utils/constants');
const { getMaxEnergyFromEndurance, getLevelFromXP } = require('../utils/helpers');

const PLAYERS_FILE = path.join(__dirname, '../data/players.json');

async function loadPlayers() {
  try {
    await fs.ensureFile(PLAYERS_FILE);
    const data = await fs.readFile(PLAYERS_FILE, 'utf8');
    return data ? JSON.parse(data) : {};
  } catch (error) {
    return {};
  }
}

async function savePlayers(players) {
  await fs.writeJson(PLAYERS_FILE, players, { spaces: 2 });
}

async function getPlayer(phoneNumber) {
  const players = await loadPlayers();
  return players[phoneNumber] || null;
}

async function playerExists(phoneNumber) {
  const player = await getPlayer(phoneNumber);
  return player !== null;
}

async function createPlayer(phoneNumber, name, race, alignment, bonusAttribute = null) {
  const players = await loadPlayers();
  
  if (players[phoneNumber]) {
    return { success: false, message: 'Vous avez déjà un personnage !' };
  }

  const raceData = RACES[race];
  if (!raceData) {
    return { success: false, message: 'Race invalide !' };
  }

  const alignmentData = ALIGNMENTS[alignment];
  if (!alignmentData) {
    return { success: false, message: 'Alignement invalide !' };
  }

  const baseAttributes = {
    force: 5,
    vitesse: 5,
    endurance: 5,
    reflexe: 5,
    intelligence: 5,
    precision: 5
  };

  if (raceData.bonus) {
    Object.keys(raceData.bonus).forEach(attr => {
      if (attr === 'choice' && bonusAttribute) {
        baseAttributes[bonusAttribute] += raceData.bonus[attr];
      } else if (attr !== 'choice') {
        baseAttributes[attr] = (baseAttributes[attr] || 0) + raceData.bonus[attr];
      }
    });
  }

  const maxEnergy = getMaxEnergyFromEndurance(baseAttributes.endurance);

  const player = {
    phoneNumber,
    name,
    race: raceData.name,
    alignment: alignmentData.name,
    level: 1,
    xp: 0,
    attributes: baseAttributes,
    attributePoints: 30,
    energy: maxEnergy,
    maxEnergy: maxEnergy,
    berrys: 1000,
    style: null,
    job: null,
    inventory: [],
    weapons: [],
    ships: [],
    currentWeapon: null,
    currentShip: null,
    techniques: [],
    haki: {
      observation: false,
      armement: false,
      royal: false
    },
    fruit: null,
    reputation: 0,
    bounty: 0,
    combatStats: {
      wins: 0,
      losses: 0,
      kills: 0
    },
    currentZone: 'EAST_BLUE',
    lastTraining: 0,
    createdAt: new Date().toISOString()
  };

  players[phoneNumber] = player;
  await savePlayers(players);

  return { success: true, player, message: '✅ Personnage créé avec succès !' };
}

async function updatePlayer(phoneNumber, updates) {
  const players = await loadPlayers();
  if (!players[phoneNumber]) {
    return { success: false, message: 'Joueur introuvable !' };
  }

  players[phoneNumber] = { ...players[phoneNumber], ...updates };
  await savePlayers(players);
  return { success: true, player: players[phoneNumber] };
}

async function addXP(phoneNumber, amount) {
  const player = await getPlayer(phoneNumber);
  if (!player) return { success: false };

  const oldLevel = player.level;
  player.xp += amount;
  const newLevel = getLevelFromXP(player.xp);

  const leveledUp = newLevel > oldLevel;
  
  if (leveledUp) {
    const { XP_LEVELS } = require('../utils/constants');
    const levelData = XP_LEVELS.find(l => l.level === newLevel);
    if (levelData) {
      player.attributePoints += levelData.points;
    }
    player.level = newLevel;
  }

  await updatePlayer(phoneNumber, player);

  return {
    success: true,
    player,
    leveledUp,
    oldLevel,
    newLevel,
    xpGained: amount
  };
}

async function spendAttributePoints(phoneNumber, attribute, points) {
  const player = await getPlayer(phoneNumber);
  if (!player) return { success: false, message: 'Joueur introuvable !' };

  if (player.attributePoints < points) {
    return { success: false, message: 'Points d\'attributs insuffisants !' };
  }

  if (!['force', 'vitesse', 'endurance', 'reflexe', 'intelligence', 'precision'].includes(attribute)) {
    return { success: false, message: 'Attribut invalide !' };
  }

  player.attributes[attribute] += points;
  player.attributePoints -= points;

  if (attribute === 'endurance') {
    const newMaxEnergy = getMaxEnergyFromEndurance(player.attributes.endurance);
    const energyDiff = newMaxEnergy - player.maxEnergy;
    player.maxEnergy = newMaxEnergy;
    player.energy += energyDiff;
  }

  await updatePlayer(phoneNumber, player);
  return { success: true, player, message: `✅ ${points} points ajoutés à ${attribute} !` };
}

async function consumeEnergy(phoneNumber, amount) {
  const player = await getPlayer(phoneNumber);
  if (!player) return { success: false };

  if (player.energy < amount) {
    return { success: false, message: 'Énergie insuffisante !' };
  }

  player.energy -= amount;
  await updatePlayer(phoneNumber, player);
  return { success: true, player };
}

async function restoreEnergy(phoneNumber, amount) {
  const player = await getPlayer(phoneNumber);
  if (!player) return { success: false };

  player.energy = Math.min(player.maxEnergy, player.energy + amount);
  await updatePlayer(phoneNumber, player);
  return { success: true, player };
}

async function getAllPlayers() {
  return await loadPlayers();
}

module.exports = {
  getPlayer,
  playerExists,
  createPlayer,
  updatePlayer,
  addXP,
  spendAttributePoints,
  consumeEnergy,
  restoreEnergy,
  getAllPlayers
};
