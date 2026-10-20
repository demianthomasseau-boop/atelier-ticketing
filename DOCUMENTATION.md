# Documentation – Ticketing (binôme A8)

## Présentation

Cet outil aide un directeur à suivre les tickets du support informatique.
Il donne une synthèse chiffrée, une vue kanban par statut et un formulaire de déclaration.
L'interface est en français, aux couleurs de la mer. Elle s'appuie sur une API de tickets inspirée de MantisBT.

## Fonctionnalités

### Tableau de bord (`#/tableau-de-bord`)

1. Ouvrez « Tableau de bord » dans la barre de navigation.
2. Lisez le compteur « Tickets au total » et les barres « Tickets par priorité ».
3. Cliquez sur une priorité pour voir seulement ses tickets (`#/priorite/{id}`). Le bouton « Retour au tableau de bord » vous ramène.
4. Cliquez sur le compteur total pour ouvrir la liste complète.

Les compteurs se mettent à jour après chaque création de ticket. Une priorité sans ticket n'est pas cliquable.

### Kanban (`#/kanban`)

1. Ouvrez « Kanban » dans la barre de navigation.
2. Repérez les 7 colonnes de statut : Nouveau, Commentaire, Accepté, Confirmé, Affecté, Résolu, Fermé. Chaque colonne affiche son nombre de tickets.
3. Lisez sur chaque carte le numéro, le résumé et la priorité.
4. Cliquez sur une carte pour ouvrir la fiche du ticket.

Le kanban est en lecture seule : on ne déplace pas les cartes.

### Liste des tickets (`#/`)

1. Ouvrez « Tickets » dans la barre de navigation.
2. Cliquez sur un ticket pour ouvrir sa fiche (`#/ticket/{id}`). Le bouton « Retour » revient à l'écran d'origine.
3. Cliquez sur l'en-tête d'une colonne pour trier en ordre croissant. Cliquez une seconde fois pour l'ordre décroissant. Une flèche marque la colonne triée.

Par défaut, la liste affiche les tickets mis à jour le plus récemment en premier.

### Fiche ticket (`#/ticket/{id}`)

La fiche affiche le statut, le projet, la priorité, le responsable, la date de mise à jour et la description. Elle est en lecture seule.

### Création d'un ticket

1. Cliquez sur l'icône « + » en haut à droite. C'est le seul accès au formulaire.
2. Choisissez le projet. Saisissez le résumé et la description. Ces trois champs sont obligatoires.
3. Choisissez la priorité (« Normale » par défaut) et, si besoin, la catégorie du projet.
4. Cliquez sur « Créer le ticket ».

Si un champ obligatoire manque, un message d'erreur en français s'affiche dans la fenêtre. Après l'envoi, la liste s'ouvre. Le ticket y apparaît avec le statut « Nouveau ».

## API

Toutes les routes renvoient du JSON. Les erreurs ont le format `{"erreur": "..."}`.

| Méthode | Chemin | Rôle |
|---|---|---|
| GET | `/api/meta` | Listes de valeurs, projets, catégories, utilisateurs |
| GET | `/api/tickets` | Liste des tickets (filtres : `project_id`, `status`, `handler_id`, `q`) |
| POST | `/api/tickets` | Création d'un ticket |
| GET | `/api/tickets/{id}` | Fiche complète (texte, notes, historique) |
| PATCH | `/api/tickets/{id}` | Modification partielle |
| DELETE | `/api/tickets/{id}` | Suppression |
| POST | `/api/tickets/{id}/notes` | Ajout d'une note |

Le binôme n'a ajouté aucune route. Le tri et le filtre par priorité se font dans l'interface.

## Lancer le projet

| | Windows (Git Bash) | macOS / Linux |
|---|---|---|
| Serveur | `outils/php/php.exe outils/serveur.php` | `php outils/serveur.php` |

Ouvrez ensuite http://localhost:8000 dans un navigateur.
Pour réinitialiser les données de démonstration, arrêtez le serveur et supprimez `data/mantis.sqlite`. La base se recrée au prochain appel.

## Tests

| Windows (Git Bash) | macOS / Linux |
|---|---|
| `outils/php/php.exe outils/tests/smoke.php` | `php outils/tests/smoke.php` |

La suite compte 28 tests de fumée. Elle utilise une base temporaire et laisse les données de travail intactes. Six tests ajoutés par le binôme couvrent la validation de la création : résumé, projet, longueur, catégorie, priorité par défaut et visibilité dans la liste.

## Limites connues

- Pas de filtres ni de recherche dans l'interface, bien que l'API les gère.
- La fiche ticket est en lecture seule : ni notes, ni modification, ni affectation, ni changement de statut.
- Pas de glisser-déposer dans le kanban.
- Pas d'échéances (SLA) ni d'export CSV.
- La synthèse ne couvre que la priorité, pas le statut, le projet ni le responsable.
- L'utilisateur connecté est fixe (utilisateur n° 1) : il n'y a pas de connexion.
