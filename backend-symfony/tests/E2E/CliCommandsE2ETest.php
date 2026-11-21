<?php

declare(strict_types=1);

namespace App\Tests\E2E;

use App\Entity\User;
use App\Entity\UserFeatureFlag;
use App\Entity\Vacancy;
use App\Tests\Support\ApiTestCase;
use Symfony\Bundle\FrameworkBundle\Console\Application;
use Symfony\Component\Console\Tester\CommandTester;

class CliCommandsE2ETest extends ApiTestCase
{
    public function testUserCreateCommandCreatesUserWithHashedPasswordAndSettings(): void
    {
        $application = new Application(static::$kernel);
        $command = $application->find('user:create');
        $tester = new CommandTester($command);

        $exitCode = $tester->execute([
            'email' => 'cli_created@local.user',
            '--name' => 'CLI Created User',
            '--password' => 'CliSecretPass2026!',
        ]);

        $this->assertSame(0, $exitCode);

        $this->entityManager->clear();
        /** @var User|null $user */
        $user = $this->entityManager->getRepository(User::class)->findOneBy(['email' => 'cli_created@local.user']);
        $this->assertNotNull($user);
        $this->assertSame('CLI Created User', $user->getName());
        $this->assertFalse($user->isAdmin());
        $this->assertNotNull($user->getPassword());
    }

    public function testUserMakeAdminCommandPromotesUserAndGrantsAdminFlags(): void
    {
        $application = new Application(static::$kernel);
        $command = $application->find('user:make_admin');
        $tester = new CommandTester($command);

        $exitCode = $tester->execute([
            'email' => 'promoted_admin@local.user',
            '--password' => 'AdminPass2026!',
        ]);

        $this->assertSame(0, $exitCode);

        $this->entityManager->clear();
        /** @var User|null $user */
        $user = $this->entityManager->getRepository(User::class)->findOneBy(['email' => 'promoted_admin@local.user']);
        $this->assertNotNull($user);
        $this->assertTrue($user->isAdmin());
        $this->assertContains('ROLE_ADMIN', $user->getRoles());

        $flags = $this->entityManager->getRepository(UserFeatureFlag::class)->findBy(['user' => $user]);
        $flagNames = array_map(static fn(UserFeatureFlag $f): string => $f->getFlag(), $flags);
        $this->assertContains('admin', $flagNames);
        $this->assertContains('api_access', $flagNames);
    }

    public function testMockCreateCommandSeedsMockVacanciesAndFixtures(): void
    {
        $application = new Application(static::$kernel);
        $command = $application->find('mock:create');
        $tester = new CommandTester($command);

        $exitCode = $tester->execute([
            '--email' => 'mock_owner@local.user',
            '--force' => true,
        ]);

        $this->assertSame(0, $exitCode);

        $this->entityManager->clear();
        /** @var User|null $owner */
        $owner = $this->entityManager->getRepository(User::class)->findOneBy(['email' => 'mock_owner@local.user']);
        $this->assertNotNull($owner);

        $vacancies = $this->entityManager->getRepository(Vacancy::class)->findBy(['user' => $owner]);
        $this->assertGreaterThanOrEqual(6, count($vacancies));
    }
}
