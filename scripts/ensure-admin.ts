import { hash } from "bcryptjs";
import { prisma } from "../src/lib/prisma";

function readRequiredEnv(key: string) {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new Error(`Variável obrigatória ausente: ${key}`);
  }

  return value;
}

async function main() {
  const email = readRequiredEnv("ADMIN_EMAIL").toLowerCase();
  const password = readRequiredEnv("ADMIN_PASSWORD");
  const name = process.env.ADMIN_NAME?.trim() || "Administrador";

  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD deve ter ao menos 12 caracteres.");
  }

  const passwordHash = await hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      password: passwordHash,
      role: "SUPER_ADMIN",
    },
    create: {
      name,
      email,
      password: passwordHash,
      role: "SUPER_ADMIN",
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  console.log(JSON.stringify({ admin, passwordUpdated: true }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });