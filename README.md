# Quiz Resident Evil

Site fan autour de l'univers **Resident Evil** : un quiz chronométré, un jeu de Memory, un classement des joueurs, un forum et une page de contact.

🔗 **En ligne :** https://projet-residentevil.loic-lepreux.com

> Projet personnel non officiel, réalisé pour apprendre. Resident Evil est une marque de Capcom.

## Fonctionnalités

- **Quiz** : 20 questions tirées au hasard, 3 niveaux de difficulté, 15 secondes par question, musique et vidéo d'ambiance.
- **Réponses vérifiées par le serveur** : le navigateur ne reçoit jamais les bonnes réponses, le score est calculé côté PHP. Impossible de tricher au classement.
- **Comptes joueurs** : inscription, connexion et déconnexion, avec mots de passe chiffrés (`password_hash`) et session PHP.
- **Classement** : Top 10 par difficulté, meilleur score, dernier score et nombre de parties. Une partie jouée sans compte est enregistrée dès que le joueur se connecte.
- **Memory** : cartes des personnages et créatures de la saga, 3 niveaux, chronomètre et compteur de coups.
- **Forum** : sujets et réponses pour les membres connectés, avec anti-spam.
- **Contact** : messages enregistrés en base, avec anti-spam et piège à robots.
- **Responsive** : ordinateur, tablette et téléphone.

## Technologies

- **PHP 8** en architecture **MVC** maison (routeur, dispatcher, contrôleurs, vues)
- **MySQL** avec PDO et requêtes préparées
- **HTML / CSS / JavaScript** (vanilla, `fetch` vers une petite API JSON)
- **Composer** pour l'autoload

## Structure

```
├── index.php              Point d'entrée : session, configuration, lancement de l'application
├── core/                  Le cœur du MVC : app (routes), rooter, dispatcher, database, tpl
├── controllers/
│   ├── pages/             Une classe par page (quiz, memory, score, forum, contact...)
│   └── api/               L'API JSON : quiz, scores, comptes, forum, contact
├── views/
│   ├── pages/             Assemblage de chaque page (header + section + footer)
│   └── sections/          Le HTML de chaque section
├── assets/                CSS, JavaScript, images, audio, vidéo
└── database/schema.sql    Structure de la base de données
```

## Lancer le projet en local

**Prérequis :** PHP 8, Composer et une base MySQL (XAMPP, Docker...).

1. Cloner le dépôt :

```bash
   git clone https://github.com/loiclepreux/projet-residentevil.git
   cd projet-re
```

2. Générer l'autoload :

```bash
   composer dump-autoload
```

3. Créer une base de données, puis importer `database/schema.sql` (dans phpMyAdmin : onglet **Importer**).
4. Créer un fichier `.env` à la racine en copiant `.env.example`, et le remplir avec les accès à ta base.
5. Lancer le serveur :

```bash
   php -S localhost:8001
```

6. Ouvrir http://localhost:8001

> Les questions du quiz ne sont pas fournies : il faut remplir les tables `questions` et `answers`.

## Auteur

**Loïc Lepreux** · [loic-lepreux.com](https://loic-lepreux.com) · [GitHub](https://github.com/loiclepreux)
