<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ChatThread extends Model
{
    protected $table = 'ChatThread';

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

    public function request()
    {
        return $this->belongsTo(Request::class, 'requestId', 'id');
    }

    public function offer()
    {
        return $this->belongsTo(Offer::class, 'offerId', 'id');
    }

    public function order()
    {
        return $this->belongsTo(Order::class, 'orderId', 'id');
    }

    public function messages()
    {
        return $this->hasMany(Message::class, 'threadId');
    }
}
