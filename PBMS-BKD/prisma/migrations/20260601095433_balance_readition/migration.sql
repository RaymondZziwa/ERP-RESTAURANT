/*
  Warnings:

  - Added the required column `balance` to the `meal_sales` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `meal_sales` ADD COLUMN `balance` DECIMAL(10, 2) NOT NULL;
