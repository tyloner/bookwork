import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create demo users
  const password = await bcrypt.hash("password123", 12);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "elena@demo.bookwork.app" },
      update: {},
      create: {
        name: "Elena R.",
        email: "elena@demo.bookwork.app",
        password,
        bio: "Literature teacher by day, voracious reader by night.",
        location: "Paris, France",
        language: "en",
        favoriteGenres: ["Fiction", "Philosophy", "Poetry"],
        readingGoal: 30,
        booksReadThisYear: 24,
      },
    }),
    prisma.user.upsert({
      where: { email: "marcus@demo.bookwork.app" },
      update: {},
      create: {
        name: "Marcus T.",
        email: "marcus@demo.bookwork.app",
        password,
        bio: "Sci-fi nerd. Building rockets and reading about them.",
        location: "Austin, TX",
        language: "en",
        favoriteGenres: ["Science Fiction", "Fantasy", "Technology"],
        readingGoal: 20,
        booksReadThisYear: 18,
      },
    }),
    prisma.user.upsert({
      where: { email: "aisha@demo.bookwork.app" },
      update: {},
      create: {
        name: "Aisha K.",
        email: "aisha@demo.bookwork.app",
        password,
        bio: "History buff and lifelong learner.",
        location: "London, UK",
        language: "en",
        favoriteGenres: ["Non-Fiction", "History", "Science"],
        readingGoal: 25,
        booksReadThisYear: 15,
      },
    }),
  ]);

  // Create books
  const books = await Promise.all([
    prisma.book.upsert({
      where: { isbn: "978-0-14-028329-7" },
      update: {},
      create: {
        title: "The Metamorphosis",
        author: "Franz Kafka",
        isbn: "978-0-14-028329-7",
        genre: ["Fiction", "Philosophy"],
        pageCount: 201,
        language: "en",
        description: "One of Kafka's best-known works, the story of Gregor Samsa who wakes one morning to find himself transformed into a monstrous insect.",
      },
    }),
    prisma.book.upsert({
      where: { isbn: "978-0-441-17271-9" },
      update: {},
      create: {
        title: "Dune",
        author: "Frank Herbert",
        isbn: "978-0-441-17271-9",
        genre: ["Science Fiction", "Fantasy"],
        pageCount: 688,
        language: "en",
        description: "Set on the desert planet Arrakis, a complex tale of politics, religion, ecology, technology, and human emotion.",
      },
    }),
    prisma.book.upsert({
      where: { isbn: "978-0-06-231609-7" },
      update: {},
      create: {
        title: "Sapiens",
        author: "Yuval Noah Harari",
        isbn: "978-0-06-231609-7",
        genre: ["Non-Fiction", "History", "Science"],
        pageCount: 443,
        language: "en",
        description: "A brief history of humankind exploring how Homo sapiens came to dominate Earth.",
      },
    }),
    prisma.book.upsert({
      where: { isbn: "978-0-593-13520-4" },
      update: {},
      create: {
        title: "Project Hail Mary",
        author: "Andy Weir",
        isbn: "978-0-593-13520-4",
        genre: ["Science Fiction"],
        pageCount: 476,
        language: "en",
        description: "A lone astronaut must save Earth from disaster in this interstellar adventure.",
      },
    }),
    prisma.book.upsert({
      where: { isbn: "978-0-375-70402-4" },
      update: {},
      create: {
        title: "Norwegian Wood",
        author: "Haruki Murakami",
        isbn: "978-0-375-70402-4",
        genre: ["Fiction", "Romance"],
        pageCount: 296,
        language: "en",
        description: "A nostalgic story of loss and sexuality set in 1960s Japan.",
      },
    }),
  ]);

  // Create spaces
  const spaces = await Promise.all([
    prisma.space.create({
      data: {
        name: "Deep dive into Kafka's Metamorphosis",
        description: "Let's explore the themes of alienation, identity, and absurdism in Kafka's masterwork.",
        bookId: books[0].id,
        ownerId: users[0].id,
        type: "CHAT",
        language: "en",
        genre: ["Fiction", "Philosophy"],
        maxMembers: 20,
        members: {
          create: { userId: users[0].id, role: "OWNER" },
        },
      },
    }),
    prisma.space.create({
      data: {
        name: "Dune Book Club — Live Discussion",
        description: "Reading Dune together chapter by chapter. Live calls every Sunday at 6pm EST.",
        bookId: books[1].id,
        ownerId: users[1].id,
        type: "CALL",
        language: "en",
        genre: ["Science Fiction", "Fantasy"],
        maxMembers: 18,
        scheduledAt: new Date(Date.now() + 86400000 * 3),
        duration: 90,
        members: {
          create: { userId: users[1].id, role: "OWNER" },
        },
      },
    }),
    prisma.space.create({
      data: {
        name: "Sapiens — History Lovers Unite",
        description: "Discussing Harari's perspective on the cognitive revolution and beyond.",
        bookId: books[2].id,
        ownerId: users[2].id,
        type: "HYBRID",
        language: "en",
        genre: ["Non-Fiction", "History", "Science"],
        maxMembers: 15,
        members: {
          create: { userId: users[2].id, role: "OWNER" },
        },
      },
    }),
  ]);

  // Add some members to spaces
  await prisma.spaceMember.createMany({
    data: [
      { userId: users[1].id, spaceId: spaces[0].id, role: "MEMBER" },
      { userId: users[2].id, spaceId: spaces[0].id, role: "MEMBER" },
      { userId: users[0].id, spaceId: spaces[1].id, role: "MEMBER" },
      { userId: users[0].id, spaceId: spaces[2].id, role: "MEMBER" },
    ],
    skipDuplicates: true,
  });

  // Add some messages
  await prisma.message.createMany({
    data: [
      { content: "Welcome to the Kafka reading group! Excited to discuss.", type: "TEXT", userId: users[0].id, spaceId: spaces[0].id },
      { content: "Just finished the first chapter — the imagery is haunting.", type: "TEXT", userId: users[1].id, spaceId: spaces[0].id },
      { content: "The way Kafka uses Gregor's transformation as a metaphor is brilliant.", type: "TEXT", userId: users[2].id, spaceId: spaces[0].id },
      { content: "Who's ready for our first live discussion of Dune?", type: "TEXT", userId: users[1].id, spaceId: spaces[1].id },
      { content: "Can't wait! I'm halfway through Part One.", type: "TEXT", userId: users[0].id, spaceId: spaces[1].id },
    ],
  });

  // Add user books
  await prisma.userBook.createMany({
    data: [
      { userId: users[0].id, bookId: books[0].id, status: "READING", progress: 65 },
      { userId: users[0].id, bookId: books[4].id, status: "READING", progress: 30 },
      { userId: users[1].id, bookId: books[1].id, status: "READING", progress: 45 },
      { userId: users[1].id, bookId: books[0].id, status: "READING", progress: 20 },
      { userId: users[2].id, bookId: books[2].id, status: "READING", progress: 55 },
      { userId: users[2].id, bookId: books[1].id, status: "READING", progress: 10 },
    ],
    skipDuplicates: true,
  });

  console.log("Seed complete!");
  console.log(`Created ${users.length} users, ${books.length} books, ${spaces.length} spaces`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
