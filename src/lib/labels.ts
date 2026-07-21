import type {
  DocumentCategory,
  OfferStatus,
  OrderStatus,
  RecommendationSeverity,
  RecommendationStatus,
  RequestStatus,
  RequestType,
  SystemType,
  UrgencyLevel,
} from "@/generated/prisma/enums";

export const systemTypeLabels: Record<SystemType, string> = {
  WATER: "Водоснабжение",
  DRAINAGE: "Водоотведение",
  HEATING: "Отопление",
  AIR: "Вентиляция и кондиционирование",
  ELECTRICITY: "Электрика",
  AUTOMATION: "Автоматизация",
  OTHER: "Другое",
};

/** Tailwind classes keyed by system type: dot color + soft chip. */
export const systemTypeTone: Record<
  SystemType,
  { dot: string; chip: string }
> = {
  WATER: { dot: "bg-system-water", chip: "bg-system-water/12 text-system-water" },
  DRAINAGE: { dot: "bg-system-drain", chip: "bg-system-drain/12 text-system-drain" },
  HEATING: { dot: "bg-system-heat", chip: "bg-system-heat/12 text-system-heat" },
  AIR: { dot: "bg-system-air", chip: "bg-system-air/12 text-system-air" },
  ELECTRICITY: {
    dot: "bg-system-electric",
    chip: "bg-system-electric/12 text-system-electric",
  },
  AUTOMATION: { dot: "bg-system-auto", chip: "bg-system-auto/12 text-system-auto" },
  OTHER: { dot: "bg-muted-foreground", chip: "bg-muted text-muted-foreground" },
};

export const requestStatusLabels: Record<RequestStatus, string> = {
  DRAFT: "Черновик",
  MODERATION: "На модерации",
  PUBLISHED: "Опубликована",
  HAS_OFFERS: "Есть отклики",
  CONTRACTOR_SELECTED: "Исполнитель выбран",
  CONVERTED: "Переведена в заказ",
  EXPIRED: "Истекла",
  CANCELLED: "Отменена",
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  AWAITING_CONTRACT: "Ожидает договора",
  AWAITING_PREPAYMENT: "Ожидает предоплаты",
  PLANNING: "Планирование",
  IN_PROGRESS: "В работе",
  PAUSED: "Приостановлен",
  AWAITING_ACCEPTANCE: "Ожидает приёмки",
  REWORK: "Доработка",
  INSPECTION: "Технадзор",
  DISPUTE: "Спор",
  AWAITING_FINAL_PAYMENT: "Ожидает оплаты",
  COMPLETED: "Завершён",
  CANCELLED: "Отменён",
};

export const recommendationSeverityLabels: Record<
  RecommendationSeverity,
  string
> = {
  INFO: "Инфо",
  ADVISORY: "Рекомендуется",
  IMPORTANT: "Важно",
  CRITICAL: "Критично",
};

export const recommendationSeverityTone: Record<RecommendationSeverity, string> =
  {
    INFO: "bg-muted text-muted-foreground",
    ADVISORY: "bg-secondary text-secondary-foreground",
    IMPORTANT: "bg-warning/15 text-warning",
    CRITICAL: "bg-destructive/12 text-destructive",
  };

export const recommendationStatusLabels: Record<RecommendationStatus, string> =
  {
    ACTIVE: "Активна",
    POSTPONED: "Отложена",
    DISMISSED: "Скрыта",
    CONVERTED: "Создана заявка",
  };

export const requestTypeLabels: Record<RequestType, string> = {
  PROFILE_FILL: "Заполнение цифрового профиля",
  DESIGN: "Проектирование",
  INSTALLATION: "Монтаж системы",
  RETROFIT: "Модернизация",
  REPAIR: "Ремонт",
  EMERGENCY: "Аварийный вызов",
  SERVICE_ONE_TIME: "Разовое обслуживание",
  SERVICE_RECURRING: "Регулярное обслуживание",
  MATERIALS: "Подбор материалов",
};

export const urgencyLabels: Record<UrgencyLevel, string> = {
  LOW: "Не срочно",
  NORMAL: "В обычном порядке",
  HIGH: "Срочно",
  EMERGENCY: "Авария",
};

export const offerStatusLabels: Record<OfferStatus, string> = {
  DRAFT: "Черновик",
  SENT: "Отправлен",
  ACCEPTED: "Принят",
  DECLINED: "Отклонён",
  WITHDRAWN: "Отозван",
  EXPIRED: "Истёк",
};

export const documentCategoryLabels: Record<DocumentCategory, string> = {
  EQUIPMENT_PASSPORT: "Паспорт оборудования",
  SCHEME: "Схема",
  CONTRACT: "Договор",
  ESTIMATE: "Смета",
  ACT: "Акт",
  CERTIFICATE: "Сертификат",
  WARRANTY: "Гарантия",
  PHOTO: "Фото",
  REPORT: "Отчёт",
  OTHER: "Прочее",
};
