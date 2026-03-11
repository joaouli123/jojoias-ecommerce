import { prisma } from "@/lib/prisma";

export async function assertProductQuantityAvailable(productId: string, requestedQuantity: number, variantId?: string) {
  if (!productId) {
    throw new Error("Produto inválido.");
  }

  if (!Number.isInteger(requestedQuantity) || requestedQuantity <= 0) {
    throw new Error("Quantidade inválida.");
  }

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      quantity: true,
      variants: {
        where: variantId
          ? {
              id: variantId,
              isActive: true,
            }
          : {
              id: "__unused_variant__",
            },
        select: {
          id: true,
          name: true,
          quantity: true,
        },
      },
    },
  });

  if (!product) {
    throw new Error("Produto indisponível no momento.");
  }

  if (variantId) {
    const variant = product.variants[0];

    if (!variant) {
      throw new Error("Variação indisponível no momento.");
    }

    if (variant.quantity < requestedQuantity) {
      throw new Error(`Estoque insuficiente para ${product.name} - ${variant.name}. Disponível: ${variant.quantity}.`);
    }

    return {
      ...product,
      quantity: variant.quantity,
      variant,
    };
  }

  if (product.quantity < requestedQuantity) {
    throw new Error(`Estoque insuficiente para ${product.name}. Disponível: ${product.quantity}.`);
  }

  return product;
}