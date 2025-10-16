
const express = require('express');
const path = require('path');
const fs = require('fs-extra');

const app = express();
const PORT = 5000;

app.use(express.static('public'));

// Route pour la page principale
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route pour récupérer le QR code
app.get('/qr-code', async (req, res) => {
  const qrPath = path.join(__dirname, 'qr-code.png');
  
  try {
    const exists = await fs.pathExists(qrPath);
    if (exists) {
      // Headers pour éviter le cache du navigateur
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
      
      // Ajouter un timestamp pour forcer le rechargement
      const stat = await fs.stat(qrPath);
      res.setHeader('Last-Modified', stat.mtime.toUTCString());
      
      res.sendFile(qrPath);
    } else {
      res.status(404).json({ error: 'QR code pas encore généré. Attends quelques secondes...' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la lecture du QR code' });
  }
});

// Route pour vérifier le statut de connexion
app.get('/status', async (req, res) => {
  const authPath = path.join(__dirname, 'auth_info', 'creds.json');
  
  try {
    const exists = await fs.pathExists(authPath);
    res.json({ 
      authenticated: exists,
      message: exists ? '✅ Bot connecté !' : '⏳ En attente de scan...'
    });
  } catch (error) {
    res.json({ authenticated: false, message: '❌ Erreur' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Interface web disponible sur: http://0.0.0.0:${PORT}`);
  console.log(`📱 Ouvre cette URL dans ton navigateur pour scanner le QR code\n`);
});

module.exports = app;
