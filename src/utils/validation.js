import { OPERATORS, NUMBERS, N } from '../../shared/constants.js';

const isValidPartialPostfix = (path, intersectionIndices) => {
  const reqNums = Math.floor((N + 1) / 2);
  const reqOps = Math.floor((N - 1) / 2);
  const memo = new Map();

  const dp = (i, n, o) => {
    if (n > reqNums || o > reqOps) return false;
    if (i > 0 && i < N && n <= o) return false;
    if (i === N) return (n === reqNums && o === reqOps);

    const key = i + "," + n + "," + o;
    if (memo.has(key)) return memo.get(key);

    let canBeN = (path[i] === null || path[i] === 'N');
    let canBeO = (path[i] === null || path[i] === 'O');

    let isIntersection = false;
    for (let idx = 0; idx < intersectionIndices.length; idx++) {
      if (intersectionIndices[idx] === i) isIntersection = true;
    }

    if (isIntersection || i === 0) canBeO = false;
    if (i === N - 1) canBeN = false;

    let possible = false;
    if (canBeN && dp(i + 1, n + 1, o)) possible = true;
    if (!possible && canBeO && dp(i + 1, n, o + 1)) possible = true;

    memo.set(key, possible);
    return possible;
  };

  return dp(0, 0, 0);
};

const hasDivisionByZero = (pathValues) => {
  const stack = [];
  for (let i = 0; i < pathValues.length; i++) {
    let val = pathValues[i];
    if (val === null) {
      stack.push('?');
    } else {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        stack.push(num);
      } else {
        if (stack.length < 2) {
          stack.push('?');
          continue;
        }
        const b = stack.pop();
        const a = stack.pop();

        if (val === '/' && b === 0) return true;

        if (typeof a === 'number' && typeof b === 'number') {
          let res = 0;
          if (val === '+') res = a + b;
          else if (val === '-') res = a - b;
          else if (val === '*') res = a * b;
          else if (val === '/') res = a / b;
          stack.push(res);
        } else {
          stack.push('?');
        }
      }
    }
  }
  return false;
};

export const isValidPlacement = (tileValue, cellData, index, boardState, gameMap) => {
  const { isPink, isInactive, isStart, isEnd } = cellData;
  if (isInactive || boardState[index] !== null) return false;

  let isOperator = OPERATORS.includes(tileValue);
  let isNumber = NUMBERS.includes(tileValue);

  if (isStart && !isNumber) return false;
  if (isEnd && !isOperator) return false;
  if (isPink && !isNumber) return false;

  const r = Math.floor(index / N);
  const c = index % N;

  let isIntersection = false;
  let isRowInter = r === gameMap.rows[0] || r === gameMap.rows[1];
  let isColInter = c === gameMap.cols[0] || c === gameMap.cols[1];
  if (isRowInter && isColInter) isIntersection = true;

  if (isIntersection && !isNumber) return false;

  const testBoardState = [...boardState];
  let simulatedValue = tileValue;
  if (isPink && isNumber && tileValue !== '0') {
    simulatedValue = "-" + tileValue;
  }
  testBoardState[index] = { value: simulatedValue };

  const getTileType = (idx) => {
    const t = testBoardState[idx];
    if (t === null) return null;
    if (!isNaN(parseFloat(t.value))) return 'N';
    if (OPERATORS.includes(t.value)) return 'O';
    return null;
  };

  const getTileValue = (idx) => {
    const t = testBoardState[idx];
    if (t !== null) return t.value;
    return null;
  };

  let isRowActive = false;
  if (r === gameMap.rows[0] || r === gameMap.rows[1]) isRowActive = true;

  let isColActive = false;
  if (c === gameMap.cols[0] || c === gameMap.cols[1]) isColActive = true;

  if (isRowActive) {
    const pathTypes = [];
    const pathValues = [];
    for (let i = 0; i < N; i++) {
      pathTypes.push(getTileType(r * N + i));
      pathValues.push(getTileValue(r * N + i));
    }
    
    if (!isValidPartialPostfix(pathTypes, gameMap.cols)) return false;
    if (hasDivisionByZero(pathValues)) return false;
  }

  if (isColActive) {
    const pathTypes = [];
    const pathValues = [];
    for (let i = 0; i < N; i++) {
      pathTypes.push(getTileType(i * N + c));
      pathValues.push(getTileValue(i * N + c));
    }
    
    if (!isValidPartialPostfix(pathTypes, gameMap.rows)) return false;
    if (hasDivisionByZero(pathValues)) return false;
  }

  return true;
};