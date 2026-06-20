import { create } from 'zustand';
import type { SupportType, SupportParams, ProjectInfo, CalculationResult, Suggestion, ValidationResult, SchemeRecord } from '@/types';
import { validateParams, hasValidationErrors, performCalculation, generateSuggestions, getParamSnapshot } from '@/utils/calculations';

interface CalculationState {
  projectInfo: ProjectInfo;
  params: SupportParams;
  validationResults: ValidationResult[];
  result: CalculationResult | null;
  suggestions: Suggestion[];
  currentStep: 'input' | 'result' | 'report';
  resultExpired: boolean;
  resultParamSnapshot: string;
  schemes: SchemeRecord[];
  calculationVersion: number;

  setProjectInfo: (info: Partial<ProjectInfo>) => void;
  setSupportType: (type: SupportType) => void;
  setParam: (key: keyof SupportParams, value: number | string | boolean) => void;
  validateAllParams: () => void;
  performCalculation: () => boolean;
  resetCalculation: () => void;
  goToStep: (step: 'input' | 'result' | 'report') => void;
  clearAll: () => void;
  saveScheme: (label: string) => void;
  deleteScheme: (id: string) => void;
  clearSchemes: () => void;
}

const today = new Date().toISOString().split('T')[0];

const initialParams: SupportParams = {
  supportType: 'slab',
  floorHeight: 3.6,
  slabThickness: 150,
  beamWidth: 300,
  beamHeight: 600,
  poleSpacingX: 1.0,
  poleSpacingY: 1.0,
  stepDistance: 1.5,
  woodSize: '50×100',
  steelPipeType: 'φ48×3.0',
  constructionLoad: 2.0,
  templateThickness: 15,
  templateElasticModulus: 6000,
  diagonalBrace: true,
  scissorsBrace: true,
  sweepPole: true,
  topCantilever: 300,
};

const initialProjectInfo: ProjectInfo = { projectName: '', preparedBy: '', preparedDate: today };

const KEY_PARAMS: (keyof SupportParams)[] = [
  'supportType', 'floorHeight', 'slabThickness', 'beamWidth', 'beamHeight',
  'poleSpacingX', 'poleSpacingY', 'stepDistance', 'woodSize', 'steelPipeType',
  'constructionLoad', 'templateThickness', 'templateElasticModulus', 'topCantilever',
  'diagonalBrace', 'scissorsBrace', 'sweepPole',
];

export const useCalculationStore = create<CalculationState>((set, get) => ({
  projectInfo: initialProjectInfo,
  params: initialParams,
  validationResults: [],
  result: null,
  suggestions: [],
  currentStep: 'input',
  resultExpired: false,
  resultParamSnapshot: '',
  schemes: [],
  calculationVersion: 0,

  setProjectInfo: (info) => {
    set((state) => ({ projectInfo: { ...state.projectInfo, ...info } }));
  },

  setSupportType: (type) => {
    set((state) => {
      const newParams = { ...state.params, supportType: type };
      const shouldExpire = state.result && state.resultParamSnapshot && getParamSnapshot(newParams) !== state.resultParamSnapshot;
      return { params: newParams, resultExpired: shouldExpire ? true : state.resultExpired };
    });
    get().validateAllParams();
  },

  setParam: (key, value) => {
    set((state) => {
      const newParams = { ...state.params, [key]: value };
      const shouldExpire = state.result && KEY_PARAMS.includes(key) && state.resultParamSnapshot && getParamSnapshot(newParams) !== state.resultParamSnapshot;
      return { params: newParams, resultExpired: shouldExpire ? true : state.resultExpired };
    });
    get().validateAllParams();
  },

  validateAllParams: () => {
    const { params } = get();
    const results = validateParams(params);
    set({ validationResults: results });
  },

  performCalculation: () => {
    const { params } = get();
    const validation = validateParams(params);
    if (hasValidationErrors(validation)) {
      set({ validationResults: validation });
      return false;
    }
    const result = performCalculation(params);
    const suggestions = generateSuggestions(params, result);
    set({
      result,
      suggestions,
      currentStep: 'result',
      resultExpired: false,
      resultParamSnapshot: getParamSnapshot(params),
      validationResults: validation,
      calculationVersion: get().calculationVersion + 1,
    });
    return true;
  },

  resetCalculation: () => {
    set((state) => ({
      currentStep: 'input',
      resultExpired: state.result ? true : state.resultExpired,
    }));
  },

  goToStep: (step) => {
    const { result, resultExpired } = get();
    if (step === 'report' && (!result || resultExpired)) return;
    if (step === 'result' && !result) return;
    set({ currentStep: step });
  },

  clearAll: () => {
    set({
      projectInfo: initialProjectInfo,
      params: initialParams,
      validationResults: [],
      result: null,
      suggestions: [],
      currentStep: 'input',
      resultExpired: false,
      resultParamSnapshot: '',
      calculationVersion: 0,
    });
  },

  saveScheme: (label) => {
    const { params, result, suggestions, calculationVersion } = get();
    if (!result) return;
    const scheme: SchemeRecord = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      label,
      params: { ...params },
      result: { ...result },
      suggestions: [...suggestions],
      savedAt: new Date().toLocaleString('zh-CN'),
      version: calculationVersion,
    };
    set((state) => ({ schemes: [...state.schemes, scheme] }));
  },

  deleteScheme: (id) => {
    set((state) => ({ schemes: state.schemes.filter(s => s.id !== id) }));
  },

  clearSchemes: () => {
    set({ schemes: [] });
  },
}));
