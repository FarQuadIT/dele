<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Equipment extends Model
{
    protected $table = 'Equipment';

    protected $guarded = [];

    public $incrementing = false;

    protected $keyType = 'string';

    public static $snakeAttributes = false;

    public const CREATED_AT = 'createdAt';

    public const UPDATED_AT = 'updatedAt';

    protected function casts(): array
    {
        return ['installedAt' => 'datetime', 'warrantyUntil' => 'datetime', 'lastServiceAt' => 'datetime', 'specs' => 'array', 'createdAt' => 'datetime', 'updatedAt' => 'datetime'];
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

    public function system()
    {
        return $this->belongsTo(EngineeringSystem::class, 'systemId', 'id');
    }

    public function subsystem()
    {
        return $this->belongsTo(Subsystem::class, 'subsystemId', 'id');
    }

    public function zone()
    {
        return $this->belongsTo(Zone::class, 'zoneId', 'id');
    }

    public function versions()
    {
        return $this->hasMany(EquipmentVersion::class, 'equipmentId');
    }

    public function documents()
    {
        return $this->hasMany(Document::class, 'equipmentId');
    }

    public function recommendations()
    {
        return $this->hasMany(ServiceRecommendation::class, 'equipmentId');
    }

    public function requests()
    {
        return $this->hasMany(Request::class, 'equipmentId');
    }

    public function proposals()
    {
        return $this->hasMany(ProfileChangeProposal::class, 'equipmentId');
    }
}
