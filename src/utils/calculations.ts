import type { SupportParams, CalculationResult, CheckItemResult, Suggestion, ValidationResult, ReportEnhancement, SchemeRecord, SchemeRankInfo, ParamDiff } from '@/types';
import { getWoodProperty, getSteelPipeProperty, getParamRange, getFieldsForType, getSupportTypeConfig, CONCRETE_DENSITY, SAFETY_FACTOR, FASTENER_SLIP_RESISTANCE } from './materials';

const fmt = (n: number, d: number = 3): number => Number(n.toFixed(d));

const PARAM_LABEL_MAP: Record<string, string> = {
  floorHeight: '层高', slabThickness: '板厚', beamWidth: '梁宽', beamHeight: '梁高',
  poleSpacingX: '立杆纵距', poleSpacingY: '立杆横距', stepDistance: '步距',
  constructionLoad: '施工荷载', woodSize: '木方规格', steelPipeType: '钢管型号',
  templateThickness: '模板厚度', templateElasticModulus: '模板弹性模量',
  topCantilever: '顶托悬臂长度', diagonalBrace: '纵横向剪刀撑',
  scissorsBrace: '水平剪刀撑', sweepPole: '扫地杆', supportType: '支撑类型',
};

const PARAM_UNIT_MAP: Record<string, string> = {
  floorHeight: 'm', slabThickness: 'mm', beamWidth: 'mm', beamHeight: 'mm',
  poleSpacingX: 'm', poleSpacingY: 'm', stepDistance: 'm',
  constructionLoad: 'kN/m²', templateThickness: 'mm', templateElasticModulus: 'N/mm²',
  topCantilever: 'mm',
};

const BETTER_PARAMS: Record<string, 'larger' | 'smaller' | 'bool'> = {
  poleSpacingX: 'smaller', poleSpacingY: 'smaller', stepDistance: 'smaller',
  woodSize: 'larger', steelPipeType: 'larger', constructionLoad: 'smaller',
  templateThickness: 'larger', templateElasticModulus: 'larger',
  topCantilever: 'smaller', diagonalBrace: 'bool', scissorsBrace: 'bool', sweepPole: 'bool',
  floorHeight: 'smaller', slabThickness: 'smaller', beamWidth: 'smaller', beamHeight: 'smaller',
};

const getTotalLoad = (params: SupportParams) => {
  const h = params.slabThickness / 1000;
  const b = params.poleSpacingY;
  const L = params.poleSpacingX;
  const concreteLoad = CONCRETE_DENSITY * h * b * L;
  const selfWeight = 0.5 * b * L;
  const liveLoad = params.constructionLoad * b * L;
  return { concreteLoad, selfWeight, liveLoad, totalLoad: (concreteLoad + selfWeight) * 1.2 + liveLoad * 1.4 };
};

export const validateParams = (params: SupportParams): ValidationResult[] => {
  const results: ValidationResult[] = [];
  const fields = getFieldsForType(params.supportType);

  fields.forEach(f => {
    if (f.type === 'boolean') return;
    const value = params[f.field as keyof SupportParams];
    if (f.type === 'select') {
      if (!value) {
        results.push({ field: f.field, label: f.label, status: 'missing', value: '', unit: f.unit });
      }
      return;
    }
    const numVal = value as number;
    const range = getParamRange(f.field);
    let status: 'valid' | 'missing' | 'outOfRange' = 'valid';
    if (!numVal || numVal <= 0) status = 'missing';
    else if (range && (numVal < range.min || numVal > range.max)) status = 'outOfRange';
    results.push({ field: f.field, label: f.label, status, value: numVal, min: range?.min, max: range?.max, unit: f.unit });
  });
  return results;
};

export const hasValidationErrors = (results: ValidationResult[]): boolean => results.some(r => r.status === 'missing');

const calcTemplateBending = (params: SupportParams): CheckItemResult => {
  const L = params.poleSpacingX;
  const b = 1;
  const h = params.templateThickness;
  const E = params.templateElasticModulus;
  const slabH = params.slabThickness / 1000;
  const q = (CONCRETE_DENSITY * slabH * 1.2 + params.constructionLoad * 1.4 + 0.5 * 1.2);
  const M = q * b * L * L / 8;
  const W = b * h * h / 6;
  const sigma = M * 1e6 / W;
  const fm = E > 8000 ? 15 : 11;
  return { name: '模板抗弯强度', category: '模板验算', calculatedValue: fmt(sigma), allowableValue: fm, unit: 'N/mm²', passed: sigma <= fm, formula: 'σ = M/W ≤ f_m', process: `q = ${fmt(q, 2)}kN/m\nM = ${fmt(q)}×1m×${L}m²/8 = ${fmt(M)}kN·m\nW = 1m×${h}mm²/6 = ${fmt(W)}mm³\nσ = ${fmt(M)}×10⁶ / ${fmt(W)} = ${fmt(sigma)}N/mm² ≤ ${fm}N/mm²` };
};

const calcTemplateDeflection = (params: SupportParams): CheckItemResult => {
  const L = params.poleSpacingX;
  const h = params.templateThickness;
  const E = params.templateElasticModulus;
  const slabH = params.slabThickness / 1000;
  const q = CONCRETE_DENSITY * slabH + 0.5 + params.constructionLoad;
  const I = 1 * Math.pow(h, 3) / 12;
  const w = 5 * q * Math.pow(L * 1000, 4) / (384 * E * I);
  const allowW = L * 1000 / 250;
  return { name: '模板挠度', category: '模板验算', calculatedValue: fmt(w, 2), allowableValue: fmt(allowW, 2), unit: 'mm', passed: w <= allowW, formula: 'ω = 5qL⁴/(384EI) ≤ L/250', process: `q = ${fmt(q, 2)}kN/m(标准值)\nI = 1m×${h}mm³/12 = ${fmt(I)}mm⁴\nω = ${fmt(w, 2)}mm ≤ ${fmt(allowW, 2)}mm` };
};

const calcWoodBending = (params: SupportParams): CheckItemResult => {
  const wood = getWoodProperty(params.woodSize);
  const L = params.poleSpacingX;
  const b = params.poleSpacingY;
  const h = params.slabThickness / 1000;
  const { totalLoad } = getTotalLoad(params);
  const M = totalLoad * L * L / 10;
  const ws = params.woodSize.split('×').map(Number);
  const W = (ws[0] / 1000) * Math.pow(ws[1] / 1000, 2) / 6;
  const sigma = M * 1000 / W / 1000;
  return { name: '木方抗弯强度', category: '木方验算', calculatedValue: fmt(sigma), allowableValue: wood.bendingStrength, unit: 'N/mm²', passed: sigma <= wood.bendingStrength, formula: 'σ = M/W ≤ f_m', process: `M = ${fmt(totalLoad)}kN×${L}m²/10 = ${fmt(M)}kN·m\nW = ${ws[0]}mm×${ws[1]}mm²/6 = ${fmt(W * 1e9)}mm³\nσ = ${fmt(sigma)}N/mm² ≤ ${wood.bendingStrength}N/mm²` };
};

const calcWoodShear = (params: SupportParams): CheckItemResult => {
  const wood = getWoodProperty(params.woodSize);
  const { totalLoad } = getTotalLoad(params);
  const V = 0.6 * totalLoad;
  const ws = params.woodSize.split('×').map(Number);
  const A = ws[0] / 1000 * ws[1] / 1000;
  const tau = 1.5 * V * 1000 / A / 1000;
  return { name: '木方抗剪强度', category: '木方验算', calculatedValue: fmt(tau), allowableValue: wood.shearStrength, unit: 'N/mm²', passed: tau <= wood.shearStrength, formula: 'τ = 3V/(2bh) ≤ f_v', process: `V = 0.6×${fmt(totalLoad)}kN = ${fmt(V)}kN\nτ = ${fmt(tau)}N/mm² ≤ ${wood.shearStrength}N/mm²` };
};

const calcWoodDeflection = (params: SupportParams): CheckItemResult => {
  const wood = getWoodProperty(params.woodSize);
  const L = params.poleSpacingX;
  const b = params.poleSpacingY;
  const h = params.slabThickness / 1000;
  const concreteLoad = CONCRETE_DENSITY * h * b * L;
  const selfWeight = 0.5 * b * L;
  const q = (concreteLoad + selfWeight) / L;
  const ws = params.woodSize.split('×').map(Number);
  const I = (ws[0] / 1000) * Math.pow(ws[1] / 1000, 3) / 12;
  const w = 5 * q * Math.pow(L * 1000, 4) / (384 * wood.elasticModulus * I * 1e12);
  const allowW = L * 1000 / 250;
  return { name: '木方挠度', category: '木方验算', calculatedValue: fmt(w, 2), allowableValue: fmt(allowW, 2), unit: 'mm', passed: w <= allowW, formula: 'ω = 5qL⁴/(384EI) ≤ L/250', process: `q = ${fmt(q, 2)}kN/m\nω = ${fmt(w, 2)}mm ≤ ${fmt(allowW, 2)}mm` };
};

const calcStability = (params: SupportParams): CheckItemResult => {
  const steel = getSteelPipeProperty(params.steelPipeType);
  const L0 = params.stepDistance;
  const { totalLoad } = getTotalLoad(params);
  const N = totalLoad * SAFETY_FACTOR;
  const i = steel.outerDiameter / 4;
  const lambda = L0 * 1000 / i;
  let phi: number;
  if (lambda <= 91.1) { phi = 1 / (1 + 0.0019 * lambda + 0.000135 * lambda * lambda); }
  else { phi = 235 / (0.0011 * lambda * lambda + 0.0003 * lambda + 1); phi = phi / 205; }
  phi = Math.min(phi, 1);
  const sigma = N * 1000 / (phi * steel.sectionArea * 100) / 10;
  return { name: '立杆稳定性', category: '立杆验算', calculatedValue: fmt(sigma), allowableValue: steel.bendingStrength, unit: 'N/mm²', passed: sigma <= steel.bendingStrength, formula: 'σ = N/(φA) ≤ f', process: `N = ${fmt(totalLoad)}kN×${SAFETY_FACTOR} = ${fmt(N)}kN\nλ = ${fmt(lambda, 1)}\nφ = ${fmt(phi, 3)}\nσ = ${fmt(sigma)}N/mm² ≤ ${steel.bendingStrength}N/mm²` };
};

const calcPoleCapacity = (params: SupportParams): CheckItemResult => {
  const steel = getSteelPipeProperty(params.steelPipeType);
  const { totalLoad } = getTotalLoad(params);
  const N = totalLoad * SAFETY_FACTOR;
  const sigma = N * 1000 / (steel.sectionArea * 100);
  return { name: '立杆承载力', category: '立杆验算', calculatedValue: fmt(sigma), allowableValue: steel.bendingStrength, unit: 'N/mm²', passed: sigma <= steel.bendingStrength, formula: 'σ = N/A ≤ f', process: `N = ${fmt(N)}kN\nA = ${steel.sectionArea}cm²\nσ = ${fmt(sigma)}N/mm² ≤ ${steel.bendingStrength}N/mm²` };
};

const calcFastenerSliding = (params: SupportParams): CheckItemResult => {
  const { totalLoad } = getTotalLoad(params);
  return { name: '扣件抗滑', category: '连接件验算', calculatedValue: fmt(totalLoad, 2), allowableValue: FASTENER_SLIP_RESISTANCE, unit: 'kN', passed: totalLoad <= FASTENER_SLIP_RESISTANCE, formula: 'R ≤ R_c(=8kN)', process: `R = ${fmt(totalLoad, 2)}kN ≤ ${FASTENER_SLIP_RESISTANCE}kN` };
};

const calcTopSupport = (params: SupportParams): CheckItemResult => {
  const steel = getSteelPipeProperty(params.steelPipeType);
  const a = params.topCantilever / 1000;
  const L0 = params.stepDistance;
  const calcLength = L0 + 2 * a;
  const i = steel.outerDiameter / 4;
  const lambda = calcLength * 1000 / i;
  let phi = 1 / (1 + 0.0019 * lambda + 0.000135 * lambda * lambda);
  phi = Math.min(phi, 1);
  const { totalLoad } = getTotalLoad(params);
  const N = totalLoad * SAFETY_FACTOR;
  const sigma = N * 1000 / (phi * steel.sectionArea * 100) / 10;
  return { name: '顶托验算', category: '立杆验算', calculatedValue: fmt(sigma), allowableValue: steel.bendingStrength, unit: 'N/mm²', passed: sigma <= steel.bendingStrength, formula: 'σ = N/(φA) ≤ f (含悬臂段)', process: `悬臂a = ${params.topCantilever}mm\n计算长度l₀ = ${L0}m + 2×${a}m = ${fmt(calcLength)}m\nλ = ${fmt(lambda, 1)}\nφ = ${fmt(phi, 3)}\nσ = ${fmt(sigma)}N/mm² ≤ ${steel.bendingStrength}N/mm²` };
};

const calcWallConnector = (params: SupportParams): CheckItemResult => {
  const stepDist = params.stepDistance;
  const spacing = 2 * stepDist;
  const windLoad = 0.5;
  const Nl = 1.4 * windLoad * spacing;
  const NlAllow = params.diagonalBrace ? 12.0 : 8.0;
  return { name: '连墙件验算', category: '连接件验算', calculatedValue: fmt(Nl, 2), allowableValue: NlAllow, unit: 'kN', passed: Nl <= NlAllow, formula: 'N_l ≤ N_l^{vc}', process: `连墙件间距${fmt(spacing)}m\n风荷载产生的轴向力N_l = ${fmt(Nl, 2)}kN\n允许值 = ${NlAllow}kN\n${fmt(Nl, 2)}kN ≤ ${NlAllow}kN` };
};

const slabCalculations = (params: SupportParams): CheckItemResult[] => [
  calcTemplateBending(params),
  calcTemplateDeflection(params),
  calcWoodBending(params),
  calcWoodShear(params),
  calcWoodDeflection(params),
  calcStability(params),
  calcFastenerSliding(params),
];

const fullSupportCalculations = (params: SupportParams): CheckItemResult[] => [
  calcStability(params),
  calcPoleCapacity(params),
  calcTopSupport(params),
  calcFastenerSliding(params),
  calcWoodBending(params),
];

const fastenerFrameCalculations = (params: SupportParams): CheckItemResult[] => [
  calcStability(params),
  calcPoleCapacity(params),
  calcFastenerSliding(params),
  calcWallConnector(params),
  calcTopSupport(params),
];

export const performCalculation = (params: SupportParams): CalculationResult => {
  let items: CheckItemResult[];
  switch (params.supportType) {
    case 'slab': items = slabCalculations(params); break;
    case 'fullSupport': items = fullSupportCalculations(params); break;
    case 'fastenerFrame': items = fastenerFrameCalculations(params); break;
    default: items = slabCalculations(params);
  }
  const ratios = items.map(it => it.allowableValue > 0 ? it.calculatedValue / it.allowableValue : 999);
  const maxIdx = ratios.indexOf(Math.max(...ratios));
  const passedCount = items.filter(it => it.passed).length;
  return {
    supportType: params.supportType,
    items,
    weakestItem: items[maxIdx].name,
    weakestSafetyRatio: fmt(ratios[maxIdx]),
    overallPassed: items.every(it => it.passed),
    passedCount,
    totalCount: items.length,
  };
};

export const generateSuggestions = (params: SupportParams, result: CalculationResult): Suggestion[] => {
  const suggestions: Suggestion[] = [];
  result.items.forEach(it => {
    if (!it.passed) {
      let sug = '';
      if (it.category === '模板验算') sug = '建议减小立杆间距或增加模板厚度';
      else if (it.category === '木方验算' && it.name.includes('抗弯')) sug = '建议减小立杆纵距或增大木方截面尺寸';
      else if (it.category === '木方验算' && it.name.includes('抗剪')) sug = '建议减小立杆间距或增加木方数量';
      else if (it.category === '木方验算' && it.name.includes('挠度')) sug = '建议减小立杆纵距或增大木方截面高度';
      else if (it.name === '立杆稳定性') sug = '建议减小立杆间距或步距，或增大钢管壁厚';
      else if (it.name === '立杆承载力') sug = '建议减小立杆间距或选用更大规格钢管';
      else if (it.name === '扣件抗滑') sug = '建议减小立杆间距或增加防滑扣件';
      else if (it.name === '顶托验算') sug = '建议缩短顶托悬臂长度或减小步距';
      else if (it.name === '连墙件验算') sug = '建议加密连墙件或设置剪刀撑';
      else sug = '建议调整相关参数以满足规范要求';
      suggestions.push({ item: `${it.name}不满足`, problem: `${it.name}: 计算值${it.calculatedValue}${it.unit} 超过允许值${it.allowableValue}${it.unit}`, suggestion: sug, priority: 'high' });
    }
  });
  if (params.stepDistance > 1.8) suggestions.push({ item: '步距偏大', problem: `步距${params.stepDistance}m超出常用范围`, suggestion: '建议步距不大于1.8m', priority: 'medium' });
  if (params.topCantilever > 500) suggestions.push({ item: '顶托悬臂偏长', problem: `顶托悬臂${params.topCantilever}mm偏大`, suggestion: '建议顶托悬臂长度不超过500mm(JGJ130-2011第6.9.4条)', priority: 'medium' });
  if (params.supportType !== 'slab' && !params.diagonalBrace) suggestions.push({ item: '缺少剪刀撑', problem: '未设置纵横向剪刀撑', suggestion: '规范要求满堂架和扣件式架必须设置剪刀撑', priority: 'high' });
  if (params.supportType !== 'slab' && !params.sweepPole) suggestions.push({ item: '缺少扫地杆', problem: '未设置扫地杆', suggestion: '规范要求必须设置纵横向扫地杆', priority: 'high' });
  if (result.overallPassed && result.weakestSafetyRatio > 0.85) suggestions.push({ item: '安全储备偏低', problem: `最薄弱项"${result.weakestItem}"安全储备为${(1 / result.weakestSafetyRatio * 100).toFixed(1)}%`, suggestion: '建议适当优化参数以提高安全储备', priority: 'low' });
  return suggestions;
};

export const generateReportEnhancement = (params: SupportParams, result: CalculationResult): ReportEnhancement => {
  const config = getSupportTypeConfig(params.supportType);
  if (!config) return { standards: [], loadCombination: '', worstCaseDesc: '', reviewNote: '' };
  const failedItems = result.items.filter(it => !it.passed).map(it => it.name);
  const reviewNote = result.overallPassed
    ? `本方案验算全部通过，最薄弱项为"${result.weakestItem}"（安全储备${(1 / result.weakestSafetyRatio * 100).toFixed(1)}%）。建议在实际施工中严格按本方案参数搭设，并加强过程检查。本计算书作为专项方案附件，需经项目技术负责人审核、总监理工程师审批后方可实施。`
    : `本方案验算未全部通过，未通过项：${failedItems.join('、')}。须按整改建议调整参数后重新验算，直至全部通过后方可实施。本计算书须经项目技术负责人审核、总监理工程师审批。`;
  return { standards: config.standards, loadCombination: config.loadCombination, worstCaseDesc: config.worstCaseDesc, reviewNote };
};

export const getParamSnapshot = (params: SupportParams): string => {
  const keys: (keyof SupportParams)[] = [
    'supportType', 'poleSpacingX', 'poleSpacingY', 'stepDistance', 'woodSize', 'steelPipeType',
    'constructionLoad', 'slabThickness', 'topCantilever', 'floorHeight', 'beamWidth', 'beamHeight',
    'templateThickness', 'templateElasticModulus', 'diagonalBrace', 'scissorsBrace', 'sweepPole',
  ];
  return keys.map(k => `${k}=${params[k]}`).join('|');
};

const getSafetyLevel = (safetyRatio: number, overallPassed: boolean): { level: SchemeRankInfo['safetyLevel']; label: string } => {
  if (!overallPassed) {
    if (safetyRatio >= 1.2) return { level: 'overLimit', label: '严重超限' };
    if (safetyRatio >= 1.05) return { level: 'overLimit', label: '超限' };
    return { level: 'overLimit', label: '超限临界' };
  }
  if (safetyRatio <= 0.7) return { level: 'sufficient', label: '储备充足' };
  if (safetyRatio <= 0.9) return { level: 'sufficient', label: '储备尚可' };
  return { level: 'critical', label: '临界状态' };
};

export const rankSchemes = (current: { result: CalculationResult; suggestions: Suggestion[]; label: string }, saved: SchemeRecord[]): { id: string; label: string; rankInfo: SchemeRankInfo }[] => {
  const all = [
    { id: '__current__', label: current.label, result: current.result, suggestions: current.suggestions },
    ...saved.map(s => ({ id: s.id, label: s.label, result: s.result, suggestions: s.suggestions })),
  ];

  const scored = all.map(a => {
    const passRate = a.result.totalCount > 0 ? a.result.passedCount / a.result.totalCount : 0;
    const safetyRatio = a.result.weakestSafetyRatio;
    const safetyMargin = safetyRatio > 0 ? 1 / safetyRatio : 0;
    const safetyInfo = getSafetyLevel(safetyRatio, a.result.overallPassed);
    const highCount = a.suggestions.filter(s => s.priority === 'high').length;
    const midCount = a.suggestions.filter(s => s.priority === 'medium').length;
    let score = 0;
    score += passRate * 500;
    score += a.result.overallPassed ? 300 : 0;
    if (a.result.overallPassed) {
      if (safetyInfo.level === 'sufficient') score += 200;
      else if (safetyInfo.level === 'critical') score += 80;
    } else {
      score -= (safetyRatio - 1) * 200;
    }
    score -= highCount * 120;
    score -= midCount * 40;
    const reasons: string[] = [];
    if (a.result.overallPassed) reasons.push('全部验算通过');
    else reasons.push(`${a.result.totalCount - a.result.passedCount}项未通过`);
    reasons.push(safetyInfo.label);
    if (highCount > 0) reasons.push(`${highCount}项高级别整改`);
    else reasons.push('无高级别整改');
    return { id: a.id, label: a.label, score, passRate, safetyMargin, safetyLevel: safetyInfo.level, safetyLabel: safetyInfo.label, highCount, reason: reasons.join('，') };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s, i) => ({
    id: s.id,
    label: s.label,
    rankInfo: {
      rank: i + 1,
      score: fmt(s.score, 1),
      reason: s.reason,
      passRate: fmt(s.passRate * 100, 1),
      safetyMargin: fmt(s.safetyMargin * 100, 1),
      safetyLevel: s.safetyLevel,
      highIssueCount: s.highCount,
    },
  }));
};

export const getParamDiff = (oldParams: SupportParams, newParams: SupportParams): ParamDiff[] => {
  const diffs: ParamDiff[] = [];
  const keys: (keyof SupportParams)[] = [
    'supportType', 'floorHeight', 'slabThickness', 'beamWidth', 'beamHeight',
    'poleSpacingX', 'poleSpacingY', 'stepDistance', 'woodSize', 'steelPipeType',
    'constructionLoad', 'templateThickness', 'templateElasticModulus',
    'topCantilever', 'diagonalBrace', 'scissorsBrace', 'sweepPole',
  ];
  keys.forEach(k => {
    const oldVal = oldParams[k];
    const newVal = newParams[k];
    if (oldVal === newVal) return;
    const direction = BETTER_PARAMS[k];
    let isBetter: 'better' | 'worse' | 'neutral' = 'neutral';
    if (direction === 'smaller') {
      if (typeof newVal === 'number' && typeof oldVal === 'number') isBetter = newVal < oldVal ? 'better' : 'worse';
    } else if (direction === 'larger') {
      if (typeof newVal === 'number' && typeof oldVal === 'number') isBetter = newVal > oldVal ? 'better' : 'worse';
    } else if (direction === 'bool') {
      isBetter = newVal === true && oldVal === false ? 'better' : 'worse';
    }
    diffs.push({
      field: k,
      label: PARAM_LABEL_MAP[k] || k,
      oldValue: oldVal,
      newValue: newVal,
      unit: PARAM_UNIT_MAP[k] || '',
      isBetter,
    });
  });
  return diffs;
};

export const generateVersionNote = (diff: ParamDiff[], oldResult: CalculationResult | null, newResult: CalculationResult): string => {
  if (!oldResult || diff.length === 0) return '初始版本';
  const changes: string[] = [];
  diff.slice(0, 5).forEach(d => {
    const arrow = d.isBetter === 'better' ? '↓' : d.isBetter === 'worse' ? '↑' : '→';
    changes.push(`${d.label}: ${d.oldValue}${d.unit}→${d.newValue}${d.unit}`);
  });
  const resultChange = newResult.overallPassed && !oldResult.overallPassed ? '（从不通过变为通过）'
    : !newResult.overallPassed && oldResult.overallPassed ? '（从通过变为不通过）'
    : newResult.weakestSafetyRatio < oldResult.weakestSafetyRatio ? '（安全储备提升）'
    : newResult.weakestSafetyRatio > oldResult.weakestSafetyRatio ? '（安全储备下降）'
    : '';
  return `${changes.join('；')}${resultChange}`;
};

export const generateComparisonSummary = (params: SupportParams, result: CalculationResult, suggestions: Suggestion[], schemes: SchemeRecord[]): string => {
  if (schemes.length === 0) return '本方案为当前唯一验算工况，未进行方案比选。';
  const ranked = rankSchemes({ result, suggestions, label: '当前方案' }, schemes);
  const currentRank = ranked.find(r => r.id === '__current__');
  const bestRank = ranked[0];
  const parts: string[] = [];
  parts.push(`本次共比选${schemes.length + 1}组工况（含当前方案）。`);
  if (currentRank) {
    parts.push(`当前方案在比选中排名第${currentRank.rankInfo.rank}（推荐得分${currentRank.rankInfo.score}），${currentRank.rankInfo.reason}。`);
  }
  if (bestRank && bestRank.id !== '__current__') {
    parts.push(`推荐方案为"${bestRank.label}"（排名第1），${bestRank.rankInfo.reason}。`);
  } else if (bestRank && bestRank.id === '__current__') {
    parts.push('当前方案为推荐方案，综合表现最优。');
  }
  return parts.join('');
};

export const getMostDiffSchemes = (params: SupportParams, schemes: SchemeRecord[], count: number = 2): SchemeRecord[] => {
  const scored = schemes.map(s => {
    const diff = getParamDiff(params, s.params);
    return { scheme: s, diffCount: diff.length };
  });
  scored.sort((a, b) => b.diffCount - a.diffCount);
  return scored.slice(0, count).map(s => s.scheme);
};
