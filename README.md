# 🏴‍☠️ Bot WhatsApp RPG One Piece ⚓

Bot WhatsApp complet basé sur l'univers de One Piece avec un système RPG avancé.

## ✨ Fonctionnalités récentes

### 🔐 QR Code amélioré
- **Affichage dans le terminal** pour un scan rapide
- **Fichier PNG généré** (`qr-code.png`) pour un meilleur scan
- Résolution optimisée (512x512px) avec correction d'erreur élevée

### 🎬 Menu animé
- Le menu d'aide (`!aide`) envoie maintenant un **GIF animé**
- Interface visuelle attractive inspirée de One Piece
- Caption complète avec toutes les commandes

## ⚠️ Important : Limitations de l'environnement

**Le bot est fonctionnel mais rencontre des problèmes de connexion dans l'environnement Replit.**

WhatsApp bloque les connexions depuis certains serveurs cloud (erreur 405). Pour faire fonctionner ce bot, vous devez :

### Solutions recommandées :

1. **Utiliser Telegram à la place** (recommandé)
   - API officielle et stable
   - Aucune restriction de connexion
   - Plus de fonctionnalités (boutons, menus interactifs)
   
2. **Déployer sur un VPS** (DigitalOcean, Linode, etc.)
   - Télécharger le code
   - Installer Node.js
   - Exécuter `npm install && npm start`
   
3. **Exécuter en local**
   - Cloner le projet
   - `npm install`
   - `npm start`
   - Scanner le QR code avec WhatsApp

## 🎮 Système de jeu

### Attributs principaux
- **Force** ⚡ : Puissance physique et dégâts
- **Vitesse** 💨 : Rapidité et esquive
- **Endurance** 🛡️ : Résistance et énergie
- **Réflexe** 👁️ : Temps de réaction
- **Intelligence** 🧠 : Stratégie et maîtrise
- **Précision** 🎯 : Coups critiques

### Races disponibles
- **Humain** : +5 à un attribut au choix
- **Homme-poisson** : +10 Force, respiration aquatique
- **Géant** : +20 Force, -10 Vitesse
- **Mink** : +10 Vitesse, Electro
- **Skypéien** : +10 Réflexe, vol avec Dial
- **Cyborg** : +10 Endurance, pièces mécaniques

### Alignements
- **Pirate** : Prime élevée, liberté totale
- **Marine** : Salaire régulier, soutien du Gouvernement
- **Révolutionnaire** : Soutien populaire, traqué
- **Civil** : Neutre, commerce libre

### Styles de combat (Niveau 5+)
- **Épéiste** : +15% Précision, +10% Réflexe
- **Combattant** : +20% Force, +10% Endurance
- **Tireur** : +20% Précision, +5% Intelligence
- **Artiste Martial** : +10% Vitesse, +10% Réflexe
- **Stratège** : +15% Intelligence, +5% Endurance
- **Fruit User** : Pouvoir unique, -10% Endurance

## 📱 Commandes

### Personnage
```
!creer [nom] [race] [alignement] - Créer un personnage
!profil - Voir le profil complet
!stats - Voir les statistiques
!attributs [attr] [points] - Ajouter des points
!niveau - Progression vers niveau suivant
```

### Combat
```
!combat [@mention] - Défier un joueur
!attaque - Attaquer en combat
!energie - Voir l'énergie actuelle
```

### Progression
```
!entrainement [type] - S'entraîner
Types : force, vitesse, endurance, reflexe, intelligence, precision
```

### Informations
```
!aide - Menu d'aide
!races - Liste des races
!alignements - Liste des alignements
!styles - Styles de combat
!metiers - Liste des métiers
!zones - Zones du monde
```

## 🎯 Système de progression

### Expérience (XP)
- Combat gagné : +100 XP
- Combat perdu : +30 XP
- Entraînement : +50 à +150 XP
- Quête secondaire : +100 à +300 XP
- Mission principale : +500 XP
- Boss/Événement : +1000 à +3000 XP

### Niveaux clés
- **Niveau 5** : Débloque les styles de combat
- **Niveau 10** : Accès Grand Line + Haki Observation
- **Niveau 15** : Haki de l'Armement
- **Niveau 20** : Fruits rares, Haki Royal
- **Niveau 25** : Accès Nouveau Monde

### Système d'énergie
- Énergie max = Endurance × 10
- Régénération automatique : +10 toutes les 5 minutes
- Coûts d'actions :
  - Attaque basique : -2
  - Esquive rapide : -4
  - Technique spéciale : -10
  - Coup ultime : -20

## 💰 Économie

### Berrys (monnaie)
- Départ : 1000 Berrys
- Combat gagné : +500 Berrys
- Salaire métier : Variable

### Métiers
- **Forgeron** : 200 Berrys/sem, +10% dégâts armes
- **Médecin** : 180 Berrys/sem, +15% régénération
- **Cuisinier** : 150 Berrys/sem, +10% énergie max
- **Navigateur** : 170 Berrys/sem, +10% vitesse maritime
- **Chasseur** : Variable, +15% XP et +20% Berrys

## 🗺️ Zones

1. **East Blue** (Niv. 1-10) : Zone d'apprentissage
2. **Grand Line** (Niv. 10-25) : Dangers climatiques
3. **Nouveau Monde** (Niv. 25-50) : Pirates puissants
4. **Eaux Interdites** (Niv. 50+) : Ennemis mythiques

## ⚔️ Système de combat

Combat au tour par tour avec :
- Calcul des dégâts basé sur Force et Précision
- Système d'esquive basé sur Vitesse et Réflexe
- Coups critiques selon la Précision
- Réduction des dégâts selon l'Endurance
- Consommation d'énergie par action

## 🚀 Structure du projet

```
/src
  /bot
    - index.js (Connexion Baileys)
    - messageHandler.js (Gestion messages)
  /game
    - playerManager.js (Gestion joueurs)
    - combatSystem.js (Système combat)
    - xpSystem.js (Système XP)
    - energySystem.js (Système énergie)
  /commands
    - index.js (Commandes du jeu)
  /utils
    - constants.js (Constantes)
    - helpers.js (Fonctions utilitaires)
  /data
    - players.json (Base de données)
```

## 📦 Dépendances

```json
{
  "@whiskeysockets/baileys": "^6.7.20",
  "qrcode-terminal": "^0.12.0",
  "pino": "^10.0.0",
  "fs-extra": "^11.3.2",
  "node-cron": "^4.2.1"
}
```

## 🔮 Fonctionnalités futures

- [ ] Système de Haki complet (Observation, Armement, Royal)
- [ ] Fruits du Démon (Paramecia, Zoan, Logia)
- [ ] Système d'équipage
- [ ] Navigation entre zones
- [ ] Quêtes scénarisées
- [ ] Boss et événements mondiaux
- [ ] Système de réputation et primes
- [ ] Combat PvP multijoueur
- [ ] Système de craft et d'équipement

## 📝 Notes techniques

### Base de données
- Actuellement : JSON (src/data/players.json)
- Recommandé pour production : PostgreSQL

### Sécurité
- Données sauvegardées localement
- Pas de secrets exposés
- Session Baileys sécurisée

### Performance
- Régénération d'énergie automatique (cron)
- Système de combat optimisé
- Gestion de sessions multiples

## 🤝 Contribution

Le code est complet et documenté. N'hésitez pas à :
- Ajouter de nouvelles fonctionnalités
- Améliorer le système de combat
- Créer de nouvelles quêtes
- Optimiser les performances

## 📄 Licence

Ce projet est un système RPG éducatif basé sur l'univers One Piece.

---

**Créé avec ❤️ pour les fans de One Piece** 🏴‍☠️
