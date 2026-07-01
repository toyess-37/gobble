const TAU = 0.5;
const SCALE = 173.7178;

const g = (phi) => 1 / Math.sqrt(1 + 3 * Math.pow(phi, 2) / Math.pow(Math.PI, 2));

const E = (mu, mu_j, phi_j) => 1 / (1 + Math.exp(-g(phi_j) * (mu - mu_j)));

const v = (mu, opponents) => {
  let sum = 0;
  for (let op of opponents) {
    const E_val = E(mu, op.mu, op.phi);
    sum += Math.pow(g(op.phi), 2) * E_val * (1 - E_val);
  }
  return 1 / sum;
};

const delta = (mu, opponents, v_val) => {
  let sum = 0;
  for (let op of opponents) {
    sum += g(op.phi) * (op.s - E(mu, op.mu, op.phi));
  }
  return v_val * sum;
};

const f = (x, delta_val, phi, v_val, a, tau) => {
  const e_x = Math.exp(x);
  const num1 = e_x * (Math.pow(delta_val, 2) - Math.pow(phi, 2) - v_val - e_x);
  const den1 = 2 * Math.pow(Math.pow(phi, 2) + v_val + e_x, 2);
  const term2 = (x - a) / Math.pow(tau, 2);
  return (num1 / den1) - term2;
};

export const updateGlicko = (rating, rd, vol, matches) => {
  const mu = (rating - 1500) / SCALE;
  const phi = rd / SCALE;

  if (matches.length === 0) {
    const phi_star = Math.sqrt(Math.pow(phi, 2) + Math.pow(vol, 2));
    return {
      rating: rating,
      rd: phi_star * SCALE,
      vol: vol
    };
  }

  const opponents = matches.map(m => ({
    mu: (m.rating - 1500) / SCALE,
    phi: m.rd / SCALE,
    s: m.score
  }));

  const v_val = v(mu, opponents);
  const delta_val = delta(mu, opponents, v_val);
  const a = Math.log(Math.pow(vol, 2));
  
  let A = a;
  let B = 0;

  if (Math.pow(delta_val, 2) > Math.pow(phi, 2) + v_val) {
    B = Math.log(Math.pow(delta_val, 2) - Math.pow(phi, 2) - v_val);
  } else {
    let k = 1;
    while (f(a - k * TAU, delta_val, phi, v_val, a, TAU) < 0) k++;
    B = a - k * TAU;
  }

  let f_A = f(A, delta_val, phi, v_val, a, TAU);
  let f_B = f(B, delta_val, phi, v_val, a, TAU);

  while (Math.abs(B - A) > 0.000001) {
    const C = A + (A - B) * f_A / (f_B - f_A);
    const f_C = f(C, delta_val, phi, v_val, a, TAU);
    if (f_C * f_B <= 0) {
      A = B;
      f_A = f_B;
    } else {
      f_A = f_A / 2;
    }
    B = C;
    f_B = f_C;
  }

  const vol_prime = Math.exp(A / 2);
  const phi_star = Math.sqrt(Math.pow(phi, 2) + Math.pow(vol_prime, 2));
  const phi_prime = 1 / Math.sqrt((1 / Math.pow(phi_star, 2)) + (1 / v_val));
  
  let sum_mu = 0;
  for (let op of opponents) {
    sum_mu += g(op.phi) * (op.s - E(mu, op.mu, op.phi));
  }
  const mu_prime = mu + Math.pow(phi_prime, 2) * sum_mu;

  return {
    rating: mu_prime * SCALE + 1500,
    rd: phi_prime * SCALE,
    vol: vol_prime
  };
};
