<?php

declare(strict_types=1);

namespace App\Entity;

interface UserOwnedInterface
{
    public function getUser(): ?User;

    public function setUser(?User $user): self;
}
