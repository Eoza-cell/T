const { startBot } = require('./src/bot');
const server = require('./server');

console.log(`
╔═══════════════════════════════════════╗
║                                       ║
║   🏴‍☠️  ONE PIECE RPG WHATSAPP BOT  ⚓   ║
║                                       ║
║   Bot de jeu de rôle basé sur        ║
║   l'univers de One Piece             ║
║                                       ║
╚═══════════════════════════════════════╝
`);

console.log('🚀 Démarrage du serveur web et du bot...\n');

startBot().catch(err => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});
