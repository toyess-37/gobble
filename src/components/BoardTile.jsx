import React from 'react';
import '../styles/components.css';

const BoardTile = ({ isInactive, styleData, radius, label, isStart, isEnd, isPink, isHighlighted, onClick, placedTile, isEvaluating }) => {
  if (isInactive) return <div className="board-tile" />;

  let fontSizeClass = 'default';
  if (placedTile === null || placedTile === undefined) {
    if (isStart || isEnd) fontSizeClass = 'start';
    else if (isPink) fontSizeClass = 'pink';
  } else if (isPink) {
    fontSizeClass = 'pink';
  }
  
  let highlightClass = '';
  if (isHighlighted) highlightClass = 'highlighted';
  
  let placedClass = '';
  if (placedTile !== null && placedTile !== undefined) placedClass = 'placed-tile';

  let evalClass = '';
  if (isEvaluating) evalClass = 'evaluating';

  return (
    <div
      className={`base-tile board-tile clickable ${fontSizeClass} ${highlightClass} ${placedClass} ${evalClass}`}
      onClick={onClick}
      style={{
        '--tile-bg': styleData.bg,
        '--tile-shadow': styleData.shadow,
        '--tile-radius': radius,
        color: styleData.color,
      }}
    >
      {label}
    </div>
  );
};

export default BoardTile;
