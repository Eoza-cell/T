const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const { handleIncomingMessage } = require('./messageHandler');
const { startEnergyRegeneration } = require('../game/energySystem');

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: pino({ level: 'silent' }),
    browser: Browsers.ubuntu('Chrome'),
    generateHighQualityLinkPreview: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n🔐 Scanne ce QR code avec WhatsApp:\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      
      console.log('❌ Connexion fermée. Raison:', lastDisconnect?.error?.message);
      
      if (shouldReconnect) {
        console.log('🔄 Reconnexion...');
        setTimeout(() => startBot(), 3000);
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
