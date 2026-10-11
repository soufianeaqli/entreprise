# HR Platform — Description Fonctionnelle du Projet

Plateforme SaaS de gestion des ressources humaines, accessible via le web. Le système gère l'ensemble du cycle de vie RH : des recrutements jusqu'à la gestion des employés, en passant par les contrats, les réunions et la finance.

---

## Les trois profils d'utilisateurs

Le système compte trois types d'utilisateurs, chacun avec son propre espace et ses propres permissions :

1. **Super Administrateur** — Accès total à tout le système
2. **Responsable RH** — Gère son département (employés, recrutement, réunions, contrats)
3. **Candidat** — Espace personnel pour postuler aux offres et suivre ses candidatures

---

## Espace Super Administrateur

### Tableau de bord
- Voit un résumé global de l'entreprise : nombre total d'employés, de départements, de recrutements en cours, de candidatures reçues
- Accède rapidement à toutes les sections du système

### Gestion des Responsables RH
- Ajoute, modifie ou supprime des responsables RH
- Voit les informations complètes de chaque RH : matricule, nom, prénom, CIN, téléphone, email, adresse, salaire, type de contrat, date d'embauche
- Peut activer ou désactiver le compte d'un RH
- Peut réinitialiser le mot de passe d'un RH
- Voit la liste des RH qui ne sont pas encore assignés à un département

### Gestion des Départements
- Crée, modifie ou supprime des départements
- Chaque département a un nom, un code, une description, un emplacement, un budget annuel, un nombre d'employés
- Assigne un responsable RH à chaque département
- Un département ne peut avoir qu'un seul responsable RH

### Gestion des Recrutements (Offres d'emploi)
- Crée des offres d'emploi avec toutes les informations : titre, département, type de contrat, mode de travail (présentiel, hybride, télétravail), nombre de postes, niveau d'expérience, niveau d'éducation, salaire, date de publication, date limite
- Peut ajouter une description détaillée, les missions, les compétences requises, les qualifications, les avantages, informations complémentaires
- Publie une offre (visible par les candidats), la met en brouillon, la clôture ou l'archive
- Voit le nombre de candidatures reçues pour chaque offre

### Gestion des Contrats
- Ajoute, modifie ou supprime des contrats de travail
- Chaque contrat contient : nom de l'employé, type (CDI, CDD...), département, dates de début et fin, salaire, statut (actif, brouillon, en attente, expiré, résilié), période d'essai, horaires de travail, jours de congé, avantages, observations
- Peut renouveler un contrat existant
- Génère automatiquement un PDF du contrat
- Peut visualiser, télécharger ou régénérer le PDF

### Gestion des Réunions
- Crée des réunions avec : titre, description, type (régulière, hebdomadaire, mensuelle, spéciale, formation, évaluation), département, date, heure de début et fin, emplacement, lien de visioconférence, priorité (basse, moyenne, haute, urgente)
- Invite des participants (responsables RH)
- Suit le statut : planifiée → en cours → terminée / annulée
- Rédige un compte-rendu : résumé, objectif, points clés, notes
- Enregistre les décisions prises lors de la réunion
- Crée des tâches à assigner aux RH avec date d'échéance et priorité
- Ajoute des pièces jointes
- Voit les prochaines réunions et un calendrier

### Gestion Finance
- Crée des projets avec : nom, client, description, budget, dates de début et fin, responsable, statut (prévu, en cours, terminé, en pause, annulé)
- Ajoute des revenus par projet (montant, date, mode de paiement, référence, description)
- Ajoute des dépenses par projet (catégorie, montant, date, description, reçu)
- Voit le budget restant, le résultat (profit), le taux de rentabilité
- Dashboard financier agrégé

### Analytiques
- Voit des indicateurs de performance (KPIs) sur différentes périodes (7 jours, 30 jours, 3 mois, 6 mois, 12 mois)
- Graphiques des revenus vs dépenses
- Résumé financier global

---

## Espace Responsable RH

### Tableau de bord
- Voit les statistiques de son département : nombre d'employés, offres actives, candidatures reçues, réunions à venir
- Accède rapidement aux sections qui le concernent

### Calendrier
- Voit tous les événements de son département : réunions, entretiens, recrutements
- Consulte les notifications à venir

### Gestion des Employés
- Ajoute, modifie ou supprime des employés dans son département
- Chaque employé a : matricule, nom, prénom, CIN, téléphone, email, adresse, photo, poste, date d'embauche, type de contrat, salaire, statut
- Active ou désactive le compte d'un employé
- Réinitialise le mot de passe d'un employé
- Voit les statistiques des employés de son département

### Documents des Employés
- Téléverse des documents pour chaque employé dans 5 catégories : CV, diplôme, attestation, certificat médical, contrat
- Remplace un document existant par un nouveau
- Supprime un document
- Consulte l'historique des documents (qui a uploadé, quand)
- Voit le nombre de documents par catégorie

### Gestion des Recrutements
- Consulte les offres d'emploi de son département
- Voit la liste des candidats pour chaque offre
- Consulte le profil complet d'un candidat en 3 onglets :
  - **Informations** — données personnelles
  - **Mon CV** — éducation, expérience, compétences, langues, liens
  - **Documents** — CV et lettre de motivation (aperçu en ligne)
- Change le statut d'un candidat selon le pipeline :
  - Nouvelle candidature
  - CV en cours d'analyse
  - Entretien programmé
  - Test technique
  - Entretien final
  - Accepté
  - Refusé
- Planifie un entretien en choisissant la date, l'heure et d'éventuelles notes
- Accepte ou refuse un candidat en un clic
- Voit les statistiques de recrutement (candidatures par statut, taux de conversion)

### Gestion des Réunions
- Mêmes fonctionnalités que l'espace Super Admin, mais limitées à son département
- Voit les réunions auxquelles il participe
- Gère les comptes-rendus, décisions, tâches et pièces jointes

### Gestion des Contrats
- Consulte, crée et gère les contrats des employés de son département
- Mêmes fonctionnalités que l'espace Super Admin (PDF, renouvellement, etc.)

### Profil
- Modifie ses informations personnelles (nom, email)
- Change son mot de passe

---

## Espace Candidat

### Connexion et Inscription
- Les candidats s'inscrivent avec un nom, un email et un mot de passe
- Un espace personnel est automatiquement créé après l'inscription
- Page de connexion dédiée pour les candidats

### Tableau de bord
- Voit un résumé de son activité : nombre de candidatures, statut des candidatures, documents uploadés
- Accède rapidement à toutes les sections

### Mon CV (Profil professionnel)
- Remplit ses informations personnelles : nom, prénom, téléphone, date de naissance, adresse, ville
- Renseigne son niveau d'éducation et son niveau d'expérience
- Ajoute ses compétences
- Ajoute ses langues
- Ajoute ses liens professionnels (LinkedIn, GitHub, portfolio)
- Ces informations sont visibles par le RH lorsqu'il consulte le profil

### Documents
- Téléverse son CV (PDF, JPG, JPEG ou PNG, max 10 Mo)
- Téléverse sa lettre de motivation (même formats)
- Voit un aperçu de ses documents directement dans le navigateur
- Remplace un document existant par un nouveau
- Supprime un document
- Un seul document par catégorie est autorisé (remplacement automatique)

### Offres d'emploi
- Consulte la liste des offres publiées par l'entreprise
- Recherche par mot clé
- Filtre par département, type de contrat, localisation
- Trie par date, pertinence, salaire
- Consulte le détail complet de chaque offre : description, missions, compétences, qualifications, avantages, salaire, type de contrat, mode de travail
- Postule en un clic (le CV televersé est automatiquement joint)

### Mes Candidatures
- Voit la liste de toutes ses candidatures avec le statut en temps réel
- Chaque candidature affiche : le titre de l'offre, le département, la date de candidature, le statut actuel
- Les statuts s'affichent en français avec des couleurs : Nouvelle candidature, CV en cours d'analyse, Entretien programmé, Test technique, Entretien final, Accepté, Refusé

### Historique
- Voit uniquement les candidatures terminées (acceptées ou refusées)
- Consulte le détail et les notes éventuelles du RH

### Calendrier
- Voit un calendrier mensuel
- Les jours où un entretien est prévu affichent un badge « Entretien »
- En cliquant sur un jour, voit les détails de l'entretien : titre, heure, notes, statut
- Voit la liste des prochains entretiens à venir

### Profil
- Modifie son nom et email (informations de connexion)

---

## Fonctionnalités transversales

### Sécurité
- Chaque utilisateur est authentifié par email et mot de passe
- Les tokens d'accès sont gérés automatiquement
- Un compte peut être désactivé par l'administrateur
- Les mots de passe peuvent être réinitialisés par l'administrateur

### Design
- Interface moderne et épurée, style SaaS premium
- Thème clair avec une couleur verte comme identité visuelle
- Interface responsive (accessible sur ordinateur, tablette et mobile)
- Typographie Inter pour une lisibilité optimale

### Navigation
- Chaque profil a sa propre barre latérale avec les sections pertinentes
- Les.icônes visuelles facilitent la navigation
- Menu responsive (rétractable sur mobile)

---

## Résumé des fonctionnalités par section

| Section | Fonctionnalités |
|---|---|
| **Authentification** | Login, inscription candidat, gestion des rôles, activation/désactivation |
| **RH Managers** | CRUD, activation, réinitialisation mot de passe |
| **Départements** | CRUD, assignation RH |
| **Employés** | CRUD, activation, documents, stats |
| **Documents Employés** | Upload, remplacement, suppression, historique, catégories |
| **Recrutement** | Offres CRUD, workflow 4 statuts, pipeline 7 statuts candidatures |
| **Candidatures** | Postuler, suivre le statut, planifier entretien, accepter/refuser |
| **Portail Candidat** | Dashboard, CV, documents, offres, candidatures, historique, calendrier |
| **Contrats** | CRUD, renouvellement, génération PDF |
| **Réunions** | CRUD, compte-rendu, décisions, tâches, pièces jointes, participants |
| **Calendrier** | Événements agrégés, notifications |
| **Finance** | Projets, revenus, dépenses, dashboard |
| **Analytiques** | KPIs, revenus vs dépenses, résumé financier |
