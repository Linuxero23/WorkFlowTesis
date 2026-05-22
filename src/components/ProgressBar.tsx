interface ProgressBarProps {
  progress: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({ progress, showLabel = true, size = 'lg' }: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  
  const getColor = () => {
    if (clampedProgress >= 75) return 'bg-success';
    if (clampedProgress >= 50) return 'bg-warning';
    return 'bg-error';
  };
  
  const getTextColor = () => {
    if (clampedProgress >= 75) return 'text-success';
    if (clampedProgress >= 50) return 'text-warning';
    return 'text-error';
  };
  
  const heights = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6',
  };
  
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };
  
  return (
    <div className="w-full">
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className={`${heights[size]} ${getColor()} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showLabel && (
        <div className={`mt-1 font-semibold ${getTextColor()} ${textSizes[size]}`}>
          {clampedProgress}% completado
        </div>
      )}
    </div>
  );
}