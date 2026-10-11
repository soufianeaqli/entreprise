<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\RhManager;
use App\Models\Department;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@company.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('admin123456'),
                'role' => 'super_admin',
            ]
        );

        $rh = RhManager::firstOrCreate(
            ['email' => 'rh@company.com'],
            [
                'matricule' => 'RH-0001',
                'first_name' => 'Fatima',
                'last_name' => 'Alami',
                'gender' => 'female',
                'phone' => '+212 600 000 001',
                'contract_type' => 'CDI',
                'salary' => 15000,
                'status' => true,
                'password' => Hash::make('rh123456'),
            ]
        );

        User::updateOrCreate(
            ['email' => 'rh@company.com'],
            [
                'name' => 'Fatima Alami',
                'password' => Hash::make('rh123456'),
                'role' => 'rh',
                'is_active' => true,
            ]
        );

        Department::updateOrCreate(
            ['code' => 'IT'],
            [
                'name' => 'Informatique',
                'rh_manager_id' => $rh->id,
                'location' => 'Bureau 201',
                'employees_count' => 12,
                'annual_budget' => 500000,
                'status' => true,
            ]
        );
    }
}
