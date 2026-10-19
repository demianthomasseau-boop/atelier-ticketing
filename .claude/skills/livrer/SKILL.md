---
name: livrer
description: Étape 6 de l'atelier. Vérifie les tests, fait le dernier commit, pousse la branche equipe-XX et donne le lien pour créer la pull request.
disable-model-invocation: true
---

# Livrer la branche

But : la branche du binôme est sur GitHub, avec une pull request prête à créer.

## Étapes

1. Lance `git branch --show-current`. Si la branche est `main`, arrête-toi. Explique au binôme qu'il faut d'abord `/construire`.
2. Lance les tests de fumée. Si un test échoue, arrête-toi. Propose une correction.
3. Lance `git status`. S'il reste des modifications, fais un commit : `git add -A`, puis `git commit -m "<message en français>"`.
4. Lance `git push -u origin <branche>`.
   - Si Git demande une connexion, explique au binôme qu'une fenêtre du navigateur s'ouvre pour GitHub. Il s'y connecte, puis tu relances la commande.
5. Lance `git remote get-url origin`. Calcule l'adresse de création de la pull request :
   `https://github.com/<propriétaire>/<dépôt>/compare/main...<branche>?expand=1`
   (enlève `.git` à la fin, convertis une adresse `git@github.com:` au format https).

## Message final au binôme

1. Le lien de création de la pull request.
2. Un titre proposé : `Binôme XX – <fonctionnalités>`.
3. Une description à copier, en 8 lignes au maximum : fonctionnalités, critères atteints, tests, captures à ajouter.
4. La consigne : « Ouvrez le lien, collez le titre et la description, cliquez sur Create pull request. Ne fusionnez pas encore. »
5. La prochaine étape : taper `/revue`.
