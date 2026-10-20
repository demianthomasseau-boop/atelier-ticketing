# Spécifications – binôme A8

## Contexte
L'outil est destiné à un directeur qui veut suivre l'activité des tickets d'un coup d'œil. Il lui donne une synthèse chiffrée, une vue kanban par statut et un formulaire pour déclarer un ticket.

## Fonctionnalités retenues

### F1 – Tableau de bord (synthèses)
- Besoin : le directeur voit en un coup d'œil le volume de tickets et leur répartition par priorité.
- Critères d'acceptation :
  - [x] Un compteur affiche le nombre total de tickets (14 avec les données de démo).
  - [x] Un bloc affiche le nombre de tickets pour chaque priorité (Basse, Normale, Élevée, Urgente, Immédiate).
  - [ ] Après la création d'un ticket, les compteurs se mettent à jour.
- API : API existante, `GET /api/tickets` (le comptage par priorité se fait côté interface) et `GET /api/meta` pour les libellés de priorité.

### F2 – Tableau kanban par statut
- Besoin : le directeur voit les tickets rangés en colonnes selon leur statut.
- Critères d'acceptation :
  - [x] Une colonne par statut MantisBT (Nouveau, Commentaire, Accepté, Confirmé, Affecté, Résolu, Fermé), avec le nombre de tickets.
  - [x] Chaque carte affiche le numéro, le résumé et la priorité du ticket.
  - [x] Un clic sur une carte ouvre la fiche du ticket.
- API : API existante, `GET /api/tickets` et `GET /api/meta` pour les statuts et leurs couleurs. Le déplacement par glisser-déposer n'est pas demandé : lecture seule.

### F3 – Création de ticket (formulaire)
- Besoin : déclarer un nouvel incident depuis un formulaire.
- Critères d'acceptation :
  - [ ] Le formulaire s'ouvre uniquement en cliquant sur l'icône « + » en haut à droite de la barre de navigation (aucun lien dans le menu), et refuse l'envoi si le projet, le résumé ou la description manque (message d'erreur en français).
  - [ ] Après l'envoi, le ticket apparaît dans la liste avec le statut « Nouveau ».
  - [ ] Le ticket créé apparaît dans la colonne « Nouveau » du kanban.
- API : API existante, `POST /api/tickets` (projet, résumé et description obligatoires, validés côté serveur).

## Hors périmètre
- Filtres et recherche (la liste existante reste telle quelle).
- Fiche ticket avec notes, affectation et changement de statut depuis l'interface.
- Glisser-déposer dans le kanban.
- Échéances et retards (SLA), export CSV.
- Synthèses par statut, par projet ou par responsable (seule la répartition par priorité est retenue).

## Charte graphique
- Thème de la mer : dominante de bleus (bleu marine, bleu océan, turquoise, bleu clair) avec des touches de blanc écume et de sable.
- Les couleurs de statut restent lisibles et distinctes sur ce fond bleu.
- Bootstrap 5 et Bootstrap Icons uniquement, sans CDN ni dépendance ajoutée.

## Écrans
Maquette : `public/maquette.html`.

| Écran | Adresse | Existant ou nouveau | Fonctionnalité | Route d'API |
|---|---|---|---|---|
| Tableau de bord | `#/tableau-de-bord` | nouveau | F1 | `GET /api/tickets`, `GET /api/meta` |
| Kanban par statut | `#/kanban` | nouveau | F2 | `GET /api/tickets`, `GET /api/meta` |
| Liste des tickets | `#/` | existant (repeint) | socle | `GET /api/tickets` |
| Nouveau ticket (fenêtre ouverte par l'icône « + » en haut à droite) | aucune adresse | nouveau | F3 | `POST /api/tickets`, `GET /api/meta` |
| Fiche ticket (lecture seule) | `#/ticket/{id}` | nouveau | F2 | `GET /api/tickets/{id}` |
