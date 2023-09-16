const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// data
const pets = require("./seedData/pets");
const categories = require("./seedData/categories");
const tags = require("./seedData/tags");
const petTags = require("./seedData/petTags");
const petPhotos = require("./seedData/petPhotos");

// Create initial data
const main = async () => {
  await prisma.$transaction(async (prisma) => {
    // Categories
    await prisma.categories.createMany({
      data: categories,
    });

    // Pets
    await prisma.pets.createMany({
      data: pets,
    });

    // Tags
    await prisma.tags.createMany({
      data: tags,
    });

    //  PetTags
    await prisma.petTags.createMany({
      data: petTags,
    });

    // PetPhotos
    await prisma.petPhotos.createMany({
      data: petPhotos,
    });
  });
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
