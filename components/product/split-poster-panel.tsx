interface SplitPosterPanelProps {
  width: string;
  height: string;
  gradient: string;
  imageSrc?: string | null;
  bgPosition: string;
  bgSize: string;
}

export function SplitPosterPanel({
  width,
  height,
  gradient,
  imageSrc,
  bgPosition,
  bgSize,
}: SplitPosterPanelProps) {
  return (
    <div
      className="rounded-sm shadow-elevated overflow-hidden flex-shrink-0"
      style={{
        width,
        height,
        backgroundImage: imageSrc ? `url(${imageSrc})` : gradient,
        backgroundPosition: bgPosition,
        backgroundSize: bgSize,
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}
