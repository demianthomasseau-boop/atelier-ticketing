/*
 * Application Vue 3 (sans build) du socle Mantis-lite.
 * - api()      : appels à l'API JSON (src/api.php)
 * - outils     : libellés, couleurs et dates
 * - vues       : un objet par écran, déclaré dans ROUTES
 * Pour ajouter un écran : créer un composant, puis l'ajouter à ROUTES et, si besoin, à MENU.
 */

const { createApp, reactive, ref, computed, onMounted } = Vue;

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

async function api(methode, chemin, corps) {
  const reponse = await fetch(chemin, {
    method: methode,
    headers: corps ? { 'Content-Type': 'application/json' } : {},
    body: corps ? JSON.stringify(corps) : undefined,
  });
  const donnees = await reponse.json().catch(() => ({}));
  if (!reponse.ok) {
    throw new Error(donnees.erreur || `Erreur ${reponse.status}`);
  }
  return donnees;
}

// ---------------------------------------------------------------------------
// État partagé et outils
// ---------------------------------------------------------------------------

// Métadonnées chargées une fois : listes de valeurs MantisBT, projets, catégories, utilisateurs
const etat = reactive({ meta: null });

const outils = {
  libelle(liste, id) {
    return etat.meta?.enums[liste]?.find((e) => e.id === id)?.label ?? '—';
  },
  couleurStatut(id) {
    return etat.meta?.enums.status.find((e) => e.id === id)?.color ?? '#eee';
  },
  date(ts) {
    return ts ? new Date(ts * 1000).toLocaleDateString('fr-FR') : '—';
  },
  dateHeure(ts) {
    return ts ? new Date(ts * 1000).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
  },
  depuis(ts) {
    const secondes = Math.floor(Date.now() / 1000) - ts;
    if (secondes < 3600) return `il y a ${Math.max(1, Math.floor(secondes / 60))} min`;
    if (secondes < 86400) return `il y a ${Math.floor(secondes / 3600)} h`;
    return `il y a ${Math.floor(secondes / 86400)} j`;
  },
};

// ---------------------------------------------------------------------------
// Vues
// ---------------------------------------------------------------------------

const ListeTickets = {
  props: ["params"],
  setup() {
    const tickets = ref([]);
    const chargement = ref(true);
    const erreur = ref('');

    onMounted(async () => {
      try {
        tickets.value = await api('GET', '/api/tickets');
      } catch (e) {
        erreur.value = e.message;
      } finally {
        chargement.value = false;
      }
    });

    function ouvrir(id) {
      location.hash = `#/tickets/${id}`;
    }

    return { tickets, chargement, erreur, ouvrir, ...outils };
  },
  template: `
    <div class="d-flex align-items-center mb-3">
      <h1 class="h4 mb-0">Tickets</h1>
      <span class="badge text-bg-secondary ms-2">{{ tickets.length }}</span>
    </div>
    <div v-if="erreur" class="alert alert-danger">{{ erreur }}</div>
    <div v-else-if="chargement" class="text-secondary">Chargement…</div>
    <div v-else class="card shadow-sm">
      <div class="table-responsive">
        <table class="table table-hover table-tickets mb-0">
          <thead class="table-light">
            <tr>
              <th>N°</th><th>Résumé</th><th>Projet</th><th>Statut</th>
              <th>Priorité</th><th>Responsable</th><th>Mis à jour</th><th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in tickets" :key="t.id" @click="ouvrir(t.id)">
              <td class="text-secondary">#{{ t.id }}</td>
              <td>{{ t.summary }}</td>
              <td class="small">{{ t.project }}<div class="text-secondary">{{ t.category }}</div></td>
              <td>
                <span class="badge badge-statut" :style="{ background: couleurStatut(t.status) }">
                  {{ libelle('status', t.status) }}
                </span>
              </td>
              <td :class="'priorite-' + t.priority">{{ libelle('priority', t.priority) }}</td>
              <td>{{ t.handler || '—' }}</td>
              <td class="small text-secondary" :title="dateHeure(t.last_updated)">{{ depuis(t.last_updated) }}</td>
              <td class="text-secondary"><i class="bi bi-chevron-right"></i></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
};

const FicheTicket = {
  props: ["params"],
  setup(props) {
    const ticket = ref(null);
    const erreur = ref('');
    const note = ref('');
    const erreurNote = ref('');
    const envoiNote = ref(false);
    const choix = reactive({ handler_id: null, status: null });
    const enregistrement = ref(false);
    const erreurTraitement = ref('');
    const confirmation = ref('');

    function remplirChoix() {
      choix.handler_id = ticket.value.handler_id;
      choix.status = ticket.value.status;
    }

    async function charger() {
      try {
        ticket.value = await api('GET', `/api/tickets/${props.params[0]}`);
        remplirChoix();
      } catch (e) {
        erreur.value = e.message;
      }
    }

    const modifie = computed(() => ticket.value !== null
      && (choix.handler_id !== ticket.value.handler_id || choix.status !== ticket.value.status));

    // Seuls les champs changés partent: l'API applique les règles MantisBT (passage en « Affecté », résolution « Corrigé »).
    async function enregistrer() {
      const champs = {};
      if (choix.handler_id !== ticket.value.handler_id) champs.handler_id = choix.handler_id;
      if (choix.status !== ticket.value.status) champs.status = choix.status;
      erreurTraitement.value = '';
      confirmation.value = '';
      enregistrement.value = true;
      try {
        ticket.value = await api('PATCH', `/api/tickets/${ticket.value.id}`, champs);
        remplirChoix();
        confirmation.value = 'Ticket mis à jour.';
      } catch (e) {
        erreurTraitement.value = e.message;
      } finally {
        enregistrement.value = false;
      }
    }

    // La validation (note vide, longueur) est faite par l'API: on affiche son message.
    async function ajouterNote() {
      erreurNote.value = '';
      envoiNote.value = true;
      try {
        await api('POST', `/api/tickets/${ticket.value.id}/notes`, { note: note.value });
        note.value = '';
        await charger();
      } catch (e) {
        erreurNote.value = e.message;
      } finally {
        envoiNote.value = false;
      }
    }

    onMounted(charger);

    return {
      ticket, erreur, note, erreurNote, envoiNote, ajouterNote,
      choix, modifie, enregistrement, erreurTraitement, confirmation, enregistrer,
      // Seuls les techniciens et plus (DEVELOPER = 55 dans MantisBT) peuvent traiter un ticket.
      utilisateurs: computed(() => etat.meta.users.filter((u) => Number(u.access_level) >= 55)),
      statuts: computed(() => etat.meta.enums.status),
      ...outils,
    };
  },
  template: `
    <a href="#/" class="small text-decoration-none"><i class="bi bi-arrow-left me-1"></i>Retour aux tickets</a>
    <div v-if="erreur" class="alert alert-danger mt-3">{{ erreur }}</div>
    <div v-else-if="!ticket" class="text-secondary mt-3">Chargement…</div>
    <template v-else>
      <div class="d-flex flex-wrap align-items-center gap-2 mt-2 mb-3">
        <h1 class="h4 mb-0"><span class="text-secondary">#{{ ticket.id }}</span> {{ ticket.summary }}</h1>
        <span class="badge badge-statut" :style="{ background: couleurStatut(ticket.status) }">
          {{ libelle('status', ticket.status) }}
        </span>
      </div>

      <div class="row g-3">
        <div class="col-lg-8">
          <div class="card shadow-sm mb-3">
            <div class="card-header bg-body fw-semibold">Description</div>
            <div class="card-body">
              <p class="texte-long mb-0">{{ ticket.description }}</p>
              <template v-if="ticket.steps_to_reproduce">
                <h2 class="h6 mt-3">Étapes pour reproduire</h2>
                <p class="texte-long mb-0">{{ ticket.steps_to_reproduce }}</p>
              </template>
              <template v-if="ticket.additional_information">
                <h2 class="h6 mt-3">Informations complémentaires</h2>
                <p class="texte-long mb-0">{{ ticket.additional_information }}</p>
              </template>
            </div>
          </div>

          <div class="card shadow-sm">
            <div class="card-header bg-body fw-semibold">
              Notes <span class="badge text-bg-secondary ms-1">{{ ticket.notes.length }}</span>
            </div>
            <ul class="list-group list-group-flush">
              <li v-if="ticket.notes.length === 0" class="list-group-item text-secondary">Aucune note.</li>
              <li v-for="n in ticket.notes" :key="n.id" class="list-group-item">
                <div class="small text-secondary mb-1">
                  <i class="bi bi-person me-1"></i>{{ n.reporter }} · {{ dateHeure(n.date_submitted) }}
                </div>
                <div class="texte-long">{{ n.note }}</div>
              </li>
            </ul>
            <form class="card-body border-top" @submit.prevent="ajouterNote">
              <label for="note" class="form-label small fw-semibold">Ajouter une note</label>
              <textarea id="note" v-model="note" class="form-control" :class="{ 'is-invalid': erreurNote }"
                        rows="3" maxlength="5000" placeholder="Votre note…"></textarea>
              <div class="invalid-feedback">{{ erreurNote }}</div>
              <div class="text-end mt-2">
                <button type="submit" class="btn btn-primary btn-sm" :disabled="envoiNote">
                  <i class="bi bi-chat-left-text me-1"></i>Ajouter la note
                </button>
              </div>
            </form>
          </div>
        </div>

        <div class="col-lg-4">
          <form class="card shadow-sm mb-3" @submit.prevent="enregistrer">
            <div class="card-header bg-body fw-semibold">Traitement</div>
            <div class="card-body">
              <div v-if="confirmation" class="alert alert-success py-2 small">
                <i class="bi bi-check-circle me-1"></i>{{ confirmation }}
              </div>
              <div v-if="erreurTraitement" class="alert alert-danger py-2 small">{{ erreurTraitement }}</div>
              <label for="responsable" class="form-label small fw-semibold">Responsable</label>
              <select id="responsable" v-model="choix.handler_id" class="form-select mb-3">
                <option :value="null">— Non affecté —</option>
                <option v-for="u in utilisateurs" :key="u.id" :value="u.id">{{ u.realname }}</option>
              </select>
              <label for="statut" class="form-label small fw-semibold">Statut</label>
              <select id="statut" v-model="choix.status" class="form-select mb-2">
                <option v-for="s in statuts" :key="s.id" :value="s.id">{{ s.label }}</option>
              </select>
              <p class="small text-secondary mb-3">
                Un ticket "Nouveau" passe en "Affecté" dès qu'il a un responsable.
                Sans responsable, un ticket "Affecté" revient à "Nouveau".
                En "Résolu", la résolution devient "Corrigé".
              </p>
              <button type="submit" class="btn btn-primary w-100" :disabled="!modifie || enregistrement">
                <i class="bi bi-save me-1"></i>Enregistrer
              </button>
            </div>
          </form>

          <div class="card shadow-sm">
            <div class="card-header bg-body fw-semibold">Détails</div>
            <div class="card-body small">
              <dl class="row mb-0">
                <dt class="col-5 fw-normal text-secondary">Projet</dt>
                <dd class="col-7">{{ ticket.project }}</dd>
                <dt class="col-5 fw-normal text-secondary">Catégorie</dt>
                <dd class="col-7">{{ ticket.category || '—' }}</dd>
                <dt class="col-5 fw-normal text-secondary">Priorité</dt>
                <dd class="col-7" :class="'priorite-' + ticket.priority">{{ libelle('priority', ticket.priority) }}</dd>
                <dt class="col-5 fw-normal text-secondary">Sévérité</dt>
                <dd class="col-7">{{ libelle('severity', ticket.severity) }}</dd>
                <dt class="col-5 fw-normal text-secondary">Résolution</dt>
                <dd class="col-7">{{ libelle('resolution', ticket.resolution) }}</dd>
                <dt class="col-5 fw-normal text-secondary">Déclarant</dt>
                <dd class="col-7">{{ ticket.reporter }}</dd>
                <dt class="col-5 fw-normal text-secondary">Créé le</dt>
                <dd class="col-7">{{ dateHeure(ticket.date_submitted) }}</dd>
                <dt class="col-5 fw-normal text-secondary">Mis à jour</dt>
                <dd class="col-7 mb-0">{{ dateHeure(ticket.last_updated) }}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </template>
  `,
};

const TableauDeBord = {
  props: ["params"],
  setup() {
    const tickets = ref([]);
    const chargement = ref(true);
    const erreur = ref('');

    onMounted(async () => {
      try {
        tickets.value = await api('GET', '/api/tickets');
      } catch (e) {
        erreur.value = e.message;
      } finally {
        chargement.value = false;
      }
    });

    const compter = (filtre) => tickets.value.filter(filtre).length;

    const parStatut = computed(() => etat.meta.enums.status
      .map((s) => ({ ...s, nombre: compter((t) => t.status === s.id) })));

    // De la priorité la plus haute à la plus basse
    const parPriorite = computed(() => [...etat.meta.enums.priority].reverse()
      .map((p) => ({ ...p, nombre: compter((t) => t.priority === p.id) })));

    const parResponsable = computed(() => {
      const comptes = new Map();
      for (const t of tickets.value) {
        if (t.handler_id === null) continue;
        const ligne = comptes.get(t.handler_id) ?? { id: t.handler_id, nom: t.handler, nombre: 0 };
        ligne.nombre++;
        comptes.set(t.handler_id, ligne);
      }
      return [...comptes.values()].sort((a, b) => b.nombre - a.nombre);
    });

    const nonAffectes = computed(() => compter((t) => t.handler_id === null));

    function largeur(nombre) {
      return tickets.value.length ? `${Math.round((nombre * 100) / tickets.value.length)}%` : '0%';
    }

    function couleurPriorite(id) {
      if (id >= 50) return 'bg-danger';
      return id === 40 ? 'bg-warning' : 'bg-secondary';
    }

    return {
      tickets, chargement, erreur, parStatut, parPriorite, parResponsable, nonAffectes,
      largeur, couleurPriorite, ...outils,
    };
  },
  template: `
    <h1 class="h4 mb-3">Tableau de bord</h1>
    <div v-if="erreur" class="alert alert-danger">{{ erreur }}</div>
    <div v-else-if="chargement" class="text-secondary">Chargement…</div>
    <template v-else>
      <div class="row g-3 mb-3">
        <div class="col-sm-6 col-lg-3">
          <div class="card shadow-sm h-100">
            <div class="card-body">
              <div class="small text-secondary"><i class="bi bi-ticket-detailed me-1"></i>Tickets</div>
              <div class="display-6 fw-semibold">{{ tickets.length }}</div>
            </div>
          </div>
        </div>
        <div class="col-sm-6 col-lg-3">
          <div class="card shadow-sm h-100 border-danger-subtle">
            <div class="card-body">
              <div class="small text-secondary"><i class="bi bi-person-dash me-1"></i>Non affectés</div>
              <div class="display-6 fw-semibold text-danger">{{ nonAffectes }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-lg-4">
          <div class="card shadow-sm h-100">
            <div class="card-header bg-body fw-semibold">Par statut</div>
            <ul class="list-group list-group-flush">
              <li v-for="s in parStatut" :key="s.id" class="list-group-item d-flex align-items-center gap-2">
                <span class="badge badge-statut" :style="{ background: s.color }">{{ s.label }}</span>
                <div class="progress flex-grow-1 barre-compteur">
                  <div class="progress-bar bg-secondary" :style="{ width: largeur(s.nombre) }"></div>
                </div>
                <span class="fw-semibold">{{ s.nombre }}</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="col-lg-4">
          <div class="card shadow-sm h-100">
            <div class="card-header bg-body fw-semibold">Par priorité</div>
            <ul class="list-group list-group-flush">
              <li v-for="p in parPriorite" :key="p.id" class="list-group-item d-flex align-items-center gap-2"
                  :class="{ 'text-secondary': p.nombre === 0 }">
                <span class="libelle-compteur" :class="'priorite-' + p.id">{{ p.label }}</span>
                <div class="progress flex-grow-1 barre-compteur">
                  <div class="progress-bar" :class="couleurPriorite(p.id)" :style="{ width: largeur(p.nombre) }"></div>
                </div>
                <span class="fw-semibold">{{ p.nombre }}</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="col-lg-4">
          <div class="card shadow-sm h-100">
            <div class="card-header bg-body fw-semibold">Par responsable</div>
            <ul class="list-group list-group-flush">
              <li v-for="r in parResponsable" :key="r.id" class="list-group-item d-flex align-items-center gap-2">
                <span class="libelle-compteur"><i class="bi bi-person me-1"></i>{{ r.nom }}</span>
                <div class="progress flex-grow-1 barre-compteur">
                  <div class="progress-bar" :style="{ width: largeur(r.nombre) }"></div>
                </div>
                <span class="fw-semibold">{{ r.nombre }}</span>
              </li>
              <li class="list-group-item d-flex align-items-center gap-2 text-danger">
                <span class="libelle-compteur"><i class="bi bi-person-dash me-1"></i>Non affecté</span>
                <div class="progress flex-grow-1 barre-compteur">
                  <div class="progress-bar bg-danger" :style="{ width: largeur(nonAffectes) }"></div>
                </div>
                <span class="fw-semibold">{{ nonAffectes }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </template>
  `,
};

const PageIntrouvable = {
  props: ["params"],
  template: `
    <div class="text-center py-5">
      <h1 class="h4">Page introuvable</h1>
      <a href="#/">Retour aux tickets</a>
    </div>
  `,
};

// ---------------------------------------------------------------------------
// Routage par ancre (#/...)
// ---------------------------------------------------------------------------

// Chaque route : un motif sur l'ancre et un composant. Les groupes capturés arrivent dans params.
const ROUTES = [
  { motif: /^#?\/?$/, vue: ListeTickets },
  { motif: /^#\/tickets\/(\d+)$/, vue: FicheTicket },
  { motif: /^#\/tableau-de-bord$/, vue: TableauDeBord },
];

// Liens de la barre de navigation
const MENU = [
  { href: '#/', label: 'Tickets', icone: 'bi-list-ul' },
  { href: '#/tableau-de-bord', label: 'Tableau de bord', icone: 'bi-speedometer2' },
];

createApp({
  setup() {
    const route = ref(location.hash || '#/');
    const erreur = ref('');
    window.addEventListener('hashchange', () => { route.value = location.hash || '#/'; });

    onMounted(async () => {
      try {
        etat.meta = await api('GET', '/api/meta');
      } catch (e) {
        erreur.value = `API indisponible : ${e.message}`;
      }
    });

    const correspondance = computed(() => {
      for (const r of ROUTES) {
        const m = route.value.match(r.motif);
        if (m) return { vue: r.vue, params: m.slice(1) };
      }
      return { vue: PageIntrouvable, params: [] };
    });

    // « Tickets » (#/) reste actif sur la fiche, mais pas quand une autre entrée du menu correspond.
    function estActif(lien) {
      if (lien.href !== '#/') return route.value.startsWith(lien.href);
      return !MENU.some((l) => l.href !== '#/' && route.value.startsWith(l.href));
    }

    return {
      route,
      erreur,
      estActif,
      menu: MENU,
      meta: computed(() => etat.meta),
      utilisateur: computed(() => etat.meta?.users.find((u) => u.id === 1)),
      vue: computed(() => correspondance.value.vue),
      params: computed(() => correspondance.value.params),
    };
  },
}).mount('#app');
