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
    
    let alreadyScored = scoredLines.includes(lineId);

    if (!alreadyScored) {
      let lineFilled = true;
      let expression = [];

      for (let c = 0; c < N; c++) {
        let cell = board[rowIdx * N + c];
        if (cell === null) {
          lineFilled = false;
          break;
        } else expression.push(cell.value);
      }

      if (lineFilled) {
        let result = evaluatePostfix(expression);
        if (result !== null) {
          if (r === 0) newScores.p1 += result;
          else if (r === 1) newScores.p2 += result;
          newlyScoredLines.push(lineId);
        }
      }
    }
  }

  for (let c = 0; c < gameMap.cols.length; c++) {
    let colIdx = gameMap.cols[c];
    let lineId = "col-" + colIdx;
    
    let alreadyScored = scoredLines.includes(lineId);

    if (!alreadyScored) {
      let lineFilled = true;
      let expression = [];

      for (let r = 0; r < N; r++) {
        let cell = board[r * N + colIdx];
        if (cell === null) {
          lineFilled = false;
          break;
        } else expression.push(cell.value);
      }

      if (lineFilled) {
        let result = evaluatePostfix(expression);
        if (result !== null) {
          if (c === 0) newScores.p1 += result;
          else if (c === 1) newScores.p2 += result;
          newlyScoredLines.push(lineId);
        }
      }
    }
  }

  return { newScores, newlyScoredLines };
};