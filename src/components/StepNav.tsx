import React from 'react';
import { ClipboardList, Calculator, FileText, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepNavProps {
  currentStep: 'input' | 'result' | 'report';
  onStepChange?: (step: 'input' | 'result' | 'report') => void;
  hasResult?: boolean;
}

const steps = [
  { id: 'input', label: '参数录入', icon: ClipboardList, number: 1 },
  { id: 'result', label: '验算结果', icon: Calculator, number: 2 },
  { id: 'report', label: '报告导出', icon: FileText, number: 3 },
] as const;

export const StepNav: React.FC<StepNavProps> = ({ currentStep, onStepChange, hasResult }) => {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500 flex items-center justify-center">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-primary-700">模板支撑安全验算系统</h1>
              <p className="text-xs text-gray-500">Template Support Safety Calculation</p>
            </div>
          </div>

          <ol className="flex items-center gap-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = index < currentIndex || (hasResult && index <= currentIndex);
              const canClick = onStepChange && (isCompleted || (index === 0) || (index === 2 && hasResult));

              return (
                <React.Fragment key={step.id}>
                  <li
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 transition-all cursor-pointer',
                      isActive && 'bg-primary-50 border-b-2 border-primary-500',
                      isCompleted && !isActive && 'text-success-600',
                      canClick && 'hover:bg-gray-50',
                      !canClick && 'opacity-50 cursor-not-allowed'
                    )}
                    onClick={() => canClick && onStepChange?.(step.id)}
                  >
                    <div
                      className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border-2',
                        isActive && 'bg-primary-500 border-primary-500 text-white',
                        isCompleted && !isActive && 'bg-success-500 border-success-500 text-white',
                        !isActive && !isCompleted && 'border-gray-300 text-gray-400'
                      )}
                    >
                      {isCompleted && !isActive ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        step.number
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-sm font-medium hidden sm:inline',
                        isActive && 'text-primary-700',
                        !isActive && !isCompleted && 'text-gray-400'
                      )}
                    >
                      {step.label}
                    </span>
                    <Icon
                      className={cn(
                        'w-4 h-4 hidden md:inline',
                        isActive && 'text-primary-500',
                        !isActive && !isCompleted && 'text-gray-300'
                      )}
                    />
                  </li>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        'w-8 h-0.5',
                        index < currentIndex ? 'bg-success-500' : 'bg-gray-200'
                      )}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </ol>
        </div>
      </div>
    </nav>
  );
};
