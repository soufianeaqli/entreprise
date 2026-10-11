<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\CandidateProfile;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(
        private NotificationService $notificationService
    ) {}

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'candidate',
            'is_active' => true,
        ]);

        CandidateProfile::create(['user_id' => $user->id]);

        $this->notificationService->createForAllAdmins(
            'Nouveau candidat inscrit',
            "Un nouveau candidat s'est inscrit : {$user->name} ({$user->email})",
            'info',
            '/recruitments'
        );

        $token = $user->createToken('candidate-token')->plainTextToken;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'avatar' => $user->avatar,
            ],
            'token' => $token,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Les identifiants sont incorrects.'],
            ]);
        }

        if (!in_array($user->role, ['super_admin', 'rh', 'candidate'])) {
            throw ValidationException::withMessages([
                'email' => ['Accès non autorisé.'],
            ]);
        }

        if (!$user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['Votre compte est désactivé. Contactez l\'administrateur.'],
            ]);
        }

        $tokenNames = [
            'super_admin' => 'super-admin-token',
            'rh' => 'rh-token',
            'candidate' => 'candidate-token',
        ];
        $token = $user->createToken($tokenNames[$user->role] ?? 'token')->plainTextToken;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'avatar' => $user->avatar,
            ],
            'token' => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnexion réussie.']);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->is_active) {
            $user->currentAccessToken()->delete();
            return response()->json(['message' => 'Compte désactivé.'], 401);
        }

        $data = [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'avatar' => $user->avatar ? Storage::disk('public')->url($user->avatar) : null,
                'created_at' => $user->created_at,
            ],
        ];

        if ($user->role === 'rh') {
            $rhManager = $user->rhManager()->with('department')->first();
            if ($rhManager) {
                $data['rh_manager'] = [
                    'id' => $rhManager->id,
                    'matricule' => $rhManager->matricule,
                    'full_name' => $rhManager->full_name,
                    'email' => $rhManager->email,
                    'department' => $rhManager->department ? [
                        'id' => $rhManager->department->id,
                        'name' => $rhManager->department->name,
                        'code' => $rhManager->department->code,
                    ] : null,
                ];
            }
        }

        if ($user->role === 'candidate') {
            $profile = $user->candidateProfile;
            $data['candidate_profile'] = $profile ? [
                'id' => $profile->id,
                'first_name' => $profile->first_name,
                'last_name' => $profile->last_name,
                'phone' => $profile->phone,
                'birth_date' => $profile->birth_date?->format('Y-m-d'),
                'address' => $profile->address,
                'city' => $profile->city,
                'education_level' => $profile->education_level,
                'experience_level' => $profile->experience_level,
                'skills' => $profile->skills,
                'languages' => $profile->languages,
                'linkedin' => $profile->linkedin,
                'github' => $profile->github,
                'portfolio' => $profile->portfolio,
                'photo' => $profile->photo,
            ] : null;
        }

        return response()->json($data);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $user->id,
        ]);

        $user->update($request->only('name', 'email'));

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'avatar' => $user->avatar ? Storage::disk('public')->url($user->avatar) : null,
                'created_at' => $user->created_at,
            ],
            'message' => 'Profil mis à jour.',
        ]);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Le mot de passe actuel est incorrect.'],
            ]);
        }

        $user->update(['password' => Hash::make($request->password)]);

        return response()->json(['message' => 'Mot de passe mis à jour.']);
    }

    public function updateAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        $user = $request->user();

        if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
            Storage::disk('public')->delete($user->avatar);
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['avatar' => $path]);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'avatar' => Storage::disk('public')->url($user->avatar),
                'created_at' => $user->created_at,
            ],
            'message' => 'Photo de profil mise à jour.',
        ]);
    }

    public function resetPassword(Request $request, int $userId): JsonResponse
    {
        $request->validate([
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = User::findOrFail($userId);

        if ($user->role !== 'rh') {
            throw ValidationException::withMessages([
                'email' => ['Impossible de réinitialiser le mot de passe pour ce type de compte.'],
            ]);
        }

        $user->update(['password' => Hash::make($request->password)]);
        $user->tokens()->delete();

        return response()->json(['message' => 'Mot de passe réinitialisé avec succès.']);
    }

    public function toggleAccountStatus(Request $request, int $userId): JsonResponse
    {
        $user = User::findOrFail($userId);

        if ($user->role !== 'rh') {
            throw ValidationException::withMessages([
                'email' => ['Impossible de modifier le statut de ce type de compte.'],
            ]);
        }

        $user->update(['is_active' => !$user->is_active]);

        if (!$user->is_active) {
            $user->tokens()->delete();
        }

        return response()->json([
            'message' => $user->is_active ? 'Compte activé.' : 'Compte désactivé.',
            'is_active' => $user->is_active,
        ]);
    }
}
