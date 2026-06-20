import React from 'react';
import {
  CheckCircle,
  XCircle,
  ArrowLeft,
  FileText,
  AlertTriangle,
  Shield,
  ShieldAlert,
  Gauge,
  Building2,
  AlertOctagon,
} from 'lucide-react';
import { useCalculationStore } from '@/store/calculationStore';
import { ResultCard } from '@/components/ResultCard';
import { SUPPORT_TYPE_CONFIGS } from '@/utils/materials';
import type { Suggestion } from '@/types';

export const ResultPage: React.FC = () => {
  const { result, suggestions, params, goToStep, resetCalculation } = useCalculationStore();

  if (!result) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="card p-12 max-w-lg mx-auto">
          <AlertOctagon className="w-16 h-16 text-warning-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">暂无验算结果</h2>
          <p className="text-gray-500 mb-6">请先在参数录入页面填写参数并进行验算</p>
          <button onClick={() => goToStep('input')} className="btn-primary">
            前往参数录入
          </button>
        </div>
      </div>
    );
  }

  const supportTypeConfig = SUPPORT_TYPE_CONFIGS.find((c) => c.type === params.supportType);

  const checkItems = [
    { key: 'bendingStrength', data: result.bendingStrength },
    { key: 'shearStrength', data: result.shearStrength },
    { key: 'stiffness', data: result.stiffness },
    { key: 'stability', data: result.stability },
    { key: 'fastenerSliding', data: result.fastenerSliding },
  ];

  const passedCount = checkItems.filter((item) => item.data.passed).length;
  const totalCount = checkItems.length;

  const getPriorityColor = (priority: Suggestion['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-danger-50 border-danger-200 text-danger-700';
      case 'medium':
        return 'bg-warning-50 border-warning-200 text-warning-700';
      case 'low':
        return 'bg-primary-50 border-primary-200 text-primary-700';
    }
  };

  const getPriorityBadge = (priority: Suggestion['priority']) => {
    switch (priority) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
    }
  };

  const getPriorityIcon = (priority: Suggestion['priority']) => {
    switch (priority) {
      case 'high':
        return <AlertOctagon className="w-4 h-4" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4" />;
      case 'low':
        return <Gauge className="w-4 h-4" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div
        className={`p-6 mb-6 rounded-lg ${
          result.overallPassed
            ? 'bg-gradient-to-r from-success-500 to-success-600'
            : 'bg-gradient-to-r from-danger-500 to-danger-600'
        } text-white`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {result.overallPassed ? (
              <Shield className="w-12 h-12" />
            ) : (
              <ShieldAlert className="w-12 h-12" />
            )}
            <div>
              <h2 className="text-2xl font-bold mb-1">
                {result.overallPassed ? '验算通过' : '验算未通过'}
              </h2>
              <p className="text-white/80">
                {supportTypeConfig?.name} · {passedCount}/{totalCount} 项验算项通过
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">
              {((passedCount / totalCount) * 100).toFixed(0)}%
            </div>
            <div className="text-white/60 text-sm">合格率</div>
          </div>
        </div>
      </div>

      {!result.overallPassed && (
        <div className="card p-5 mb-6 border-2 border-danger-200 bg-danger-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-danger-500 flex-shrink-0 mt-0.5 animate-blink" />
            <div>
              <h4 className="font-bold text-danger-700 mb-1">最薄弱项警告</h4>
              <p className="text-danger-600 text-sm">
                <strong>{result.weakestItem}</strong> 为最薄弱环节，安全储备为
                <strong>
                  {' '}
                  {(1 / result.weakestSafetyRatio * 100).toFixed(1)}%
                </strong>
                ，请重点关注并采取加固措施。
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {checkItems.map((item) => (
          <ResultCard
            key={item.key}
            item={item.data}
            isWeakest={item.data.name === result.weakestItem}
          />
        ))}
      </div>

      {suggestions.length > 0 && (
        <div className="card p-6 mb-6">
          <h3 className="section-title flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning-500" />
            整改建议
          </h3>
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg ${getPriorityColor(suggestion.priority)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getPriorityIcon(suggestion.priority)}
                    <span className="font-bold">{suggestion.item}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-xs font-bold rounded ${
                      suggestion.priority === 'high'
                        ? 'bg-danger-500 text-white'
                        : suggestion.priority === 'medium'
                        ? 'bg-warning-500 text-white'
                        : 'bg-primary-500 text-white'
                    }`}
                  >
                    {getPriorityBadge(suggestion.priority)}优先级
                  </span>
                </div>
                <p className="text-sm mb-2 opacity-90">
                  <strong>问题：</strong>
                  {suggestion.problem}
                </p>
                <p className="text-sm opacity-90">
                  <strong>建议：</strong>
                  {suggestion.suggestion}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-6 mb-6">
        <h3 className="section-title flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary-500" />
          验算参数汇总
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-gray-500 text-xs mb-1">支撑类型</div>
            <div className="font-mono font-medium">{supportTypeConfig?.name}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-gray-500 text-xs mb-1">层高</div>
            <div className="font-mono font-medium">{params.floorHeight}m</div>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-gray-500 text-xs mb-1">板厚</div>
            <div className="font-mono font-medium">{params.slabThickness}mm</div>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-gray-500 text-xs mb-1">梁截面</div>
            <div className="font-mono font-medium">
              {params.beamWidth}×{params.beamHeight}mm
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-gray-500 text-xs mb-1">立杆纵距</div>
            <div className="font-mono font-medium">{params.poleSpacingX}m</div>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-gray-500 text-xs mb-1">立杆横距</div>
            <div className="font-mono font-medium">{params.poleSpacingY}m</div>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-gray-500 text-xs mb-1">步距</div>
            <div className="font-mono font-medium">{params.stepDistance}m</div>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-gray-500 text-xs mb-1">施工荷载</div>
            <div className="font-mono font-medium">
              {params.constructionLoad}kN/m²
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-gray-500 text-xs mb-1">木方规格</div>
            <div className="font-mono font-medium">{params.woodSize}mm</div>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-gray-500 text-xs mb-1">钢管型号</div>
            <div className="font-mono font-medium">{params.steelPipeType}mm</div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center no-print">
        <button
          onClick={resetCalculation}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          修改参数
        </button>
        <button
          onClick={() => goToStep('report')}
          className="btn-success flex items-center gap-2"
        >
          <FileText className="w-5 h-5" />
          生成计算书
        </button>
      </div>
    </div>
  );
};
