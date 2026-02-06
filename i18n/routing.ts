import {
  defaultLocale,
  localeDetection,
  localePrefix,
  locales,
} from "./locale";

import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix,
  localeDetection,
});

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
