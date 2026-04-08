<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'type',
        'description',
    ];

    /**
     * Get the typed value of the setting.
     */
    public function getTypedValueAttribute()
    {
        return match ($this->type) {
            'integer' => (int) $this->value,
            'boolean' => filter_var($this->value, FILTER_VALIDATE_BOOLEAN),
            'json' => json_decode($this->value, true),
            'float' => (float) $this->value,
            default => $this->value,
        };
    }

    /**
     * Set the value with type conversion.
     */
    public function setTypedValue($value): void
    {
        $this->value = match ($this->type) {
            'json' => json_encode($value),
            'boolean' => $value ? 'true' : 'false',
            default => (string) $value,
        };
    }

    /**
     * Get a setting value by key.
     */
    public static function getValue(string $key, $default = null)
    {
        $setting = self::where('key', $key)->first();

        return $setting ? $setting->typed_value : $default;
    }

    /**
     * Set a setting value by key.
     */
    public static function setValue(string $key, $value, string $type = 'string', ?string $description = null): self
    {
        return self::updateOrCreate(
            ['key' => $key],
            [
                'value' => is_array($value) ? json_encode($value) : (string) $value,
                'type' => $type,
                'description' => $description,
            ]
        );
    }

    /**
     * Get all settings as a key-value array.
     */
    public static function getAllAsArray(): array
    {
        return self::all()->pluck('typed_value', 'key')->toArray();
    }
}
