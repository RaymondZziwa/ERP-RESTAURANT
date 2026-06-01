/*
  Warnings:

  - You are about to drop the column `balance` on the `meal_sales` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `meal_sales` DROP COLUMN `balance`,
    MODIFY `paymentMethod` VARCHAR(191) NULL;
