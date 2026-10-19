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

    async function charger() {
      try {
        ticket.value = await api('GET', `/api/tickets/${props.params[0]}`);
      } catch (e) {
        erreur.value = e.message;
      }
    }

    // La validation (note vide, longueur) est faite par l'API : on affiche son message.
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

    return { ticket, erreur, note, erreurNote, envoiNote, ajouterNote, ...outils };
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
                <dt class="col-5 fw-normal text-secondary">Responsable</dt>
                <dd class="col-7">{{ ticket.handler || '—' }}</dd>
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
];

// Liens de la barre de navigation
const MENU = [
  { href: '#/', label: 'Tickets', icone: 'bi-list-ul' },
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

    return {
      route,
      erreur,
      menu: MENU,
      meta: computed(() => etat.meta),
      utilisateur: computed(() => etat.meta?.users.find((u) => u.id === 1)),
      vue: computed(() => correspondance.value.vue),
      params: computed(() => correspondance.value.params),
    };
  },
}).mount('#app');
