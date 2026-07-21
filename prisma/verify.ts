import path from "node:path";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaLibSql({
  url: `file:${path.join(process.cwd(), "dev.db")}`,
});
const db = new PrismaClient({ adapter });

async function main() {
  const counts = {
    users: await db.user.count(),
    organizations: await db.organization.count(),
    facilities: await db.facility.count(),
    systems: await db.engineeringSystem.count(),
    equipment: await db.equipment.count(),
    requests: await db.request.count(),
    offers: await db.offer.count(),
    orders: await db.order.count(),
    stages: await db.orderStage.count(),
    payments: await db.payment.count(),
    documents: await db.document.count(),
    threads: await db.chatThread.count(),
    messages: await db.message.count(),
    reviews: await db.review.count(),
    recommendations: await db.serviceRecommendation.count(),
    proposals: await db.profileChangeProposal.count(),
    notifications: await db.notification.count(),
    auditEvents: await db.auditEvent.count(),
  };
  console.log(JSON.stringify(counts, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
