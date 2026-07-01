import React from 'react';
import '../styles/components.css';

const RackTile = ({ item, theme, onClick, isSelected, isEmpty }) => {
  let selectedClass = '';
  if (isSelected) selectedClass = 'selected';
  
  let emptyClass = '';
  if (isEmpty) emptyClass = 'empty';

  let finalOpacity = 1;
  if (isEmpty) finalOpacity = 0.3;

  let clickHandler = onClick;
  if (isEmpty) clickHandler = undefined;

  return (
    <div 
      className={`base-tile rack-tile clickable ${selectedClass} ${emptyClass}`} 
      onClick={clickHandler}
      style={{
        '--tile-bg': theme.bg,
        '--tile-shadow': theme.shadow,
        color: theme.color,
        opacity: finalOpacity,
      }}
    >
      {item}
    </div>
  );
};

export default RackTile;
