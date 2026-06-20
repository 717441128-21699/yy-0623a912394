import React from 'react';
import { AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import type { ValidationResult } from '@/types';
import { getParamRange } from '@/utils/materials';
import { cn } from '@/lib/utils';

interface FormInputProps {
  label: string;
  field: string;
  value: number | string;
  unit: string;
  onChange: (value: number | string) => void;
  type?: 'number' | 'text' | 'select';
  options?: string[];
  placeholder?: string;
  step?: number;
  validation?: ValidationResult;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  field,
  value,
  unit,
  onChange,
  type = 'number',
  options = [],
  placeholder,
  step = 0.1,
  validation,
}) => {
  const range = getParamRange(field);

  const getStatus = () => {
    if (!validation) return null;
    return validation.status;
  };

  const status = getStatus();

  const inputClassName = cn(
    'input-field pr-16',
    status === 'missing' && 'error',
    status === 'outOfRange' && 'warning'
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (type === 'number') {
      const numValue = parseFloat(e.target.value);
      onChange(isNaN(numValue) ? 0 : numValue);
    } else {
      onChange(e.target.value);
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {status === 'valid' && (
          <CheckCircle className="w-4 h-4 text-success-500" />
        )}
        {status === 'missing' && (
          <div className="flex items-center text-xs text-danger-500">
            <XCircle className="w-4 h-4 mr-1" />
            必填
          </div>
        )}
        {status === 'outOfRange' && (
          <div className="flex items-center text-xs text-warning-500">
            <AlertTriangle className="w-4 h-4 mr-1" />
            {range && `常用范围: ${range.min}-${range.max}${range.unit}`}
          </div>
        )}
      </div>
      <div className="relative">
        {type === 'select' ? (
          <select
            value={value}
            onChange={handleChange}
            className={cn(inputClassName, 'text-left appearance-none bg-no-repeat bg-right pr-10')}
            style={{ backgroundPosition: 'right 0.75rem center', backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundSize: '1.5em 1.5em' }}
          >
            <option value="">请选择</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={value || ''}
            onChange={handleChange}
            placeholder={placeholder}
            step={step}
            className={inputClassName}
          />
        )}
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-mono">
          {unit}
        </span>
      </div>
    </div>
  );
};
