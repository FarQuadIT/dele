<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class EngineeringSystem extends Model
{
    protected $table = 'EngineeringSystem';

    protected $guarded = [];

    public $incrementing = false;

    protected $keyType = 'string';

    public static $snakeAttributes = false;

    public const CREATED_AT = 'createdAt';

    public const UPDATED_AT = 'updatedAt';

    protected function casts(): array
    {
        return ['createdAt' => 'datetime', 'updatedAt' => 'datetime'];
    }

    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (! $model->getKey()) {
                $model->setAttribute($model->getKeyName(), (string) Str::ulid());
            }
        });
    }

    public function facility()
    {
        return $this->belongsTo(Facility::class, 'facilityId', 'id');
    }

    public function subsystems()
    {
        return $this->hasMany(Subsystem::class, 'systemId');
    }

    public function equipment()
    {
        return $this->hasMany(Equipment::class, 'systemId');
    }

    public function requests()
    {
        return $this->hasMany(Request::class, 'systemId');
    }

    public function recommendations()
    {
        return $this->hasMany(ServiceRecommendation::class, 'systemId');
    }
}
