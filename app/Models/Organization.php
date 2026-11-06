<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Organization extends Model
{
    protected $table = 'Organization';

    protected $guarded = [];

    public $incrementing = false;

    protected $keyType = 'string';

    public static $snakeAttributes = false;

    public const CREATED_AT = 'createdAt';

    public const UPDATED_AT = 'updatedAt';

    protected function casts(): array
    {
        return ['regionsServed' => 'array', 'specializations' => 'array', 'verifiedAt' => 'datetime', 'createdAt' => 'datetime', 'updatedAt' => 'datetime'];
    }

    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (! $model->getKey()) {
                $model->setAttribute($model->getKeyName(), (string) Str::ulid());
            }
        });
    }

    public function members()
    {
        return $this->hasMany(OrganizationMember::class, 'organizationId');
    }

    public function offers()
    {
        return $this->hasMany(Offer::class, 'organizationId');
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'organizationId');
    }

    public function documents()
    {
        return $this->hasMany(Document::class, 'organizationId');
    }

    public function reviewsReceived()
    {
        return $this->hasMany(Review::class, 'targetOrgId');
    }

    public function proposals()
    {
        return $this->hasMany(ProfileChangeProposal::class, 'authorOrgId');
    }

    public function recommendations()
    {
        return $this->hasMany(ServiceRecommendation::class, 'createdByOrgId');
    }
}
