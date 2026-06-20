import { create } from 'zustand';
import type { SupportType, SupportParams, ProjectInfo, CalculationResult, Suggestion, ValidationResult } from '@/types';
import { validateParams, hasValidationErrors, performCalculation, generateSuggestions } from '@/utils/calculations';

interface CalculationState {
  projectInfo: ProjectInfo;
  params: SupportParams;
  validationResults: ValidationResult[];
  result: CalculationResult | null;
  suggestions: Suggestion[];
  currentStep: 'input' | 'result' | 'report';

  setProjectInfo: (info: Partial<ProjectInfo>) => void;
  setSupportType: (type: SupportType) => void;
  setParam: (key: keyof SupportParams, value: number | string) => void;
  validateAllParams: () => void;
  performCalculation: () => boolean;
  resetCalculation: () => void;
  goToStep: (step: 'input' | 'result' | 'report') => void;
  clearAll: () => void;
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
};

const initialProjectInfo: ProjectInfo = {
  projectName: '',
  preparedBy: '',
  preparedDate: today,
};

export const useCalculationStore = create<CalculationState>((set, get) => ({
  projectInfo: initialProjectInfo,
  params: initialParams,
  validationResults: [],
  result: null,
  suggestions: [],
  currentStep: 'input',

  setProjectInfo: (info) => {
    set((state) => ({
      projectInfo: { ...state.projectInfo, ...info },
    }));
  },

  setSupportType: (type) => {
    set((state) => ({
      params: { ...state.params, supportType: type },
    }));
    get().validateAllParams();
  },

  setParam: (key, value) => {
    set((state) => ({
      params: { ...state.params, [key]: value },
    }));
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
    });

    return true;
  },

  resetCalculation: () => {
    set({
      result: null,
      suggestions: [],
      currentStep: 'input',
    });
  },

  goToStep: (step) => {
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
    });
  },
}));
