<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rh_manager_id')->nullable()->constrained('rh_managers')->nullOnDelete();
            $table->string('employee_name');
            $table->string('type')->default('CDI');
            $table->string('department')->nullable();
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->decimal('salary', 10, 2)->nullable();
            $table->enum('status', ['active', 'draft', 'pending', 'expired', 'terminated'])->default('active');
            $table->string('trial_period')->nullable();
            $table->string('work_hours')->nullable();
            $table->integer('leave_days')->nullable();
            $table->text('benefits')->nullable();
            $table->text('observations')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contracts');
    }
};
