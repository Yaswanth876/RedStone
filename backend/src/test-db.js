
import prisma from "./db.js";

try {
  await prisma.$connect();

  const result = await prisma.$queryRaw`SELECT current_database() AS database`;

  console.log("Database connected successfully!");
  console.log(result);
} catch (error) {
  console.error("Database connection failed:", error.message);
} finally {
  await prisma.$disconnect();
}
