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
    // categories
    for (let category of categories) {
      await prisma.categories.create({
        data: { name: category.name },
      });
    }

    // pets
    for (let pet of pets) {
      await prisma.pets.create({
        data: {
          name: pet.name,
          category_id: pet.category_id,
          status: pet.status,
        },
      });
    }

    // tags
    for (let tag of tags) {
      await prisma.tags.create({
        data: { name: tag.name },
      });
    }

    // pet_tags
    for (let petTag of petTags) {
      await prisma.petTags.upsert({
        where: {
          petId_tagId: {
            petId: petTag.petId,
            tagId: petTag.tagId,
          },
        },
        update: {},
        create: petTag,
      });
    }

    // pet_photos
    for (let petPhoto of petPhotos) {
      await prisma.petPhotos.upsert({
        where: {
          petId_photoUrl: {
            petId: petPhoto.petId,
            photoUrl: petPhoto.photoUrl,
          },
        },
        update: {},
        create: petPhoto,
      });
    }
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
