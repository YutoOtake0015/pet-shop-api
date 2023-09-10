require("dotenv").config();
const express = require("express");
const router = express.Router();

// Initialize Prisma Client instance
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Middleware applied
router.use(express.json());

// Get all pets
router.get("/", async (req, res) => {
  const pets = await prisma.pets.findMany({
    select: {
      id: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      name: true,
      pet_photos: {
        select: {
          photo_url: true,
        },
      },
      pet_tags: {
        select: {
          tag: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      status: true,
    },
  });

  // formatted response
  const formattedPets = pets.map((pet) => {
    return {
      id: pet.id,
      category: pet.category,
      name: pet.name,
      photoUrls: pet.pet_photos.map((photo) => photo.photo_url),
      tags: pet.pet_tags.map((pet_tag) => ({
        id: pet_tag.tag.id,
        name: pet_tag.tag.name,
      })),
      status: pet.status,
    };
  });

  return res.json(formattedPets);
});

module.exports = router;
