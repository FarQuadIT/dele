/**
 * Сид демо-данными: заказчик/исполнитель/админ, объект с цифровым профилем,
 * заявки в разных статусах, отклики, заказ с этапами, отзывы, рекомендации.
 * Запуск: npm run db:seed (идемпотентно — предварительно чистит таблицы).
 */
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaLibSql({
  url: `file:${path.join(process.cwd(), "dev.db")}`,
});
const db = new PrismaClient({ adapter });

const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (d: number) => new Date(Date.now() + d * DAY);

async function main() {
  console.log("Очистка таблиц...");
  // Порядок важен из-за внешних ключей
  await db.auditEvent.deleteMany();
  await db.notification.deleteMany();
  await db.review.deleteMany();
  await db.profileChangeProposal.deleteMany();
  await db.dispute.deleteMany();
  await db.inspection.deleteMany();
  await db.refund.deleteMany();
  await db.payment.deleteMany();
  await db.contract.deleteMany();
  await db.documentVersion.deleteMany();
  await db.document.deleteMany();
  await db.message.deleteMany();
  await db.chatThread.deleteMany();
  await db.stageEvidence.deleteMany();
  await db.orderStage.deleteMany();
  await db.orderParticipant.deleteMany();
  await db.equipmentVersion.deleteMany();
  await db.serviceRecommendation.deleteMany();
  await db.request.updateMany({ data: { acceptedOfferId: null } });
  await db.order.deleteMany();
  await db.offerVersion.deleteMany();
  await db.offer.deleteMany();
  await db.requestAttachment.deleteMany();
  await db.request.deleteMany();
  await db.equipment.deleteMany();
  await db.subsystem.deleteMany();
  await db.engineeringSystem.deleteMany();
  await db.zone.deleteMany();
  await db.floor.deleteMany();
  await db.building.deleteMany();
  await db.facilityAccess.deleteMany();
  await db.facility.deleteMany();
  await db.organizationMember.deleteMany();
  await db.organization.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.user.deleteMany();

  console.log("Пользователи...");
  const passwordHash = await bcrypt.hash("demo1234", 10);

  const customer = await db.user.create({
    data: {
      email: "customer@dele.ru",
      phone: "+79990000001",
      passwordHash,
      name: "Дмитрий Заказчиков",
      role: "CUSTOMER",
    },
  });

  const contractorOwner = await db.user.create({
    data: {
      email: "contractor@dele.ru",
      phone: "+79990000002",
      passwordHash,
      name: "Сергей Монтажников",
      role: "CONTRACTOR",
    },
  });

  const contractorEmployee = await db.user.create({
    data: {
      email: "engineer@dele.ru",
      phone: "+79990000003",
      passwordHash,
      name: "Алексей Инженеров",
      role: "CONTRACTOR",
    },
  });

  const admin = await db.user.create({
    data: {
      email: "admin@dele.ru",
      phone: "+79990000009",
      passwordHash,
      name: "Администратор DELE",
      role: "ADMIN",
    },
  });

  console.log("Организации...");
  const orgFlow = await db.organization.create({
    data: {
      name: "FLOW Engineering",
      slug: "flow-engineering",
      inn: "7701234567",
      description:
        "Проектирование, монтаж и обслуживание вентиляции и кондиционирования. Работаем с частными домами и коммерческими объектами.",
      phone: "+74950000001",
      email: "hello@flow-eng.ru",
      website: "https://flow-eng.ru",
      regionsServed: ["Москва", "Московская область"],
      specializations: ["AIR", "HEATING"],
      verificationStatus: "VERIFIED",
      verifiedAt: daysFromNow(-120),
      ratingAvg: 4.9,
      ratingCount: 37,
      members: {
        create: [
          { userId: contractorOwner.id, role: "OWNER", position: "Директор" },
          {
            userId: contractorEmployee.id,
            role: "EMPLOYEE",
            position: "Ведущий инженер",
          },
        ],
      },
    },
  });

  const orgWat = await db.organization.create({
    data: {
      name: "Wat-Ing",
      slug: "wat-ing",
      inn: "7707654321",
      description:
        "Водоснабжение и водоотведение под ключ: скважины, насосные станции, фильтрация.",
      phone: "+74950000002",
      email: "info@wat-ing.ru",
      regionsServed: ["Москва", "Московская область", "Калужская область"],
      specializations: ["WATER", "DRAINAGE"],
      verificationStatus: "VERIFIED",
      verifiedAt: daysFromNow(-200),
      ratingAvg: 4.7,
      ratingCount: 21,
    },
  });

  const orgWarm = await db.organization.create({
    data: {
      name: "Warm-Tec",
      slug: "warm-tec",
      description:
        "Отопление: котельные, радиаторы, тёплые полы. Сервисные контракты.",
      phone: "+74950000003",
      email: "service@warm-tec.ru",
      regionsServed: ["Московская область"],
      specializations: ["HEATING"],
      verificationStatus: "PENDING",
      ratingAvg: 5.0,
      ratingCount: 8,
    },
  });

  console.log("Объект и цифровой профиль...");
  const facility = await db.facility.create({
    data: {
      ownerId: customer.id,
      title: "Загородный дом",
      type: "HOUSE",
      address: "Московская обл., Истринский р-н, д. Лесная, ул. Сосновая, 12",
      region: "Московская область",
      area: 214,
      floorsCount: 2,
      buildYear: 2019,
      description: "Двухэтажный дом из газобетона с автономными системами.",
    },
  });

  const building = await db.building.create({
    data: {
      facilityId: facility.id,
      name: "Основной дом",
      floors: {
        create: [
          {
            number: 1,
            name: "Первый этаж",
            zones: {
              create: [
                { name: "Котельная" },
                { name: "Кухня-гостиная" },
                { name: "Санузел 1" },
              ],
            },
          },
          {
            number: 2,
            name: "Второй этаж",
            zones: {
              create: [{ name: "Спальни" }, { name: "Санузел 2" }],
            },
          },
        ],
      },
    },
    include: { floors: { include: { zones: true } } },
  });

  const boilerRoom = building.floors[0].zones.find(
    (z) => z.name === "Котельная",
  )!;
  const livingRoom = building.floors[0].zones.find(
    (z) => z.name === "Кухня-гостиная",
  )!;

  const sysWater = await db.engineeringSystem.create({
    data: {
      facilityId: facility.id,
      type: "WATER",
      name: "Водоснабжение",
      notes: "Скважина 42 м, кессон, магистраль ПНД-32.",
    },
  });

  const sysHeating = await db.engineeringSystem.create({
    data: {
      facilityId: facility.id,
      type: "HEATING",
      name: "Отопление",
      notes: "Газовый котёл, радиаторы + тёплый пол первого этажа.",
    },
  });

  const sysAir = await db.engineeringSystem.create({
    data: {
      facilityId: facility.id,
      type: "AIR",
      name: "Вентиляция и кондиционирование",
      subsystems: {
        create: [
          { name: "Приточная вентиляция" },
          { name: "Кондиционирование" },
        ],
      },
    },
    include: { subsystems: true },
  });

  const sysElectric = await db.engineeringSystem.create({
    data: {
      facilityId: facility.id,
      type: "ELECTRICITY",
      name: "Электроснабжение",
      notes: "Ввод 15 кВт, трёхфазный. Щит на 24 модуля.",
    },
  });

  const pump = await db.equipment.create({
    data: {
      facilityId: facility.id,
      systemId: sysWater.id,
      zoneId: boilerRoom.id,
      name: "Скважинный насос",
      brand: "Grundfos",
      model: "SQ 3-65",
      serialNumber: "GR-2019-448812",
      installedAt: daysFromNow(-1900),
      warrantyUntil: daysFromNow(-100),
      serviceIntervalDays: 365,
      lastServiceAt: daysFromNow(-300),
      specs: { power: "1.05 кВт", head: "65 м", flow: "3 м³/ч" },
    },
  });

  const boiler = await db.equipment.create({
    data: {
      facilityId: facility.id,
      systemId: sysHeating.id,
      zoneId: boilerRoom.id,
      name: "Газовый котёл",
      brand: "Viessmann",
      model: "Vitodens 100-W 26 кВт",
      serialNumber: "VS-100-778231",
      installedAt: daysFromNow(-1850),
      warrantyUntil: daysFromNow(300),
      serviceIntervalDays: 365,
      lastServiceAt: daysFromNow(-347),
      specs: { power: "26 кВт", type: "конденсационный" },
    },
  });

  const ac = await db.equipment.create({
    data: {
      facilityId: facility.id,
      systemId: sysAir.id,
      subsystemId: sysAir.subsystems.find(
        (s) => s.name === "Кондиционирование",
      )!.id,
      zoneId: livingRoom.id,
      name: "Кондиционер (гостиная)",
      brand: "Daikin",
      model: "FTXM35R",
      serialNumber: "DK-35R-99120",
      installedAt: daysFromNow(-800),
      warrantyUntil: daysFromNow(295),
      serviceIntervalDays: 180,
      lastServiceAt: daysFromNow(-166),
      specs: { cooling: "3.5 кВт", inverter: true, refrigerant: "R-32" },
    },
  });

  await db.equipmentVersion.create({
    data: {
      equipmentId: boiler.id,
      version: 1,
      data: { event: "Установка котла", by: "Warm-Tec" },
      authorId: contractorOwner.id,
      comment: "Первичная установка и пусконаладка",
    },
  });

  console.log("Рекомендации...");
  await db.serviceRecommendation.createMany({
    data: [
      {
        facilityId: facility.id,
        equipmentId: boiler.id,
        systemId: sysHeating.id,
        title: "Плановое ТО газового котла",
        reason: "Регламент производителя: ежегодное обслуживание",
        severity: "IMPORTANT",
        status: "ACTIVE",
        dueAt: daysFromNow(18),
        lastServiceAt: daysFromNow(-347),
        createdByOrgId: orgWarm.id,
      },
      {
        facilityId: facility.id,
        equipmentId: ac.id,
        systemId: sysAir.id,
        title: "Чистка фильтров и проверка фреона",
        reason: "Прошло более 5 месяцев с последнего обслуживания",
        severity: "ADVISORY",
        status: "ACTIVE",
        dueAt: daysFromNow(14),
        lastServiceAt: daysFromNow(-166),
        createdByOrgId: orgFlow.id,
      },
      {
        facilityId: facility.id,
        equipmentId: pump.id,
        systemId: sysWater.id,
        title: "Диагностика скважинного насоса",
        reason: "Гарантия истекла, рекомендована профилактика",
        severity: "INFO",
        status: "POSTPONED",
        dueAt: daysFromNow(60),
        createdByUserId: admin.id,
      },
    ],
  });

  console.log("Заявки...");
  // Черновик
  await db.request.create({
    data: {
      customerId: customer.id,
      facilityId: facility.id,
      systemId: sysElectric.id,
      type: "RETROFIT",
      status: "DRAFT",
      title: "Установить стабилизатор напряжения",
      description: "Периодические просадки напряжения по вечерам.",
      urgency: "LOW",
    },
  });

  // Опубликованная (без откликов)
  await db.request.create({
    data: {
      customerId: customer.id,
      facilityId: facility.id,
      systemId: sysWater.id,
      equipmentId: pump.id,
      type: "SERVICE_ONE_TIME",
      status: "PUBLISHED",
      title: "Профилактика скважинного насоса",
      description:
        "Насос работает 5 лет, хочу диагностику и профилактику перед сезоном.",
      urgency: "NORMAL",
      desiredDateFrom: daysFromNow(7),
      desiredDateTo: daysFromNow(21),
      publishedAt: daysFromNow(-2),
      expiresAt: daysFromNow(12),
      budgetMax: 1500000,
    },
  });

  // С откликами (сравнение)
  const reqAcService = await db.request.create({
    data: {
      customerId: customer.id,
      facilityId: facility.id,
      systemId: sysAir.id,
      equipmentId: ac.id,
      type: "SERVICE_ONE_TIME",
      status: "HAS_OFFERS",
      title: "Обслуживание кондиционера: чистка и заправка",
      description:
        "Daikin FTXM35R в гостиной. Нужна чистка фильтров, проверка давления фреона, при необходимости дозаправка.",
      urgency: "NORMAL",
      desiredDateFrom: daysFromNow(5),
      desiredDateTo: daysFromNow(15),
      publishedAt: daysFromNow(-4),
      expiresAt: daysFromNow(10),
      budgetMax: 1200000,
      attachments: {
        create: [
          {
            fileName: "photo-conditioner.jpg",
            fileUrl: "/demo/photo-conditioner.jpg",
            fileSize: 482133,
            mimeType: "image/jpeg",
          },
        ],
      },
    },
  });

  const offerFlow = await db.offer.create({
    data: {
      requestId: reqAcService.id,
      organizationId: orgFlow.id,
      authorId: contractorOwner.id,
      status: "SENT",
      priceTotal: 850000,
      priceMaterials: 150000,
      durationDays: 1,
      validUntil: daysFromNow(7),
      warrantyMonths: 6,
      stagesPlan: [
        "Диагностика",
        "Чистка фильтров и теплообменника",
        "Проверка давления, дозаправка",
        "Тестовый запуск",
      ],
      comment:
        "Выезд в течение 3 дней. В стоимость входит выезд и расходные материалы.",
      availableDates: [
        daysFromNow(6).toISOString(),
        daysFromNow(8).toISOString(),
      ],
      currentVersion: 1,
    },
  });

  await db.offerVersion.create({
    data: {
      offerId: offerFlow.id,
      version: 1,
      data: { priceTotal: 850000, durationDays: 1, warrantyMonths: 6 },
    },
  });

  const offerWat = await db.offer.create({
    data: {
      requestId: reqAcService.id,
      organizationId: orgWat.id,
      authorId: contractorOwner.id,
      status: "SENT",
      priceTotal: 700000,
      durationDays: 1,
      validUntil: daysFromNow(5),
      warrantyMonths: 3,
      comment: "Стоимость без дозаправки — фреон оплачивается отдельно.",
      currentVersion: 1,
    },
  });

  await db.offerVersion.create({
    data: {
      offerId: offerWat.id,
      version: 1,
      data: { priceTotal: 700000, durationDays: 1, warrantyMonths: 3 },
    },
  });

  console.log("Заявка -> заказ (монтаж вентиляции)...");
  const reqVent = await db.request.create({
    data: {
      customerId: customer.id,
      facilityId: facility.id,
      systemId: sysAir.id,
      type: "INSTALLATION",
      status: "CONVERTED",
      title: "Монтаж приточной вентиляции",
      description:
        "Приточная установка с подогревом и фильтрацией на первый этаж, разводка по кухне-гостиной.",
      urgency: "NORMAL",
      publishedAt: daysFromNow(-30),
      needsWarranty: true,
      budgetMax: 35000000,
    },
  });

  const offerVent = await db.offer.create({
    data: {
      requestId: reqVent.id,
      organizationId: orgFlow.id,
      authorId: contractorOwner.id,
      status: "ACCEPTED",
      priceTotal: 28500000,
      priceMaterials: 16200000,
      durationDays: 14,
      warrantyMonths: 24,
      paymentSchedule: { prepayment: 0.4, final: 0.6 },
      stagesPlan: [
        "Обследование объекта",
        "Подготовка проекта",
        "Поставка оборудования",
        "Монтаж",
        "Пусконаладка",
        "Приёмка",
      ],
      comment: "Установка Systemair с рекуперацией, гарантия 2 года.",
      currentVersion: 1,
    },
  });

  await db.offerVersion.create({
    data: {
      offerId: offerVent.id,
      version: 1,
      data: {
        priceTotal: 28500000,
        durationDays: 14,
        warrantyMonths: 24,
        note: "Зафиксировано при принятии",
      },
    },
  });

  await db.request.update({
    where: { id: reqVent.id },
    data: { acceptedOfferId: offerVent.id },
  });

  const order = await db.order.create({
    data: {
      number: "DELE-2026-0142",
      requestId: reqVent.id,
      offerId: offerVent.id,
      customerId: customer.id,
      organizationId: orgFlow.id,
      facilityId: facility.id,
      status: "IN_PROGRESS",
      priceTotal: 28500000,
      prepaymentAmount: 11400000,
      scheduledStartAt: daysFromNow(-10),
      scheduledEndAt: daysFromNow(4),
      startedAt: daysFromNow(-10),
      addressRevealed: true,
      participants: {
        create: [
          { userId: contractorOwner.id, roleNote: "Руководитель работ" },
          { userId: contractorEmployee.id, roleNote: "Монтажник" },
        ],
      },
    },
  });

  console.log("Этапы заказа...");
  const stageNames: {
    name: string;
    status: "DONE" | "IN_PROGRESS" | "PENDING";
    offsetDays: number;
  }[] = [
    { name: "Обследование объекта", status: "DONE", offsetDays: -10 },
    { name: "Подготовка проекта", status: "DONE", offsetDays: -7 },
    { name: "Поставка оборудования", status: "IN_PROGRESS", offsetDays: -2 },
    { name: "Монтаж", status: "PENDING", offsetDays: 1 },
    { name: "Пусконаладка", status: "PENDING", offsetDays: 3 },
    { name: "Приёмка", status: "PENDING", offsetDays: 4 },
  ];

  for (let i = 0; i < stageNames.length; i++) {
    const s = stageNames[i];
    const stage = await db.orderStage.create({
      data: {
        orderId: order.id,
        index: i + 1,
        name: s.name,
        status: s.status,
        plannedAt: daysFromNow(s.offsetDays),
        startedAt: s.status !== "PENDING" ? daysFromNow(s.offsetDays) : null,
        completedAt: s.status === "DONE" ? daysFromNow(s.offsetDays + 2) : null,
      },
    });
    if (s.status === "DONE") {
      await db.stageEvidence.create({
        data: {
          stageId: stage.id,
          type: "PHOTO",
          fileUrl: `/demo/stage-${i + 1}.jpg`,
          note: `Фотоотчёт: ${s.name.toLowerCase()}`,
          createdById: contractorEmployee.id,
        },
      });
    }
  }

  console.log("Договор, платежи, документы...");
  await db.contract.create({
    data: {
      orderId: order.id,
      terms: {
        subject: "Монтаж приточной вентиляции",
        warrantyMonths: 24,
        totalRub: 285000,
      },
      signedByCustomerAt: daysFromNow(-12),
      signedByContractorAt: daysFromNow(-12),
    },
  });

  await db.payment.create({
    data: {
      orderId: order.id,
      kind: "PREPAYMENT",
      status: "SUCCEEDED",
      amount: 11400000,
      externalId: "pay_demo_0001",
      idempotencyKey: "order-0142-prepayment",
      paidAt: daysFromNow(-11),
    },
  });

  await db.payment.create({
    data: {
      orderId: order.id,
      kind: "FINAL",
      status: "PENDING",
      amount: 17100000,
      idempotencyKey: "order-0142-final",
    },
  });

  const projectDoc = await db.document.create({
    data: {
      category: "SCHEME",
      title: "Проект вентиляции (аксонометрия)",
      facilityId: facility.id,
      orderId: order.id,
      versions: {
        create: [
          {
            version: 1,
            fileUrl: "/demo/vent-project-v1.pdf",
            fileName: "vent-project-v1.pdf",
            fileSize: 2411000,
            mimeType: "application/pdf",
            uploadedById: contractorOwner.id,
          },
        ],
      },
    },
  });

  await db.documentVersion.create({
    data: {
      documentId: projectDoc.id,
      version: 2,
      fileUrl: "/demo/vent-project-v2.pdf",
      fileName: "vent-project-v2.pdf",
      fileSize: 2544000,
      mimeType: "application/pdf",
      uploadedById: contractorOwner.id,
    },
  });

  await db.document.update({
    where: { id: projectDoc.id },
    data: { currentVersion: 2 },
  });

  await db.document.create({
    data: {
      category: "EQUIPMENT_PASSPORT",
      title: "Паспорт котла Viessmann Vitodens 100-W",
      facilityId: facility.id,
      equipmentId: boiler.id,
      versions: {
        create: [
          {
            version: 1,
            fileUrl: "/demo/boiler-passport.pdf",
            fileName: "boiler-passport.pdf",
            fileSize: 1811000,
            mimeType: "application/pdf",
            uploadedById: customer.id,
          },
        ],
      },
    },
  });

  console.log("Чаты...");
  const threadOffer = await db.chatThread.create({
    data: {
      kind: "OFFER",
      requestId: reqAcService.id,
      offerId: offerFlow.id,
      messages: {
        create: [
          {
            authorId: contractorOwner.id,
            body: "Добрый день! Готовы выполнить обслуживание в четверг или субботу. Фреон, если потребуется, есть с собой.",
          },
          {
            authorId: customer.id,
            body: "Здравствуйте! Суббота подходит. Сколько по времени займёт?",
          },
          {
            authorId: contractorOwner.id,
            body: "Около 1,5–2 часов вместе с проверкой давления.",
          },
        ],
      },
    },
  });

  await db.chatThread.create({
    data: {
      kind: "ORDER",
      orderId: order.id,
      messages: {
        create: [
          {
            authorId: contractorEmployee.id,
            body: "Оборудование заказано, поставка ожидается в течение 2 дней. Фото проекта приложил к этапу.",
          },
          {
            authorId: customer.id,
            body: "Отлично, спасибо! Ключи у охраны, как договаривались.",
          },
        ],
      },
    },
  });

  console.log("Завершённый заказ с отзывами...");
  const reqBoilerService = await db.request.create({
    data: {
      customerId: customer.id,
      facilityId: facility.id,
      systemId: sysHeating.id,
      equipmentId: boiler.id,
      type: "SERVICE_ONE_TIME",
      status: "CONVERTED",
      title: "Годовое ТО газового котла",
      description: "Плановое ежегодное обслуживание котла Viessmann.",
      publishedAt: daysFromNow(-360),
    },
  });

  const offerBoiler = await db.offer.create({
    data: {
      requestId: reqBoilerService.id,
      organizationId: orgWarm.id,
      authorId: contractorOwner.id,
      status: "ACCEPTED",
      priceTotal: 1200000,
      durationDays: 1,
      warrantyMonths: 12,
      currentVersion: 1,
    },
  });

  await db.offerVersion.create({
    data: {
      offerId: offerBoiler.id,
      version: 1,
      data: { priceTotal: 1200000 },
    },
  });

  await db.request.update({
    where: { id: reqBoilerService.id },
    data: { acceptedOfferId: offerBoiler.id },
  });

  const orderDone = await db.order.create({
    data: {
      number: "DELE-2025-0089",
      requestId: reqBoilerService.id,
      offerId: offerBoiler.id,
      customerId: customer.id,
      organizationId: orgWarm.id,
      facilityId: facility.id,
      status: "COMPLETED",
      priceTotal: 1200000,
      prepaymentAmount: 0,
      scheduledStartAt: daysFromNow(-347),
      scheduledEndAt: daysFromNow(-347),
      startedAt: daysFromNow(-347),
      completedAt: daysFromNow(-347),
      addressRevealed: true,
      stages: {
        create: [
          {
            index: 1,
            name: "Диагностика",
            status: "DONE",
            completedAt: daysFromNow(-347),
          },
          {
            index: 2,
            name: "Обслуживание",
            status: "DONE",
            completedAt: daysFromNow(-347),
          },
          {
            index: 3,
            name: "Приёмка",
            status: "DONE",
            completedAt: daysFromNow(-347),
          },
        ],
      },
    },
  });

  await db.payment.create({
    data: {
      orderId: orderDone.id,
      kind: "FINAL",
      status: "SUCCEEDED",
      amount: 1200000,
      externalId: "pay_demo_0002",
      idempotencyKey: "order-0089-final",
      paidAt: daysFromNow(-347),
    },
  });

  await db.review.create({
    data: {
      orderId: orderDone.id,
      direction: "CUSTOMER_TO_CONTRACTOR",
      authorId: customer.id,
      targetOrgId: orgWarm.id,
      rating: 5,
      text: "Приехали вовремя, аккуратно обслужили котёл, оставили отчёт с фото. Рекомендую.",
    },
  });

  await db.review.create({
    data: {
      orderId: orderDone.id,
      direction: "CONTRACTOR_TO_CUSTOMER",
      authorId: contractorOwner.id,
      targetUserId: customer.id,
      rating: 5,
      text: "Понятная задача, полный доступ к оборудованию. Приятно работать.",
    },
  });

  console.log("Предложение изменения профиля...");
  await db.profileChangeProposal.create({
    data: {
      facilityId: facility.id,
      equipmentId: boiler.id,
      orderId: orderDone.id,
      authorId: contractorOwner.id,
      authorOrgId: orgWarm.id,
      status: "PENDING",
      changes: {
        lastServiceAt: daysFromNow(-347).toISOString(),
        note: "Заменён электрод розжига, рекомендована замена датчика тяги в следующее ТО",
      },
      comment: "Обновление данных по итогам годового ТО",
    },
  });

  console.log("Уведомления...");
  await db.notification.createMany({
    data: [
      {
        userId: customer.id,
        kind: "RECOMMENDATION",
        title: "Плановое ТО котла через 18 дней",
        body: "Warm-Tec рекомендует ежегодное обслуживание Viessmann Vitodens 100-W.",
        href: "/app/customer/objects",
      },
      {
        userId: customer.id,
        kind: "OFFER",
        title: "2 отклика на заявку «Обслуживание кондиционера»",
        body: "FLOW Engineering и Wat-Ing отправили предложения.",
        href: "/app/customer/requests",
      },
      {
        userId: contractorOwner.id,
        kind: "ORDER",
        title: "Этап «Поставка оборудования» в работе",
        body: "Заказ DELE-2026-0142: подтвердите сроки поставки.",
        href: "/app/contractor/orders",
      },
    ],
  });

  console.log("Журнал действий...");
  await db.auditEvent.createMany({
    data: [
      {
        actorId: customer.id,
        action: "request.publish",
        entity: "Request",
        entityId: reqVent.id,
        meta: { title: reqVent.title },
      },
      {
        actorId: customer.id,
        action: "offer.accept",
        entity: "Offer",
        entityId: offerVent.id,
        meta: { orderNumber: "DELE-2026-0142" },
      },
      {
        actorId: admin.id,
        action: "organization.verify",
        entity: "Organization",
        entityId: orgFlow.id,
      },
    ],
  });

  console.log("Готово. Демо-доступы:");
  console.log("  Заказчик:    customer@dele.ru / demo1234");
  console.log("  Исполнитель: contractor@dele.ru / demo1234");
  console.log("  Админ:       admin@dele.ru / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
