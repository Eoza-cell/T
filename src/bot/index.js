const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const pino = require('pino');
const fs = require('fs-extra');
const path = require('path');
const { handleIncomingMessage } = require('./messageHandler');
const { startEnergyRegeneration } = require('../game/energySystem');

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['Ubuntu', 'Chrome', '128.0.6613.86'],
    version: [2, 3000, 1025190524], 
    getMessage: async key => {
        console.log('⚠️ Message non déchiffré, retry demandé:', key);
        return { conversation: '🔄 Réessaye d\'envoyer ton message' };
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n╔════════════════════════════════════════╗');
      console.log('║   🔐 QR CODE WHATSAPP DISPONIBLE     ║');
      console.log('╚════════════════════════════════════════╝\n');
      
      try {
        // Affichage dans le terminal
        qrcodeTerminal.generate(qr, { small: true }, (qrcode) => {
          console.log(qrcode);
        });
        
        // Sauvegarde en fichier PNG (TOUJOURS mis à jour)
        const qrPath = path.join(__dirname, '../../qr-code.png');
        
        // Supprimer l'ancien QR code s'il existe
        if (await fs.pathExists(qrPath)) {
          await fs.remove(qrPath);
        }
        
        // Créer le nouveau QR code
        await QRCode.toFile(qrPath, qr, {
          errorCorrectionLevel: 'H',
          type: 'png',
          quality: 0.95,
          margin: 1,
          width: 512
        });
        
        const timestamp = new Date().toLocaleTimeString('fr-FR');
        console.log(`\n📱 QR Code mis à jour: ${timestamp}`);
        console.log('💡 Le fichier qr-code.png a été actualisé');
        console.log('🌐 Rafraîchis la page web pour voir le nouveau QR\n');
      } catch (err) {
        console.error('❌ Erreur lors de la création du QR code:', err);
      }
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      
      console.log('\n❌ Connexion fermée');
      console.log('📊 Code:', statusCode);
      console.log('📝 Raison:', lastDisconnect?.error?.message);
      
      // Erreur 405 = WhatsApp bloque les connexions cloud
      if (statusCode === 405) {
        console.log('\n╔════════════════════════════════════════════════════╗');
        console.log('║  ⚠️  ERREUR 405: WhatsApp bloque Replit           ║');
        console.log('╠════════════════════════════════════════════════════╣');
        console.log('║  WhatsApp refuse les connexions depuis les        ║');
        console.log('║  serveurs cloud comme Replit.                      ║');
        console.log('║                                                    ║');
        console.log('║  💡 SOLUTIONS:                                     ║');
        console.log('║  1. Télécharge le code et exécute-le localement   ║');
        console.log('║  2. Déploie sur un VPS personnel                  ║');
        console.log('║  3. Utilise l\'option SSH de Replit (voir docs)    ║');
        console.log('╚════════════════════════════════════════════════════╝\n');
      }
      
      if (shouldReconnect && statusCode !== 405) {
        console.log('🔄 Reconnexion dans 5 secondes...');
        setTimeout(() => startBot(), 5000);
      } else if (statusCode === 405) {
        console.log('🛑 Arrêt des tentatives de reconnexion (erreur 405)');
      } else {
        console.log('🚪 Déconnecté. Relance le bot pour te reconnecter.');
      }
    } else if (connection === 'open') {
      console.log('✅ Bot connecté à WhatsApp !');
      console.log('🏴‍☠️ Bot One Piece RPG opérationnel !');
      console.log('\n📱 Envoie "!aide" sur WhatsApp pour commencer\n');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const message of messages) {
      if (!message.message) continue;
      if (message.key.fromMe) continue;

      await handleIncomingMessage(sock, message);
    }
  });

  startEnergyRegeneration();

  console.log('⚡ Système d\'énergie activé');
}

module.exports = {
  startBot
};
