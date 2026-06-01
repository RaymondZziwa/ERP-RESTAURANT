/*
  Warnings:

  - You are about to alter the column `paymentMethod` on the `salesPayments` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(13))` to `VarChar(191)`.

*/
-- AlterTable
ALTER TABLE `salesPayments` MODIFY `paymentMethod` VARCHAR(191) NOT NULL;
