<?php
// Quick database verification script

$pdo = new PDO('sqlite:database/database.sqlite');

echo "=== MARS Database Verification ===\n\n";

// Count records
$tables = ['departments', 'categories', 'staff', 'priorities', 'statuses', 'items', 'tasks', 'settings', 'history'];
echo "TABLE RECORD COUNTS:\n";
foreach ($tables as $table) {
    $count = $pdo->query("SELECT COUNT(*) FROM $table")->fetchColumn();
    echo "  $table: $count\n";
}

echo "\n=== SAMPLE TASKS (with joins) ===\n";
$stmt = $pdo->query('
    SELECT t.taskid, d.name as dept, c.name as cat, s.name as staff, p.name as priority, st.name as status, t.date
    FROM tasks t
    JOIN departments d ON t.department_id = d.id
    JOIN categories c ON t.category_id = c.id
    JOIN staff s ON t.staff_id = s.id
    JOIN priorities p ON t.priority_id = p.id
    JOIN statuses st ON t.status_id = st.id
    ORDER BY t.date DESC
    LIMIT 5
');

foreach ($stmt as $row) {
    echo sprintf("%-12s | %-25s | %-20s | %-10s | %-12s | %s\n",
        $row['taskid'], $row['dept'], $row['cat'], $row['priority'], $row['status'], $row['date']);
}

echo "\n=== DEPARTMENTS ===\n";
$stmt = $pdo->query('SELECT name FROM departments ORDER BY name LIMIT 10');
foreach ($stmt as $row) {
    echo "  - " . $row['name'] . "\n";
}

echo "\n=== CATEGORIES ===\n";
$stmt = $pdo->query('SELECT name FROM categories ORDER BY name');
foreach ($stmt as $row) {
    echo "  - " . $row['name'] . "\n";
}

echo "\n=== PRIORITIES ===\n";
$stmt = $pdo->query('SELECT name, level, color FROM priorities ORDER BY level');
foreach ($stmt as $row) {
    echo "  " . $row['level'] . ". " . $row['name'] . " (" . $row['color'] . ")\n";
}

echo "\n=== STATUSES ===\n";
$stmt = $pdo->query('SELECT name, color FROM statuses ORDER BY "order"');
foreach ($stmt as $row) {
    echo "  - " . $row['name'] . " (" . $row['color'] . ")\n";
}

echo "\n=== Database verification complete ===\n";
