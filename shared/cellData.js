import { N } from './constants.js';

export function getCellData(index, gameMap) {
  const r = Math.floor(index / N);
  const c = index % N;

  const isBluePath = r === gameMap.rows[0] || c === gameMap.cols[0];
  const isRedPath = r === gameMap.rows[1] || c === gameMap.cols[1];

  let isPink = false;
  for (let i = 0; i < gameMap.pink.length; i++) {
    if (gameMap.pink[i][0] === r && gameMap.pink[i][1] === c) {
      isPink = true;
      break;
    }
  }

  const isRowStart = (r === gameMap.rows[0] && c === 0) || (r === gameMap.rows[1] && c === 0);
  const isColStart = (c === gameMap.cols[0] && r === 0) || (c === gameMap.cols[1] && r === 0);
  const isRowEnd = (r === gameMap.rows[0] && c === N - 1) || (r === gameMap.rows[1] && c === N - 1);
  const isColEnd = (c === gameMap.cols[0] && r === N - 1) || (c === gameMap.cols[1] && r === N - 1);

  const isStart = isRowStart || isColStart;
  const isEnd = isRowEnd || isColEnd;
  const isInactive = !isBluePath && !isRedPath;

  return { 
    isPink, 
    isInactive, 
    isStart, 
    isEnd, 
    isRowStart, 
    isRowEnd, 
    isColStart, 
    isColEnd, 
    isBluePath, 
    isRedPath 
  };
}
