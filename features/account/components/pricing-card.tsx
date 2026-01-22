"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { handleCheckout } from "../server";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

interface PricingCardProps {
  product: {
    name: string;
    price_formatted: string;
    description: string;
    variant_id?: string;
    test_mode: boolean;
  };
}

export function PricingCard({ product }: PricingCardProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const formatProductName = (name: string) => {
    return name
      .replace("subscription_", "")
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const parseDescription = (html: string) => {
    // Simple regex to strip HTML tags for SSR compatibility
    return html.replace(/<[^>]*>/g, '').trim();
  };

  const onSubscribe = () => {
    if (!product.variant_id) return;
    
    startTransition(async () => {
      const checkoutUrl = await handleCheckout(product.variant_id!);
      if (checkoutUrl) {
        router.push(checkoutUrl);
      }
    });
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-2xl">
            {formatProductName(product.name)}
          </CardTitle>
          {product.test_mode && (
            <Badge variant="secondary" className="text-xs">
              Test Mode
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="text-3xl font-bold">{product.price_formatted}</div>
        <CardDescription className="text-base">
          {parseDescription(product.description)}
        </CardDescription>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          size="lg"
          onClick={onSubscribe}
          disabled={isPending || !product.variant_id}
        >
          {isPending ? "Processing..." : "Subscribe"}
        </Button>
      </CardFooter>
    </Card>
  );
}