export type Difficulty = 'easy' | 'medium' | 'hard';

export type Risk = {
  code: string;
  level: number;
};

type FlatRisk = {
  pos: number;  // index of the single non-zero digit (0-14)
  val: number;  // value at that position (1-30)
  level: number;
};

type RiskGroup = {
  risks: FlatRisk[];
};

type RawRisk = { code: string; level: number };
type RawGroup = { risks: RawRisk[] };

const DIGITS = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const CODE_LEN = 15;

const DIFFICULTY_PROBABILITY: Record<Difficulty, number> = {
  easy: 0.3,
  medium: 0.5,
  hard: 0.75,
};

const CHAR_TO_VAL = new Uint8Array(128);
for (let i = 0; i < DIGITS.length; i++) {
  CHAR_TO_VAL[DIGITS.charCodeAt(i)] = i;
}

export type GenerateOptions = {
  difficulty?: Difficulty;
  useKey?: boolean;
};

const RISK_DATA = buildRisks();

export function generateCode(options: GenerateOptions = {}): Risk {
  const difficulty = options.difficulty ?? 'medium';
  const useKey = options.useKey ?? true;
  const digits = new Uint8Array(CODE_LEN);
  const p = DIFFICULTY_PROBABILITY[difficulty];

  let level = 0;
  if (useKey) {
    const key = pick(RISK_DATA.key.risks);
    digits[key.pos] = key.val;
    level = key.level;
  }

  const groups = useKey
    ? RISK_DATA.free.concat(RISK_DATA.locked)
    : RISK_DATA.free;
  for (const group of groups) {
    if (cryptoRandom() < p) {
      const r = pick(group.risks);
      digits[r.pos] += r.val;
      level += r.level;
    }
  }

  let code = '';
  for (let i = 0; i < CODE_LEN; i++) {
    code += DIGITS[digits[i]];
  }

  return { code, level };
}

// --- Random number generation (batched) ---

const randomPool = new Uint32Array(64);
let randomIndex = randomPool.length; // forces initial fill

function cryptoRandom(): number {
  if (randomIndex >= randomPool.length) {
    crypto.getRandomValues(randomPool);
    randomIndex = 0;
  }
  return randomPool[randomIndex++] / 0x100000000;
}

function pick<T>(list: T[]): T {
  return list[Math.floor(cryptoRandom() * list.length)];
}

/** Convert a single-position code string into a flat {pos, val} risk. */
function toFlat(r: RawRisk): FlatRisk {
  for (let i = 0; i < r.code.length; i++) {
    const val = CHAR_TO_VAL[r.code.charCodeAt(i)];
    if (val !== 0) {
      return { pos: i, val, level: r.level };
    }
  }
  return { pos: 0, val: 0, level: r.level };
}

function convert(groups: RawGroup[]): RiskGroup[] {
  return groups.map(g => ({ risks: g.risks.map(toFlat) }));
}

function buildRisks() {
  const free: RawGroup[] = [
    {
      risks: [
      { code: '000000000000001', level: 1 },
      { code: '000000000000002', level: 2 },
      { code: '000000000000004', level: 3 }
    ]},
    {
      risks: [
      { code: '000000000000008', level: 1 },
      { code: '00000000000000G', level: 2 }
    ]},
    {
      risks: [
      { code: '000000000000020', level: 1 },
      { code: '000000000000040', level: 2 }
    ]},
    {
      risks: [
      { code: '0000000000000G0', level: 1 },
      { code: '000000000000100', level: 2 },
      { code: '000000000000200', level: 3 }
    ]},
    {
      risks: [
      { code: '000000000000400', level: 1 },
      { code: '000000000000800', level: 2 }
    ]},
    {
      risks: [
      { code: '000000000001000', level: 1 },
      { code: '000000000002000', level: 2 }
    ]},
    {
      risks: [
      { code: '000000000008000', level: 1 },
      { code: '000000000010000', level: 3 }
    ]},
    {
      risks: [
      { code: '000000000020000', level: 1 },
      { code: '000000000040000', level: 2 }
    ]},
    {
      risks: [
      { code: '0000000000G0000', level: 1 },
      { code: '000000000100000', level: 2 }
    ]},
    {
      risks: [
      { code: '000000000400000', level: 1 }
    ]},
    {
      risks: [
      { code: '000000000800000', level: 2 }
    ]},
    {
      risks: [
      { code: '000000000G00000', level: 3 }
    ]},
    {
      risks: [
      { code: '000000002000000', level: 2 }
    ]},
    {
      risks: [
      { code: '000000004000000', level: 3 }
    ]}
  ];

  const key: RawGroup = {
    risks: [
    { code: '000000010000000', level: 3 },
    { code: '000000080000000', level: 3 }
  ]};

  const locked: RawGroup[] = [
    {
      risks: [
      { code: '0000000G0000000', level: 1 }
    ]},
    {
      risks: [
      { code: '000000100000000', level: 2 }
    ]},
    {
      risks: [
      { code: '000000400000000', level: 1 },
      { code: '000000800000000', level: 2 }
    ]},
    {
      risks: [
      { code: '000001000000000', level: 1 },
      { code: '000002000000000', level: 2 }
    ]},
    {
      risks: [
      { code: '000008000000000', level: 1 },
      { code: '00000G000000000', level: 2 }
    ]},
    {
      risks: [
      { code: '000020000000000', level: 1 },
      { code: '0000G0000000000', level: 1 },
      { code: '000400000000000', level: 1 },
      { code: '001000000000000', level: 1 }
    ]},
    {
      risks: [
      { code: '008000000000000', level: 1 },
      { code: '00G000000000000', level: 2 }
    ]}
  ];

  return {
    free: convert(free),
    key: { risks: key.risks.map(toFlat) },
    locked: convert(locked)
  };
}
