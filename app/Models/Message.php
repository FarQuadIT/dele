<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Message extends Model
{
    protected $table = 'Message';

    protected $guarded = [];

    public $incrementing = false;

    protected $keyType = 'string';

    public static $snakeAttributes = false;

    public const CREATED_AT = 'createdAt';

    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return ['attachments' => 'array', 'createdAt' => 'datetime'];
    }

    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (! $model->getKey()) {
                $model->setAttribute($model->getKeyName(), (string) Str::ulid());
            }
        });
    }

    public function thread()
    {
        return $this->belongsTo(ChatThread::class, 'threadId', 'id');
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'authorId', 'id');
    }
}
