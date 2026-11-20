interface VegIndicatorProps {
  isVeg: boolean;
  showLabel?: boolean;
}

export function VegIndicator({ isVeg, showLabel = false }: VegIndicatorProps) {
  return (
    <span className="inline-flex items-center gap-1.5 shrink-0">
      <span
        className={`inline-flex items-center justify-center w-4 h-4 rounded-[3px] border-[1.5px] ${
          isVeg ? 'border-[#15803D]' : 'border-[#B91C1C]'
        }`}
        aria-label={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
        title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
      >
        {isVeg ? (
          <span className="w-2 h-2 rounded-full bg-[#15803D]" />
        ) : (
          <span className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[7px] border-b-[#B91C1C]" />
        )}
      </span>
      {showLabel && (
        <span className={`text-xs font-medium ${isVeg ? 'text-[#15803D]' : 'text-[#B91C1C]'}`}>
          {isVeg ? 'Veg' : 'Non-Veg'}
        </span>
      )}
    </span>
  );
}
