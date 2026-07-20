interface SizeSelectorProps {
  sizes: string[];
  selected: string;
  onSelect: (size: string) => void;
}

export function SizeSelector({ sizes, selected, onSelect }: SizeSelectorProps) {
  return (
    <div>
      <span className="font-mono text-caption text-ash uppercase tracking-wider block mb-3">
        Size — {selected}
      </span>
      <div className="flex gap-2">
        {sizes.map((size) => (
          <button
            key={size}
            onClick={() => onSelect(size)}
            className={`px-4 py-2 font-mono text-caption uppercase border transition-colors ${
              size === selected
                ? 'border-cobalt text-cobalt bg-cobalt/10'
                : 'border-smoke text-pearl hover:border-pearl'
            }`}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
}
