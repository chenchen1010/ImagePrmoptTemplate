export const locales = ["en", "zh"];

export const localeNames: any = {
  en: "English",
  zh: "中文",
};

export const defaultLocale = "en";

export const localePrefix = "always";

export const localeDetection =
  process.env.NEXT_PUBLIC_LOCALE_DETECTION === "true";

// 移除 pathnames 配置,使用默认路径映射
// export const pathnames = {
//   "privacy-policy": "/privacy-policy",
//   "terms-of-service": "/terms-of-service",
//   "my-profile": "/my-profile",
//   "my-orders": "/my-orders",
//   "pricing": "/pricing",
// } satisfies Pathnames<typeof locales>;

