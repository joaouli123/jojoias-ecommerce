"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { addressSchema } from "@/lib/validators";
import { DEFAULT_COUNTRY } from "@/lib/constants";

function readField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function requireUser() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Faça login para gerenciar seus endereços.");
  }

  return session.user;
}

export async function createAddressAction(formData: FormData) {
  const user = await requireUser();

  const parsed = addressSchema.safeParse({
    recipient: readField(formData, "recipient"),
    zipcode: readField(formData, "zipcode"),
    street: readField(formData, "street"),
    number: readField(formData, "number"),
    district: readField(formData, "district"),
    city: readField(formData, "city"),
    state: readField(formData, "state").toUpperCase(),
    complement: readField(formData, "complement"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Dados do endereço inválidos.");
  }

  const label = readField(formData, "label");

  await prisma.address.create({
    data: {
      userId: user.id,
      label: label || null,
      country: DEFAULT_COUNTRY,
      ...parsed.data,
      complement: parsed.data.complement || null,
    },
  });

  revalidatePath("/account");
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
}

export async function deleteAddressAction(formData: FormData) {
  const user = await requireUser();
  const id = readField(formData, "id");

  if (!id) {
    throw new Error("Endereço inválido.");
  }

  await prisma.address.deleteMany({
    where: {
      id,
      userId: user.id,
    },
  });

  revalidatePath("/account");
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
}