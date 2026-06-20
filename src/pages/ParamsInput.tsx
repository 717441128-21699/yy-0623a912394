import React, { useEffect } from 'react';
import { Calculator, RotateCcw, Building2, User, Calendar } from 'lucide-react';
import { useCalculationStore } from '@/store/calculationStore';
import { SupportTypeSelector } from '@/components/SupportTypeSelector';
import { FormInput } from '@/components/FormInput';
import { ValidationPanel } from '@/components/ValidationPanel';
import { WOOD_OPTIONS, STEEL_PIPE_OPTIONS } from '@/utils/materials';
import { hasValidationErrors } from '@/utils/calculations';

export const ParamsInput: React.FC = () => {
  const {
    projectInfo,
    params,
    validationResults,
    setProjectInfo,
    setSupportType,
    setParam,
    validateAllParams,
    performCalculation,
    clearAll,
  } = useCalculationStore();

  useEffect(() => {
    validateAllParams();
  }, []);

  const handleCalculate = () => {
    const success = performCalculation();
    if (!success) {
      return;
    }
  };

  const hasErrors = hasValidationErrors(validationResults);

  const getValidation = (field: string) => {
    return validationResults.find((v) => v.field === field);
  };

  return (
    <div className="container mx-auto px-4 py-6">
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
                <input
                  type="text"
                  value={projectInfo.projectName}
                  onChange={(e) => setProjectInfo({ projectName: e.target.value })}
                  placeholder="请输入项目名称"
                  className="input-field text-left"
                />
              </div>
              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4 text-gray-400" />
                  编制人
                </label>
                <input
                  type="text"
                  value={projectInfo.preparedBy}
                  onChange={(e) => setProjectInfo({ preparedBy: e.target.value })}
                  placeholder="请输入编制人"
                  className="input-field text-left"
                />
              </div>
              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  编制日期
                </label>
                <input
                  type="date"
                  value={projectInfo.preparedDate}
                  onChange={(e) => setProjectInfo({ preparedDate: e.target.value })}
                  className="input-field text-left"
                />
              </div>
            </div>
          </div>

          <div className="card p-6 mb-6">
            <SupportTypeSelector
              selectedType={params.supportType}
              onSelect={setSupportType}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="section-title">构件尺寸</h3>
              <FormInput
                label="层高"
                field="floorHeight"
                value={params.floorHeight}
                unit="m"
                onChange={(v) => setParam('floorHeight', v as number)}
                step={0.1}
                validation={getValidation('floorHeight')}
              />
              <FormInput
                label="板厚"
                field="slabThickness"
                value={params.slabThickness}
                unit="mm"
                onChange={(v) => setParam('slabThickness', v as number)}
                step={10}
                validation={getValidation('slabThickness')}
              />
              <FormInput
                label="梁宽"
                field="beamWidth"
                value={params.beamWidth}
                unit="mm"
                onChange={(v) => setParam('beamWidth', v as number)}
                step={50}
                validation={getValidation('beamWidth')}
              />
              <FormInput
                label="梁高"
                field="beamHeight"
                value={params.beamHeight}
                unit="mm"
                onChange={(v) => setParam('beamHeight', v as number)}
                step={50}
                validation={getValidation('beamHeight')}
              />
            </div>

            <div className="card p-6">
              <h3 className="section-title">支撑参数</h3>
              <FormInput
                label="立杆纵距"
                field="poleSpacingX"
                value={params.poleSpacingX}
                unit="m"
                onChange={(v) => setParam('poleSpacingX', v as number)}
                step={0.1}
                validation={getValidation('poleSpacingX')}
              />
              <FormInput
                label="立杆横距"
                field="poleSpacingY"
                value={params.poleSpacingY}
                unit="m"
                onChange={(v) => setParam('poleSpacingY', v as number)}
                step={0.1}
                validation={getValidation('poleSpacingY')}
              />
              <FormInput
                label="步距"
                field="stepDistance"
                value={params.stepDistance}
                unit="m"
                onChange={(v) => setParam('stepDistance', v as number)}
                step={0.1}
                validation={getValidation('stepDistance')}
              />
              <FormInput
                label="施工荷载"
                field="constructionLoad"
                value={params.constructionLoad}
                unit="kN/m²"
                onChange={(v) => setParam('constructionLoad', v as number)}
                step={0.5}
                validation={getValidation('constructionLoad')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="card p-6">
              <h3 className="section-title">材料规格</h3>
              <FormInput
                label="木方规格"
                field="woodSize"
                value={params.woodSize}
                unit="mm"
                onChange={(v) => setParam('woodSize', v as string)}
                type="select"
                options={WOOD_OPTIONS}
                validation={getValidation('woodSize')}
              />
              <FormInput
                label="钢管型号"
                field="steelPipeType"
                value={params.steelPipeType}
                unit="mm"
                onChange={(v) => setParam('steelPipeType', v as string)}
                type="select"
                options={STEEL_PIPE_OPTIONS}
                validation={getValidation('steelPipeType')}
              />
            </div>

            <div className="card p-6">
              <h3 className="section-title">操作说明</h3>
              <div className="text-sm text-gray-600 space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <p>根据工程实际情况选择合适的支撑类型</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <p>按照施工图纸准确录入各项参数</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <p>查看右侧参数校验表，确保所有参数完整有效</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    4
                  </div>
                  <p>点击"开始验算"按钮进行安全验算</p>
                </div>
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-700 text-xs">
                  <strong>提示：</strong>本系统验算依据《建筑施工模板安全技术规范》JGJ162-2008 和《建筑施工扣件式钢管脚手架安全技术规范》JGJ130-2011，结果仅供参考，最终验算需经专业人员审核。
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-6 no-print">
            <button
              onClick={clearAll}
              className="btn-secondary flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              重置参数
            </button>
            <button
              onClick={handleCalculate}
              disabled={hasErrors}
              className={`btn-primary flex items-center gap-2 ${
                hasErrors ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Calculator className="w-5 h-5" />
              开始验算
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
