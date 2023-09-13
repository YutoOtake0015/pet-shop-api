-- CreateTable
CREATE TABLE "Pets" (
    "id" SERIAL NOT NULL,
    "category_id" INTEGER,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "Pets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tags" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pet_Tags" (
    "pet_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "Pet_Tags_pkey" PRIMARY KEY ("pet_id","tag_id")
);

-- CreateTable
CREATE TABLE "Pet_Photos" (
    "pet_id" INTEGER NOT NULL,
    "photo_url" TEXT NOT NULL,

    CONSTRAINT "Pet_Photos_pkey" PRIMARY KEY ("pet_id","photo_url")
);

-- AddForeignKey
ALTER TABLE "Pets" ADD CONSTRAINT "Pets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pet_Tags" ADD CONSTRAINT "Pet_Tags_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "Pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pet_Tags" ADD CONSTRAINT "Pet_Tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "Tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pet_Photos" ADD CONSTRAINT "Pet_Photos_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "Pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
