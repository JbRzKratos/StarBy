interface SizeSelectorProps {
  sizes: string[];
  selected: string;
  onSelect: (size: string) => void;
  hideLabel?: boolean;
}

export function SizeSelector({ sizes, selected, onSelect, hideLabel = false }: SizeSelectorProps) {
  return (
    <div>
      {!hideLabel && (
        <span className="font-mono text-caption text-ash uppercase tracking-wider block mb-3">
          Size — <span className="text-bone font-bold">{selected}</span>
        </span>
      )}
      <div className="flex gap-2 flex-wrap">
        {sizes.map((size) => {
          const isSelected =
            size === selected ||
            ((size === '2XL' || size === 'XXL') && (selected === '2XL' || selected === 'XXL')) ||
            ((size === '3XL' || size === 'XXXL') && (selected === '3XL' || selected === 'XXXL'));

          return (
            <button
              key={size}
              type="button"
              onClick={() => onSelect(size)}
              className={`px-4 py-2 font-mono text-caption uppercase border rounded-lg transition-all ${
                isSelected
                  ? 'border-cobalt text-cobalt bg-cobalt/15 font-bold ring-1 ring-cobalt/40 shadow-sm'
                  : 'border-smoke/60 text-pearl hover:border-pearl hover:text-bone hover:bg-smoke/10'
              }`}
            >
              {size}
            </button>
          );
        })}
      </div>
    </div>
  );
}
