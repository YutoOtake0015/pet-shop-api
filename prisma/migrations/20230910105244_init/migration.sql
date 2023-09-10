-- CreateTable
CREATE TABLE "Pets" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category_id" INTEGER,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    CONSTRAINT "Pets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Categories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Tags" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Pet_Tags" (
    "pet_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,

    PRIMARY KEY ("pet_id", "tag_id"),
    CONSTRAINT "Pet_Tags_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "Pets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Pet_Tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "Tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pet_Photos" (
    "pet_id" INTEGER NOT NULL,
    "photo_url" TEXT NOT NULL,

    PRIMARY KEY ("pet_id", "photo_url"),
    CONSTRAINT "Pet_Photos_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "Pets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
