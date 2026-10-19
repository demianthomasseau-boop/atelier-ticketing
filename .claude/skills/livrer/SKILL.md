---
name: livrer
description: Étape 6 de l'atelier. Vérifie les tests, fait le dernier commit, pousse la branche equipe-XX et crée la pull request vers main.
disable-model-invocation: true
---

# Livrer la branche

But : la pull request du binôme est ouverte sur GitHub, créée par Claude, en 3 minutes.

## Étapes

1. Lance `git branch --show-current`. Si la branche est `main`, arrête-toi. Explique au binôme qu'il faut d'abord `/construire`.
2. Lance les tests de fumée. Si un test échoue, arrête-toi. Propose une correction.
3. Lance `git status`. S'il reste des modifications, fais un commit : `git add -A`, puis `git commit -m "<message en français>"`.
4. Lance `git push -u origin <branche>`.
   - Si Git demande une connexion, explique au binôme qu'une fenêtre du navigateur s'ouvre pour GitHub. Il s'y connecte, puis tu relances la commande.
5. Écris le fichier `.git/pr.md` :
   - 1re ligne : le titre, `Binôme XX – <fonctionnalités>`.
   - Lignes suivantes : la description, 10 lignes au maximum. Fonctionnalités, critères d'acceptation atteints, tests, points à vérifier par les relecteurs.
6. Lance `bash outils/pr.sh creer .git/pr.md`. Le script crée la pull request vers `main` et affiche son adresse.
   - Si le script signale une erreur, affiche le message exact. Demande au binôme d'appeler l'animateur.

## Message final au binôme

1. L'adresse de la pull request.
2. La consigne : « Ouvrez le lien pour voir la pull request. Ne fusionnez pas encore. »
3. La prochaine étape : taper `/revue`.
