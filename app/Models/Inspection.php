<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Inspection extends Model
{
    protected $table = 'Inspection';

    protected $guarded = [];

    public $incrementing = false;

    protected $keyType = 'string';

    public static $snakeAttributes = false;

    public const CREATED_AT = 'createdAt';

    public const UPDATED_AT = 'updatedAt';

    protected function casts(): array
    {
        return ['scheduledAt' => 'datetime', 'createdAt' => 'datetime', 'updatedAt' => 'datetime'];
    }

    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (! $model->getKey()) {
                $model->setAttribute($model->getKeyName(), (string) Str::ulid());
            }
        });
    }

    public function order()
    {
        return $this->belongsTo(Order::class, 'orderId', 'id');
    }

    public function requestedBy()
    {
        return $this->belongsTo(User::class, 'requestedById', 'id');
    }

    public function reportDocument()
    {
        return $this->belongsTo(Document::class, 'reportDocumentId', 'id');
    }
}
