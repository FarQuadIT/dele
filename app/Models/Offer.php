<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Offer extends Model
{
    protected $table = 'Offer';

    protected $guarded = [];

    public $incrementing = false;

    protected $keyType = 'string';

    public static $snakeAttributes = false;

    public const CREATED_AT = 'createdAt';

    public const UPDATED_AT = 'updatedAt';

    protected function casts(): array
    {
        return ['isEstimate' => 'boolean', 'validUntil' => 'datetime', 'paymentSchedule' => 'array', 'stagesPlan' => 'array', 'availableDates' => 'array', 'createdAt' => 'datetime', 'updatedAt' => 'datetime'];
    }

    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (! $model->getKey()) {
                $model->setAttribute($model->getKeyName(), (string) Str::ulid());
            }
        });
    }

    public function request()
    {
        return $this->belongsTo(Request::class, 'requestId', 'id');
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class, 'organizationId', 'id');
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'authorId', 'id');
    }

    public function versions()
    {
        return $this->hasMany(OfferVersion::class, 'offerId');
    }

    public function acceptedForRequest()
    {
        return $this->hasOne(Request::class, 'acceptedOfferId');
    }

    public function order()
    {
        return $this->hasOne(Order::class, 'offerId');
    }

    public function threads()
    {
        return $this->hasMany(ChatThread::class, 'offerId');
    }
}
