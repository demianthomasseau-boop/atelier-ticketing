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
// creationOuverte : fenêtre « Nouveau ticket » ; version : incrémentée après une création pour recharger l'écran affiché
const etat = reactive({ meta: null, creationOuverte: false, version: 0 });

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

    return { tickets, chargement, erreur, ...outils };
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
              <th>Priorité</th><th>Responsable</th><th>Mis à jour</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in tickets" :key="t.id">
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
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
};

// Charge la liste des tickets (partagée par le tableau de bord et le kanban)
function useTickets() {
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
  return { tickets, chargement, erreur };
}

const TableauDeBord = {
  props: ["params"],
  setup() {
    const { tickets, chargement, erreur } = useTickets();

    // Priorités de la plus haute à la plus basse ; « Aucune » n'apparaît que si des tickets l'utilisent
    const parPriorite = computed(() => {
      const liste = [...(etat.meta?.enums.priority ?? [])].reverse().map((p) => ({
        id: p.id,
        label: p.label,
        nombre: tickets.value.filter((t) => t.priority === p.id).length,
      }));
      return liste.filter((p) => p.id !== 10 || p.nombre > 0);
    });
    const maximum = computed(() => Math.max(1, ...parPriorite.value.map((p) => p.nombre)));

    return { tickets, chargement, erreur, parPriorite, maximum };
  },
  template: `
    <h1 class="h4 mb-3">Tableau de bord</h1>
    <div v-if="erreur" class="alert alert-danger">{{ erreur }}</div>
    <div v-else-if="chargement" class="text-secondary">Chargement…</div>
    <div v-else class="row g-3">
      <div class="col-md-3">
        <div class="card shadow-sm h-100">
          <div class="card-body text-center">
            <div class="text-secondary small mb-1"><i class="bi bi-ticket-detailed me-1"></i>Tickets au total</div>
            <div class="compteur" data-test="total">{{ tickets.length }}</div>
          </div>
        </div>
      </div>
      <div class="col-md-9">
        <div class="card shadow-sm h-100">
          <div class="card-header card-header-mer"><i class="bi bi-bar-chart-fill me-1"></i>Tickets par priorité</div>
          <div class="card-body">
            <div v-for="p in parPriorite" :key="p.id" class="row align-items-center mb-2">
              <div class="col-3 col-md-2 small">{{ p.label }}</div>
              <div class="col">
                <div class="barre-prio" :style="{ width: Math.max(p.nombre ? 4 : 0, p.nombre / maximum * 100) + '%' }">{{ p.nombre || '' }}</div>
                <span v-if="!p.nombre" class="small text-secondary">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
};

const Kanban = {
  props: ["params"],
  setup() {
    const { tickets, chargement, erreur } = useTickets();

    const colonnes = computed(() => (etat.meta?.enums.status ?? []).map((s) => ({
      ...s,
      tickets: tickets.value.filter((t) => t.status === s.id),
    })));

    return { tickets, chargement, erreur, colonnes, ...outils };
  },
  template: `
    <div class="d-flex align-items-center mb-3">
      <h1 class="h4 mb-0">Kanban</h1>
      <span class="badge text-bg-secondary ms-2">{{ tickets.length }}</span>
    </div>
    <div v-if="erreur" class="alert alert-danger">{{ erreur }}</div>
    <div v-else-if="chargement" class="text-secondary">Chargement…</div>
    <div v-else class="kanban">
      <div v-for="c in colonnes" :key="c.id" class="kanban-col">
        <h2 :style="{ borderColor: c.color }">{{ c.label }} <span class="badge text-bg-secondary">{{ c.tickets.length }}</span></h2>
        <a v-for="t in c.tickets" :key="t.id" :href="'#/ticket/' + t.id" class="kanban-carte d-block text-decoration-none text-body">
          <strong>#{{ t.id }}</strong> {{ t.summary }}
          <div class="small mt-1" :class="'priorite-' + t.priority">{{ libelle('priority', t.priority) }}</div>
        </a>
      </div>
    </div>
  `,
};

const FicheTicket = {
  props: ["params"],
  setup(props) {
    const ticket = ref(null);
    const erreur = ref('');

    onMounted(async () => {
      try {
        ticket.value = await api('GET', `/api/tickets/${props.params[0]}`);
      } catch (e) {
        erreur.value = e.message;
      }
    });

    return { ticket, erreur, ...outils };
  },
  template: `
    <div v-if="erreur" class="alert alert-danger">{{ erreur }}</div>
    <div v-else-if="!ticket" class="text-secondary">Chargement…</div>
    <div v-else class="card shadow-sm">
      <div class="card-header card-header-mer d-flex align-items-center">
        <span>#{{ ticket.id }} · {{ ticket.summary }}</span>
        <span class="badge badge-statut ms-auto" :style="{ background: couleurStatut(ticket.status) }">
          {{ libelle('status', ticket.status) }}
        </span>
      </div>
      <div class="card-body">
        <div class="row mb-3 small">
          <div class="col-md-3"><div class="text-secondary">Projet</div>{{ ticket.project }}</div>
          <div class="col-md-3"><div class="text-secondary">Priorité</div><span :class="'priorite-' + ticket.priority">{{ libelle('priority', ticket.priority) }}</span></div>
          <div class="col-md-3"><div class="text-secondary">Responsable</div>{{ ticket.handler || '—' }}</div>
          <div class="col-md-3"><div class="text-secondary">Mis à jour</div>{{ depuis(ticket.last_updated) }}</div>
        </div>
        <div class="text-secondary small">Description</div>
        <p class="mb-3" style="white-space: pre-wrap">{{ ticket.description }}</p>
        <a class="btn btn-sm btn-outline-secondary" href="#/kanban"><i class="bi bi-arrow-left me-1"></i>Retour au kanban</a>
      </div>
    </div>
  `,
};

// Fenêtre de création, ouverte uniquement par l'icône « + » de la barre de navigation
const FormulaireCreation = {
  setup() {
    const champs = reactive({ project_id: '', summary: '', description: '', priority: 30, category_id: '' });
    const erreur = ref('');
    const envoi = ref(false);

    const categories = computed(() => (etat.meta?.categories ?? []).filter((c) => c.project_id === Number(champs.project_id)));

    function fermer() {
      etat.creationOuverte = false;
    }

    async function envoyer() {
      erreur.value = '';
      envoi.value = true;
      // Les champs vides sont omis : l'API renvoie alors son message d'erreur en français
      const corps = { priority: Number(champs.priority), summary: champs.summary, description: champs.description };
      if (champs.project_id !== '') corps.project_id = Number(champs.project_id);
      if (champs.category_id !== '') corps.category_id = Number(champs.category_id);
      try {
        await api('POST', '/api/tickets', corps);
        etat.version++;
        fermer();
        location.hash = '#/';
      } catch (e) {
        erreur.value = e.message;
      } finally {
        envoi.value = false;
      }
    }

    // Changer de projet réinitialise la catégorie, qui dépend du projet
    function changerProjet() {
      champs.category_id = '';
    }

    return { champs, erreur, envoi, categories, fermer, envoyer, changerProjet, meta: computed(() => etat.meta) };
  },
  template: `
    <div class="modal d-block" tabindex="-1" role="dialog" aria-modal="true" @keydown.esc="fermer">
      <div class="modal-dialog modal-lg">
        <form class="modal-content" novalidate @submit.prevent="envoyer">
          <div class="modal-header card-header-mer">
            <h2 class="modal-title h5"><i class="bi bi-plus-circle me-1"></i>Nouveau ticket</h2>
            <button type="button" class="btn-close" aria-label="Fermer" @click="fermer"></button>
          </div>
          <div class="modal-body">
            <div v-if="erreur" class="alert alert-danger py-2 small" role="alert">
              <i class="bi bi-exclamation-circle me-1"></i>{{ erreur }}
            </div>
            <div class="mb-3">
              <label class="form-label" for="champ-projet">Projet <span class="text-danger">*</span></label>
              <select id="champ-projet" class="form-select" v-model="champs.project_id" @change="changerProjet">
                <option value="">— Choisir un projet —</option>
                <option v-for="p in meta.projects" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label" for="champ-resume">Résumé <span class="text-danger">*</span></label>
              <input id="champ-resume" class="form-control" v-model="champs.summary" maxlength="128">
            </div>
            <div class="mb-3">
              <label class="form-label" for="champ-description">Description <span class="text-danger">*</span></label>
              <textarea id="champ-description" class="form-control" rows="4" v-model="champs.description"></textarea>
            </div>
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label" for="champ-priorite">Priorité</label>
                <select id="champ-priorite" class="form-select" v-model="champs.priority">
                  <option v-for="p in meta.enums.priority.filter((e) => e.id !== 10)" :key="p.id" :value="p.id">{{ p.label }}</option>
                </select>
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label" for="champ-categorie">Catégorie</label>
                <select id="champ-categorie" class="form-select" v-model="champs.category_id" :disabled="!categories.length">
                  <option value="">— Aucune —</option>
                  <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" @click="fermer">Annuler</button>
            <button type="submit" class="btn btn-mer" :disabled="envoi"><i class="bi bi-send me-1"></i>Créer le ticket</button>
          </div>
        </form>
      </div>
    </div>
    <div class="modal-backdrop show"></div>
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
  { motif: /^#\/tableau-de-bord$/, vue: TableauDeBord },
  { motif: /^#\/kanban$/, vue: Kanban },
  { motif: /^#\/ticket\/(\d+)$/, vue: FicheTicket },
];

// Liens de la barre de navigation
const MENU = [
  { href: '#/tableau-de-bord', label: 'Tableau de bord', icone: 'bi-speedometer2' },
  { href: '#/kanban', label: 'Kanban', icone: 'bi-kanban' },
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
      creationOuverte: computed(() => etat.creationOuverte),
      version: computed(() => etat.version),
      ouvrirCreation: () => { etat.creationOuverte = true; },
      vue: computed(() => correspondance.value.vue),
      params: computed(() => correspondance.value.params),
    };
  },
}).component('formulaire-creation', FormulaireCreation).mount('#app');
