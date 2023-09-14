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
      petPhotos: {
        select: {
          photoUrl: true,
        },
      },
      petTags: {
        select: {
          tags: {
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
      photoUrls: pet.petPhotos.map((photo) => photo.photoUrl),
      tags: pet.petTags.map((petTag) => ({
        id: petTag.tags.id,
        name: petTag.tags.name,
      })),
      status: pet.status,
    };
  });

  return res.status(200).json(formattedPets);
});

module.exports = router;
