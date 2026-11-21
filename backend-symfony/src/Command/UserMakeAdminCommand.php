<?php

declare(strict_types=1);

namespace App\Command;

use App\Entity\ApiKey;
use App\Entity\User;
use App\Entity\UserFeatureFlag;
use App\Entity\UserSetting;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(
    name: 'user:make_admin',
    description: 'Grant admin role, feature flags (admin, api_access), and API key to one or more users (creating them if missing).'
)]
class UserMakeAdminCommand extends Command
{
    private EntityManagerInterface $entityManager;
    private UserPasswordHasherInterface $passwordHasher;

    public function __construct(EntityManagerInterface $entityManager, UserPasswordHasherInterface $passwordHasher)
    {
        parent::__construct();
        $this->entityManager = $entityManager;
        $this->passwordHasher = $passwordHasher;
    }

    protected function configure(): void
    {
        $this
            ->addArgument('email', InputArgument::OPTIONAL, 'Email address (or comma-separated list of emails) to grant admin access')
            ->addOption('password', null, InputOption::VALUE_REQUIRED, 'Admin password to set');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $emailArg = $input->getArgument('email');
        $adminEmailsEnv = isset($_ENV['ADMIN_EMAILS']) ? (string)$_ENV['ADMIN_EMAILS'] : (isset($_SERVER['ADMIN_EMAILS']) ? (string)$_SERVER['ADMIN_EMAILS'] : '');
        $adminEmailEnv = isset($_ENV['ADMIN_EMAIL']) ? (string)$_ENV['ADMIN_EMAIL'] : (isset($_SERVER['ADMIN_EMAIL']) ? (string)$_SERVER['ADMIN_EMAIL'] : '');
        $rawList = ($emailArg !== null && trim((string)$emailArg) !== '')
            ? (string)$emailArg
            : ($adminEmailsEnv !== '' ? $adminEmailsEnv : $adminEmailEnv);

        $emails = [];
        foreach (explode(',', $rawList) as $part) {
            $e = strtolower(trim($part));
            if ($e !== '') {
                $emails[] = $e;
            }
        }
        if (count($emails) === 0) {
            $emails[] = 'dkoldyaev@gmail.com';
        }

        $passwordOpt = $input->getOption('password');
        $adminPasswordEnv = isset($_ENV['ADMIN_PASSWORD']) ? (string)$_ENV['ADMIN_PASSWORD'] : (isset($_SERVER['ADMIN_PASSWORD']) ? (string)$_SERVER['ADMIN_PASSWORD'] : '');
        $adminPassword = ($passwordOpt !== null && trim((string)$passwordOpt) !== '')
            ? trim((string)$passwordOpt)
            : ($adminPasswordEnv !== '' ? $adminPasswordEnv : 'AdminSecure2026!#');

        $now = new \DateTimeImmutable();
        $userRepo = $this->entityManager->getRepository(User::class);
        $flagRepo = $this->entityManager->getRepository(UserFeatureFlag::class);
        $apiKeyRepo = $this->entityManager->getRepository(ApiKey::class);
        $settingRepo = $this->entityManager->getRepository(UserSetting::class);

        foreach ($emails as $email) {
            /** @var User|null $user */
            $user = $userRepo->findOneBy(['email' => $email]);
            $nameParts = explode('@', $email);
            $userName = count($nameParts) > 0 && $nameParts[0] !== '' ? $nameParts[0] : $email;

            if ($user === null) {
                $user = new User(
                    $email,
                    $userName,
                    sprintf('https://api.dicebear.com/7.x/bottts/svg?seed=%s', substr(md5($email), 0, 8)),
                    true,
                    ['ROLE_USER', 'ROLE_ADMIN'],
                    $now
                );
                $user->setPassword($this->passwordHasher->hashPassword($user, $adminPassword));
                $this->entityManager->persist($user);
                $this->entityManager->flush();
                $io->info(sprintf('Created admin user: %s (ID: %d)', $email, (int)$user->getId()));
            } else {
                $user->setIsAdmin(true);
                $user->setRoles(['ROLE_USER', 'ROLE_ADMIN']);
                $user->setIsAnonymous(false);
                if ($passwordOpt !== null || $user->getPassword() === null) {
                    $user->setPassword($this->passwordHasher->hashPassword($user, $adminPassword));
                }
                $this->entityManager->flush();
                $io->info(sprintf('Promoted user to admin: %s (ID: %d)', $email, (int)$user->getId()));
            }

            foreach (['admin', 'api_access'] as $flag) {
                if ($flagRepo->findOneBy(['user' => $user, 'flag' => $flag]) === null) {
                    $this->entityManager->persist(new UserFeatureFlag($user, $flag, $now));
                }
            }

            if ($apiKeyRepo->findOneBy(['user' => $user]) === null) {
                $hash = hash('sha256', sprintf('lp_key_%s_%s', $user->getEmail(), (string)$now->getTimestamp()));
                $this->entityManager->persist(new ApiKey($user, $hash, 'Main Admin Key', 'lp_admin', $now));
            }

            if ($settingRepo->findOneBy(['user' => $user, 'key' => 'locale']) === null) {
                $this->entityManager->persist(new UserSetting($user, 'locale', 'ru', $now));
            }
            if ($settingRepo->findOneBy(['user' => $user, 'key' => 'salary_display_format']) === null) {
                $this->entityManager->persist(new UserSetting($user, 'salary_display_format', 'month', $now));
            }

            $this->entityManager->flush();
        }

        $io->success(sprintf('Configured admin privileges for: %s', implode(', ', $emails)));
        return Command::SUCCESS;
    }
}
