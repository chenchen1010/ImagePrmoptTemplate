"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Check, Zap } from "lucide-react";
import { Pricing as PricingType } from "@/types/blocks/pricing";
import { CountdownTimer } from "./countdown-timer";

export default function Pricing({ pricing }: { pricing: PricingType }) {
  const [activeTab, setActiveTab] = useState("yearly");

  if (!pricing || !pricing.items) {
    return null;
  }

  const handleCheckout = (item: any) => {
    console.log("Checkout clicked for:", item);
    alert("Payment integration removed. Please implement your own payment system.");
  };

  const filteredItems = pricing.items.filter(
    (item) => item.group === activeTab
  );

  return (
    <section
      id="pricing"
      className="relative z-0 pb-14 md:pb-20 lg:pb-24"
      style={{ paddingTop: 'calc(96px + var(--locale-banner-height, 0px))' }}
    >
      <div className="mx-auto mb-8 px-4 text-center md:mb-10 md:px-8">
        <h1 className="sr-only">Z-Image Pricing</h1>
        <h2 className="mb-6 text-3xl font-bold text-pretty lg:text-4xl">
          {pricing.title || "Simple credit pricing"}
        </h2>
        <p className="text-muted-foreground mx-auto mb-4 max-w-xl lg:max-w-none lg:text-lg">
          {pricing.subtitle || "Credits are usage units consumed per task, not a form of currency."}
        </p>
        {pricing.disclaimer && (
          <p className="text-muted-foreground mx-auto mt-2 max-w-2xl text-xs text-gray-500">
            {pricing.disclaimer}
          </p>
        )}
      </div>

      <div className="container">
        <div className="relative z-10 mx-auto mt-6 mb-10 flex w-full justify-center md:mt-8 md:mb-12 md:max-w-lg">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="border inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
              <TabsTrigger value="yearly" className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium">
                Yearly
              </TabsTrigger>
              <TabsTrigger value="monthly" className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium">
                Monthly
              </TabsTrigger>
              <TabsTrigger value="one-time" className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium">
                Pay as you go
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="relative z-0 mt-0 grid w-full gap-4 pt-4 md:gap-6 md:pt-6 lg:gap-8 md:grid-cols-3">
          {filteredItems.map((item: any, index: number) => {
            const isFeatured = item.is_featured || item.featured;

            return (
              <Card
                key={index}
                data-slot="card"
                className={`text-card-foreground flex flex-col gap-6 rounded-xl py-6 relative overflow-visible border transition-all duration-300 backdrop-blur ${
                  isFeatured
                    ? "border-amber-200/70 bg-[#0C0C10]/90 shadow-[0_20px_90px_rgba(0,0,0,0.65),0_0_55px_rgba(0,224,255,0.25)] ring-1 ring-amber-100/70 md:-translate-y-1 md:scale-[1.06] lg:scale-[1.1]"
                    : "border-border/70 bg-card/80 hover:-translate-y-1 hover:shadow-[0_20px_40px_-30px_rgba(15,23,42,0.65)]"
                }`}
              >
                {isFeatured && (
                  <>
                    <div className="pointer-events-none absolute inset-0 opacity-60 [background:radial-gradient(circle_at_18%_15%,rgba(77,168,255,0.14),transparent_38%),radial-gradient(circle_at_82%_0%,rgba(245,216,115,0.18),transparent_42%)]" />
                    <div className="pointer-events-none absolute inset-0 opacity-45 [background:linear-gradient(120deg,transparent,rgba(255,211,106,0.45),transparent)] [background-size:200%_100%] animate-[shimmer_3.2s_linear_infinite]" />
                    <span className="absolute inset-x-0 -top-3 mx-auto flex h-7 w-fit items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ring-white/20 ring-offset-1 ring-offset-gray-950/5 bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-200 text-amber-900 shadow-[0_0_40px_rgba(255,211,106,0.55)]">
                      {item.badge_icon || "⭐️ Most Popular"}
                    </span>
                  </>
                )}

                <div
                  data-slot="card-header"
                  className={`@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6 pb-3 md:pb-4 ${
                    isFeatured ? "relative pt-5 md:pt-6 text-amber-50" : ""
                  }`}
                >
                  <div data-slot="card-title" className="leading-none font-medium">
                    <h3 className={isFeatured ? "text-[17px] font-semibold text-amber-100 md:text-lg" : "text-sm font-medium"}>
                      {item.title}
                    </h3>
                  </div>

                  <div className="my-3 flex items-baseline gap-2">
                    <span className="text-muted-foreground text-sm line-through">
                      ${item.original_price}
                    </span>
                    <div className={isFeatured ? "my-3 block font-semibold text-[30px] md:text-[34px]" : "my-3 block font-semibold text-2xl"}>
                      <span className={isFeatured ? "bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-200 bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(0,224,255,0.25)]" : "text-primary"}>
                        ${item.price}/{item.unit}
                      </span>
                    </div>
                  </div>

                  {isFeatured && item.badge && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-amber-100">
                      <div className="flex items-center gap-2">
                        <Zap className="size-4 text-amber-200" />
                        <Badge className="border-transparent bg-amber-200 text-amber-900 shadow-sm">
                          {item.badge}
                        </Badge>
                      </div>
                    </div>
                  )}

                  <div data-slot="card-description" className="text-muted-foreground text-sm">
                    {item.description}
                  </div>

                  <Button
                    onClick={() => handleCheckout(item)}
                    className={`mt-4 w-full px-4 py-2 border-[0.5px] border-white/25 shadow-black/20 ${
                      isFeatured
                        ? "h-11 text-[15px] bg-[linear-gradient(90deg,#FFD36A,#F5D873)] text-slate-950 shadow-[0_0_24px_rgba(0,224,255,0.28)] hover:shadow-[0_0_32px_rgba(0,224,255,0.38)] font-bold"
                        : "h-9 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                    }`}
                  >
                    <Zap className="size-4" />
                    <span className="block">{item.button_text}</span>
                  </Button>

                  {isFeatured && item.limited_time_bonus && (
                    <div className="mt-3 flex items-center justify-between rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[12px] text-amber-100/90 shadow-[0_0_24px_rgba(0,0,0,0.45)]">
                      <span className="flex items-center gap-2 font-semibold text-amber-200">
                        <Zap className="size-4 text-amber-200" />
                        Limited-time bonus
                      </span>
                      <CountdownTimer />
                    </div>
                  )}
                </div>

                <div data-slot="card-content" className="px-6 space-y-3 md:space-y-4">
                  <hr className="border-dashed" />
                  <p className="text-sm font-medium">What you get</p>
                  <ul className="list-outside space-y-2 md:space-y-3 text-sm pricing-features">
                    {item.features?.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="size-3 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
