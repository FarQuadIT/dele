<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ProfileChangeProposal extends Model
{
    protected $table = 'ProfileChangeProposal';

    protected $guarded = [];

    public $incrementing = false;

    protected $keyType = 'string';

    public static $snakeAttributes = false;

    public const CREATED_AT = 'createdAt';

    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return ['changes' => 'array', 'decidedAt' => 'datetime', 'createdAt' => 'datetime'];
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

    public function order()
    {
        return $this->belongsTo(Order::class, 'orderId', 'id');
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'authorId', 'id');
    }

    public function authorOrg()
    {
        return $this->belongsTo(Organization::class, 'authorOrgId', 'id');
    }

    public function decidedBy()
    {
        return $this->belongsTo(User::class, 'decidedById', 'id');
    }
}
