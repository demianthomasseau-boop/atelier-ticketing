# Spécifications – binôme 100

## Contexte
Outil de ticketing pour les techniciens du support informatique.
Ils consultent un ticket, l'affectent, le font avancer jusqu'à sa résolution et suivent la charge du support d'un coup d'œil.

## Fonctionnalités retenues

### F1 – Fiche ticket avec notes
- Besoin: le technicien ouvre un ticket depuis la liste et voit tout son détail pour le traiter.
- Critères d'acceptation:
  - [x] Un clic sur une ligne de la liste ouvre la fiche: résumé, description, projet, statut, priorité, responsable.
  - [x] La fiche affiche les notes existantes avec leur auteur et leur date, de la plus ancienne à la plus récente.
  - [x] Une note ajoutée apparaît aussitôt dans la fiche. Une note vide affiche un message d'erreur.
- API: existante. `GET /api/tickets/{id}` (texte, notes, historique), `POST /api/tickets/{id}/notes`.

### F2 – Affectation et changement de statut
- Besoin: depuis la fiche, le technicien affecte un responsable et fait avancer le statut du ticket.
- Critères d'acceptation:
  - [x] Une liste "Responsable" propose les utilisateurs. Choisir un responsable sur un ticket "Nouveau" le passe en "Affecté".
  - [x] Une liste "Statut" propose les 7 statuts MantisBT. Le nouveau statut s'affiche dans la fiche et dans la liste.
  - [x] Passer un ticket en "Résolu" affiche la résolution "Corrigé" dans la fiche.
- API: existante. `PATCH /api/tickets/{id}` (champs `handler_id`, `status`), `GET /api/meta` (utilisateurs, statuts). L'API applique déjà les règles MantisBT (passage en "Affecté", résolution "Corrigé").

### F3 – Tableau de bord
- Besoin: le technicien voit d'un coup d'œil la charge du support.
- Critères d'acceptation:
  - [ ] Un écran "Tableau de bord", accessible depuis le menu, affiche le nombre de tickets par statut et par priorité.
  - [ ] Il affiche le nombre de tickets par responsable et le nombre de tickets non affectés. Les totaux correspondent à la liste.
  - [ ] Après une affectation ou un changement de statut, les compteurs sont à jour au retour sur l'écran.
- API: existante. `GET /api/tickets` (tous les tickets) et `GET /api/meta` (libellés). Le comptage se fait dans l'interface, sans modification de l'API.

## Hors périmètre
- Filtres et recherche dans la liste.
- Création de ticket par formulaire.
- Tableau kanban, échéances et retards (SLA), export CSV.
- Modification du résumé, de la description ou de la priorité.
- Connexion et gestion des utilisateurs.

## Écrans
Maquette: `public/maquette.html` (aperçu `/maquette.html`).

| Écran | Adresse | État | Fonctionnalité | Route d'API |
|---|---|---|---|---|
| Liste des tickets (clic sur une ligne vers la fiche) | `#/` | existant, modifié | F1 | `GET /api/tickets` |
| Fiche ticket: description, détails, notes, traitement | `#/tickets/{id}` | nouveau | F1, F2 | `GET /api/tickets/{id}`, `GET /api/meta`, `POST /api/tickets/{id}/notes`, `PATCH /api/tickets/{id}` |
| Tableau de bord: compteurs par statut, priorité, responsable, non affectés | `#/tableau-de-bord` | nouveau | F3 | `GET /api/tickets`, `GET /api/meta` |
