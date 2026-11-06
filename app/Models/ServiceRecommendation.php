<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ServiceRecommendation extends Model
{
    protected $table = 'ServiceRecommendation';

    protected $guarded = [];

    public $incrementing = false;

    protected $keyType = 'string';

    public static $snakeAttributes = false;

    public const CREATED_AT = 'createdAt';

    public const UPDATED_AT = 'updatedAt';

    protected function casts(): array
    {
        return ['dueAt' => 'datetime', 'lastServiceAt' => 'datetime', 'createdAt' => 'datetime', 'updatedAt' => 'datetime'];
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

    public function equipment()
    {
        return $this->belongsTo(Equipment::class, 'equipmentId', 'id');
    }

    public function system()
    {
        return $this->belongsTo(EngineeringSystem::class, 'systemId', 'id');
    }

    public function createdByUser()
    {
        return $this->belongsTo(User::class, 'createdByUserId', 'id');
    }

    public function createdByOrg()
    {
        return $this->belongsTo(Organization::class, 'createdByOrgId', 'id');
    }

    public function sourceOrder()
    {
        return $this->belongsTo(Order::class, 'sourceOrderId', 'id');
    }
}
