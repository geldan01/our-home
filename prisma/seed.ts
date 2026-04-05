import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await hash("password123", 12);

  await prisma.user.upsert({
    where: { email: "admin@ourhome.test" },
    update: {},
    create: {
      email: "admin@ourhome.test",
      name: "Test Admin",
      hashedPassword,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "member@ourhome.test" },
    update: {},
    create: {
      email: "member@ourhome.test",
      name: "Test Member",
      hashedPassword,
      role: "MEMBER",
    },
  });

  console.log("Seeded test users: admin@ourhome.test, member@ourhome.test");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
