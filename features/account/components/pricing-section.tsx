import { PricingCard } from "./pricing-card";

interface Product {
  name: string;
  price_formatted: string;
  description: string;
  variant_id?: string;
  test_mode: boolean;
  [key: string]: any;
}

interface PricingSectionProps {
  products: Product[];
}

export function PricingSection({ products }: PricingSectionProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No subscription plans available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">Choose Your Plan</h2>
        <p className="text-lg text-muted-foreground">
          Select the subscription that best fits your needs
        </p>
      </div>
      <div
        className={`grid gap-6 ${
          products.length === 1
            ? "max-w-md mx-auto"
            : products.length === 2
            ? "md:grid-cols-2 max-w-4xl mx-auto"
            : "md:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {products.map((product, index) => (
          <PricingCard key={product.variant_id || index} product={product} />
        ))}
      </div>
    </div>
  );
}