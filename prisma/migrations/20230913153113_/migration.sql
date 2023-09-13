/*
  Warnings:

  - You are about to drop the column `category_id` on the `Pets` table. All the data in the column will be lost.
  - You are about to drop the `Pet_Photos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Pet_Tags` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Pet_Photos" DROP CONSTRAINT "Pet_Photos_pet_id_fkey";

-- DropForeignKey
ALTER TABLE "Pet_Tags" DROP CONSTRAINT "Pet_Tags_pet_id_fkey";

-- DropForeignKey
ALTER TABLE "Pet_Tags" DROP CONSTRAINT "Pet_Tags_tag_id_fkey";

-- DropForeignKey
ALTER TABLE "Pets" DROP CONSTRAINT "Pets_category_id_fkey";

-- AlterTable
ALTER TABLE "Pets" DROP COLUMN "category_id",
ADD COLUMN     "categoryId" INTEGER;

-- DropTable
DROP TABLE "Pet_Photos";

-- DropTable
DROP TABLE "Pet_Tags";

-- CreateTable
CREATE TABLE "PetTags" (
    "petId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "PetTags_pkey" PRIMARY KEY ("petId","tagId")
);

-- CreateTable
CREATE TABLE "PetPhotos" (
    "petId" INTEGER NOT NULL,
    "photoUrl" TEXT NOT NULL,

    CONSTRAINT "PetPhotos_pkey" PRIMARY KEY ("petId","photoUrl")
);

-- AddForeignKey
ALTER TABLE "Pets" ADD CONSTRAINT "Pets_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetTags" ADD CONSTRAINT "PetTags_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetTags" ADD CONSTRAINT "PetTags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetPhotos" ADD CONSTRAINT "PetPhotos_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
