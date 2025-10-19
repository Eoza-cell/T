const Groq = require('groq-sdk');
const { getPlayer, updatePlayer, addXP } = require('../game/playerManager');

// Configuration Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const activeAdventures = new Map();

class MultiplayerAdventure {
  constructor(groupId, masterId) {
    this.id = `adventure_${groupId}_${Date.now()}`;
    this.groupId = groupId;
    this.masterId = masterId;
    this.players = new Map();
    this.playerOrder = [];
    this.currentTurnIndex = 0;
    this.round = 1;
    this.actions = [];
    this.context = '';
    this.active = true;
    this.createdAt = Date.now();
  }

  addPlayer(phoneNumber, playerData) {
    if (!this.players.has(phoneNumber)) {
      this.players.set(phoneNumber, {
        phoneNumber,
        name: playerData.name,
        level: playerData.level,
        actionsCount: 0,
        lastAction: null,
        coolness: 0
      });
      this.playerOrder.push(phoneNumber);
    }
  }

  removePlayer(phoneNumber) {
    this.players.delete(phoneNumber);
    this.playerOrder = this.playerOrder.filter(p => p !== phoneNumber);
  }

  getCurrentPlayer() {
    if (this.playerOrder.length === 0) return null;
    return this.playerOrder[this.currentTurnIndex];
  }

  nextTurn() {
    this.currentTurnIndex = (this.currentTurnIndex + 1) % this.playerOrder.length;
    if (this.currentTurnIndex === 0) {
      this.round++;
    }
  }

  recordAction(phoneNumber, action, coolnessScore) {
    this.actions.push({
      phoneNumber,
      action,
      coolnessScore,
      round: this.round,
      timestamp: Date.now()
    });

    const player = this.players.get(phoneNumber);
    if (player) {
      player.actionsCount++;
      player.lastAction = action;
      player.coolness += coolnessScore;
    }
  }

  getTurnOrder() {
    return this.playerOrder.map((phone, index) => {
      const player = this.players.get(phone);
      const isCurrent = index === this.currentTurnIndex;
      return {
        phoneNumber: phone,
        name: player.name,
        position: index + 1,
        isCurrent,
        emoji: isCurrent ? '👉' : '⏳'
      };
    });
  }

  getTopPlayers() {
    const sorted = Array.from(this.players.values())
      .sort((a, b) => b.coolness - a.coolness);
    
    return sorted.slice(0, 3);
  }
}

async function startAdventure(groupId, masterId, initialPlayers = []) {
  const adventure = new MultiplayerAdventure(groupId, masterId);
  
  for (const phoneNumber of initialPlayers) {
    const player = await getPlayer(phoneNumber);
    if (player) {
      adventure.addPlayer(phoneNumber, player);
    }
  }

  activeAdventures.set(groupId, adventure);
  
  return {
    success: true,
    adventure,
    message: 'Aventure démarrée avec succès !'
  };
}

function getAdventure(groupId) {
  return activeAdventures.get(groupId);
}

async function joinAdventure(groupId, phoneNumber) {
  const adventure = activeAdventures.get(groupId);
  if (!adventure) {
    return { success: false, message: 'Aucune aventure active dans ce groupe !' };
  }

  if (!adventure.active) {
    return { success: false, message: 'Cette aventure est terminée !' };
  }

  const player = await getPlayer(phoneNumber);
  if (!player) {
    return { success: false, message: 'Tu dois créer un personnage d\'abord !' };
  }

  adventure.addPlayer(phoneNumber, player);
  
  return {
    success: true,
    message: `${player.name} a rejoint l'aventure !`,
    playerCount: adventure.players.size
  };
}

async function generateNarration(adventure, playerAction, playerName) {
  const context = adventure.context || 'Début de l\'aventure dans le monde de One Piece';
  const recentActions = adventure.actions.slice(-5).map(a => {
    const p = adventure.players.get(a.phoneNumber);
    return `${p.name}: ${a.action}`;
  }).join('\n');

  const prompt = `Tu es le narrateur d'une aventure One Piece en groupe. Sois créatif, dramatique et parfois humoristique.

Contexte de l'aventure: ${context}

Actions récentes:
${recentActions}

Action actuelle de ${playerName}: ${playerAction}

Raconte ce qui se passe en 2-3 phrases maximum. Sois dynamique, ajoute des détails visuels et émotionnels. Parfois ajoute une touche d'humour. Ne pose pas de questions, raconte juste ce qui arrive.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Tu es un narrateur expert en One Piece. Tes descriptions sont vivantes, dramatiques et parfois drôles. Tu racontes en 2-3 phrases max.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.1-70b-versatile',
      temperature: 0.8,
      max_tokens: 200
    });

    const narration = completion.choices[0]?.message?.content || 'L\'aventure continue...';
    adventure.context = `${context}\n${playerName}: ${playerAction}\nRésultat: ${narration}`;
    
    return narration;
  } catch (error) {
    console.error('Erreur Groq:', error);
    return `${playerName} ${playerAction}. L'aventure continue avec intensité !`;
  }
}

async function evaluateActionCoolness(action, playerName) {
  const prompt = `Évalue le niveau de "coolness" de cette action dans une aventure One Piece sur une échelle de 1 à 10.

Action de ${playerName}: ${action}

Critères:
- Créativité et originalité
- Épique et spectaculaire
- Cohérence avec One Piece
- Risque et audace
- Impact émotionnel

Réponds UNIQUEMENT avec un nombre de 1 à 10.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Tu évalues la coolness des actions. Réponds uniquement avec un nombre de 1 à 10.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.5,
      max_tokens: 10
    });

    const response = completion.choices[0]?.message?.content || '5';
    const score = parseInt(response.match(/\d+/)?.[0] || '5');
    return Math.max(1, Math.min(10, score));
  } catch (error) {
    console.error('Erreur évaluation:', error);
    return 5;
  }
}

async function processPlayerAction(groupId, phoneNumber, action, sock) {
  const adventure = activeAdventures.get(groupId);
  
  if (!adventure) {
    return { success: false, message: 'Aucune aventure active !' };
  }

  if (!adventure.active) {
    return { success: false, message: 'Cette aventure est terminée !' };
  }

  const currentPlayer = adventure.getCurrentPlayer();
  if (currentPlayer !== phoneNumber) {
    return { 
      success: false, 
      message: 'Ce n\'est pas ton tour ! Attends que le narrateur t\'appelle.' 
    };
  }

  const player = adventure.players.get(phoneNumber);
  if (!player) {
    return { success: false, message: 'Tu n\'es pas dans cette aventure !' };
  }

  const coolnessScore = await evaluateActionCoolness(action, player.name);
  const narration = await generateNarration(adventure, action, player.name);
  
  adventure.recordAction(phoneNumber, action, coolnessScore);
  adventure.nextTurn();

  const nextPlayer = adventure.getCurrentPlayer();
  const nextPlayerData = adventure.players.get(nextPlayer);

  const response = `
📖 *NARRATION*

${narration}

⭐ *Coolness:* ${coolnessScore}/10

━━━━━━━━━━━━━━━━━━━━

🎯 *Tour suivant:* @${nextPlayer.replace('@s.whatsapp.net', '')}
👤 ${nextPlayerData.name}

🔄 Round ${adventure.round} | 👥 ${adventure.players.size} joueurs
`.trim();

  if (sock) {
    await sock.sendMessage(adventure.groupId, { 
      text: response,
      mentions: [nextPlayer]
    });
  }

  return {
    success: true,
    narration,
    coolnessScore,
    nextPlayer: nextPlayerData,
    round: adventure.round
  };
}

async function endAdventure(groupId, sock) {
  const adventure = activeAdventures.get(groupId);
  
  if (!adventure) {
    return { success: false, message: 'Aucune aventure active !' };
  }

  adventure.active = false;
  const topPlayers = adventure.getTopPlayers();

  const xpRewards = [
    { place: 1, xp: 500, emoji: '🥇' },
    { place: 2, xp: 300, emoji: '🥈' },
    { place: 3, xp: 150, emoji: '🥉' }
  ];

  let finalReport = `
🏆 *FIN DE L'AVENTURE !*

📊 *Durée:* ${adventure.round} rounds
🎬 *Actions totales:* ${adventure.actions.length}

━━━━━━━━━━━━━━━━━━━━

🌟 *PODIUM DES MEILLEURS JOUEURS:*

`;

  for (let i = 0; i < Math.min(3, topPlayers.length); i++) {
    const player = topPlayers[i];
    const reward = xpRewards[i];
    
    await addXP(player.phoneNumber, reward.xp);
    
    finalReport += `
${reward.emoji} *${player.name}*
   💫 Coolness: ${player.coolness}
   🎭 Actions: ${player.actionsCount}
   ✨ Récompense: +${reward.xp} XP

`;
  }

  finalReport += `
━━━━━━━━━━━━━━━━━━━━

Merci à tous les participants ! 🎉
Utilisez !startma pour une nouvelle aventure !
`.trim();

  activeAdventures.delete(groupId);

  if (sock) {
    await sock.sendMessage(groupId, { text: finalReport });
  }

  return {
    success: true,
    finalReport,
    topPlayers,
    totalActions: adventure.actions.length
  };
}

function formatTurnOrder(adventure) {
  const order = adventure.getTurnOrder();
  
  let message = `
🎯 *ORDRE DES TOURS*

Round ${adventure.round}

`;

  order.forEach(turn => {
    message += `${turn.emoji} ${turn.position}. ${turn.name}${turn.isCurrent ? ' *← C\'EST TON TOUR !*' : ''}\n`;
  });

  message += `\n━━━━━━━━━━━━━━━━━━━━\n\n📝 Décris ton action quand c'est ton tour !`;

  return message.trim();
}

module.exports = {
  startAdventure,
  getAdventure,
  joinAdventure,
  processPlayerAction,
  endAdventure,
  formatTurnOrder,
  activeAdventures
};
