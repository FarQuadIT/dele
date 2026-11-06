<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Str;

class User extends Authenticatable
{
    protected $table = 'User';

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

    protected $hidden = ['passwordHash'];

    public function getAuthPasswordName(): string
    {
        return 'passwordHash';
    }

    public function getRememberTokenName()
    {
        return null;
    }

    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (! $model->getKey()) {
                $model->setAttribute($model->getKeyName(), (string) Str::ulid());
            }
        });
    }

    public function accounts()
    {
        return $this->hasMany(Account::class, 'userId');
    }

    public function sessions()
    {
        return $this->hasMany(Session::class, 'userId');
    }

    public function memberships()
    {
        return $this->hasMany(OrganizationMember::class, 'userId');
    }

    public function facilityAccess()
    {
        return $this->hasMany(FacilityAccess::class, 'userId');
    }

    public function facilitiesOwned()
    {
        return $this->hasMany(Facility::class, 'ownerId');
    }

    public function requests()
    {
        return $this->hasMany(Request::class, 'customerId');
    }

    public function offersAuthored()
    {
        return $this->hasMany(Offer::class, 'authorId');
    }

    public function orderParticipants()
    {
        return $this->hasMany(OrderParticipant::class, 'userId');
    }

    public function messages()
    {
        return $this->hasMany(Message::class, 'authorId');
    }

    public function documentsUploaded()
    {
        return $this->hasMany(DocumentVersion::class, 'uploadedById');
    }

    public function stageEvidence()
    {
        return $this->hasMany(StageEvidence::class, 'createdById');
    }

    public function proposalsAuthored()
    {
        return $this->hasMany(ProfileChangeProposal::class, 'authorId');
    }

    public function proposalsDecided()
    {
        return $this->hasMany(ProfileChangeProposal::class, 'decidedById');
    }

    public function inspections()
    {
        return $this->hasMany(Inspection::class, 'requestedById');
    }

    public function disputesOpened()
    {
        return $this->hasMany(Dispute::class, 'openedById');
    }

    public function reviewsAuthored()
    {
        return $this->hasMany(Review::class, 'authorId');
    }

    public function reviewsReceived()
    {
        return $this->hasMany(Review::class, 'targetUserId');
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class, 'userId');
    }

    public function auditEvents()
    {
        return $this->hasMany(AuditEvent::class, 'actorId');
    }

    public function equipmentVersions()
    {
        return $this->hasMany(EquipmentVersion::class, 'authorId');
    }

    public function recommendations()
    {
        return $this->hasMany(ServiceRecommendation::class, 'createdByUserId');
    }
}
