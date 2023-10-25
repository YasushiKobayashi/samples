CREATE TABLE `users` (
    `id` VARCHAR(255) NOT NULL,
    `sub` VARCHAR(255) NOT NULL,
    `registration_date` TIMESTAMP NOT NULL,
    `created` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE current_timestamp,
    `deleted` BOOLEAN NULL DEFAULT false,
    `deleted_date` TIMESTAMP NULL,

    UNIQUE INDEX `users_sub_key`(`sub`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `user_profiles` (
    `user_id` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `created` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE current_timestamp,
    `deleted` BOOLEAN NULL DEFAULT false,
    `deleted_date` TIMESTAMP NULL,

    CONSTRAINT `user_profile_user_id_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
    UNIQUE INDEX `user_profiles_user_id_key`(`user_id`),
    INDEX `user_id`(`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
