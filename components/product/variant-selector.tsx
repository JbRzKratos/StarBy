import type { ProductVariant } from '@/data/products';

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export function VariantSelector({ variants, selectedIndex, onSelect }: VariantSelectorProps) {
  return (
    <div>
      <span className="font-mono text-caption text-ash uppercase tracking-wider block mb-3">
        Color — {variants[selectedIndex]?.name}
      </span>
      <div className="flex gap-3">
        {variants.map((variant, i) => (
          <button
            key={variant.id}
            onClick={() => onSelect(i)}
            className={`w-10 h-10 rounded-full border-2 transition-colors ${
              i === selectedIndex ? 'border-cobalt scale-110' : 'border-smoke hover:border-pearl'
            }`}
            style={{ backgroundColor: variant.colorHex }}
            aria-label={variant.name}
          />
        ))}
      </div>
    </div>
  );
}
