<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckDepartmentMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Non authentifié.'], 401);
        }

        if ($user->role === 'super_admin') {
            return $next($request);
        }

        if ($user->role === 'rh') {
            $rhManager = $user->rhManager;

            if (!$rhManager) {
                return response()->json([
                    'message' => 'Aucun profil RH associé à votre compte.',
                ], 403);
            }

            if (!$rhManager->department) {
                return response()->json([
                    'message' => 'Vous n\'êtes pas associé à un département. Contactez l\'administrateur.',
                ], 403);
            }

            $request->merge(['rh_department_id' => $rhManager->department->id]);
            $request->merge(['rh_manager_id' => $rhManager->id]);
            $request->merge(['rh_department_name' => $rhManager->department->name]);
        }

        return $next($request);
    }
}
