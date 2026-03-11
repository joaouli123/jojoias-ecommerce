import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

type ConfiguredAdmin = {
  email: string;
  password: string;
  name: string;
};

function getConfiguredAdmin(): ConfiguredAdmin | null {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD?.trim();

  if (!email || !password || password.length < 12) {
    return null;
  }

  return {
    email,
    password,
    name: process.env.ADMIN_NAME?.trim() || "Administrador",
  };
}

export async function syncConfiguredAdmin(inputEmail?: string) {
  const configuredAdmin = getConfiguredAdmin();
  if (!configuredAdmin) {
    return null;
  }

  const normalizedInputEmail = inputEmail?.trim().toLowerCase();
  if (normalizedInputEmail && normalizedInputEmail !== configuredAdmin.email) {
    return null;
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: configuredAdmin.email },
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
      role: true,
    },
  });

  const hasMatchingPassword = existingAdmin?.password
    ? await compare(configuredAdmin.password, existingAdmin.password)
    : false;

  if (!existingAdmin) {
    const passwordHash = await hash(configuredAdmin.password, 10);

    return prisma.user.create({
      data: {
        name: configuredAdmin.name,
        email: configuredAdmin.email,
        password: passwordHash,
        role: "SUPER_ADMIN",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
  }

  if (
    existingAdmin.role === "SUPER_ADMIN" &&
    existingAdmin.name === configuredAdmin.name &&
    hasMatchingPassword
  ) {
    return existingAdmin;
  }

  return prisma.user.update({
    where: { email: configuredAdmin.email },
    data: {
      name: configuredAdmin.name,
      password: hasMatchingPassword ? existingAdmin.password : await hash(configuredAdmin.password, 10),
      role: "SUPER_ADMIN",
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });
}