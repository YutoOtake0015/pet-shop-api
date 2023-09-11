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
      where: {
        pet_tags: {
          some: {
            tag: {
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

    return res.status(200).json(formattedPets);
  } catch (error) {
    return res.status(500).send({
      code: 500,
      type: "Internal Server Error",
      message: error.message,
    });
  }
});

module.exports = router;
