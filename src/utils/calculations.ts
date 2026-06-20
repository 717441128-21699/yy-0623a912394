import type { SupportParams, CalculationResult, CheckItemResult, Suggestion, ValidationResult } from '@/types';
import {
  getWoodProperty,
  getSteelPipeProperty,
  getParamRange,
  CONCRETE_DENSITY,
  SAFETY_FACTOR,
  FASTENER_SLIP_RESISTANCE,
} from './materials';

const formatNumber = (num: number, decimals: number = 3): number => {
  return Number(num.toFixed(decimals));
};

export const validateParams = (params: SupportParams): ValidationResult[] => {
  const results: ValidationResult[] = [];
  const fieldsToCheck = [
    'floorHeight',
    'slabThickness',
    'beamWidth',
    'beamHeight',
    'poleSpacingX',
    'poleSpacingY',
    'stepDistance',
    'constructionLoad',
  ];

  fieldsToCheck.forEach(field => {
    const range = getParamRange(field);
    if (!range) return;

    const value = params[field as keyof SupportParams] as number;
    let status: 'valid' | 'missing' | 'outOfRange' = 'valid';

    if (!value || value <= 0) {
      status = 'missing';
    } else if (value < range.min || value > range.max) {
      status = 'outOfRange';
    }

    results.push({
      field,
      label: range.label,
      status,
      value,
      min: range.min,
      max: range.max,
      unit: range.unit,
    });
  });

  if (!params.woodSize) {
    results.push({
      field: 'woodSize',
      label: '木方规格',
      status: 'missing',
      value: '',
      unit: 'mm',
    });
  }

  if (!params.steelPipeType) {
    results.push({
      field: 'steelPipeType',
      label: '钢管型号',
      status: 'missing',
      value: '',
      unit: 'mm',
    });
  }

  return results;
};

export const hasValidationErrors = (results: ValidationResult[]): boolean => {
  return results.some(r => r.status === 'missing');
};

export const calculateBendingStrength = (params: SupportParams): CheckItemResult => {
  const wood = getWoodProperty(params.woodSize);
  const L = params.poleSpacingX;
  const b = params.poleSpacingY;
  const h = params.slabThickness / 1000;
  const load = params.constructionLoad;

  const concreteLoad = CONCRETE_DENSITY * h * b * L;
  const selfWeight = 0.5 * b * L;
  const liveLoad = load * b * L;
  const totalLoad = (concreteLoad + selfWeight) * 1.2 + liveLoad * 1.4;

  const maxMoment = (totalLoad * L * L) / 10;

  const woodSize = params.woodSize.split('×').map(Number);
  const woodWidth = woodSize[0] / 1000;
  const woodHeight = woodSize[1] / 1000;
  const W = (woodWidth * woodHeight * woodHeight) / 6;

  const bendingStress = (maxMoment * 1000) / W / 1000;

  const allowableStress = wood.bendingStrength;
  const passed = bendingStress <= allowableStress;

  return {
    name: '抗弯强度验算',
    calculatedValue: formatNumber(bendingStress),
    allowableValue: allowableStress,
    unit: 'N/mm²',
    passed,
    formula: 'σ = M/W ≤ f_m',
    process: `M = ${formatNumber(totalLoad)}kN × ${L}m² / 10 = ${formatNumber(maxMoment)}kN·m\nW = ${formatNumber(woodWidth * 1000)}mm × ${formatNumber(woodHeight * 1000)}mm² / 6 = ${formatNumber(W * 1e9)}mm³\nσ = ${formatNumber(maxMoment * 1000)}N·m / ${formatNumber(W * 1e9)}mm³ = ${formatNumber(bendingStress)}N/mm²\n允许值: ${allowableStress}N/mm²`,
  };
};

export const calculateShearStrength = (params: SupportParams): CheckItemResult => {
  const wood = getWoodProperty(params.woodSize);
  const L = params.poleSpacingX;
  const b = params.poleSpacingY;
  const h = params.slabThickness / 1000;
  const load = params.constructionLoad;

  const concreteLoad = CONCRETE_DENSITY * h * b * L;
  const selfWeight = 0.5 * b * L;
  const liveLoad = load * b * L;
  const totalLoad = (concreteLoad + selfWeight) * 1.2 + liveLoad * 1.4;

  const maxShear = 0.6 * totalLoad;

  const woodSize = params.woodSize.split('×').map(Number);
  const woodWidth = woodSize[0] / 1000;
  const woodHeight = woodSize[1] / 1000;
  const A = woodWidth * woodHeight;

  const shearStress = (1.5 * maxShear * 1000) / A / 1000;

  const allowableStress = wood.shearStrength;
  const passed = shearStress <= allowableStress;

  return {
    name: '抗剪强度验算',
    calculatedValue: formatNumber(shearStress),
    allowableValue: allowableStress,
    unit: 'N/mm²',
    passed,
    formula: 'τ = 3V/(2bh) ≤ f_v',
    process: `V = 0.6 × ${formatNumber(totalLoad)}kN = ${formatNumber(maxShear)}kN\nA = ${formatNumber(woodWidth * 1000)}mm × ${formatNumber(woodHeight * 1000)}mm = ${formatNumber(A * 1e6)}mm²\nτ = 1.5 × ${formatNumber(maxShear * 1000)}N / ${formatNumber(A * 1e6)}mm² = ${formatNumber(shearStress)}N/mm²\n允许值: ${allowableStress}N/mm²`,
  };
};

export const calculateStiffness = (params: SupportParams): CheckItemResult => {
  const wood = getWoodProperty(params.woodSize);
  const L = params.poleSpacingX;
  const b = params.poleSpacingY;
  const h = params.slabThickness / 1000;

  const concreteLoad = CONCRETE_DENSITY * h * b * L;
  const selfWeight = 0.5 * b * L;
  const totalLoad = concreteLoad + selfWeight;
  const q = totalLoad / L;

  const woodSize = params.woodSize.split('×').map(Number);
  const woodWidth = woodSize[0] / 1000;
  const woodHeight = woodSize[1] / 1000;
  const I = (woodWidth * woodHeight * woodHeight * woodHeight) / 12;
  const E = wood.elasticModulus;

  const deflection = (5 * q * Math.pow(L * 1000, 4)) / (384 * E * I * 1e12);

  const allowableDeflection = (L * 1000) / 250;
  const passed = deflection <= allowableDeflection;

  return {
    name: '刚度（挠度）验算',
    calculatedValue: formatNumber(deflection, 2),
    allowableValue: formatNumber(allowableDeflection, 2),
    unit: 'mm',
    passed,
    formula: 'ω = 5qL⁴/(384EI) ≤ L/250',
    process: `q = ${formatNumber(totalLoad)}kN / ${L}m = ${formatNumber(q)}kN/m\nI = ${formatNumber(woodWidth * 1000)}mm × ${formatNumber(woodHeight * 1000)}mm³ / 12 = ${formatNumber(I * 1e12)}mm⁴\nω = 5 × ${formatNumber(q)}N/mm × ${formatNumber(L * 1000)}mm⁴ / (384 × ${E}N/mm² × ${formatNumber(I * 1e12)}mm⁴) = ${formatNumber(deflection, 2)}mm\n允许值: L/250 = ${formatNumber(L * 1000)}mm / 250 = ${formatNumber(allowableDeflection, 2)}mm`,
  };
};

export const calculateStability = (params: SupportParams): CheckItemResult => {
  const steel = getSteelPipeProperty(params.steelPipeType);
  const L0 = params.stepDistance;
  const b = params.poleSpacingY;
  const L = params.poleSpacingX;
  const h = params.slabThickness / 1000;
  const load = params.constructionLoad;

  const concreteLoad = CONCRETE_DENSITY * h * b * L;
  const selfWeight = 0.5 * b * L;
  const liveLoad = load * b * L;
  const totalLoad = (concreteLoad + selfWeight) * 1.2 + liveLoad * 1.4;

  const axialForce = totalLoad * SAFETY_FACTOR;

  const i = steel.outerDiameter / 4;
  const lambda = (L0 * 1000) / i;

  let phi: number;
  if (lambda <= 91.1) {
    phi = 1 / (1 + 0.0019 * lambda + 0.000135 * lambda * lambda);
  } else {
    phi = 235 / (0.0011 * lambda * lambda + 0.0003 * lambda + 1);
    phi = phi / 205;
  }
  phi = Math.min(phi, 1);

  const A = steel.sectionArea;
  const stress = (axialForce * 1000) / (phi * A * 100) / 10;

  const allowableStress = steel.bendingStrength;
  const passed = stress <= allowableStress;

  return {
    name: '立杆稳定性验算',
    calculatedValue: formatNumber(stress),
    allowableValue: allowableStress,
    unit: 'N/mm²',
    passed,
    formula: 'σ = N/(φA) ≤ f',
    process: `N = ${formatNumber(totalLoad)}kN × ${SAFETY_FACTOR} = ${formatNumber(axialForce)}kN\nλ = ${L0}m / (${formatNumber(steel.outerDiameter)}mm / 4) = ${formatNumber(lambda, 1)}\nφ = ${formatNumber(phi, 3)}\nA = ${A}cm²\nσ = ${formatNumber(axialForce * 1000)}N / (${formatNumber(phi, 3)} × ${formatNumber(A * 100)}mm²) = ${formatNumber(stress)}N/mm²\n允许值: ${allowableStress}N/mm²`,
  };
};

export const calculateFastenerSliding = (params: SupportParams): CheckItemResult => {
  const b = params.poleSpacingY;
  const L = params.poleSpacingX;
  const h = params.slabThickness / 1000;
  const load = params.constructionLoad;

  const concreteLoad = CONCRETE_DENSITY * h * b * L;
  const selfWeight = 0.5 * b * L;
  const liveLoad = load * b * L;
  const totalLoad = (concreteLoad + selfWeight) * 1.2 + liveLoad * 1.4;

  const shearForce = totalLoad;
  const allowableForce = FASTENER_SLIP_RESISTANCE;
  const passed = shearForce <= allowableForce;

  return {
    name: '扣件抗滑验算',
    calculatedValue: formatNumber(shearForce, 2),
    allowableValue: allowableForce,
    unit: 'kN',
    passed,
    formula: 'R ≤ R_c',
    process: `R = ${formatNumber(totalLoad, 2)}kN\nR_c = ${allowableForce}kN\n${formatNumber(shearForce, 2)}kN ≤ ${allowableForce}kN: ${passed ? '满足' : '不满足'}`,
  };
};

export const performCalculation = (params: SupportParams): CalculationResult => {
  const bendingStrength = calculateBendingStrength(params);
  const shearStrength = calculateShearStrength(params);
  const stiffness = calculateStiffness(params);
  const stability = calculateStability(params);
  const fastenerSliding = calculateFastenerSliding(params);

  const items = [bendingStrength, shearStrength, stiffness, stability, fastenerSliding];
  const ratios = items.map(item => item.allowableValue > 0 ? item.calculatedValue / item.allowableValue : 999);
  const maxRatioIndex = ratios.indexOf(Math.max(...ratios));
  const weakestItem = items[maxRatioIndex].name;
  const weakestSafetyRatio = ratios[maxRatioIndex];

  const overallPassed = items.every(item => item.passed);

  return {
    bendingStrength,
    shearStrength,
    stiffness,
    stability,
    fastenerSliding,
    weakestItem,
    weakestSafetyRatio: formatNumber(weakestSafetyRatio, 3),
    overallPassed,
  };
};

export const generateSuggestions = (params: SupportParams, result: CalculationResult): Suggestion[] => {
  const suggestions: Suggestion[] = [];

  if (!result.bendingStrength.passed) {
    suggestions.push({
      item: '抗弯强度不足',
      problem: `模板抗弯应力 ${result.bendingStrength.calculatedValue}N/mm² 超过允许值 ${result.bendingStrength.allowableValue}N/mm²`,
      suggestion: '建议减小立杆纵距或增大木方截面尺寸',
      priority: 'high',
    });
  }

  if (!result.shearStrength.passed) {
    suggestions.push({
      item: '抗剪强度不足',
      problem: `模板抗剪应力 ${result.shearStrength.calculatedValue}N/mm² 超过允许值 ${result.shearStrength.allowableValue}N/mm²`,
      suggestion: '建议减小立杆间距或增加木方数量',
      priority: 'high',
    });
  }

  if (!result.stiffness.passed) {
    suggestions.push({
      item: '刚度不足',
      problem: `模板挠度 ${result.stiffness.calculatedValue}mm 超过允许值 ${result.stiffness.allowableValue}mm`,
      suggestion: '建议减小立杆纵距或增大木方截面高度',
      priority: 'high',
    });
  }

  if (!result.stability.passed) {
    suggestions.push({
      item: '立杆稳定性不足',
      problem: `立杆应力 ${result.stability.calculatedValue}N/mm² 超过允许值 ${result.stability.allowableValue}N/mm²`,
      suggestion: '建议减小立杆间距或步距，或增大钢管壁厚',
      priority: 'high',
    });
  }

  if (!result.fastenerSliding.passed) {
    suggestions.push({
      item: '扣件抗滑不足',
      problem: `扣件反力 ${result.fastenerSliding.calculatedValue}kN 超过允许值 ${result.fastenerSliding.allowableValue}kN`,
      suggestion: '建议减小立杆间距或增加防滑扣件',
      priority: 'high',
    });
  }

  if (params.stepDistance > 1.8) {
    suggestions.push({
      item: '步距偏大',
      problem: `步距 ${params.stepDistance}m 超出常用范围 1.2-1.8m`,
      suggestion: '建议将步距减小至1.8m以内，以提高立杆稳定性',
      priority: 'medium',
    });
  }

  if (params.poleSpacingX > 1.5 || params.poleSpacingY > 1.2) {
    suggestions.push({
      item: '立杆间距偏大',
      problem: `立杆纵距 ${params.poleSpacingX}m 或横距 ${params.poleSpacingY}m 偏大`,
      suggestion: '建议立杆纵距不超过1.5m，横距不超过1.2m',
      priority: 'medium',
    });
  }

  if (params.constructionLoad > 3.0) {
    suggestions.push({
      item: '施工荷载偏大',
      problem: `施工荷载 ${params.constructionLoad}kN/m² 较大`,
      suggestion: '建议控制施工荷载在3.0kN/m²以内，或进行专项设计',
      priority: 'low',
    });
  }

  if (result.overallPassed && result.weakestSafetyRatio > 0.85) {
    suggestions.push({
      item: '安全储备偏低',
      problem: `最薄弱项"${result.weakestItem}"安全储备为 ${(1 / result.weakestSafetyRatio * 100).toFixed(1)}%`,
      suggestion: '建议适当优化参数以提高安全储备',
      priority: 'low',
    });
  }

  return suggestions;
};
