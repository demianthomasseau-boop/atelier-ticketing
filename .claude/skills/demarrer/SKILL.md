---
name: demarrer
description: Étape 1 de l'atelier. Vérifie PHP, lance les tests et ouvre l'aperçu du socle. À lancer une seule fois, au début.
disable-model-invocation: true
---

# Démarrer le socle

But : le binôme voit l'application tourner dans l'aperçu en moins de 5 minutes.
Ne modifie aucun fichier du dépôt pendant cette étape.

## Étapes

1. Lance `git --version`. Si Git est absent, arrête-toi. Demande au binôme de taper `/installer` suivi de l'adresse de son dépôt.
2. Lance `uname -s` pour détecter le système.
3. Choisis la commande PHP :
   - Windows (résultat contenant MINGW, MSYS ou CYGWIN) : `outils/php/php.exe`.
   - macOS ou Linux : `php`. Si `php` est absent, arrête-toi. Affiche la commande d'installation (macOS : `brew install php`).
4. Lance `<php> -v`, puis `<php> -m`. Vérifie la présence des modules `pdo_sqlite` et `mbstring`.
   - Si `php.exe` ne démarre pas, arrête-toi. Affiche le message d'erreur exact. Demande au binôme d'appeler l'animateur.
5. Lance les tests : `<php> outils/tests/smoke.php`. Tous les tests doivent réussir.
6. Ouvre l'aperçu avec la configuration de `.claude/launch.json` adaptée au système :
   - Windows : « atelier (Windows) ».
   - macOS ou Linux : « atelier (Mac-Linux) ».
   - En cas d'échec : lance `<php> outils/serveur.php` en arrière-plan, puis ouvre « atelier (déjà lancé) ».
7. Contrôle que la liste des tickets s'affiche dans l'aperçu.
8. Lance `git branch --show-current`. Ne crée pas encore de branche.

## Message final au binôme

Écris 6 lignes au maximum :
- Ce que contient le socle : une API de tickets inspirée de MantisBT (création, fiche, notes, statuts, affectation, filtres).
- Les données de démonstration : 14 tickets, 3 projets, 6 utilisateurs.
- L'écran existant : la liste des tickets.
- La prochaine étape : taper `/specs`.
