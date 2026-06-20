import type { MaterialProperty, ParamRange, SupportTypeConfig } from '@/types';

export const WOOD_MATERIALS: Record<string, MaterialProperty> = {
  '50×100': {
    name: '木方',
    size: '50×100mm',
    elasticModulus: 9000,
    bendingStrength: 13,
    shearStrength: 1.4,
    density: 5,
  },
  '60×80': {
    name: '木方',
    size: '60×80mm',
    elasticModulus: 9000,
    bendingStrength: 13,
    shearStrength: 1.4,
    density: 5,
  },
  '40×80': {
    name: '木方',
    size: '40×80mm',
    elasticModulus: 9000,
    bendingStrength: 13,
    shearStrength: 1.4,
    density: 5,
  },
  '100×100': {
    name: '木方',
    size: '100×100mm',
    elasticModulus: 9000,
    bendingStrength: 13,
    shearStrength: 1.4,
    density: 5,
  },
};

export const STEEL_PIPE_MATERIALS: Record<string, MaterialProperty & { wallThickness: number; outerDiameter: number; sectionArea: number; momentOfInertia: number; sectionModulus: number }> = {
  'φ48×3.0': {
    name: '焊接钢管',
    size: 'φ48×3.0mm',
    elasticModulus: 206000,
    bendingStrength: 205,
    shearStrength: 120,
    density: 78.5,
    outerDiameter: 48,
    wallThickness: 3.0,
    sectionArea: 4.24,
    momentOfInertia: 10.78,
    sectionModulus: 4.49,
  },
  'φ48×3.5': {
    name: '焊接钢管',
    size: 'φ48×3.5mm',
    elasticModulus: 206000,
    bendingStrength: 205,
    shearStrength: 120,
    density: 78.5,
    outerDiameter: 48,
    wallThickness: 3.5,
    sectionArea: 4.89,
    momentOfInertia: 12.19,
    sectionModulus: 5.08,
  },
  'φ51×3.0': {
    name: '焊接钢管',
    size: 'φ51×3.0mm',
    elasticModulus: 206000,
    bendingStrength: 205,
    shearStrength: 120,
    density: 78.5,
    outerDiameter: 51,
    wallThickness: 3.0,
    sectionArea: 4.52,
    momentOfInertia: 13.08,
    sectionModulus: 5.13,
  },
};

export const WOOD_OPTIONS = Object.keys(WOOD_MATERIALS);
export const STEEL_PIPE_OPTIONS = Object.keys(STEEL_PIPE_MATERIALS);

export const PARAM_RANGES: ParamRange[] = [
  { field: 'floorHeight', label: '层高', min: 2.0, max: 8.0, unit: 'm', required: true },
  { field: 'slabThickness', label: '板厚', min: 80, max: 400, unit: 'mm', required: true },
  { field: 'beamWidth', label: '梁宽', min: 150, max: 800, unit: 'mm', required: true },
  { field: 'beamHeight', label: '梁高', min: 300, max: 1500, unit: 'mm', required: true },
  { field: 'poleSpacingX', label: '立杆纵距', min: 0.6, max: 2.0, unit: 'm', required: true },
  { field: 'poleSpacingY', label: '立杆横距', min: 0.6, max: 1.5, unit: 'm', required: true },
  { field: 'stepDistance', label: '步距', min: 1.0, max: 2.0, unit: 'm', required: true },
  { field: 'constructionLoad', label: '施工荷载', min: 1.0, max: 5.0, unit: 'kN/m²', required: true },
];

export const SUPPORT_TYPE_CONFIGS: SupportTypeConfig[] = [
  {
    type: 'slab',
    name: '梁板模板',
    description: '适用于楼板和梁的模板支撑体系验算，包括模板、木方、钢管等',
    icon: 'layout-template',
  },
  {
    type: 'fullSupport',
    name: '满堂支架',
    description: '适用于大跨度、大荷载的满堂脚手架支撑体系验算',
    icon: 'grid-3x3',
  },
  {
    type: 'fastenerFrame',
    name: '扣件式钢管架',
    description: '适用于扣件式钢管脚手架的承载力、稳定性验算',
    icon: 'construction',
  },
];

export const CONCRETE_DENSITY = 24;
export const STEEL_DENSITY = 78.5;
export const WOOD_DENSITY = 5;
export const GRAVITY_ACCELERATION = 9.8;
export const SAFETY_FACTOR = 1.4;
export const FASTENER_SLIP_RESISTANCE = 8.0;

export const getWoodProperty = (size: string): MaterialProperty => {
  return WOOD_MATERIALS[size] || WOOD_MATERIALS['50×100'];
};

export const getSteelPipeProperty = (type: string) => {
  return STEEL_PIPE_MATERIALS[type] || STEEL_PIPE_MATERIALS['φ48×3.0'];
};

export const getParamRange = (field: string): ParamRange | undefined => {
  return PARAM_RANGES.find(p => p.field === field);
};
