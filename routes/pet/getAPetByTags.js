require("dotenv").config();
const express = require("express");
const router = express.Router();

// Initialize Prisma Client instance
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Middleware applied
router.use(express.json());

// Search a pets by tags
router.get("/findByTags", async (req, res) => {
  try {
    // Get request
    const tagsArray = req.query.tags.split(",");

    // Check request's tags
    let invalidTags = [];
    for (let tagName of tagsArray) {
      const countTagName = await prisma.tags.count({
        where: {
          name: tagName,
        },
      });
      if (countTagName === 0) {
        invalidTags.push(tagName);
      }
    }
    if (invalidTags.length) {
      return res.status(400).json({
        code: 400,
        type: "Bad Request",
        message: `Invalid status value: [${invalidTags}]`,
      });
    }

    // Search pet
    const pets = await prisma.pets.findMany({
      orderBy: [{ id: "asc" }],
      where: {
        petTags: {
          some: {
            tags: {
              name: {
                in: tagsArray,
              },
            },
          },
        },
      },
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
    console.log(pets);

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
  } catch (error) {
    console.log(error.message);
    return res.status(500).send({
      code: 500,
      type: "Internal Server Error",
      message: error.message,
    });
  }
});

module.exports = router;
