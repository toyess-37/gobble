import React, { useMemo } from 'react';
import BoardTile from './BoardTile.jsx';
import { N, THEME } from '../utils/constants';
import { isValidPlacement } from '../utils/validation';
import { getCellData } from '../../shared/cellData';
import '../styles/components.css';

const Board = ({ selectedTile, boardState, onCellClick, gameMap, evalStep }) => {
  const cellDataArray = useMemo(() => {
    const arr = [];
    for (let i = 0; i < N * N; i++) {
      arr.push(getCellData(i, gameMap));
    }
    return arr;
  }, [gameMap]);

  const highlights = useMemo(() => {
    const arr = Array(N * N).fill(false);
    if (selectedTile !== null) {
      for (let i = 0; i < N * N; i++) {
        const cellData = cellDataArray[i];
        if (isValidPlacement(selectedTile.value, cellData, i, boardState, gameMap)) {
          arr[i] = true;
        }
      }
    }
    return arr;
  }, [selectedTile, boardState, gameMap, cellDataArray]);

  return (
    <div 
      className="board-container"
      style={{ 
        '--grid-n': N,
      }}
    >
      {Array.from({ length: N * N }).map((_, i) => {
        const cellData = cellDataArray[i];
        const isHighlighted = highlights[i];
        const placedTile = boardState[i];
        const r = Math.floor(i / N);
        const c = i % N;

        let isEvaluating = false;
        if (evalStep >= 0) {
          if (cellData.isBluePath) {
            let idx1 = r === gameMap.rows[0] ? c : -1;
            let idx2 = c === gameMap.cols[0] ? r : -1;
            if (idx1 === evalStep || idx2 === evalStep) isEvaluating = true;
          }
          if (cellData.isRedPath) {
            let idx1 = r === gameMap.rows[1] ? c : -1;
            let idx2 = c === gameMap.cols[1] ? r : -1;
            if (idx1 === evalStep || idx2 === evalStep) isEvaluating = true;
          }
        }

        let styleData = THEME.blue;
        if (cellData.isPink) styleData = THEME.purple;
        else if (cellData.isRedPath) styleData = THEME.red;

        let radius = '12px';
        if (cellData.isRowStart) radius = '50% 12px 12px 50%';
        else if (cellData.isRowEnd) radius = '12px 50% 50% 12px';
        else if (cellData.isColStart) radius = '50% 50% 12px 12px';
        else if (cellData.isColEnd) radius = '12px 12px 50% 50%';

        let label = '';
        if (cellData.isStart) label = 'Start';
        else if (cellData.isEnd) label = 'End';
        else if (cellData.isPink) label = 'x-1';

        let finalLabel = label;
        if (placedTile !== null) finalLabel = placedTile.value;

        return (
          <BoardTile
            key={i}
            isInactive={cellData.isInactive}
            styleData={styleData}
            radius={radius}
            label={finalLabel}
            isStart={cellData.isStart}
            isEnd={cellData.isEnd}
            isPink={cellData.isPink}
            isHighlighted={isHighlighted}
            placedTile={placedTile}
            isEvaluating={isEvaluating}
            onClick={() => onCellClick(i, cellData)}
          />
        );
      })}
    </div>
  );
};

export default Board;
