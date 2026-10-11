# HR Platform — Documentation Technique Complète (A → Z)

> Documentation technique détaillée de la plateforme de gestion RH.
> Pour la description fonctionnelle (parcours utilisateurs, écrans), voir `DESCRIPTION_PROJET.md`.

---

## Sommaire

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture générale](#2-architecture-générale)
3. [Stack technique](#3-stack-technique)
4. [Backend Laravel](#4-backend-laravel)
5. [Base de données (schéma)](#5-base-de-données-schéma)
6. [Authentification & rôles](#6-authentification--rôles)
7. [API REST (routes)](#7-api-rest-routes)
8. [Services métier](#8-services-métier)
9. [Sous-système IA](#9-sous-système-ia)
10. [Frontend React](#10-frontend-react)
11. [Design & thème](#11-design--thème)
12. [Installation & lancement](#12-installation--lancement)
13. [Comptes de démonstration](#13-comptes-de-démonstration)
14. [Points d'attention / dette technique](#14-points-dattention--dette-technique)

---

## 1. Vue d'ensemble

**HR Platform** est une application web SaaS de gestion des ressources humaines couvrant l'intégralité du cycle de vie RH :

- Recrutement (offres d'emploi, candidatures, pipeline, entretiens)
- Gestion des employés et de leurs documents
- Contrats de travail (avec génération PDF)
- Réunions (comptes-rendus, décisions, tâches, pièces jointes)
- Finance (projets, revenus, dépenses)
- Analytiques / KPIs
- Portail candidat (CV, documents, candidatures, calendrier)
- Assistant IA (chat, suggestions de formulaires, insights automatiques, base de connaissances)

L'application est séparée en deux projets indépendants :

```
entreprise/
├── backend/              # API Laravel 12 (PHP 8.2)
├── frontend/             # SPA React 19 + Vite 8
├── DESCRIPTION_PROJET.md         # Doc fonctionnelle
└── DOCUMENTATION_TECHNIQUE.md    # Ce fichier
```

**Communication** : le frontend consomme l'API REST sous `/api/v1` (Bearer token Sanctum).

---

## 2. Architecture générale

```
┌──────────────────────────┐        HTTP / JSON        ┌──────────────────────────┐
│   Frontend (SPA React)   │ ────────────────────────► │   Backend (API Laravel)  │
│   Vite dev server :3000  │  Authorization: Bearer    │   php artisan serve :8000│
│                          │ ◄──────────────────────── │                          │
│  BrowserRouter           │                           │  routes/api.php          │
│  AuthContext (token)     │                           │  Middlewares (role,      │
│  services/api.ts (fetch) │                           │   department, throttle)  │
└──────────────────────────┘                           │  Controllers → Services  │
                                                        │  Models (Eloquent)       │
                                                        │  MySQL + Sanctum         │
                                                        │  DomPDF · Groq/Gemini    │
                                                        └──────────────────────────┘
```

- Le frontend proxifie `/api` **et** `/storage` vers `http://localhost:8000` (voir `frontend/vite.config.ts`).
- Auth sans état par **token Bearer** stocké dans `localStorage` (`auth_token`).
- Les contrôleurs délèguent la logique aux **Services** ; les modèles sont de type Eloquent.

---

## 3. Stack technique

### Backend

| Élément | Version / Choix |
|---|---|
| PHP | `^8.2` |
| Framework | Laravel `^12.0` |
| Auth API | Laravel Sanctum `^4.0` |
| PDF | `barryvdh/laravel-dompdf` |
| REPL | `laravel/tinker` |
| Tests | PHPUnit `^11.5`, Faker, Mockery |
| Lint PHP | Laravel Pint |
| Base de données | MySQL (SQLite par défaut en config, mais migrations MySQL-only) |

### Frontend

| Élément | Version / Choix |
|---|---|
| React | `^19.2` |
| Build | Vite `^8.1` + `@vitejs/plugin-react` |
| Routing | React Router DOM `^7.18` |
| Styling | Tailwind CSS `^4.3` (plugin Vite officiel) |
| Icônes | `lucide-react` |
| Graphiques | `recharts` |
| Classes | `clsx` + `tailwind-merge` |
| Lint | `oxlint` |
| TypeScript | `~6.0` |

**Absences notables (choix volontaire, pas de dépendance externe)** : pas de store global (Redux/Zustand) → React Context ; pas de lib de data-fetching (React Query) → wrapper `fetch` maison ; pas de lib de formulaires → état local ; pas de bibliothèque UI → composants maison.

---

## 4. Backend Laravel

### 4.1 Arborescence clé

```
backend/
├── app/
│   ├── AI/                 # Sous-système IA (orchestrateur, outils, insights, KB)
│   ├── Console/Commands/   # ai:insights-analyze
│   ├── Http/
│   │   ├── Controllers/Api/   # Tous les contrôleurs REST
│   │   ├── Middleware/        # RoleMiddleware, CheckDepartmentMiddleware
│   │   ├── Requests/          # 18 Form Requests (validation)
│   │   └── Resources/         # 13 API Resources (transformation JSON)
│   ├── Models/             # 22 modèles Eloquent
│   ├── Providers/          # AppServiceProvider, AIServiceProvider
│   └── Services/           # 14 services métier
├── bootstrap/app.php       # Config middleware & exceptions
├── config/                 # auth, sanctum, cors, ai, database...
├── database/
│   ├── migrations/         # 38 migrations
│   ├── seeders/            # DatabaseSeeder, KnowledgeBaseSeeder
│   └── factories/
├── routes/
│   ├── api.php             # Toutes les routes API
│   ├── web.php             # Accueil
│   └── console.php         # Planification (insights horaires)
└── composer.json
```

### 4.2 Middlewares (`bootstrap/app.php`)

| Alias | Classe | Rôle |
|---|---|---|
| `role` | `RoleMiddleware` | Accepte `role:a,b` ; 401 si non authentifié, 403 si rôle non autorisé |
| `department` | `CheckDepartmentMiddleware` | `super_admin` passe ; RH doit avoir un `rhManager` + département, sinon 403 ; injecte `rh_department_id`, `rh_manager_id`, `rh_department_name` dans la requête |
| `throttle:ai` | Limiteur (`AppServiceProvider`) | `Limit::perMinute(config('ai.rate_limit_per_minute', 30))` par utilisateur/IP |

### 4.3 Modèles Eloquent (22)

| Modèle | Table | Relations principales |
|---|---|---|
| `User` | users | hasOne RhManager, CandidateProfile, hasMany CandidateDocument, CandidateApplication |
| `RhManager` | rh_managers | hasOne Department, Contract ; accessor `full_name` |
| `Department` | departments | belongsTo RhManager |
| `Recruitment` | recruitments | belongsTo Department, RhManager ; hasMany Candidate |
| `Annonce` | annonces | standalone (module legacy) |
| `Contract` | contracts | belongsTo RhManager |
| `FinancialData` | financial_data | standalone |
| `Meeting` | meetings | belongsTo Department, RhManager ; belongsToMany RhManager (participants) ; hasMany Decision/Task/Attachment |
| `MeetingTask` / `MeetingDecision` / `MeetingAttachment` | — | belongsTo Meeting |
| `Project` | projects | hasMany Income/Expense ; accessors `total_incomes`, `total_expenses`, `result`, `remaining_budget`, `profitability_rate` |
| `ProjectIncome` / `ProjectExpense` | — | belongsTo Project |
| `Employee` | employees | belongsTo Department ; hasOne User (par email), Contract (par email) ; hasMany EmployeeDocument ; accessor `full_name` |
| `EmployeeDocument` | employee_documents | belongsTo Employee, User |
| `Candidate` | candidates | belongsTo Recruitment/Department/User ; hasOneThrough Profile, hasManyThrough Document ; accessors `full_name`, `status_label` |
| `CandidateProfile` | candidate_profiles | belongsTo User |
| `CandidateDocument` | candidate_documents | belongsTo User |
| `CandidateApplication` | candidate_applications | belongsTo User/Recruitment/Department |
| `Notification` | notifications | belongsTo User ; accessor `time_ago` |
| `AIExecution` | ai_executions | belongsTo User |
| `AIInsight` | ai_insights | scopes `new`, `active` ; `acknowledge()`, `dismiss()` |
| `KnowledgeBase` / `KnowledgeDocument` / `KnowledgeUsageLog` | — | KB → hasMany Documents ; `isAccessibleBy(role)`, `incrementUsage()` |

> **Particularité** : le lien `Employee ↔ User` et `Contract ↔ Employee` se fait **par email** (chaîne de caractères), pas par clé étrangère.

---

## 5. Base de données (schéma)

38 migrations. Tables principales par domaine :

### Auth / système
- `users` (name, email unique, password, role, avatar, is_active)
- `password_reset_tokens`, `sessions`, `cache`, `jobs`, `failed_jobs`
- `personal_access_tokens` (Sanctum)

### RH / organisation
- `rh_managers` : matricule, prénom/nom, genre, naissance, CIN, téléphone, email, adresse, photo, date embauche, type contrat, salaire, statut, mot de passe
- `departments` : nom/code uniques, description, `rh_manager_id` (nullable, unique), localisation, budget annuel, nombre employés, statut
- `employees` : matricule, identité, département (FK), poste, date embauche, contrat, salaire, statut
- `employee_documents` : employé, catégorie (cv/diploma/attestation/medical/contract), fichier, uploader

### Recrutement
- `recruitments` : titre, département, RH, type contrat, `work_mode` (presentiel/hybride/teletravail), nb postes, expérience, éducation, salaire, dates, `status` (draft/published/closed/archived), description/missions/skills/qualifications/benefits
- `candidates` : identité, `recruitment_id`, `department_id`, CV, `status` (pipeline 7 étapes), notes, entretien
- `candidate_profiles` : profil pro du candidat (éducation, expérience, compétences, langues, liens)
- `candidate_documents` : CV / lettre de motivation
- `candidate_applications` : candidature (user + recruitment, statut, notes, unique user+recruitment)

### Contrats
- `contracts` : RH, nom employé, type, département, dates, salaire, `status` (active/draft/pending/expired/terminated), période d'essai, horaires, congés, avantages, `pdf_path`

### Réunions
- `meetings` : titre, type, département, RH, date/heures, lieu, lien visio, priorité, statut, minutes (résumé/objectif/points/notes)
- `meeting_participants` : meeting + RH + statut (invited/accepted/declined/tentative)
- `meeting_decisions`, `meeting_tasks`, `meeting_attachments`

### Finance
- `projects` : nom, client, budget, dates, responsable, statut
- `project_incomes` : montant, date, mode paiement, référence
- `project_expenses` : catégorie, montant, date, reçu
- `financial_data` : mois, revenue, expenses

### Notifications / IA
- `notifications` : user, rôle, titre, message, type, lien, lu
- `ai_executions` : question, plan/result/tools (JSON), statut, durée
- `ai_insights` : règle, titre, sévérité, catégorie, actions/metadata, statut
- `knowledge_bases` / `knowledge_documents` (index FULLTEXT) / `knowledge_usage_logs`

> **Important** : la config par défaut pointe sur SQLite, mais certaines migrations utilisent du SQL MySQL (`MODIFY COLUMN ... ENUM`, `MATCH ... AGAINST`) → **la production doit être sous MySQL**.

---

## 6. Authentification & rôles

### 6.1 Mécanisme

- **Sanctum** avec tokens Bearer. Le guard par défaut est `web` (session), les tokens sont validés par `auth:sanctum`.
- À la connexion, un token est créé avec un nom selon le rôle : `super-admin-token`, `rh-token`, `candidate-token`.
- **Pas d'expiration** des tokens (`sanctum.expiration => null`).
- Domaines *stateful* : `localhost`, `localhost:3000`, `127.0.0.1`.

### 6.2 Les trois rôles

| Rôle | Valeur `users.role` | Accès |
|---|---|---|
| Super Administrateur | `super_admin` | Totalité du système |
| Responsable RH | `rh` | Périmètre de son département uniquement |
| Candidat | `candidate` | Portail personnel |

> Un quatrième rôle `employee` existe dans les services (création d'utilisateur pour un employé) mais **n'a ni route ni page de connexion**.

### 6.3 Autorisation

- **Aucun répertoire `Policies`**, aucune Gate : l'autorisation est **basée sur la chaîne de rôle**.
- Enforcée à 3 niveaux :
  1. Middleware de route `role:...`
  2. Middleware `department` (cloisonnement RH)
  3. Vérifications inline dans les contrôleurs (propriété des ressources : portail candidat, documents, exécutions IA)
- La base de connaissances a un contrôle d'accès supplémentaire via la colonne `knowledge_documents.access_role` + `isAccessibleBy($role)`.

### 6.4 CORS

`config/cors.php` : origins autorisées `['http://localhost:3000']`, credentials activés, méthodes/headers `*`.

---

## 7. API REST (routes)

Préfixe global : **`/api/v1`**. Toutes les routes sauf `login`/`register` sont protégées par `auth:sanctum`.

### Auth
| Méthode | URL | Contrôleur |
|---|---|---|
| POST | `auth/login`, `auth/register` | public |
| GET | `auth/me` | AuthController@me |
| PUT | `auth/profile` | updateProfile |
| POST | `auth/avatar` | updateAvatar |
| PUT | `auth/password` | updatePassword |
| POST | `auth/logout` | logout |
| POST | `auth/users/{userId}/reset-password` | *(super_admin)* |
| PATCH | `auth/users/{userId}/toggle-status` | *(super_admin)* |

### Notifications
`GET notifications` · `notifications/unread-count` · `notifications/recent` · `PATCH notifications/{id}/read` · `notifications/read-all` · `DELETE notifications/{id}`

### IA
`POST ai/chat` · `GET ai/tools` · `GET ai/executions[/{id}]` · `POST ai/form-suggestions`
Insights : `GET/POST ai-insights/*` (index, show, analyze, acknowledge, dismiss, health-score, stats)
Knowledge Base *(super_admin)* : CRUD + `stats`, `search`, documents imbriqués

### Dashboards
- `GET rh-dashboard` *(rh, super_admin)*

### RH Managers & Départements *(super_admin)*
- `rh-managers` (apiResource) + `rh-managers/available` + `PATCH .../toggle-status`
- `departments` (apiResource) + `departments/available`

### Groupe "département" (middleware `department` — RH ou super_admin)
- **Recrutements** : `recruitments` (CRUD) + `stats` + `publish/draft/close/archive`
- **Candidats** : `recruitment/announcements[/{id}]`, `recruitment/{id}/candidates`, `recruitment/candidates/{id}`, `.../full-profile`, `recruitment/stats`, `PATCH recruitment/candidates/{c}/status`
- **Employés** : `employees` (CRUD) + `stats` + `toggle-status` + `reset-password`
- **Documents employés** : `employees/{e}/documents` (+ `history`, `counts`), `employee-documents/{d}` (+ `replace`)
- **Contrats** : `contracts` (CRUD) + `renew`, `pdf`, `pdf/download`, `pdf/regenerate`
- **Réunions** : `meetings` (CRUD) + `stats/upcoming/calendar/status/minutes` + sous-routes décisions/tâches/pièces jointes
- **Calendrier** : `calendar/events`, `calendar/notifications`

### Finance *(super_admin)*
`finance/dashboard`, projets CRUD, `incomes`, `expenses`

### Analytiques *(super_admin)*
`analytics/`, `analytics/kpis`, `analytics/revenue-expenses`, `analytics/financial`

### Portail Candidat *(role:candidate)*
`candidate/dashboard`, `profile` (get/update), `documents` (CRUD + download/replace), `announcements[/{id}]` (+ apply), `applications` + `history`, `calendar`

---

## 8. Services métier (14)

| Service | Responsabilité |
|---|---|
| `RhManagerService` | Création RH + User lié (rôle `rh`) + contrat auto + assignation département ; matricule `RH-####` ; toggleStatus synchronise le user |
| `EmployeeService` | Employé + User (rôle `employee`, mdp `employee123`) + contrat ; matricule `EMP####` |
| `DepartmentService` | CRUD + RH disponibles |
| `RecruitmentService` | CRUD, assignation RH auto, statuts, stats |
| `CandidateService` | Offres/candidats filtrés par département, `updateStatus`, stats 7 étapes |
| `ContractService` | Génération PDF (vue `contracts.pdf`), `ensurePdfExists`, `getPdfUrl` |
| `MeetingService` | CRUD + participants, décisions/tâches/pj, stats, calendrier |
| `FinanceService` | Projets + revenus/dépenses + dashboard |
| `CalendarService` | Agrège entretiens, réunions, expirations de contrats + notifications |
| `AnalyticsService` | KPIs, revenus vs dépenses, croissance, distributions (périodes 7j/30j/3m/6m/12m) |
| `NotificationService` | Création/envoi/liste/marquage notifications |
| `EmployeeDocumentService` | Upload/remplacement/suppression (pdf/jpg/png, max 10 Mo), historique |
| `ReportsService` | 5 catégories de rapports (utilisé par un contrôleur non routé) |

---

## 9. Sous-système IA

Dossier `backend/app/AI/`, branché via `AIServiceProvider`.

- **`AIOrchestrator`** : pipeline de chat → contexte → prompt système → boucle de *tool calling* en lecture seule (max 5 itérations) → journalisation dans `ai_executions`. **Ne modifie jamais les données.**
- **Client LLM** : `Groq/GroqClient.php` (API compatible OpenAI). Provider configurable via `config/ai.php` (`AI_PROVIDER`) : `groq` (llama-3.3-70b-versatile) ou `gemini` (gemini-2.0-flash).
- **Composants** : `Context/ContextBuilder`, `Memory/ConversationMemory`, `Planner`, `Executor`, `Actions/ActionRegistry`, `Workflow`, `Skills`.
- **Insights** : `Insights/InsightEngine` + 6 analyseurs (`Employee`, `Contract`, `Budget`, `Recruitment`, `Meeting`, `Rh`) + `HealthScoreCalculator`.
- **Knowledge Base** : recherche FULLTEXT MySQL (+ fallback LIKE).
- **Outils** : ~40 classes existent, mais **seulement 5 outils en lecture seule sont enregistrés** (`SearchEmployeesTool`, `GetDepartmentsTool`, `GetCandidatesCountTool`, `GetContractsTool`, `GetMeetingsTodayTool`).
- **Commande planifiée** : `ai:insights-analyze` — **horaire** (voir `routes/console.php`) ; notifie les super admins des insights critiques.

---

## 10. Frontend React

### 10.1 Structure

```
frontend/src/
├── App.tsx                 # Routes + guards + providers
├── main.tsx                # Point d'entrée (StrictMode)
├── index.css               # Thème Tailwind v4 + styles globaux
├── components/
│   ├── ai/                 # FormAssistantPanel
│   ├── layout/             # AdminLayout, RHLayout, CandidateLayout, Sidebar, Navbar, NotificationBell
│   └── ui/                 # Bibliothèque UI maison
├── contexts/               # AuthContext, NotificationContext
├── hooks/                  # useFormAssistant
├── pages/                  # Pages par domaine
├── services/api.ts         # Client API central (types + endpoints)
└── utils/cn.ts             # twMerge(clsx(...))
```

### 10.2 Providers & guards

Arbre : `BrowserRouter → AuthProvider → NotificationProvider → AppRoutes`.

Guards définis **inline dans `App.tsx`** :
- `GuestRoute` : redirige un utilisateur connecté selon son rôle.
- `AdminRoute` : `role === 'super_admin'`.
- `RhRoute` : `role === 'rh'`.
- `CandidateRoute` : `role === 'candidate'`.

### 10.3 Routes par espace

**Public** : `/login`, `/candidate/login`, `/candidate/register`

**Super Admin** (`AdminRoute` + `AdminLayout`) : `/dashboard`, `/rh`, `/rh/:id`, `/departments[/:id]`, `/contracts`, `/meetings[/:id]`, `/finance[/:id]`, `/recruitments[/:id]`, `/analytics`, `/notifications`, `/ai-assistant`, `/profile`

**RH** (`RhRoute` + `RHLayout`) : `/rh-dashboard`, `/rh/calendar`, `/rh/employees[/:id]`, `/rh/recruitment[/:id]`, `/rh/meetings`, `/rh/contracts`, `/notifications`, `/rh/profile`

**Candidat** (`CandidateRoute` + `CandidateLayout`) : `/candidate/dashboard`, `/candidate/profile`, `/candidate/announcements[/:id]`, `/candidate/applications`, `/candidate/calendar`, `/candidate/history`, `/candidate/documents`, `/candidate/cv`, `/notifications`

### 10.4 `AuthContext`

- Token dans `localStorage` (`auth_token`), restauration via `api.auth.me()` au démarrage.
- Expose `user`, `loading`, `rhManager`, `candidateProfile`.
- Méthodes : `login`, `register`, `logout`, `updateUser`, `updateCandidateProfile`.

### 10.5 `services/api.ts` (958 lignes)

- `API_BASE = '/api/v1'` (proxifié par Vite).
- Wrapper `request<T>()` sur `fetch` : injecte le Bearer token, gère le `FormData`, **401 → suppression du token + redirection `/login`**, lève `ApiError` (message + erreurs de validation), dé-enveloppe `{ data }`, renvoie `null` sur 204.
- Groupes d'endpoints : `auth`, `analytics`, `rhDashboard`, `rhManagers`, `departments`, `recruitments`, `contracts`, `meetings`, `finance`, `employees` (+ documents), `candidates`, `calendar`, `candidate`, `notifications`, `ai`.
- **Tous les types du domaine sont co-localisés** ici (User, RhManager, Department, Recruitment, Contract, Meeting, Employee, Candidate, Project, Notification, etc.).

### 10.6 `NotificationContext`

- Poll `unreadCount` toutes les **30 s** (`setInterval`), réinitialisé à la déconnexion.

### 10.7 Bibliothèque UI (`components/ui/`)

`Button`, `Card` (+Header/Title/Description), `Badge`, `Input`, `Select`, `Avatar` (+AvatarGroup), `PageHeader`, `Modal`, `DataTable` (+Pagination), `StatCard`.

---

## 11. Design & thème

- **Tailwind CSS v4** en configuration *CSS-first* : **pas de `tailwind.config.js`**. Thème défini dans `src/index.css` via le bloc `@theme`.
- Typographie **Inter** (Google Fonts).
- Palette de marque verte `--color-primary-50..950` (`#22c55e` en 500) + neutres `--color-surface-0..950`.
- Animations personnalisées : `fade-in`, `slide-in-left`, `slide-in-up`, `scale-in`, `float`.
- Interface **en français**, responsive (desktop / tablette / mobile), sidebars rétractables.
- Alias de chemin : `@/*` → `./src/*` (Vite + tsconfig).

---

## 12. Installation & lancement

### Prérequis
- PHP 8.2+, Composer, MySQL, Node.js 18+.

### Backend
```bash
cd backend
composer install
copy .env.example .env       # puis configurer la connexion MySQL
php artisan key:generate
php artisan migrate --seed
php artisan storage:link     # pour les avatars / documents (disk public)
php artisan serve            # http://localhost:8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev                  # http://localhost:3000 (proxy vers :8000)
```

### Scripts utiles
| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de dev Vite (:3000) |
| `npm run build` | `tsc -b && vite build` |
| `npm run lint` | `oxlint` |
| `php artisan migrate --seed` | Migrations + données de démo |
| `php artisan ai:insights-analyze` | Lance l'analyse d'insights IA |

> Le proxy Vite cible `http://localhost:8000`. Si Laravel tourne sur un autre port, ajustez `vite.config.ts`.

---

## 13. Comptes de démonstration

Créés par `DatabaseSeeder` :

| Rôle | Email | Mot de passe |
|---|---|---|
| Super Admin | `admin@company.com` | `admin123456` |
| Responsable RH | `rh@company.com` | `rh123456` |

Un département **Informatique** (`IT`) est créé et assigné au RH. Un jeu de base de connaissances (`hr-platform-kb`) est également seedé.

> Les employés créés via le service ont par défaut le mot de passe `employee123`.

*(Pour se connecter en tant que candidat : créez un compte via `/candidate/register`.)*

---

## 14. Points d'attention / dette technique

1. **`ReportsController` et `AnnonceController` ne sont branchés à aucune route** — code complet mais inaccessible (modules legacy).
2. **Base de données** : config par défaut SQLite mais migrations MySQL-only → forcer MySQL.
3. **Liaisons par email** (`Employee ↔ User`, `Contract ↔ Employee`) plutôt que par clé étrangère — fragile en cas de changement d'email.
4. **Tokens Sanctum sans expiration** (sécurité à considérer pour la production).
5. **Pas de Policies/Gates** : autorisation uniquement par chaîne de rôle + vérifications inline.
6. **~40 outils IA** existent mais seuls **5 outils en lecture seule** sont enregistrés.
7. **Pages orphelines** côté frontend (non référencées dans `App.tsx`) : `CompanyPage`, `AnnoncesPage`, `EmployeesPage`, `ReportsPage` — elles importent des types non exportés par `api.ts` et casseraient un build `tsc` strict.
8. **`/notifications` déclarée 3 fois** (une par layout) — la première correspondance l'emporte.
9. **Duplication de markup** entre `RHLayout` et `CandidateLayout`.
10. **Aucun test automatisé** (seulement les stubs PHPUnit) ni configuration CI.
11. **Bundle frontend volumineux** (~1,1 Mo) — pas de code-splitting (avertissement au build).
12. **Pas de fichier `.env` frontend** : l'URL d'API est en dur (`/api/v1`) + proxy de dev.
