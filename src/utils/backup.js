
const fs = require('fs-extra');
const path = require('path');

const PLAYERS_FILE = path.join(__dirname, '../data/players.json');
const BACKUP_DIR = path.join(__dirname, '../data/backups');

async function createBackup() {
  try {
    await fs.ensureDir(BACKUP_DIR);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `players_backup_${timestamp}.json`);
    
    if (await fs.pathExists(PLAYERS_FILE)) {
      await fs.copy(PLAYERS_FILE, backupFile);
      console.log(`✅ Sauvegarde créée: ${backupFile}`);
      
      await cleanOldBackups();
      
      return { success: true, file: backupFile };
    }
    
    return { success: false, message: 'Aucune donnée à sauvegarder' };
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde:', error);
    return { success: false, message: error.message };
  }
}

async function cleanOldBackups() {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const backups = files
      .filter(f => f.startsWith('players_backup_'))
      .map(f => ({
        name: f,
        path: path.join(BACKUP_DIR, f),
        time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);
    
    const MAX_BACKUPS = 10;
    if (backups.length > MAX_BACKUPS) {
      for (let i = MAX_BACKUPS; i < backups.length; i++) {
        await fs.remove(backups[i].path);
        console.log(`🗑️ Ancienne sauvegarde supprimée: ${backups[i].name}`);
      }
    }
  } catch (error) {
    console.error('Erreur lors du nettoyage des sauvegardes:', error);
  }
}

async function restoreBackup(backupFileName = null) {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const backups = files
      .filter(f => f.startsWith('players_backup_'))
      .map(f => ({
        name: f,
        path: path.join(BACKUP_DIR, f),
        time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);
    
    if (backups.length === 0) {
      return { success: false, message: 'Aucune sauvegarde disponible' };
    }
    
    const backup = backupFileName 
      ? backups.find(b => b.name === backupFileName)
      : backups[0];
    
    if (!backup) {
      return { success: false, message: 'Sauvegarde introuvable' };
    }
    
    await fs.copy(backup.path, PLAYERS_FILE);
    console.log(`✅ Données restaurées depuis: ${backup.name}`);
    
    return { success: true, file: backup.name };
  } catch (error) {
    console.error('❌ Erreur lors de la restauration:', error);
    return { success: false, message: error.message };
  }
}

async function listBackups() {
  try {
    await fs.ensureDir(BACKUP_DIR);
    const files = await fs.readdir(BACKUP_DIR);
    const backups = files
      .filter(f => f.startsWith('players_backup_'))
      .map(f => {
        const stat = fs.statSync(path.join(BACKUP_DIR, f));
        return {
          name: f,
          date: new Date(stat.mtime).toLocaleString('fr-FR'),
          size: (stat.size / 1024).toFixed(2) + ' KB'
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
    
    return { success: true, backups };
  } catch (error) {
    console.error('Erreur lors de la liste des sauvegardes:', error);
    return { success: false, message: error.message };
  }
}

module.exports = {
  createBackup,
  restoreBackup,
  listBackups
};
