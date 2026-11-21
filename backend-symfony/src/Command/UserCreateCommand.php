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
    name: 'user:create',
    description: 'Create or update a user account with optional password and admin permissions.'
)]
class UserCreateCommand extends Command
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
            ->addArgument('email', InputArgument::REQUIRED, 'User email address')
            ->addOption('name', null, InputOption::VALUE_REQUIRED, 'Display name of the user')
            ->addOption('password', null, InputOption::VALUE_REQUIRED, 'User password')
            ->addOption('admin', null, InputOption::VALUE_NONE, 'Grant admin role and feature flags');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $rawEmail = (string)$input->getArgument('email');
        $email = strtolower(trim($rawEmail));
        if ($email === '') {
            $io->error('Email cannot be empty.');
            return Command::FAILURE;
        }

        $nameOpt = $input->getOption('name');
        $nameParts = explode('@', $email);
        $name = ($nameOpt !== null && trim((string)$nameOpt) !== '')
            ? trim((string)$nameOpt)
            : ($nameParts[0] !== '' ? $nameParts[0] : $email);

        $passwordOpt = $input->getOption('password');
        $isAdmin = (bool)$input->getOption('admin');
        $now = new \DateTimeImmutable();

        $userRepo = $this->entityManager->getRepository(User::class);
        /** @var User|null $user */
        $user = $userRepo->findOneBy(['email' => $email]);

        if ($user === null) {
            $user = new User(
                $email,
                $name,
                sprintf('https://api.dicebear.com/7.x/bottts/svg?seed=%s', substr(md5($email), 0, 8)),
                $isAdmin,
                $isAdmin ? ['ROLE_USER', 'ROLE_ADMIN'] : ['ROLE_USER'],
                $now
            );
            if ($passwordOpt !== null && trim((string)$passwordOpt) !== '') {
                $user->setPassword($this->passwordHasher->hashPassword($user, (string)$passwordOpt));
            }
            $this->entityManager->persist($user);
            $this->entityManager->flush();
            $io->success(sprintf('Created user %s (ID: %d)', $email, (int)$user->getId()));
        } else {
            if ($nameOpt !== null && trim((string)$nameOpt) !== '') {
                $user->setName(trim((string)$nameOpt));
            }
            if ($passwordOpt !== null && trim((string)$passwordOpt) !== '') {
                $user->setPassword($this->passwordHasher->hashPassword($user, (string)$passwordOpt));
            }
            if ($isAdmin) {
                $user->setIsAdmin(true);
                $user->setRoles(['ROLE_USER', 'ROLE_ADMIN']);
            }
            $this->entityManager->flush();
            $io->success(sprintf('Updated existing user %s (ID: %d)', $email, (int)$user->getId()));
        }

        $settingRepo = $this->entityManager->getRepository(UserSetting::class);
        if ($settingRepo->findOneBy(['user' => $user, 'key' => 'locale']) === null) {
            $this->entityManager->persist(new UserSetting($user, 'locale', 'ru', $now));
        }
        if ($settingRepo->findOneBy(['user' => $user, 'key' => 'salary_display_format']) === null) {
            $this->entityManager->persist(new UserSetting($user, 'salary_display_format', 'month', $now));
        }

        if ($isAdmin) {
            $flagRepo = $this->entityManager->getRepository(UserFeatureFlag::class);
            foreach (['admin', 'api_access'] as $flag) {
                if ($flagRepo->findOneBy(['user' => $user, 'flag' => $flag]) === null) {
                    $this->entityManager->persist(new UserFeatureFlag($user, $flag, $now));
                }
            }
            $apiKeyRepo = $this->entityManager->getRepository(ApiKey::class);
            if ($apiKeyRepo->findOneBy(['user' => $user]) === null) {
                $hash = hash('sha256', sprintf('lp_key_%s_%s', $user->getEmail(), (string)$now->getTimestamp()));
                $this->entityManager->persist(new ApiKey($user, $hash, 'Main Admin Key', 'lp_admin', $now));
            }
        }

        $this->entityManager->flush();

        return Command::SUCCESS;
    }
}
