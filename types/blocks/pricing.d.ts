import { Button } from "@/types/blocks/base/button";

export interface PricingGroup {
  name?: string;
  title?: string;
  description?: string;
  label?: string;
}

export interface PricingItem {
  title?: string;
  description?: string;
  label?: string;
  price?: string;
  original_price?: string;
  unit?: string;
  features_title?: string;
  features?: string[];
  button?: Button;
  tip?: string;
  is_featured?: boolean;
  featured?: boolean;
  interval?: "month" | "year" | "one-time";
  product_id?: string;
  product_name?: string;
  amount?: number;
  cn_amount?: number;
  currency?: string;
  credits?: number;
  valid_months?: number;
  group?: string;
  planId?: number;
  button_text?: string;
  badge?: string;
  badge_icon?: string;
  bonus_percentage?: number;
  limited_time_bonus?: boolean;
}

export interface Pricing {
  disabled?: boolean;
  name?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  disclaimer?: string;
  items?: PricingItem[];
  groups?: PricingGroup[];
}
