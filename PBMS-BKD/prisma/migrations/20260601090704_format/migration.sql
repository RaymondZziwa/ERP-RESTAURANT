/*
  Warnings:

  - You are about to alter the column `paymentMethod` on the `salesPayments` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(27))`.

*/
-- AlterTable
ALTER TABLE `salesPayments` MODIFY `paymentMethod` ENUM('CASH', 'MTN_MOMO', 'AIRTEL_MOMO', 'CARD', 'PROF_MOMO') NOT NULL;
