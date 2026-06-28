import { riskData, type RiskData, type RiskGroupData } from "./risks";

export type Difficulty = 'easy' | 'medium' | 'hard';

export type GeneratedRisk = {
  code: string;
  level: number;
  picks: string[];
  conflicts: string[];
};

export type GenerateOptions = {
  difficulty?: Difficulty;
  useKey?: boolean;
  locked?: string[];
  banned?: string[];
};

type FlatRisk = {
  pos: number;  // index of the single non-zero digit (0-14)
  val: number;  // value at that position (1-30)
  level: number;
  code: string; // original single-position code string
};

type RiskGroup = {
  risks: FlatRisk[];
};

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

const RISK_DATA = buildRisks();
const CODE_MAP: Record<string, FlatRisk> = {};
for (const group of [...RISK_DATA.free, RISK_DATA.key, ...RISK_DATA.locked]) {
  for (const r of group.risks) {
    CODE_MAP[r.code] = r;
  }
}

export function generateCode(options: GenerateOptions = {}): GeneratedRisk {
  const difficulty = options.difficulty ?? 'medium';
  const useKey = options.useKey ?? true;
  const lockedSet = new Set(options.locked ?? []);
  const bannedSet = new Set(options.banned ?? []);
  const digits = new Uint8Array(CODE_LEN);
  const p = DIFFICULTY_PROBABILITY[difficulty];

  const picks: string[] = [];
  const conflicts: string[] = [];

  let level = 0;
  if (useKey) {
    const group = RISK_DATA.key;
    const lockedInGroup = group.risks.filter(r => lockedSet.has(r.code));
    if (lockedInGroup.length > 0) {
      const key = lockedInGroup[0];
      digits[key.pos] = key.val;
      level = key.level;
      picks.push(key.code);
      for (const r of group.risks) {
        if (r !== key) conflicts.push(r.code);
      }
    } else {
      const available = group.risks.filter(r => !bannedSet.has(r.code));
      if (available.length > 0) {
        const key = pick(available);
        digits[key.pos] = key.val;
        level = key.level;
        picks.push(key.code);
        for (const r of available) {
          if (r !== key) conflicts.push(r.code);
        }
      }
    }
  }

  const groups = useKey
    ? RISK_DATA.free.concat(RISK_DATA.locked)
    : RISK_DATA.free;
  for (const group of groups) {
    const lockedInGroup = group.risks.filter(r => lockedSet.has(r.code));
    if (lockedInGroup.length > 0) {
      for (const locked of lockedInGroup) {
        digits[locked.pos] += locked.val;
        level += locked.level;
        picks.push(locked.code);
      }
      for (const other of group.risks) {
        if (!lockedSet.has(other.code)) conflicts.push(other.code);
      }
    } else {
      const available = group.risks.filter(r => !bannedSet.has(r.code));
      if (available.length > 0 && cryptoRandom() < p) {
        const r = pick(available);
        digits[r.pos] += r.val;
        level += r.level;
        picks.push(r.code);
        for (const other of available) {
          if (other !== r) conflicts.push(other.code);
        }
      }
    }
  }

  return { code: buildDigits(digits), level, picks, conflicts };
}

/** Add a risk's digit and level to an existing generated code. */
export function addRiskToCode(risk: GeneratedRisk, code: string): GeneratedRisk {
  const flat = CODE_MAP[code];
  if (!flat) return risk;
  const digits = parseDigits(risk.code);
  digits[flat.pos] += flat.val;
  return {
    code: buildDigits(digits),
    level: risk.level + flat.level,
    picks: [...risk.picks, code],
    conflicts: risk.conflicts,
  };
}

/** Subtract a risk's digit and level from an existing generated code. */
export function removeRiskFromCode(risk: GeneratedRisk, code: string): GeneratedRisk {
  const flat = CODE_MAP[code];
  if (!flat) return risk;
  const digits = parseDigits(risk.code);
  digits[flat.pos] -= flat.val;
  return {
    code: buildDigits(digits),
    level: risk.level - flat.level,
    picks: risk.picks.filter(c => c !== code),
    conflicts: risk.conflicts,
  };
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

function parseDigits(code: string): number[] {
  const digits = new Array(CODE_LEN);
  for (let i = 0; i < CODE_LEN; i++) {
    digits[i] = CHAR_TO_VAL[code.charCodeAt(i)];
  }
  return digits;
}

function buildDigits(digits: ArrayLike<number>): string {
  let code = '';
  for (let i = 0; i < CODE_LEN; i++) {
    code += DIGITS[digits[i]];
  }
  return code;
}

/** Convert a single-position code string into a flat {pos, val} risk. */
function toFlat(r: RiskData): FlatRisk {
  for (let i = 0; i < r.code.length; i++) {
    const val = CHAR_TO_VAL[r.code.charCodeAt(i)];
    if (val !== 0) {
      return { pos: i, val, level: r.level, code: r.code };
    }
  }
  return { pos: 0, val: 0, level: r.level, code: r.code };
}

function convert(groups: RiskGroupData[]): RiskGroup[] {
  return groups.map(g => ({ risks: g.risks.map(toFlat) }));
}

function buildRisks() {
  const risks = riskData();
  const free = convert(risks.free);
  const key = { risks: risks.key.risks.map(toFlat) };
  const locked = convert(risks.locked);
  return { free, key, locked };
}
