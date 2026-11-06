<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Request extends Model
{
    protected $table = 'Request';

    protected $guarded = [];

    public $incrementing = false;

    protected $keyType = 'string';

    public static $snakeAttributes = false;

    public const CREATED_AT = 'createdAt';

    public const UPDATED_AT = 'updatedAt';

    protected function casts(): array
    {
        return ['desiredDateFrom' => 'datetime', 'desiredDateTo' => 'datetime', 'needsEstimate' => 'boolean', 'needsContract' => 'boolean', 'needsWarranty' => 'boolean', 'publishedAt' => 'datetime', 'expiresAt' => 'datetime', 'cancelledAt' => 'datetime', 'createdAt' => 'datetime', 'updatedAt' => 'datetime'];
    }

    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (! $model->getKey()) {
                $model->setAttribute($model->getKeyName(), (string) Str::ulid());
            }
        });
    }

    public function customer()
    {
        return $this->belongsTo(User::class, 'customerId', 'id');
    }

    public function facility()
    {
        return $this->belongsTo(Facility::class, 'facilityId', 'id');
    }

    public function system()
    {
        return $this->belongsTo(EngineeringSystem::class, 'systemId', 'id');
    }

    public function equipment()
    {
        return $this->belongsTo(Equipment::class, 'equipmentId', 'id');
    }

    public function acceptedOffer()
    {
        return $this->belongsTo(Offer::class, 'acceptedOfferId', 'id');
    }

    public function offers()
    {
        return $this->hasMany(Offer::class, 'requestId');
    }

    public function attachments()
    {
        return $this->hasMany(RequestAttachment::class, 'requestId');
    }

    public function order()
    {
        return $this->hasOne(Order::class, 'requestId');
    }

    public function threads()
    {
        return $this->hasMany(ChatThread::class, 'requestId');
    }

    public function documents()
    {
        return $this->hasMany(Document::class, 'requestId');
    }
}
