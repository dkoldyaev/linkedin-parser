export const STATUS_NOT_CONTACTED = "Еще не написал";
export const STATUS_CONTACTED = "Написал";
export const STATUS_INTERVIEW = "Собеседование";
export const STATUS_ASSESSMENT = "Тестовое";
export const STATUS_OFFER = "Оффер";
export const STATUS_REJECTED = "Отказ";

export const BASE_STATUSES = [
  STATUS_NOT_CONTACTED,
  STATUS_REJECTED,
];

export const DEFAULT_COLUMNS = [
  { id: STATUS_NOT_CONTACTED, color: "#2563eb", has_lanes: false, is_base: true },
  { id: STATUS_CONTACTED, color: "#0284c7", has_lanes: false, is_base: false },
  { id: STATUS_INTERVIEW, color: "#d97706", has_lanes: true, is_base: false },
  { id: STATUS_ASSESSMENT, color: "#9333ea", has_lanes: true, is_base: false },
  { id: STATUS_OFFER, color: "#059669", has_lanes: false, is_base: false },
  { id: STATUS_REJECTED, color: "#ef4444", has_lanes: false, is_base: true },
];

