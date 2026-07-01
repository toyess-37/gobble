import { N } from '../shared/constants.js';

export const evaluatePostfix = (expression) => {
  const stack = [];
  
  for (let i = 0; i < expression.length; i++) {
    const token = expression[i];
    
    let parsedToken = parseFloat(token);
    if (!isNaN(parsedToken)) {
      stack.push(parsedToken);
    } else {
      let b = stack.pop();
      let a = stack.pop();
      
      if (token === '+') stack.push(a + b);
      else if (token === '-') stack.push(a - b);
      else if (token === '*') stack.push(a * b);
      else if (token === '/') {
        if (b === 0) return null;
        stack.push(a / b);
      } else return null;
    }
  }

  if (stack.length === 1) return stack[0];
  return null;
};

export const evaluateLines = (board, gameMap, currentScores, scoredLines) => {
  let newScores = { p1: currentScores.p1, p2: currentScores.p2 };
  let newlyScoredLines = [];

  for (let r = 0; r < gameMap.rows.length; r++) {
    let rowIdx = gameMap.rows[r];
    let lineId = "row-" + rowIdx;
    
    let alreadyScored = false;
    for (let i = 0; i < scoredLines.length; i++) {
      if (scoredLines[i] === lineId) alreadyScored = true;
    }

    if (!alreadyScored) {
      let lineFilled = true;
      let expression = [];
      let p1Count = 0;
      let p2Count = 0;

      for (let c = 0; c < N; c++) {
        let cell = board[rowIdx * N + c];
        if (cell === null) lineFilled = false;
        else {
          expression.push(cell.value);
          if (cell.player === 1) p1Count++;
          else if (cell.player === 2) p2Count++;
        }
      }

      if (lineFilled) {
        let result = evaluatePostfix(expression);
        if (result !== null) {
          let absScore = Math.abs(result);
          if (p1Count > p2Count) newScores.p1 += absScore;
          else if (p2Count > p1Count) newScores.p2 += absScore;
          newlyScoredLines.push(lineId);
        }
      }
    }
  }

  for (let c = 0; c < gameMap.cols.length; c++) {
    let colIdx = gameMap.cols[c];
    let lineId = "col-" + colIdx;
    
    let alreadyScored = false;
    for (let i = 0; i < scoredLines.length; i++) {
      if (scoredLines[i] === lineId) alreadyScored = true;
    }

    if (!alreadyScored) {
      let lineFilled = true;
      let expression = [];
      let p1Count = 0;
      let p2Count = 0;

      for (let r = 0; r < N; r++) {
        let cell = board[r * N + colIdx];
        if (cell === null) lineFilled = false;
        else {
          expression.push(cell.value);
          if (cell.player === 1) p1Count++;
          else if (cell.player === 2) p2Count++;
        }
      }

      if (lineFilled) {
        let result = evaluatePostfix(expression);
        if (result !== null) {
          let absScore = Math.abs(result);
          if (p1Count > p2Count) newScores.p1 += absScore;
          else if (p2Count > p1Count) newScores.p2 += absScore;
          newlyScoredLines.push(lineId);
        }
      }
    }
  }

  return { newScores, newlyScoredLines };
};
