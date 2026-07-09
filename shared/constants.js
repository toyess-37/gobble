export const N = 7;

export function uniqueVals(N) {
  let a = Math.floor(Math.random() * (N - 2)) + 1;
  let b = Math.floor(Math.random() * (N - 3)) + 1;
  if (b === a) b++;
  return [a, b];
}

export const NUMBERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
export const OPERATORS = ['+', '-', '*', '/'];

export function generateMap() {
  const rows = uniqueVals(N);
  const cols = uniqueVals(N);
  const pink = [[rows[0], cols[1]], [rows[1], cols[0]]];
  return { rows, cols, pink };
}