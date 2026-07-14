import React from 'react';
import RackTile from './RackTile.jsx';
import { NUMBERS, OPERATORS } from '../utils/constants';

const Rack = ({ playerName, theme, onTileClick, selectedTile, rackData, isInactivePlayer }) => {
  let numEmpty = rackData.numbers <= 0;
  let opEmpty = rackData.operators <= 0;

  return (
    <div className={`
      flex flex-col items-center bg-bg-card p-5 rounded-2xl border border-border w-full max-w-[320px] shadow-[0_10px_30px_rgba(0,0,0,0.3)] box-border transition-opacity duration-300 ease-in-out
      ${isInactivePlayer ? 'opacity-50 pointer-events-none grayscale-[50%]' : ''}
    `}>
      <h2 className="m-0 mb-4 text-2xl uppercase tracking-widest" style={{ color: theme.color, textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}>
        {playerName}
      </h2>
      <div className="flex flex-col w-full gap-3">
        <div className="text-[11px] text-text-muted uppercase tracking-wider font-bold mb-1">
          Numbers Left: {rackData.numbers}
        </div>
        <div className="grid grid-cols-5 gap-2 w-full justify-items-center items-center">
          {NUMBERS.map((item, i) => {
            let isSelected = false;
            if (selectedTile === item) isSelected = true;
            
            return (
              <RackTile 
                key={`num-${i}`} 
                item={item} 
                theme={theme} 
                isEmpty={numEmpty}
                onClick={() => onTileClick(item)}
                isSelected={isSelected}
              />
            );
          })}
        </div>
        
        <div className="text-[11px] text-text-muted uppercase tracking-wider font-bold mb-1 mt-2">
          Operators Left: {rackData.operators}
        </div>
        <div className="grid grid-cols-4 gap-2 w-full max-w-[80%] mx-auto justify-items-center items-center">
          {OPERATORS.map((item, i) => {
            let isSelected = false;
            if (selectedTile === item) isSelected = true;

            return (
              <RackTile 
                key={`op-${i}`} 
                item={item} 
                theme={theme} 
                isEmpty={opEmpty}
                onClick={() => onTileClick(item)}
                isSelected={isSelected}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Rack;