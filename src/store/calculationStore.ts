import { create } from 'zustand';
import type { SupportType, SupportParams, ProjectInfo, CalculationResult, Suggestion, ValidationResult, SchemeRecord, ParamDiff } from '@/types';
import { validateParams, hasValidationErrors, performCalculation as doCalculation, generateSuggestions, getParamSnapshot, getParamDiff, generateVersionNote } from '@/utils/calculations';

const STORAGE_KEY = 'template-support-calc-state';

interface PersistState {
  projectInfo: ProjectInfo;
  params: SupportParams;
  previousParams: SupportParams | null;
  previousResult: CalculationResult | null;
  result: CalculationResult | null;
  suggestions: Suggestion[];
  resultExpired: boolean;
  resultParamSnapshot: string;
  schemes: SchemeRecord[];
  calculationVersion: number;
  adoptedFrom: string | null;
  lastVersionDiff: ParamDiff[];
  lastVersionNote: string;
  currentStep: 'input' | 'result' | 'report';
  validationResults: ValidationResult[];
}

const loadPersistedState = (): Partial<PersistState> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PersistState;
    return parsed;
  } catch {
    return {};
  }
};

const savePersistedState = (state: PersistState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
};

interface CalculationState {
  projectInfo: ProjectInfo;
  params: SupportParams;
  previousParams: SupportParams | null;
  previousResult: CalculationResult | null;
  validationResults: ValidationResult[];
  result: CalculationResult | null;
  suggestions: Suggestion[];
  currentStep: 'input' | 'result' | 'report';
  resultExpired: boolean;
  resultParamSnapshot: string;
  schemes: SchemeRecord[];
  calculationVersion: number;
  adoptedFrom: string | null;
  lastVersionDiff: ParamDiff[];
  lastVersionNote: string;

  setProjectInfo: (info: Partial<ProjectInfo>) => void;
  setSupportType: (type: SupportType) => void;
  setParam: (key: keyof SupportParams, value: number | string | boolean) => void;
  validateAllParams: () => void;
  performCalculation: () => boolean;
  resetCalculation: () => void;
  goToStep: (step: 'input' | 'result' | 'report') => void;
  clearAll: () => void;
  saveScheme: (label: string) => void;
  adoptScheme: (schemeId: string) => void;
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

const persisted = loadPersistedState();

const KEY_PARAMS: (keyof SupportParams)[] = [
  'supportType', 'floorHeight', 'slabThickness', 'beamWidth', 'beamHeight',
  'poleSpacingX', 'poleSpacingY', 'stepDistance', 'woodSize', 'steelPipeType',
  'constructionLoad', 'templateThickness', 'templateElasticModulus', 'topCantilever',
  'diagonalBrace', 'scissorsBrace', 'sweepPole',
];

export const useCalculationStore = create<CalculationState>((set, get) => ({
  projectInfo: persisted.projectInfo || initialProjectInfo,
  params: persisted.params || initialParams,
  previousParams: persisted.previousParams || null,
  previousResult: persisted.previousResult || null,
  validationResults: persisted.validationResults || [],
  result: persisted.result || null,
  suggestions: persisted.suggestions || [],
  currentStep: persisted.currentStep || 'input',
  resultExpired: persisted.resultExpired || false,
  resultParamSnapshot: persisted.resultParamSnapshot || '',
  schemes: persisted.schemes || [],
  calculationVersion: persisted.calculationVersion || 0,
  adoptedFrom: persisted.adoptedFrom || null,
  lastVersionDiff: persisted.lastVersionDiff || [],
  lastVersionNote: persisted.lastVersionNote || '',

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
    const { params, result: prevResult, previousParams: prevParams } = get();
    const validation = validateParams(params);
    if (hasValidationErrors(validation)) {
      set({ validationResults: validation });
      return false;
    }
    const oldParams = prevResult ? prevParams : null;
    const newResult = doCalculation(params);
    const suggestions = generateSuggestions(params, newResult);
    const diff = oldParams ? getParamDiff(oldParams, params) : [];
    const versionNote = generateVersionNote(diff, prevResult, newResult);
    set({
      previousParams: { ...params },
      previousResult: prevResult ? { ...prevResult } : null,
      result: newResult,
      suggestions,
      currentStep: 'result',
      resultExpired: false,
      resultParamSnapshot: getParamSnapshot(params),
      validationResults: validation,
      calculationVersion: get().calculationVersion + 1,
      lastVersionDiff: diff,
      adoptedFrom: null,
      lastVersionNote: versionNote,
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
      previousParams: null,
      previousResult: null,
      validationResults: [],
      result: null,
      suggestions: [],
      currentStep: 'input',
      resultExpired: false,
      resultParamSnapshot: '',
      calculationVersion: 0,
      adoptedFrom: null,
      lastVersionDiff: [],
      lastVersionNote: '',
    });
  },

  saveScheme: (label) => {
    const { params, result, suggestions, calculationVersion, adoptedFrom, lastVersionNote } = get();
    if (!result) return;
    const scheme: SchemeRecord = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      label,
      params: { ...params },
      result: { ...result },
      suggestions: [...suggestions],
      savedAt: new Date().toLocaleString('zh-CN'),
      version: calculationVersion,
      paramSnapshot: getParamSnapshot(params),
      adoptedFrom: adoptedFrom || undefined,
      versionNote: lastVersionNote || '初始版本',
    };
    set((state) => ({ schemes: [...state.schemes, scheme] }));
  },

  adoptScheme: (schemeId) => {
    const scheme = get().schemes.find(s => s.id === schemeId);
    if (!scheme) return;
    set((state) => ({
      params: { ...scheme.params },
      result: { ...scheme.result },
      suggestions: [...scheme.suggestions],
      resultExpired: false,
      resultParamSnapshot: scheme.paramSnapshot,
      adoptedFrom: scheme.label,
      currentStep: 'input',
    }));
    get().validateAllParams();
  },

  deleteScheme: (id) => {
    set((state) => ({ schemes: state.schemes.filter(s => s.id !== id) }));
  },

  clearSchemes: () => {
    set({ schemes: [] });
  },
}));

useCalculationStore.subscribe((state) => {
  const persist: PersistState = {
    projectInfo: state.projectInfo,
    params: state.params,
    previousParams: state.previousParams,
    previousResult: state.previousResult,
    result: state.result,
    suggestions: state.suggestions,
    resultExpired: state.resultExpired,
    resultParamSnapshot: state.resultParamSnapshot,
    schemes: state.schemes,
    calculationVersion: state.calculationVersion,
    adoptedFrom: state.adoptedFrom,
    lastVersionDiff: state.lastVersionDiff,
    lastVersionNote: state.lastVersionNote,
    currentStep: state.currentStep,
    validationResults: state.validationResults,
  };
  savePersistedState(persist);
});
