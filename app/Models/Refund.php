<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Refund extends Model
{
    protected $table = 'Refund';

    protected $guarded = [];

    public $incrementing = false;

    protected $keyType = 'string';

    public static $snakeAttributes = false;

    public const CREATED_AT = 'createdAt';

    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return ['createdAt' => 'datetime'];
    }

    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (! $model->getKey()) {
                $model->setAttribute($model->getKeyName(), (string) Str::ulid());
            }
        });
    }

    public function payment()
    {
        return $this->belongsTo(Payment::class, 'paymentId', 'id');
    }
}
