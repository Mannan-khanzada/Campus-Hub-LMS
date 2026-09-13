require("dotenv").config();
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@college.edu";
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log("Admin already exists:", adminEmail);
    return;
  }
  const hashed = await bcrypt.hash("Admin@123", 10);
  await prisma.user.create({
    data: {
      name: "System Admin",
      email: adminEmail,
      password: hashed,
      role: "ADMIN",
    },
  });
  console.log("✅ Admin account created:");
  console.log("   Email:    admin@college.edu");
  console.log("   Password: Admin@123");
  console.log("   ⚠️  Change this password immediately after first login!");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
