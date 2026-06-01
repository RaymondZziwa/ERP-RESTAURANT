-- AlterTable
ALTER TABLE `salesPayments` ADD COLUMN `mealSaleId` INTEGER NULL;

-- CreateTable
CREATE TABLE `meal_sales` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tableId` INTEGER NULL,
    `items` JSON NOT NULL,
    `servedBy` INTEGER NOT NULL,
    `saleStatus` ENUM('COMPLETE', 'PENDING', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `status` ENUM('FULLY_PAID', 'PARTIALLY_PAID', 'UNPAID') NOT NULL DEFAULT 'UNPAID',
    `total` DECIMAL(10, 2) NOT NULL,
    `balance` DECIMAL(10, 2) NOT NULL,
    `paymentMethod` VARCHAR(191) NOT NULL,
    `notes` VARCHAR(191) NULL,
    `isReceiptPrinted` BOOLEAN NOT NULL DEFAULT false,
    `updatedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `meal_sales_servedBy_createdAt_idx`(`servedBy`, `createdAt`),
    INDEX `meal_sales_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `meal_sales_createdAt_idx`(`createdAt`),
    INDEX `meal_sales_total_idx`(`total`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `salesPayments` ADD CONSTRAINT `salesPayments_mealSaleId_fkey` FOREIGN KEY (`mealSaleId`) REFERENCES `meal_sales`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meal_sales` ADD CONSTRAINT `meal_sales_tableId_fkey` FOREIGN KEY (`tableId`) REFERENCES `tables`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meal_sales` ADD CONSTRAINT `meal_sales_servedBy_fkey` FOREIGN KEY (`servedBy`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
