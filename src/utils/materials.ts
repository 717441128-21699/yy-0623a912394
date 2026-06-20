import type { MaterialProperty, ParamRange, SupportTypeConfig, ParamFieldConfig } from '@/types';

export const WOOD_MATERIALS: Record<string, MaterialProperty> = {
  '50×100': { name: '木方', size: '50×100mm', elasticModulus: 9000, bendingStrength: 13, shearStrength: 1.4, density: 5 },
  '60×80': { name: '木方', size: '60×80mm', elasticModulus: 9000, bendingStrength: 13, shearStrength: 1.4, density: 5 },
  '40×80': { name: '木方', size: '40×80mm', elasticModulus: 9000, bendingStrength: 13, shearStrength: 1.4, density: 5 },
  '100×100': { name: '木方', size: '100×100mm', elasticModulus: 9000, bendingStrength: 13, shearStrength: 1.4, density: 5 },
};

export const STEEL_PIPE_MATERIALS: Record<string, MaterialProperty & { wallThickness: number; outerDiameter: number; sectionArea: number; momentOfInertia: number; sectionModulus: number }> = {
  'φ48×3.0': { name: '焊接钢管', size: 'φ48×3.0mm', elasticModulus: 206000, bendingStrength: 205, shearStrength: 120, density: 78.5, outerDiameter: 48, wallThickness: 3.0, sectionArea: 4.24, momentOfInertia: 10.78, sectionModulus: 4.49 },
  'φ48×3.5': { name: '焊接钢管', size: 'φ48×3.5mm', elasticModulus: 206000, bendingStrength: 205, shearStrength: 120, density: 78.5, outerDiameter: 48, wallThickness: 3.5, sectionArea: 4.89, momentOfInertia: 12.19, sectionModulus: 5.08 },
  'φ51×3.0': { name: '焊接钢管', size: 'φ51×3.0mm', elasticModulus: 206000, bendingStrength: 205, shearStrength: 120, density: 78.5, outerDiameter: 51, wallThickness: 3.0, sectionArea: 4.52, momentOfInertia: 13.08, sectionModulus: 5.13 },
};

export const WOOD_OPTIONS = Object.keys(WOOD_MATERIALS);
export const STEEL_PIPE_OPTIONS = Object.keys(STEEL_PIPE_MATERIALS);

export const PARAM_FIELDS: ParamFieldConfig[] = [
  { field: 'floorHeight', label: '层高', unit: 'm', type: 'number', step: 0.1, defaultValue: 3.6, group: '构件尺寸', supportTypes: ['slab', 'fullSupport', 'fastenerFrame'] },
  { field: 'slabThickness', label: '板厚', unit: 'mm', type: 'number', step: 10, defaultValue: 150, group: '构件尺寸', supportTypes: ['slab', 'fullSupport'] },
  { field: 'beamWidth', label: '梁宽', unit: 'mm', type: 'number', step: 50, defaultValue: 300, group: '构件尺寸', supportTypes: ['slab'] },
  { field: 'beamHeight', label: '梁高', unit: 'mm', type: 'number', step: 50, defaultValue: 600, group: '构件尺寸', supportTypes: ['slab'] },
  { field: 'poleSpacingX', label: '立杆纵距', unit: 'm', type: 'number', step: 0.1, defaultValue: 1.0, group: '支撑参数', supportTypes: ['slab', 'fullSupport', 'fastenerFrame'] },
  { field: 'poleSpacingY', label: '立杆横距', unit: 'm', type: 'number', step: 0.1, defaultValue: 1.0, group: '支撑参数', supportTypes: ['slab', 'fullSupport', 'fastenerFrame'] },
  { field: 'stepDistance', label: '步距', unit: 'm', type: 'number', step: 0.1, defaultValue: 1.5, group: '支撑参数', supportTypes: ['slab', 'fullSupport', 'fastenerFrame'] },
  { field: 'constructionLoad', label: '施工荷载', unit: 'kN/m²', type: 'number', step: 0.5, defaultValue: 2.0, group: '支撑参数', supportTypes: ['slab', 'fullSupport', 'fastenerFrame'] },
  { field: 'woodSize', label: '木方规格', unit: 'mm', type: 'select', options: WOOD_OPTIONS, defaultValue: '50×100', group: '材料规格', supportTypes: ['slab', 'fullSupport'] },
  { field: 'steelPipeType', label: '钢管型号', unit: 'mm', type: 'select', options: STEEL_PIPE_OPTIONS, defaultValue: 'φ48×3.0', group: '材料规格', supportTypes: ['slab', 'fullSupport', 'fastenerFrame'] },
  { field: 'templateThickness', label: '模板厚度', unit: 'mm', type: 'number', step: 2, defaultValue: 15, group: '构件尺寸', supportTypes: ['slab'] },
  { field: 'templateElasticModulus', label: '模板弹性模量', unit: 'N/mm²', type: 'number', step: 500, defaultValue: 6000, group: '材料规格', supportTypes: ['slab'] },
  { field: 'diagonalBrace', label: '设置纵横向剪刀撑', unit: '', type: 'boolean', defaultValue: true, group: '构造措施', supportTypes: ['fullSupport', 'fastenerFrame'] },
  { field: 'scissorsBrace', label: '设置水平剪刀撑', unit: '', type: 'boolean', defaultValue: true, group: '构造措施', supportTypes: ['fullSupport'] },
  { field: 'sweepPole', label: '设置扫地杆', unit: '', type: 'boolean', defaultValue: true, group: '构造措施', supportTypes: ['fullSupport', 'fastenerFrame'] },
  { field: 'topCantilever', label: '顶托悬臂长度', unit: 'mm', type: 'number', step: 50, defaultValue: 300, group: '支撑参数', supportTypes: ['fullSupport', 'fastenerFrame'] },
];

export const PARAM_RANGES: ParamRange[] = [
  { field: 'floorHeight', label: '层高', min: 2.0, max: 8.0, unit: 'm', required: true },
  { field: 'slabThickness', label: '板厚', min: 80, max: 400, unit: 'mm', required: true },
  { field: 'beamWidth', label: '梁宽', min: 150, max: 800, unit: 'mm', required: true },
  { field: 'beamHeight', label: '梁高', min: 300, max: 1500, unit: 'mm', required: true },
  { field: 'poleSpacingX', label: '立杆纵距', min: 0.6, max: 2.0, unit: 'm', required: true },
  { field: 'poleSpacingY', label: '立杆横距', min: 0.6, max: 1.5, unit: 'm', required: true },
  { field: 'stepDistance', label: '步距', min: 1.0, max: 2.0, unit: 'm', required: true },
  { field: 'constructionLoad', label: '施工荷载', min: 1.0, max: 5.0, unit: 'kN/m²', required: true },
  { field: 'templateThickness', label: '模板厚度', min: 12, max: 25, unit: 'mm', required: true },
  { field: 'templateElasticModulus', label: '模板弹性模量', min: 3000, max: 12000, unit: 'N/mm²', required: true },
  { field: 'topCantilever', label: '顶托悬臂长度', min: 0, max: 650, unit: 'mm', required: true },
];

export const SUPPORT_TYPE_CONFIGS: SupportTypeConfig[] = [
  {
    type: 'slab',
    name: '梁板模板',
    description: '适用于楼板和梁的模板支撑体系验算，重点验算模板、木方和钢管的承载力与刚度',
    icon: 'layout-template',
    standards: ['JGJ 162-2008《建筑施工模板安全技术规范》', 'GB 50666-2011《混凝土结构工程施工规范》'],
    loadCombination: '恒载分项系数1.2，活载分项系数1.4；恒载=混凝土自重+模板及支架自重，活载=施工人员及设备荷载',
    checkFocus: ['模板抗弯强度', '模板挠度', '木方抗弯强度', '木方抗剪强度', '木方挠度', '立杆稳定性', '扣件抗滑'],
    worstCaseDesc: '最不利工况为板厚最大处混凝土浇筑时的满载状态，此时模板及木方承受最大均布荷载',
  },
  {
    type: 'fullSupport',
    name: '满堂支架',
    description: '适用于大跨度、大荷载的满堂脚手架支撑体系验算，重点验算整体稳定性和构造措施',
    icon: 'grid-3x3',
    standards: ['JGJ 130-2011《建筑施工扣件式钢管脚手架安全技术规范》', 'JGJ 162-2008《建筑施工模板安全技术规范》', 'JGJ 231-2010《承插型盘扣式钢管支架安全技术规程》'],
    loadCombination: '恒载分项系数1.2，活载分项系数1.4；恒载=混凝土自重+支架自重，活载=施工荷载+振捣混凝土荷载',
    checkFocus: ['立杆稳定性', '立杆承载力', '顶托验算', '扣件抗滑', '地基承载力'],
    worstCaseDesc: '最不利工况为高支模区域混凝土浇筑完成时的全载状态，且考虑顶托悬臂偏心影响',
  },
  {
    type: 'fastenerFrame',
    name: '扣件式钢管架',
    description: '适用于扣件式钢管脚手架的承载力、稳定性和连接件验算',
    icon: 'construction',
    standards: ['JGJ 130-2011《建筑施工扣件式钢管脚手架安全技术规范》', 'GB 50009-2012《建筑结构荷载规范》'],
    loadCombination: '恒载分项系数1.2，活载分项系数1.4；恒载=结构自重+架体自重，活载=施工荷载+风荷载',
    checkFocus: ['立杆稳定性', '立杆承载力', '扣件抗滑', '连墙件验算', '顶托验算'],
    worstCaseDesc: '最不利工况为施工荷载最大且未设置连墙件的自由高度段，长细比最大处',
  },
];

export const CONCRETE_DENSITY = 24;
export const SAFETY_FACTOR = 1.4;
export const FASTENER_SLIP_RESISTANCE = 8.0;

export const getWoodProperty = (size: string): MaterialProperty => WOOD_MATERIALS[size] || WOOD_MATERIALS['50×100'];
export const getSteelPipeProperty = (type: string) => STEEL_PIPE_MATERIALS[type] || STEEL_PIPE_MATERIALS['φ48×3.0'];
export const getParamRange = (field: string): ParamRange | undefined => PARAM_RANGES.find(p => p.field === field);
export const getSupportTypeConfig = (type: string) => SUPPORT_TYPE_CONFIGS.find(c => c.type === type);
export const getFieldsForType = (supportType: string) => PARAM_FIELDS.filter(f => f.supportTypes.includes(supportType as any));
export const getGroupsForType = (supportType: string) => {
  const fields = getFieldsForType(supportType);
  const groups: string[] = [];
  fields.forEach(f => { if (!groups.includes(f.group)) groups.push(f.group); });
  return groups;
};
