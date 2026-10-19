# Documentation – outil de ticketing (binôme 100)

## Présentation

Cet outil sert aux techniciens du support informatique.
Ils consultent un ticket, ajoutent des notes, l'affectent et font avancer son statut jusqu'à la résolution.
Un tableau de bord leur montre la charge du support d'un coup d'œil.

## Fonctionnalités

### F1 – Fiche ticket avec notes

1. Ouvrez la liste des tickets (menu "Tickets", adresse `#/`).
2. Cliquez sur une ligne. La fiche du ticket s'ouvre (`#/tickets/{id}`).
3. Lisez la description, les étapes pour reproduire et les détails (projet, catégorie, priorité, sévérité, résolution, déclarant, dates).
4. Consultez les notes, de la plus ancienne à la plus récente, avec leur auteur et leur date.
5. Pour ajouter une note, écrivez-la dans "Ajouter une note", puis cliquez sur "Ajouter la note". Elle apparaît aussitôt.
6. Une note vide est refusée: le message "La note est vide." s'affiche sous le champ.
7. Cliquez sur "Retour aux tickets" pour revenir à la liste.

### F2 – Affectation et changement de statut

1. Ouvrez la fiche d'un ticket.
2. Dans le bloc "Traitement", choisissez un responsable dans la liste "Responsable", ou "Non affecté".
3. Choisissez un statut dans la liste "Statut" (les 7 statuts MantisBT).
4. Cliquez sur "Enregistrer". Le bouton reste grisé tant que rien n'a changé.
5. Le message "Ticket mis à jour." confirme l'enregistrement. Le nouveau statut s'affiche dans la fiche et dans la liste.

L'API applique deux règles MantisBT:
- un ticket "Nouveau" qui reçoit un responsable passe en "Affecté";
- un ticket passé en "Résolu" ou "Fermé" avec la résolution "Ouvert" reçoit la résolution "Corrigé".

### F3 – Tableau de bord

1. Cliquez sur "Tableau de bord" dans le menu (adresse `#/tableau-de-bord`).
2. Lisez les deux compteurs du haut: nombre total de tickets et nombre de tickets non affectés.
3. Lisez la répartition par statut, par priorité et par responsable. Chaque barre montre la part du total.
4. Après une affectation ou un changement de statut, revenez sur l'écran: les compteurs sont recalculés.

## API

Aucune route n'a été ajoutée par le binôme. L'interface utilise les routes du socle.

| Méthode | Chemin | Rôle | Utilisée par |
|---|---|---|---|
| GET | `/api/meta` | Listes de valeurs MantisBT, projets, catégories, utilisateurs | toute l'application |
| GET | `/api/tickets` | Liste des tickets (filtres `project_id`, `status`, `handler_id`, `q`) | liste, F3 |
| POST | `/api/tickets` | Création d'un ticket | non utilisée |
| GET | `/api/tickets/{id}` | Fiche complète: texte, notes, historique | F1, F2 |
| PATCH | `/api/tickets/{id}` | Modification partielle (ici `handler_id`, `status`) | F2 |
| DELETE | `/api/tickets/{id}` | Suppression | non utilisée |
| POST | `/api/tickets/{id}/notes` | Ajout d'une note | F1 |

Les erreurs arrivent au format `{"erreur": "..."}` avec le code HTTP adapté (404, 422...).

## Lancer le projet

| Système | Commande |
|---|---|
| Windows (Git Bash) | aperçu "atelier (Windows)", ou `outils/php/php.exe outils/serveur.php` |
| macOS / Linux | aperçu "atelier (Mac-Linux)", ou `php outils/serveur.php` |

L'application répond sur `http://localhost:8000` (ou sur le port de la variable `PORT`).
La maquette reste visible sur `/maquette.html`.
Pour revenir aux données de démonstration, supprimez `data/mantis.sqlite`. La base se recrée au prochain appel.

## Tests

| Système | Commande |
|---|---|
| Windows (Git Bash) | `outils/php/php.exe outils/tests/smoke.php` |
| macOS / Linux | `php outils/tests/smoke.php` |

Résultat attendu: 22 tests réussis. Le binôme n'a ajouté aucune règle métier, donc aucun test.

## Limites connues

- Hors périmètre: filtres et recherche dans la liste, création de ticket, tableau kanban, échéances (SLA), export CSV.
- Le résumé, la description et la priorité ne se modifient pas depuis la fiche.
- Pas de connexion: l'utilisateur courant est toujours "Administrateur Atelier".
- La liste "Responsable" propose tous les utilisateurs actifs, déclarants compris.
- L'historique du ticket est renvoyé par l'API mais n'est pas affiché.
- Le tableau de bord compte tous les tickets, fermés compris. Il ne se met pas à jour tout seul: il se recalcule à l'ouverture de l'écran.
- Ajouter une note recharge la fiche: un choix non enregistré dans "Traitement" est alors perdu.
