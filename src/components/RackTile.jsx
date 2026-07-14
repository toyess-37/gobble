import React from 'react';

const RackTile = ({ item, theme, onClick, isSelected, isEmpty }) => {
  let clickHandler = onClick;
  if (isEmpty) clickHandler = undefined;

  let baseShadow = 'shadow-[0_4px_0_var(--tile-shadow),inset_0_2px_0_rgba(255,255,255,0.2)]';
  if (isSelected) baseShadow = '';
  if (isEmpty) baseShadow = 'shadow-[0_2px_0_var(--tile-shadow),inset_0_2px_0_rgba(255,255,255,0.1)]';

  return (
    <div 
      className={`
        w-full aspect-square rounded-[12px] flex items-center justify-center font-sans font-bold select-none transition-all duration-200 box-border bg-[var(--tile-bg)] border-2
        text-base sm:text-xl md:text-2xl p-2
        ${isEmpty ? 'cursor-not-allowed grayscale-[50%] border-transparent opacity-30 !translate-y-0' : 'cursor-pointer hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_6px_0_var(--tile-shadow),inset_0_2px_0_rgba(255,255,255,0.3)] active:translate-y-1 active:shadow-[0_0_0_var(--tile-shadow),inset_0_2px_0_rgba(255,255,255,0.1)] opacity-100'}
        ${isSelected ? 'border-[#ffd700] -translate-y-1 shadow-[0_8px_0_var(--tile-shadow),inset_0_2px_0_rgba(255,255,255,0.3)] z-10' : 'border-transparent'}
        ${!isSelected ? baseShadow : ''}
      `} 
      onClick={clickHandler}
      style={{
        '--tile-bg': theme.bg,
        '--tile-shadow': theme.shadow,
        color: theme.color,
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
      }}
    >
      {item}
    </div>
  );
};

export default RackTile;
