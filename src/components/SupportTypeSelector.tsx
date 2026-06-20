import React from 'react';
import { LayoutTemplate, Grid3X3, Construction } from 'lucide-react';
import type { SupportType } from '@/types';
import { SUPPORT_TYPE_CONFIGS } from '@/utils/materials';
import { cn } from '@/lib/utils';

interface SupportTypeSelectorProps {
  selectedType: SupportType;
  onSelect: (type: SupportType) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  'layout-template': <LayoutTemplate className="w-8 h-8" />,
  'grid-3x3': <Grid3X3 className="w-8 h-8" />,
  'construction': <Construction className="w-8 h-8" />,
};

export const SupportTypeSelector: React.FC<SupportTypeSelectorProps> = ({
  selectedType,
  onSelect,
}) => {
  return (
    <div className="mb-6">
      <h3 className="section-title">支撑类型</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SUPPORT_TYPE_CONFIGS.map((config) => {
          const isSelected = selectedType === config.type;
          return (
            <button
              key={config.type}
              onClick={() => onSelect(config.type)}
              className={cn(
                'card card-hover p-5 text-left transition-all',
                isSelected && 'ring-2 ring-primary-500 bg-primary-50/50'
              )}
            >
              <div
                className={cn(
                  'w-14 h-14 flex items-center justify-center mb-4 transition-colors',
                  isSelected ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-500'
                )}
              >
                {iconMap[config.icon]}
              </div>
              <h4
                className={cn(
                  'font-bold text-lg mb-2',
                  isSelected ? 'text-primary-700' : 'text-gray-800'
                )}
              >
                {config.name}
              </h4>
              <p className="text-sm text-gray-500 leading-relaxed">
                {config.description}
              </p>
              {isSelected && (
                <div className="mt-4 flex items-center gap-2 text-xs font-medium text-primary-600">
                  <div className="w-2 h-2 bg-primary-500 rounded-full" />
                  已选择
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
