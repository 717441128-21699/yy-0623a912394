import React, { useEffect } from 'react';
import { Calculator, RotateCcw, Building2, User, Calendar, AlertTriangle } from 'lucide-react';
import { useCalculationStore } from '@/store/calculationStore';
import { SupportTypeSelector } from '@/components/SupportTypeSelector';
import { FormInput } from '@/components/FormInput';
import { ValidationPanel } from '@/components/ValidationPanel';
import { getFieldsForType, getGroupsForType, getSupportTypeConfig } from '@/utils/materials';
import { hasValidationErrors } from '@/utils/calculations';
import type { SupportParams, ParamFieldConfig } from '@/types';

export const ParamsInput: React.FC = () => {
  const {
    projectInfo,
    params,
    validationResults,
    resultExpired,
    result,
    setProjectInfo,
    setSupportType,
    setParam,
    validateAllParams,
    performCalculation,
    clearAll,
  } = useCalculationStore();

  useEffect(() => { validateAllParams(); }, []);

  const handleCalculate = () => { performCalculation(); };
  const hasErrors = hasValidationErrors(validationResults);
  const getValidation = (field: string) => validationResults.find(v => v.field === field);
  const fields = getFieldsForType(params.supportType);
  const groups = getGroupsForType(params.supportType);
  const config = getSupportTypeConfig(params.supportType);

  const renderField = (f: ParamFieldConfig) => {
    if (f.type === 'boolean') {
      const checked = params[f.field as keyof SupportParams] as boolean;
      return (
        <div key={f.field} className="mb-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">{f.label}</label>
            <button
              type="button"
              onClick={() => setParam(f.field as keyof SupportParams, !checked)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-primary-500' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      );
    }
    return (
      <FormInput
        key={f.field}
        label={f.label}
        field={f.field}
        value={params[f.field as keyof SupportParams] as number | string}
        unit={f.unit}
        onChange={v => setParam(f.field as keyof SupportParams, v as number | string)}
        type={f.type === 'select' ? 'select' : 'number'}
        options={f.options}
        step={f.step}
        validation={getValidation(f.field)}
      />
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {resultExpired && result && (
        <div className="mb-4 p-4 bg-warning-50 border-2 border-warning-300 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-warning-500 flex-shrink-0" />
          <div>
            <p className="font-bold text-warning-700">验算结果已过期</p>
            <p className="text-sm text-warning-600">参数已修改，当前验算结果不再有效。请重新点击"开始验算"获取最新结果。</p>
          </div>
        </div>
      )}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="card p-6 mb-6">
            <h3 className="section-title flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              项目信息
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  项目名称
                </label>
                <input type="text" value={projectInfo.projectName} onChange={e => setProjectInfo({ projectName: e.target.value })} placeholder="请输入项目名称" className="input-field text-left" />
              </div>
              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4 text-gray-400" />
                  编制人
                </label>
                <input type="text" value={projectInfo.preparedBy} onChange={e => setProjectInfo({ preparedBy: e.target.value })} placeholder="请输入编制人" className="input-field text-left" />
              </div>
              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  编制日期
                </label>
                <input type="date" value={projectInfo.preparedDate} onChange={e => setProjectInfo({ preparedDate: e.target.value })} className="input-field text-left" />
              </div>
            </div>
          </div>

          <div className="card p-6 mb-6">
            <SupportTypeSelector selectedType={params.supportType} onSelect={setSupportType} />
            {config && (
              <div className="mt-4 p-3 bg-primary-50 border border-primary-200 text-sm">
                <p className="font-medium text-primary-700 mb-1">验算重点</p>
                <div className="flex flex-wrap gap-1">
                  {config.checkFocus.map(f => (
                    <span key={f} className="inline-block px-2 py-0.5 bg-white text-primary-600 text-xs border border-primary-200">{f}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {groups.map(group => {
              const groupFields = fields.filter(f => f.group === group);
              if (groupFields.length === 0) return null;
              return (
                <div key={group} className="card p-6">
                  <h3 className="section-title">{group}</h3>
                  {groupFields.map(renderField)}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center mt-6 no-print">
            <button onClick={clearAll} className="btn-secondary flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              重置参数
            </button>
            <button onClick={handleCalculate} disabled={hasErrors} className={`btn-primary flex items-center gap-2 ${hasErrors ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <Calculator className="w-5 h-5" />
              {resultExpired ? '重新验算' : '开始验算'}
            </button>
          </div>
        </div>

        <div className="w-full lg:w-80 flex-shrink-0">
          <ValidationPanel results={validationResults} />
        </div>
      </div>
    </div>
  );
};
