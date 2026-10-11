<?php

namespace Database\Migrations;

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('financial_data', function (Blueprint $table) {
            $table->id();
            $table->string('month');
            $table->integer('revenue');
            $table->integer('expenses');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('financial_data');
    }
};
