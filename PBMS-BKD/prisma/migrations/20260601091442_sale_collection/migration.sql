/*
  Warnings:

  - You are about to drop the column `mealSaleId` on the `salesPayments` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `salesPayments` DROP FOREIGN KEY `salesPayments_mealSaleId_fkey`;

-- DropIndex
DROP INDEX `salesPayments_mealSaleId_fkey` ON `salesPayments`;

-- AlterTable
ALTER TABLE `sale_payment_transaction_history` ADD COLUMN `mealSalePaymentsId` INTEGER NULL;

-- AlterTable
ALTER TABLE `salesPayments` DROP COLUMN `mealSaleId`;

-- CreateTable
CREATE TABLE `meal_sale_payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `amount` DECIMAL(10, 2) NOT NULL,
    `paymentMethod` VARCHAR(191) NOT NULL,
    `referenceId` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `cashierId` INTEGER NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `mealSaleId` INTEGER NULL,

    INDEX `meal_sale_payments_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sale_payment_transaction_history` ADD CONSTRAINT `sale_payment_transaction_history_mealSalePaymentsId_fkey` FOREIGN KEY (`mealSalePaymentsId`) REFERENCES `meal_sale_payments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meal_sale_payments` ADD CONSTRAINT `meal_sale_payments_cashierId_fkey` FOREIGN KEY (`cashierId`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meal_sale_payments` ADD CONSTRAINT `meal_sale_payments_mealSaleId_fkey` FOREIGN KEY (`mealSaleId`) REFERENCES `meal_sales`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
