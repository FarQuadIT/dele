<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Zone extends Model
{
    protected $table = 'Zone';

    protected $guarded = [];

    public $incrementing = false;

    protected $keyType = 'string';

    public static $snakeAttributes = false;

    public const CREATED_AT = 'createdAt';

    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return ['createdAt' => 'datetime'];
    }

    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (! $model->getKey()) {
                $model->setAttribute($model->getKeyName(), (string) Str::ulid());
            }
        });
    }

    public function floor()
    {
        return $this->belongsTo(Floor::class, 'floorId', 'id');
    }

    public function equipment()
    {
        return $this->hasMany(Equipment::class, 'zoneId');
    }
}
