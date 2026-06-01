/*
  Warnings:

  - Made the column `mealSalePaymentId` on table `meal_sale_payment_transaction_history` required. This step will fail if there are existing NULL values in that column.
  - Made the column `mealSaleId` on table `meal_sale_payments` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `meal_sale_payment_transaction_history` DROP FOREIGN KEY `meal_sale_payment_transaction_history_mealSalePaymentId_fkey`;

-- DropForeignKey
ALTER TABLE `meal_sale_payments` DROP FOREIGN KEY `meal_sale_payments_mealSaleId_fkey`;

-- DropIndex
DROP INDEX `meal_sale_payments_mealSaleId_fkey` ON `meal_sale_payments`;

-- AlterTable
ALTER TABLE `meal_sale_payment_transaction_history` MODIFY `mealSalePaymentId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `meal_sale_payments` MODIFY `mealSaleId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `meal_sale_payments` ADD CONSTRAINT `meal_sale_payments_mealSaleId_fkey` FOREIGN KEY (`mealSaleId`) REFERENCES `meal_sales`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meal_sale_payment_transaction_history` ADD CONSTRAINT `meal_sale_payment_transaction_history_mealSalePaymentId_fkey` FOREIGN KEY (`mealSalePaymentId`) REFERENCES `meal_sale_payments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
