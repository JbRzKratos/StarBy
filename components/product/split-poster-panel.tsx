interface SplitPosterPanelProps {
  width: string;
  height: string;
  gradient: string;
  bgPosition: string;
  bgSize: string;
}

export function SplitPosterPanel({
  width,
  height,
  gradient,
  bgPosition,
  bgSize,
}: SplitPosterPanelProps) {
  return (
    <div
      className="rounded-sm shadow-elevated overflow-hidden flex-shrink-0"
      style={{
        width,
        height,
        background: gradient,
        backgroundPosition: bgPosition,
        backgroundSize: bgSize,
      }}
    />
  );
}
