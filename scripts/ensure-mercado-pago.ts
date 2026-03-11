import { prisma } from "../src/lib/prisma";

const publicKey = process.env.MP_PUBLIC_KEY || "";
const accessToken = process.env.MP_ACCESS_TOKEN || "";
const webhookSecret = process.env.MP_WEBHOOK_SECRET || "";
const endpointUrl = process.env.MP_API_BASE_URL || "https://api.mercadopago.com";
const environment = process.env.MP_ENVIRONMENT || "production";

async function main() {
  if (!publicKey || !accessToken || !webhookSecret) {
    throw new Error("Defina MP_PUBLIC_KEY, MP_ACCESS_TOKEN e MP_WEBHOOK_SECRET antes de executar este script.");
  }

  const extraConfig = JSON.stringify(
    {
      notificationMode: "webhooks",
      notificationUrl: "https://luxijoias.com.br/api/webhooks/mercado-pago",
      sourceNews: "webhooks",
    },
    null,
    2,
  );

  const integration = await prisma.integrationSetting.upsert({
    where: { provider: "mercado_pago" },
    update: {
      name: "Mercado Pago",
      isEnabled: true,
      environment,
      publicKey,
      secretKey: accessToken,
      webhookSecret,
      endpointUrl,
      extraConfig,
    },
    create: {
      provider: "mercado_pago",
      name: "Mercado Pago",
      isEnabled: true,
      environment,
      publicKey,
      secretKey: accessToken,
      webhookSecret,
      endpointUrl,
      extraConfig,
    },
    select: {
      provider: true,
      isEnabled: true,
      environment: true,
      publicKey: true,
      endpointUrl: true,
      webhookSecret: true,
      extraConfig: true,
    },
  });

  console.log(JSON.stringify({ integration }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
