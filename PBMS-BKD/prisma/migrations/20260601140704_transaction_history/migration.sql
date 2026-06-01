/*
  Warnings:

  - You are about to drop the column `mealSalePaymentsId` on the `sale_payment_transaction_history` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `sale_payment_transaction_history` DROP FOREIGN KEY `sale_payment_transaction_history_mealSalePaymentsId_fkey`;

-- DropIndex
DROP INDEX `sale_payment_transaction_history_mealSalePaymentsId_fkey` ON `sale_payment_transaction_history`;

-- AlterTable
ALTER TABLE `sale_payment_transaction_history` DROP COLUMN `mealSalePaymentsId`;

-- CreateTable
CREATE TABLE `meal_sale_payment_transaction_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mealSalePaymentId` INTEGER NULL,
    `transaction_uuid` VARCHAR(191) NOT NULL,
    `transaction_reference` VARCHAR(191) NOT NULL,
    `provider_transaction_id` VARCHAR(191) NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `amount_formatted` VARCHAR(191) NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'UGX',
    `payment_method` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NULL,
    `provider_mode` VARCHAR(191) NULL,
    `phone_number` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `event_type` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `notes` TEXT NULL,
    `cashierId` INTEGER NOT NULL,
    `webhook_received_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `webhook_payload` JSON NULL,
    `transaction_initiated_at` DATETIME(3) NULL,
    `transaction_completed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `meal_sale_payment_transaction_history_transaction_uuid_key`(`transaction_uuid`),
    UNIQUE INDEX `meal_sale_payment_transaction_history_transaction_reference_key`(`transaction_reference`),
    UNIQUE INDEX `meal_sale_payment_transaction_history_provider_transaction_i_key`(`provider_transaction_id`),
    INDEX `meal_sale_payment_transaction_history_mealSalePaymentId_idx`(`mealSalePaymentId`),
    INDEX `meal_sale_payment_transaction_history_transaction_uuid_idx`(`transaction_uuid`),
    INDEX `meal_sale_payment_transaction_history_transaction_reference_idx`(`transaction_reference`),
    INDEX `meal_sale_payment_transaction_history_provider_transaction_i_idx`(`provider_transaction_id`),
    INDEX `meal_sale_payment_transaction_history_provider_idx`(`provider`),
    INDEX `meal_sale_payment_transaction_history_phone_number_idx`(`phone_number`),
    INDEX `meal_sale_payment_transaction_history_created_at_idx`(`created_at`),
    INDEX `meal_sale_payment_transaction_history_payment_method_idx`(`payment_method`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `meal_sale_payment_transaction_history` ADD CONSTRAINT `meal_sale_payment_transaction_history_mealSalePaymentId_fkey` FOREIGN KEY (`mealSalePaymentId`) REFERENCES `meal_sale_payments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meal_sale_payment_transaction_history` ADD CONSTRAINT `meal_sale_payment_transaction_history_cashierId_fkey` FOREIGN KEY (`cashierId`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
