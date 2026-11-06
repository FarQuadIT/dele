<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Document extends Model
{
    protected $table = 'Document';

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

    public function equipment()
    {
        return $this->belongsTo(Equipment::class, 'equipmentId', 'id');
    }

    public function request()
    {
        return $this->belongsTo(Request::class, 'requestId', 'id');
    }

    public function order()
    {
        return $this->belongsTo(Order::class, 'orderId', 'id');
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class, 'organizationId', 'id');
    }

    public function versions()
    {
        return $this->hasMany(DocumentVersion::class, 'documentId');
    }

    public function contract()
    {
        return $this->hasOne(Contract::class, 'documentId');
    }

    public function inspection()
    {
        return $this->hasOne(Inspection::class, 'reportDocumentId');
    }
}
