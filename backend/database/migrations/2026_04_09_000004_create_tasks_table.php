<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('tasks')) {
            return;
        }

        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->string('taskid')->unique();
            $table->text('description');
            $table->unsignedBigInteger('department_id');
            $table->unsignedBigInteger('category_id');
            $table->unsignedBigInteger('staff_id');
            $table->unsignedBigInteger('priority_id');
            $table->unsignedBigInteger('status_id');
            $table->string('requester')->nullable();
            $table->date('date');
            $table->time('starttime')->nullable();
            $table->time('endtime')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->index('date');
            $table->index(['department_id', 'date']);
            $table->index(['category_id', 'date']);
            $table->index(['staff_id', 'date']);
            $table->index(['status_id', 'date']);
            $table->index(['priority_id', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
