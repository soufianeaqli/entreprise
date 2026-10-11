<?php

namespace Database\Seeders;

use App\Models\KnowledgeBase;
use App\Models\KnowledgeDocument;
use Illuminate\Database\Seeder;

class KnowledgeBaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Main Knowledge Base ─────────────────────────────────────────
        $kb = KnowledgeBase::create([
            'name' => 'Base de connaissances HR Platform',
            'slug' => 'hr-platform-kb',
            'description' => 'Documentation complète de l\'application HR Platform, règles de l\'entreprise, procédures et FAQ.',
            'status' => 'active',
        ]);

        // ── Company Info ────────────────────────────────────────────────
        $kb->documents()->create([
            'title' => 'Présentation de l\'entreprise',
            'content' => 'HR Platform est une plateforme SaaS de gestion des ressources humaines conçue pour les entreprises modernes. Elle offre une solution intégrée pour gérer les employés, les contrats, les recrutements, les réunions, les documents, les budgets et les analytics. La plateforme s\'adresse aux Super Admins, Responsables RH et Candidats avec des espaces dédiés pour chaque rôle.',
            'category' => 'company',
            'tags' => ['présentation', 'entreprise', 'overview'],
            'access_role' => 'all',
            'status' => 'active',
        ]);

        $kb->documents()->create([
            'title' => 'Valeurs et mission',
            'content' => 'Notre mission est de simplifier la gestion des ressources humaines grâce à la technologie. Nos valeurs incluent : l\'innovation continue, la confidentialité des données, l\'accessibilité pour tous les utilisateurs, et l\'excellence dans le service. Nous croyons que la gestion RH efficace est la clé de la réussite de toute entreprise.',
            'category' => 'company',
            'tags' => ['valeurs', 'mission', 'vision'],
            'access_role' => 'all',
            'status' => 'active',
        ]);

        // ── Internal Regulations ────────────────────────────────────────
        $kb->documents()->create([
            'title' => 'Horaires de travail',
            'content' => 'Les horaires de travail standard sont de 8h30 à 17h30, du lundi au vendredi. La pause déjeuner est de 12h00 à 13h00. Le travail à distance est possible selon la politique de l\'entreprise. Les heures supplémentaires doivent être préalablement autorisées par le responsable hiérarchique. Le pointage est obligatoire pour tous les employés.',
            'category' => 'regulations',
            'tags' => ['horaires', 'travail', 'planning'],
            'access_role' => 'all',
            'status' => 'active',
        ]);

        $kb->documents()->create([
            'title' => 'Politique de congés',
            'content' => 'Chaque employé a droit à 22 jours de congés payés par an. Les demandes de congés doivent être soumises au moins 2 semaines à l\'avance via le module Congés. Les congés maladie nécessitent un certificat médical. Le solde de congés est consultable dans l\'espace personnel. Les jours fériés sont au nombre de 12 par an. Les reports de congés sont possibles jusqu\'au 31 mars de l\'année suivante.',
            'category' => 'regulations',
            'tags' => ['congés', 'absence', 'politique'],
            'access_role' => 'all',
            'status' => 'active',
        ]);

        $kb->documents()->create([
            'title' => 'Politique RH et confidentialité',
            'content' => 'La politique RH de l\'entreprise garantit l\'égalité de traitement, la non-discrimination et le respect de la vie privée. Les données personnelles des employés sont confidentielles et ne peuvent être partagées qu\'avec les personnes autorisées. Le règlement intérieur est accessible à tous les employés. Les procédures disciplinaires suivent un processus en 3 étapes : avertissement, blâme, licenciement. Les entretiens annuels d\'évaluation sont obligatoires.',
            'category' => 'regulations',
            'tags' => ['RH', 'confidentialité', 'règlement'],
            'access_role' => 'super_admin',
            'status' => 'active',
        ]);

        // ── Application Documentation ───────────────────────────────────
        $kb->documents()->create([
            'title' => 'Fonctionnement du recrutement',
            'content' => 'Le module Recrutement fonctionne en 4 étapes : 1) Création d\'une annonce (draft) avec titre, département, type de contrat, salaire, description, compétences requises. 2) Publication de l\'annonce (status → published). 3) Réception et gestion des candidatures via un pipeline en 7 étapes : new → cv_review → interview_scheduled → technical_test → final_interview → accepted → rejected. 4) Fermeture ou archivage de l\'annonce. Les RH gèrent les candidatures de leur département. Le Super Admin gère toutes les annonces.',
            'category' => 'app_usage',
            'tags' => ['recrutement', 'annonce', 'candidature', 'pipeline'],
            'access_role' => 'all',
            'status' => 'active',
        ]);

        $kb->documents()->create([
            'title' => 'Fonctionnement des contrats',
            'content' => 'Le module Contrats permet de créer, gérer et suivre les contrats de travail. Types disponibles : CDI, CDD, Stage. Chaque contrat contient : employee_name (email de l\'employé), type, département, dates, salaire, statut (active/draft/pending/expired/terminated). Le renouvellement crée un nouveau contrat basé sur l\'existant. La génération PDF est disponible pour chaque contrat. Les contrats expirés sont automatiquement détectés par le système d\'alertes.',
            'category' => 'app_usage',
            'tags' => ['contrats', 'CDI', 'CDD', 'stage', 'renouvellement'],
            'access_role' => 'all',
            'status' => 'active',
        ]);

        $kb->documents()->create([
            'title' => 'Fonctionnement des réunions',
            'content' => 'Le module Réunions permet de planifier et gérer les réunions d\'équipe. Fonctionnalités : création avec type (regular/weekly/monthly/special/training/evaluation), priorité (low/medium/high/urgent), participants, lieu, lien de visio. Après la réunions, le compte-rendu est ajouté avec : résumé, objectifs, points clés, notes. Les décisions et tâches sont enregistrées séparément. Les pièces jointes sont gérées. Le statut suit le flux : scheduled → in_progress → completed/cancelled.',
            'category' => 'app_usage',
            'tags' => ['réunions', 'compte-rendu', 'décisions', 'tâches'],
            'access_role' => 'all',
            'status' => 'active',
        ]);

        $kb->documents()->create([
            'title' => 'Fonctionnement des employés et documents',
            'content' => 'Le module Employés gère les informations de chaque employé : matricule unique, nom, prénom, email, téléphone, département, poste, salaire, type de contrat, statut (actif/inactif). Chaque employé a un dossier de documents contenant : CV, diplôme, attestation, certificat médical, contrat signé. Les documents sont uploadés en PDF. Le système de notifications alerte en cas de document manquant ou expiré. La recherche et les filtres permettent de trouver rapidement un employé.',
            'category' => 'app_usage',
            'tags' => ['employés', 'documents', 'dossier', 'matricule'],
            'access_role' => 'all',
            'status' => 'active',
        ]);

        $kb->documents()->create([
            'title' => 'Fonctionnement du calendrier et notifications',
            'content' => 'Le Calendrier agrège tous les événements : entretiens, réunions, contrats, périodes d\'essai. Il est consultable par tous les rôles. Le système de Notifications envoie automatiquement des alertes pour : contrats expirant, candidatures en attente, réunions à venir, documents manquants. Les notifications sont lues/non lues et archivables. Le polling toutes les 30 secondes maintient le compteur de notifications non lues à jour.',
            'category' => 'app_usage',
            'tags' => ['calendrier', 'notifications', 'alertes'],
            'access_role' => 'all',
            'status' => 'active',
        ]);

        $kb->documents()->create([
            'title' => 'Fonctionnement des budgets et finances',
            'content' => 'Le module Finance gère les projets avec budget, revenus et dépenses. Chaque projet a : nom, client, budget initial, dates, statut (planned/in_progress/completed/on_hold/cancelled). Les revenus et dépenses sont enregistrés avec montant, date, méthode de paiement. Le système calcule automatiquement : résultat (revenus - dépenses), rentabilité, budget restant. Les alertes détectent les dépassements budgétaires. Le Super Admin a un accès complet au module Finance.',
            'category' => 'app_usage',
            'tags' => ['budget', 'finance', 'projets', 'revenus', 'dépenses'],
            'access_role' => 'super_admin',
            'status' => 'active',
        ]);

        $kb->documents()->create([
            'title' => 'Rôles et permissions',
            'content' => 'L\'application 3 rôles : 1) Super Admin : accès total à tous les modules, gestion des RH, départements, finances, analytics. 2) RH Manager : accès scope département - employés, candidatures, contrats, réunions de son département. 3) Candidat : espace personnel - profil, CV, documents, candidatures, calendrier d\'entretiens. Le contrôle des permissions est vérifié côté serveur via middleware. Les données sont filtrées par rôle.',
            'category' => 'app_usage',
            'tags' => ['rôles', 'permissions', 'super_admin', 'RH', 'candidat'],
            'access_role' => 'all',
            'status' => 'active',
        ]);

        $kb->documents()->create([
            'title' => 'Fonctionnement du système d\'IA',
            'content' => 'L\'Assistant IA est un agent intelligent qui répond aux questions en se basant sur les données réelles de l\'application et la base de connaissances. Il utilise OpenAI pour générer des réponses contextuelles. L\'IA peut : consulter les données via des outils (employés, contrats, candidatures, réunions), créer des plans d\'exécution multi-étapes, demander confirmation pour les actions sensibles. Le système d\'AI Insights analyse automatiquement les données et génère des recommandations proactives.',
            'category' => 'app_usage',
            'tags' => ['IA', 'assistant', 'outils', 'planification'],
            'access_role' => 'all',
            'status' => 'active',
        ]);

        // ── FAQ ─────────────────────────────────────────────────────────
        $kb->documents()->create([
            'title' => 'FAQ : Comment créer un RH ?',
            'content' => 'Pour créer un nouveau Responsable RH : 1) Allez dans la section "RH Management". 2) Cliquez sur "Ajouter un RH". 3) Remplissez les informations : prénom, nom, email, téléphone, département assigné, type de contrat, salaire. 4) Le matricule est généré automatiquement. 5) Créez un compte utilisateur avec un mot de passe initial. 6) Le RH peut ensuite se connecter et accéder à son espace département.',
            'category' => 'faq',
            'tags' => ['FAQ', 'RH', 'création', 'ajout'],
            'access_role' => 'super_admin',
            'status' => 'active',
        ]);

        $kb->documents()->create([
            'title' => 'FAQ : Comment publier une annonce ?',
            'content' => 'Pour publier une annonce de recrutement : 1) Allez dans "Recrutement". 2) Cliquez sur "Nouvelle annonce". 3) Remplissez : titre, département, type de contrat, localisation, nombre de postes, description, missions, compétences requises. 4) L\'annonce est créée en brouillon (draft). 5) Cliquez sur "Publier" pour la rendre visible aux candidats. 6) Les candidatures arrivent automatiquement dans le pipeline.',
            'category' => 'faq',
            'tags' => ['FAQ', 'recrutement', 'annonce', 'publication'],
            'access_role' => 'super_admin',
            'status' => 'active',
        ]);

        $kb->documents()->create([
            'title' => 'FAQ : Comment renouveler un contrat ?',
            'content' => 'Pour renouveler un contrat : 1) Allez dans "Contrats". 2) Trouvez le contrat à renouveler. 3) Cliquez sur l\'icône "Renouveler". 4) Le système crée une copie du contrat avec de nouvelles dates. 5) Vérifiez et modifiez les informations si nécessaire. 6) Enregistrez. Le contrat d\'origine reste accessible dans l\'historique.',
            'category' => 'faq',
            'tags' => ['FAQ', 'contrat', 'renouvellement'],
            'access_role' => 'all',
            'status' => 'active',
        ]);

        $kb->documents()->create([
            'title' => 'FAQ : Comment programmer une réunion ?',
            'content' => 'Pour programmer une réunion : 1) Allez dans "Réunions". 2) Cliquez sur "Nouvelle réunion". 3) Remplissez : titre, type, date, heure de début/fin, lieu, priorité. 4) Sélectionnez les participants (RH Managers). 5) Ajoutez une description si besoin. 6) Enregistrez. Les participants seront notifiés. Le lien de visio peut être ajouté pour les réunions à distance.',
            'category' => 'faq',
            'tags' => ['FAQ', 'réunion', 'planification'],
            'access_role' => 'all',
            'status' => 'active',
        ]);

        $kb->documents()->create([
            'title' => 'FAQ : Comment utiliser l\'Assistant IA ?',
            'content' => 'L\'Assistant IA est accessible via le menu "AI Assistant". Vous pouvez : poser des questions sur les données (ex: "Combien d\'employés avons-nous ?"), demander des actions (ex: "Montre les contrats expirant"), obtenir des analyses (ex: "Quel est l\'état du recrutement ?"). L\'IA utilise des outils pour accéder aux données réelles. Pour les actions sensibles, elle demande confirmation. L\'onglet "AI Insights" montre les recommandations proactives.',
            'category' => 'faq',
            'tags' => ['FAQ', 'IA', 'assistant', 'utilisation'],
            'access_role' => 'all',
            'status' => 'active',
        ]);
    }
}
