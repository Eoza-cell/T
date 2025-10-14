# Bot WhatsApp RPG One Piece

## Vue d'ensemble
Bot WhatsApp avec système RPG complet inspiré de l'univers One Piece. Le bot gère la création de personnages, un système d'attributs, des combats au tour par tour, de la progression XP, et une économie complète.

## État actuel
✅ **Code complet et fonctionnel**
⚠️ **Limitation environnement** : WhatsApp bloque les connexions depuis Replit (erreur 405)

## Architecture

### Structure des fichiers
```
/src
  /bot - Connexion WhatsApp et gestion messages
  /game - Logique de jeu (joueurs, combat, XP, énergie)
  /commands - Système de commandes
  /utils - Constantes et helpers
  /data - Base de données JSON
```

### Technologies
- Node.js 20
- @whiskeysockets/baileys (WhatsApp Web API)
- fs-extra (stockage JSON)
- node-cron (tâches programmées)
- qrcode-terminal (affichage QR)

## Système de jeu implémenté

### ✅ Fonctionnalités MVP complètes
1. **Création de personnage**
   - 6 races avec bonus uniques
   - 4 alignements
   - 30 points d'attributs de départ

2. **Système d'attributs**
   - Force, Vitesse, Endurance, Réflexe, Intelligence, Précision
   - Calculs de bonus automatiques
   - Progression par entraînement

3. **Système XP/Niveau**
   - 30 niveaux planifiés
   - Déblocages progressifs (styles, haki, zones)
   - Points d'attributs par niveau

4. **Système d'énergie**
   - Basé sur l'Endurance (×10)
   - Régénération automatique (5 min)
   - Consommation par action

5. **Combat au tour par tour**
   - Calculs basés sur stats
   - Esquive et coups critiques
   - XP et Berrys en récompense

6. **Économie de base**
   - Système de Berrys
   - 5 métiers avec revenus
   - Gains par combat

7. **Commandes complètes**
   - 20+ commandes implémentées
   - Menu d'aide interactif
   - Système d'information

### 🔮 Phase suivante (fonctionnalités avancées)
- Base de données PostgreSQL
- Système de Haki complet
- Fruits du Démon
- Styles de combat avec techniques
- Métiers et crafting avancés
- Zones géographiques avec navigation
- Système d'équipage
- Réputation et primes
- Combats de boss scénarisés
- Arbre de quêtes

## Problème actuel

### Erreur de connexion WhatsApp
```
Code: 405 "Method Not Allowed"
Raison: WhatsApp bloque les connexions cloud
```

**Cause** : Les serveurs WhatsApp rejettent les connexions depuis certains cloud providers (dont Replit)

### Solutions recommandées

1. **Migrer vers Telegram** ⭐ (recommandé)
   - API officielle
   - Pas de restrictions
   - Plus stable et riche en fonctionnalités

2. **Déployer sur VPS**
   - DigitalOcean, Linode, AWS EC2
   - Connexion directe acceptée

3. **Exécution locale**
   - Sur machine personnelle
   - Connexion stable

## Commandes principales

```bash
# Personnage
!creer [nom] [race] [alignement]
!profil
!attributs [attr] [points]

# Combat
!combat [@mention]
!attaque
!energie

# Progression
!entrainement [type]
!niveau

# Info
!aide, !races, !alignements, !styles, !metiers, !zones
```

## Base de données

### Format actuel (JSON)
```json
{
  "phoneNumber": {
    "name": "Luffy",
    "race": "Humain",
    "level": 1,
    "xp": 0,
    "attributes": {...},
    "energy": 50,
    "berrys": 1000,
    ...
  }
}
```

### Migration future (PostgreSQL)
Tables prévues :
- players
- combats
- quests
- items
- crews

## Notes de développement

### Bonnes pratiques suivies
- Code modulaire et organisé
- Constantes centralisées
- Helpers réutilisables
- Gestion d'erreurs
- Logging détaillé

### Points d'attention
- Régénération énergie (cron toutes les 5 min)
- Combat PvP nécessite 2 joueurs actifs
- Sauvegarde JSON après chaque action
- Session Baileys dans /auth_info

### Optimisations possibles
- Cache en mémoire pour joueurs actifs
- Batch updates pour la DB
- Rate limiting sur commandes
- Système de cooldown

## Déploiement

### Workflow actuel
```
Nom: WhatsApp Bot
Commande: npm start
Type: console
```

### Variables d'environnement
Aucune requise pour le moment (session Baileys auto-gérée)

## Modifications récentes

**14/10/2025**
- ✅ Création structure complète du projet
- ✅ Implémentation système RPG complet
- ✅ Système de commandes interactif
- ✅ Gestion énergie automatique
- ⚠️ Problème connexion WhatsApp identifié (405)

## Préférences utilisateur

- Langue : Français
- Framework : Node.js vanilla (pas de frameworks web)
- Base de données : JSON → PostgreSQL (phase 2)
- Système inspiré : One Piece (fidèle à l'univers)

---

**Prochaines étapes suggérées** :
1. Migrer vers Telegram Bot API
2. Ou déployer sur VPS pour WhatsApp
3. Ajouter fonctionnalités avancées (Haki, Fruits)
