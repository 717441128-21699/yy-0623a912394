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
  calculatedValue: number;
  allowableValue: number;
  unit: string;
  passed: boolean;
  formula: string;
  process: string;
}

export interface CalculationResult {
  bendingStrength: CheckItemResult;
  shearStrength: CheckItemResult;
  stiffness: CheckItemResult;
  stability: CheckItemResult;
  fastenerSliding: CheckItemResult;
  weakestItem: string;
  weakestSafetyRatio: number;
  overallPassed: boolean;
}

export interface Suggestion {
  item: string;
  problem: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
}

export interface CalculationReport {
  projectInfo: ProjectInfo;
  params: SupportParams;
  result: CalculationResult;
  suggestions: Suggestion[];
  generatedAt: string;
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

export interface SupportTypeConfig {
  type: SupportType;
  name: string;
  description: string;
  icon: string;
}
