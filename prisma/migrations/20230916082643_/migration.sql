/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Pets` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Pets_name_key" ON "Pets"("name");
