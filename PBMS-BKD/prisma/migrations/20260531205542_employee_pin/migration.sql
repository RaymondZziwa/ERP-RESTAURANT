/*
  Warnings:

  - A unique constraint covering the columns `[pin]` on the table `employees` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `employees` ADD COLUMN `pin` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `sales` ADD COLUMN `isReceiptPrinted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `tableId` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `employees_pin_key` ON `employees`(`pin`);

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_tableId_fkey` FOREIGN KEY (`tableId`) REFERENCES `tables`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
