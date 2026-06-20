export type SupportType = 'slab' | 'fullSupport' | 'fastenerFrame';

export interface ProjectInfo {
  projectName: string;
  preparedBy: string;
  preparedDate: string;
}

export interface SupportParams {
  supportType: SupportType;
  floorHeight: number;
  slabThickness: number;
  beamWidth: number;
  beamHeight: number;
  poleSpacingX: number;
  poleSpacingY: number;
  stepDistance: number;
  woodSize: string;
  steelPipeType: string;
  constructionLoad: number;
  templateThickness: number;
  templateElasticModulus: number;
  diagonalBrace: boolean;
  scissorsBrace: boolean;
  sweepPole: boolean;
  topCantilever: number;
}

export interface ValidationResult {
  field: string;
  label: string;
  status: 'valid' | 'missing' | 'outOfRange';
  value: number | string;
  min?: number;
  max?: number;
  unit: string;
}

export interface CheckItemResult {
  name: string;
  category: string;
  calculatedValue: number;
  allowableValue: number;
  unit: string;
  passed: boolean;
  formula: string;
  process: string;
}

export interface CalculationResult {
  supportType: SupportType;
  items: CheckItemResult[];
  weakestItem: string;
  weakestSafetyRatio: number;
  overallPassed: boolean;
  passedCount: number;
  totalCount: number;
}

export interface Suggestion {
  item: string;
  problem: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
}

export interface SchemeRecord {
  id: string;
  label: string;
  params: SupportParams;
  result: CalculationResult;
  suggestions: Suggestion[];
  savedAt: string;
}

export interface MaterialProperty {
  name: string;
  size: string;
  elasticModulus: number;
  bendingStrength: number;
  shearStrength: number;
  density?: number;
}

export interface ParamRange {
  field: string;
  label: string;
  min: number;
  max: number;
  unit: string;
  required: boolean;
}

export interface ParamFieldConfig {
  field: string;
  label: string;
  unit: string;
  type: 'number' | 'select' | 'boolean';
  options?: string[];
  step?: number;
  defaultValue: number | string | boolean;
  group: string;
  supportTypes: SupportType[];
}

export interface SupportTypeConfig {
  type: SupportType;
  name: string;
  description: string;
  icon: string;
  standards: string[];
  loadCombination: string;
  checkFocus: string[];
  worstCaseDesc: string;
}

export interface ReportEnhancement {
  standards: string[];
  loadCombination: string;
  worstCaseDesc: string;
  reviewNote: string;
}
