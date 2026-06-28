export type RiskData = { code: string; level: number, edge?: RiskEdge };
export type RiskGroupData = { risks: RiskData[] };
export type RiskEdge = 'none' | 'short' | 'long' | 'left';

export function riskData() {
  const free: RiskGroupData[] = [
    {
      risks: [
      { code: '000000000000001', level: 1 },
      { code: '000000000000002', level: 2, edge: 'short' },
      { code: '000000000000004', level: 3, edge: 'short' }
    ]},
    {
      risks: [
      { code: '000000000000008', level: 1 },
      { code: '00000000000000G', level: 2, edge: 'short' }
    ]},
    {
      risks: [
      { code: '000000000000020', level: 1 },
      { code: '000000000000040', level: 2, edge: 'short' },
      { code: '000000000000080', level: 3, edge: 'short' }
    ]},
    {
      risks: [
      { code: '0000000000000G0', level: 1 },
      { code: '000000000000100', level: 2, edge: 'short' },
      { code: '000000000000200', level: 3, edge: 'short' }
    ]},
    {
      risks: [
      { code: '000000000000400', level: 1 },
      { code: '000000000000800', level: 2, edge: 'short' }
    ]},
    {
      risks: [
      { code: '000000000001000', level: 1 },
      { code: '000000000002000', level: 2, edge: 'short' }
    ]},
    {
      risks: [
      { code: '000000000008000', level: 1 },
      { code: '000000000010000', level: 3, edge: 'long' }
    ]},
    {
      risks: [
      { code: '000000000020000', level: 1 },
      { code: '000000000040000', level: 2, edge: 'short' }
    ]},
    {
      risks: [
      { code: '0000000000G0000', level: 1 },
      { code: '000000000100000', level: 2, edge: 'short' }
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
      { code: '000000001000000', level: 1 }
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

  const key: RiskGroupData = {
    risks: [
    { code: '000000010000000', level: 3 },
    { code: '000000080000000', level: 3, edge: 'left' }
  ]};

  const locked: RiskGroupData[] = [
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
      { code: '000000800000000', level: 2, edge: 'short' }
    ]},
    {
      risks: [
      { code: '000001000000000', level: 1 },
      { code: '000002000000000', level: 2, edge: 'short' }
    ]},
    {
      risks: [
      { code: '000008000000000', level: 1 },
      { code: '00000G000000000', level: 2, edge: 'short' }
    ]},
    {
      risks: [
      { code: '000020000000000', level: 1 },
      { code: '0000G0000000000', level: 1, edge: 'left' },
      { code: '000400000000000', level: 1, edge: 'left' },
      { code: '001000000000000', level: 1, edge: 'left' }
    ]},
    {
      risks: [
      { code: '000040000000000', level: 2 }
    ]},
    {
      risks: [
      { code: '008000000000000', level: 1 },
      { code: '00G000000000000', level: 2, edge: 'short' }
    ]},
    {
      risks: [
      { code: '040000000000000', level: 2 },
      { code: '080000000000000', level: 3, edge: 'short' }
    ]}
  ];

  return { free, key, locked };
}

export function findRiskGroup(code: string): RiskGroupData | undefined {
  const data = riskData();
  const allGroups = [...data.free, data.key, ...data.locked];
  return allGroups.find(group => group.risks.some(r => r.code === code));
}
