import { prisma } from "../src/lib/prisma";

const measurementId = "G-JX0K9554KQ";

async function main() {
  const integration = await prisma.integrationSetting.upsert({
    where: { provider: "google_analytics" },
    update: {
      name: "Google Analytics 4",
      isEnabled: true,
      environment: "production",
      publicKey: measurementId,
      extraConfig: JSON.stringify({ measurementId }),
    },
    create: {
      provider: "google_analytics",
      name: "Google Analytics 4",
      isEnabled: true,
      environment: "production",
      publicKey: measurementId,
      extraConfig: JSON.stringify({ measurementId }),
    },
    select: {
      provider: true,
      isEnabled: true,
      environment: true,
      publicKey: true,
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