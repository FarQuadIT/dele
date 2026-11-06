<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Session extends Model
{
    protected $table = 'Session';

    protected $guarded = [];

    public $incrementing = false;

    protected $keyType = 'string';

    public static $snakeAttributes = false;

    public const CREATED_AT = null;

    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return ['expires' => 'datetime'];
    }

    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (! $model->getKey()) {
                $model->setAttribute($model->getKeyName(), (string) Str::ulid());
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'userId', 'id');
    }
}
