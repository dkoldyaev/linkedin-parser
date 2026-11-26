export interface SkeletonBarProps {
  width?: number | string;
  height?: number | string;
  className?: string;
}

export default function SkeletonBar({
  width = '100%',
  height = 10,
  className = '',
}: SkeletonBarProps) {
  return (
    <span
      className={`landing-skel-bar ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}
