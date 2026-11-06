<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Facility extends Model
{
    protected $table = 'Facility';

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

    public function owner()
    {
        return $this->belongsTo(User::class, 'ownerId', 'id');
    }

    public function access()
    {
        return $this->hasMany(FacilityAccess::class, 'facilityId');
    }

    public function buildings()
    {
        return $this->hasMany(Building::class, 'facilityId');
    }

    public function systems()
    {
        return $this->hasMany(EngineeringSystem::class, 'facilityId');
    }

    public function equipment()
    {
        return $this->hasMany(Equipment::class, 'facilityId');
    }

    public function requests()
    {
        return $this->hasMany(Request::class, 'facilityId');
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'facilityId');
    }

    public function documents()
    {
        return $this->hasMany(Document::class, 'facilityId');
    }

    public function recommendations()
    {
        return $this->hasMany(ServiceRecommendation::class, 'facilityId');
    }

    public function proposals()
    {
        return $this->hasMany(ProfileChangeProposal::class, 'facilityId');
    }
}
