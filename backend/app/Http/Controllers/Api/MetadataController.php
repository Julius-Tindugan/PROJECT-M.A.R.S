<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MetadataController extends Controller
{
    public function index(string $type): JsonResponse
    {
        $table = $this->tableForType($type);

        $query = DB::table($table)->select(['id', 'name'])->orderBy('name');

        if ($this->hasActiveColumn($table)) {
            $query->where('active', 1);
        }

        return response()->json($query->get());
    }

    public function store(Request $request, string $type): JsonResponse
    {
        $table = $this->tableForType($type);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $name = trim($validated['name']);

        $exists = DB::table($table)
            ->whereRaw('LOWER(name) = ?', [strtolower($name)])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'An entry with this name already exists.',
            ], 422);
        }

        $payload = [
            'name' => $name,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        if ($this->hasActiveColumn($table)) {
            $payload['active'] = 1;
        }

        if ($table === 'staff') {
            $payload['email'] = null;
            $payload['phone'] = null;
        }

        $id = DB::table($table)->insertGetId($payload);

        return response()->json([
            'success' => true,
            'message' => 'Entry created successfully',
            'item' => [
                'id' => (int) $id,
                'name' => $name,
            ],
        ], 201);
    }

    public function update(Request $request, string $type, int $id): JsonResponse
    {
        $table = $this->tableForType($type);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $name = trim($validated['name']);

        $item = DB::table($table)->where('id', $id)->first();

        if (! $item) {
            abort(404, 'Entry not found.');
        }

        $duplicate = DB::table($table)
            ->where('id', '!=', $id)
            ->whereRaw('LOWER(name) = ?', [strtolower($name)])
            ->exists();

        if ($duplicate) {
            return response()->json([
                'message' => 'An entry with this name already exists.',
            ], 422);
        }

        DB::table($table)
            ->where('id', $id)
            ->update([
                'name' => $name,
                'updated_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Entry updated successfully',
            'item' => [
                'id' => $id,
                'name' => $name,
            ],
        ]);
    }

    public function destroy(string $type, int $id): JsonResponse
    {
        $table = $this->tableForType($type);
        $foreignKey = $this->taskForeignKeyForTable($table);

        $isReferenced = DB::table('tasks')->where($foreignKey, $id)->exists();

        if ($isReferenced) {
            return response()->json([
                'message' => 'Cannot delete this entry because it is referenced by existing tasks.',
            ], 422);
        }

        $deleted = DB::table($table)->where('id', $id)->delete();

        if ($deleted === 0) {
            abort(404, 'Entry not found.');
        }

        return response()->json([
            'success' => true,
            'message' => 'Entry deleted successfully',
        ]);
    }

    public function reset(): JsonResponse
    {
        $existingTasks = DB::table('tasks')->count();

        if ($existingTasks > 0) {
            return response()->json([
                'message' => 'Cannot reset metadata while tasks exist. Remove task records first.',
            ], 422);
        }

        DB::transaction(function () {
            DB::table('departments')->delete();
            DB::table('categories')->delete();
            DB::table('staff')->delete();

            DB::table('departments')->insert($this->departmentRows());
            DB::table('categories')->insert($this->categoryRows());
            DB::table('staff')->insert($this->staffRows());
        });

        return response()->json([
            'success' => true,
            'message' => 'Metadata reset to defaults',
        ]);
    }

    private function hasActiveColumn(string $table): bool
    {
        return in_array($table, ['departments', 'categories', 'staff'], true);
    }

    private function tableForType(string $type): string
    {
        return match ($type) {
            'departments' => 'departments',
            'categories' => 'categories',
            'staff' => 'staff',
            default => abort(404, 'Unsupported metadata type.'),
        };
    }

    private function taskForeignKeyForTable(string $table): string
    {
        return match ($table) {
            'departments' => 'department_id',
            'categories' => 'category_id',
            'staff' => 'staff_id',
            default => abort(500, 'Unsupported metadata mapping.'),
        };
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function departmentRows(): array
    {
        $rows = [];
        $timestamp = now()->toDateTimeString();

        $names = [
            'Emergency Room (ER)',
            'Radiology',
            'Billing',
            'Pharmacy',
            'Cashier',
            'Laboratory',
            'OPD (Outpatient)',
            'IPD (Inpatient)',
            'ICU',
            'Operating Room',
            'Medical Records',
            'Human Resources',
            'Admitting',
            'Nursing Station 1',
            'Nursing Station 2',
            'Administration',
        ];

        foreach ($names as $name) {
            $rows[] = [
                'name' => $name,
                'active' => 1,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ];
        }

        return $rows;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function categoryRows(): array
    {
        $rows = [];
        $timestamp = now()->toDateTimeString();

        $names = [
            'Computer Hardware',
            'Network',
            'Printer',
            'Software',
            'CCTV',
            'Bizbox System Encoding',
            'Email/Communication',
            'Server Maintenance',
            'Data Backup',
            'System Installation',
        ];

        foreach ($names as $name) {
            $rows[] = [
                'name' => $name,
                'active' => 1,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ];
        }

        return $rows;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function staffRows(): array
    {
        $rows = [];
        $timestamp = now()->toDateTimeString();

        $names = [
            'John Santos',
            'Maria Garcia',
            'Carlos Reyes',
            'Ana Cruz',
            'Miguel Torres',
        ];

        foreach ($names as $name) {
            $rows[] = [
                'name' => $name,
                'email' => null,
                'phone' => null,
                'active' => 1,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ];
        }

        return $rows;
    }
}
