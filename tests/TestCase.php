<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    public function createApplication()
    {
        $app = parent::createApplication();
        $connection = $app['config']->get('database.default');
        $database = $app['config']->get("database.connections.$connection.database");
        if (! (($connection === 'sqlite' && $database === ':memory:') || ($connection === 'pgsql' && $database === 'dele_test'))) {
            throw new \RuntimeException('Tests may use only SQLite :memory: or PostgreSQL dele_test.');
        }

        return $app;
    }

    protected function setUp(): void
    {
        parent::setUp();
        config(['app.key' => 'base64:'.base64_encode(str_repeat('t', 32))]);
        $this->withoutVite();
    }
}
