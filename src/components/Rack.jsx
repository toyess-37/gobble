import React from 'react';
import RackTile from './RackTile.jsx';
import { NUMBERS, OPERATORS } from '../utils/constants';
import '../styles/components.css';

const Rack = ({ playerName, theme, onTileClick, selectedTile, rackData, isInactivePlayer }) => {
  let inactiveClass = '';
  if (isInactivePlayer) inactiveClass = 'inactive-player';

  let numEmpty = rackData.numbers <= 0;
  let opEmpty = rackData.operators <= 0;

  return (
    <div className={`rack-container ${inactiveClass}`}>
      <h2 className="rack-title" style={{ color: theme.color }}>
        {playerName}
      </h2>
      <div className="rack-content">
        <div style={{ textAlign: 'center', fontSize: '14px', color: '#ccc', marginBottom: '4px' }}>
          Numbers Left: {rackData.numbers}
        </div>
        <div className="rack-grid numbers-grid">
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
        
        <div style={{ textAlign: 'center', fontSize: '14px', color: '#ccc', marginTop: '8px', marginBottom: '4px' }}>
          Operators Left: {rackData.operators}
        </div>
        <div className="rack-grid operators-grid">
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
