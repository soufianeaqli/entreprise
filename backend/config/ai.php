<?php

return [

    /*
    |--------------------------------------------------------------------------
    | System Prompt — AI Assistant Identity
    |--------------------------------------------------------------------------
    |
    | Ce prompt définit l'identité complète, les connaissances et le
    | comportement de l'Assistant IA. Il est utilisé comme message system
    | lors de chaque appel à l'API IA.
    |
    */

    'system_prompt' => <<<'PROMPT'
Tu es l'Assistant IA de la plateforme RH. Tu aides les utilisateurs à comprendre et utiliser le site. Tu ne peux JAMAIS créer, modifier ou supprimer de données. Tu es un assistant d'information et de guidance uniquement.

Modules du site: Dashboard, RH Management, Departments, Recruitment, Announcements, Employees, Documents, Meetings, Calendar, Budgets, Analytics, Reports, Notifications, Profile.

Rôles: Super Admin (accès complet), RH (gestion de son département), Candidat (espace personnel).

Tu as accès à des outils de lecture pour fournir des données quand l'utilisateur pose une question sur les données. Utilise-les. Si l'utilisateur te demande une action (créer, modifier, supprimer), explique-lui comment le faire manuellement dans le module approprié.

Réponds dans la langue de l'utilisateur. Sois concis, clair et pédagogique. Utilise des listes et le gras pour les étapes importantes.
PROMPT,

    /*
    |--------------------------------------------------------------------------
    | Configuration des tokens
    |--------------------------------------------------------------------------
    */

    'max_tokens' => 512,
    'temperature' => 0.7,

    /*
    |--------------------------------------------------------------------------
    | AI Provider Configuration
    |--------------------------------------------------------------------------
    |
    | Supported: "groq" (free tier, 100K TPD) or "gemini" (Google AI, 1500 RPM)
    |
    */

    'provider' => env('AI_PROVIDER', 'gemini'),

    /*
    |--------------------------------------------------------------------------
    | Groq Configuration
    */

    'groq' => [
        'api_key' => env('GROQ_API_KEY', ''),
        'base_url' => 'https://api.groq.com/openai/v1/chat/completions',
        'model' => env('GROQ_MODEL', 'llama-3.3-70b-versatile'),
        'fallback_model' => env('GROQ_FALLBACK_MODEL', 'llama-3.1-8b-instant'),
        'max_tokens' => (int) env('GROQ_MAX_TOKENS', 1024),
        'temperature' => (float) env('GROQ_TEMPERATURE', 0.7),
        'timeout' => (int) env('GROQ_TIMEOUT', 60),
    ],

    /*
    |--------------------------------------------------------------------------
    | Gemini Configuration
    */

    'gemini' => [
        'api_key' => env('GEMINI_API_KEY', ''),
        'base_url' => 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
        'model' => env('GEMINI_MODEL', 'gemini-2.0-flash'),
        'max_tokens' => (int) env('GROQ_MAX_TOKENS', 1024),
        'temperature' => (float) env('GROQ_TEMPERATURE', 0.7),
        'timeout' => (int) env('GROQ_TIMEOUT', 60),
    ],

    /*
    |--------------------------------------------------------------------------
    | Rate Limiting (requests per minute per user)
    |--------------------------------------------------------------------------
    */

    'rate_limit_per_minute' => (int) env('AI_RATE_LIMIT', 30),

    /*
    |--------------------------------------------------------------------------
    | Max message length sent to OpenAI
    |--------------------------------------------------------------------------
    */

    'max_message_length' => 4000,

    /*
    |--------------------------------------------------------------------------
    | Contexte maximum envoyé à l'IA (en messages)
    |--------------------------------------------------------------------------
    */

    'max_context_messages' => 5,

];
