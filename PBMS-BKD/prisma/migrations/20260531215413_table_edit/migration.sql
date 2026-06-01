/*
  Warnings:

  - You are about to drop the column `name` on the `tables` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[number]` on the table `tables` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `number` to the `tables` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `tables_name_idx` ON `tables`;

-- AlterTable
ALTER TABLE `tables` DROP COLUMN `name`,
    ADD COLUMN `number` INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `tables_number_key` ON `tables`(`number`);

-- CreateIndex
CREATE INDEX `tables_number_idx` ON `tables`(`number`);
