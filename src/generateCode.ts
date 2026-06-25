export type Risk = {
  code: string;
  level: 1|2|3;
};

type RiskGroup = {
  risks: Risk[];
}

const riskData = buildRisks();

export function generateCode(): Risk {
  let risk = pick(riskData.key.risks);
  return risk;
}

function sumCode(a: string, b: string): string {
  const digits = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  let result = '';
  for (let i = 0; i < a.length; i++) {
    const sum = digits.indexOf(a[i]) + digits.indexOf(b[i]);
    result += digits[sum];
  }
  return result;
}

function pick<T>(list: T[]): T {
  const index = Math.floor(cryptoRandom() * list.length);
  return list[index];
}

function cryptoRandom(): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] / (0xFFFFFFFF + 1); // normalize to [0, 1)
}

function buildRisks() {
  const free: RiskGroup[] = [
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

  const key: RiskGroup = {
    risks: [
    { code: '000000010000000', level: 3 },
    { code: '000000080000000', level: 3 }
  ]};

  const locked: RiskGroup[] = [
    {
      risks: [
      { code: '0000000H0000000', level: 1 }
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
    free,
    key,
    locked
  };
}
