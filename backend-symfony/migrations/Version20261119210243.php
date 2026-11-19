<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Migration to drop legacy settings table in favor of user-scoped user_settings.
 */
final class Version20261119210243 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Drop legacy global settings table in favor of user_settings';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('DROP TABLE IF EXISTS settings');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('CREATE TABLE settings (key VARCHAR(128) NOT NULL, value TEXT DEFAULT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(key))');
    }
}
