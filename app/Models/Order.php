<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Order extends Model
{
    protected $table = 'Order';

    protected $guarded = [];

    public $incrementing = false;

    protected $keyType = 'string';

    public static $snakeAttributes = false;

    public const CREATED_AT = 'createdAt';

    public const UPDATED_AT = 'updatedAt';

    protected function casts(): array
    {
        return ['scheduledStartAt' => 'datetime', 'scheduledEndAt' => 'datetime', 'startedAt' => 'datetime', 'completedAt' => 'datetime', 'cancelledAt' => 'datetime', 'addressRevealed' => 'boolean', 'createdAt' => 'datetime', 'updatedAt' => 'datetime'];
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

    public function offer()
    {
        return $this->belongsTo(Offer::class, 'offerId', 'id');
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class, 'organizationId', 'id');
    }

    public function facility()
    {
        return $this->belongsTo(Facility::class, 'facilityId', 'id');
    }

    public function participants()
    {
        return $this->hasMany(OrderParticipant::class, 'orderId');
    }

    public function stages()
    {
        return $this->hasMany(OrderStage::class, 'orderId');
    }

    public function documents()
    {
        return $this->hasMany(Document::class, 'orderId');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'orderId');
    }

    public function contract()
    {
        return $this->hasOne(Contract::class, 'orderId');
    }

    public function inspections()
    {
        return $this->hasMany(Inspection::class, 'orderId');
    }

    public function disputes()
    {
        return $this->hasMany(Dispute::class, 'orderId');
    }

    public function threads()
    {
        return $this->hasMany(ChatThread::class, 'orderId');
    }

    public function proposals()
    {
        return $this->hasMany(ProfileChangeProposal::class, 'orderId');
    }

    public function reviews()
    {
        return $this->hasMany(Review::class, 'orderId');
    }

    public function equipmentVersions()
    {
        return $this->hasMany(EquipmentVersion::class, 'orderId');
    }

    public function recommendations()
    {
        return $this->hasMany(ServiceRecommendation::class, 'sourceOrderId');
    }
}
