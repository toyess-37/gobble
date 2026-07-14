import React from 'react';

const BoardTile = ({ isInactive, styleData, radius, label, isStart, isEnd, isPink, isHighlighted, onClick, placedTile, isEvaluating }) => {
  if (isInactive) return <div className="w-full aspect-square border-2 border-transparent" />;

  let fontClasses = 'text-sm sm:text-lg md:text-xl lg:text-2xl'; // default
  if (placedTile === null || placedTile === undefined) {
    if (isStart || isEnd) fontClasses = 'text-[10px] sm:text-xs md:text-sm';
    else if (isPink) fontClasses = 'text-xs sm:text-sm md:text-lg';
  } else if (isPink) {
    fontClasses = 'text-xs sm:text-sm md:text-lg';
  }
  
  let highlightClasses = isHighlighted ? 'border-2 border-[#ffd700] shadow-[0_4px_0_var(--tile-shadow),inset_0_2px_0_rgba(255,255,255,0.2)] -translate-y-1 z-10' : '';
  let evalClasses = isEvaluating ? 'border-white scale-110 z-20' : '';
  
  // Base tile shadow
  let baseShadow = 'shadow-[0_4px_0_var(--tile-shadow),inset_0_2px_0_rgba(255,255,255,0.2)]';
  if (isHighlighted) baseShadow = ''; // Overridden by highlightClasses

  return (
    <div
      className={`
        w-full aspect-square rounded-[var(--tile-radius,12px)] 
        flex items-center justify-center font-sans font-bold select-none 
        transition-all duration-200 box-border bg-[var(--tile-bg)] 
        ${highlightClasses ? '' : 'border-2 border-transparent'}
        ${fontClasses} 
        ${highlightClasses} 
        ${evalClasses}
        ${!isEvaluating && !isHighlighted ? baseShadow : ''}
        cursor-pointer 
        hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_6px_0_var(--tile-shadow),inset_0_2px_0_rgba(255,255,255,0.3)]
        active:translate-y-1 active:shadow-[0_0_0_var(--tile-shadow),inset_0_2px_0_rgba(255,255,255,0.1)]
      `}
      onClick={onClick}
      style={{
        '--tile-bg': styleData.bg,
        '--tile-shadow': styleData.shadow,
        '--tile-radius': radius,
        color: styleData.color,
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
      }}
    >
      {label}
    </div>
  );
};

export default BoardTile;
