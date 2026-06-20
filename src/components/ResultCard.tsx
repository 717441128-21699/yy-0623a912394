import React, { useState } from 'react';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import type { CheckItemResult } from '@/types';

interface ResultCardProps {
  item: CheckItemResult;
  isWeakest?: boolean;
}

export const ResultCard: React.FC<ResultCardProps> = ({ item, isWeakest }) => {
  const [expanded, setExpanded] = useState(false);

  const ratio = item.allowableValue > 0 ? item.calculatedValue / item.allowableValue : 0;
  const percentage = Math.min(ratio * 100, 120);

  const getProgressColor = () => {
    if (ratio > 1) return 'bg-danger-500';
    if (ratio > 0.85) return 'bg-warning-500';
    return 'bg-success-500';
  };

  return (
    <div
      className={`card card-hover p-5 relative overflow-hidden ${
        isWeakest ? 'ring-2 ring-danger-500 animate-pulse-slow' : ''
      }`}
    >
      {isWeakest && (
        <div className="absolute top-0 left-0 right-0 bg-danger-500 text-white text-xs font-medium py-1 px-3 flex items-center justify-center gap-1">
          <AlertTriangle className="w-3 h-3 animate-blink" />
          最薄弱项
        </div>
      )}

      <div className={isWeakest ? 'mt-6' : ''}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="font-bold text-gray-800">{item.name}</h4>
            <p className="text-xs text-gray-500 font-mono mt-1">{item.formula}</p>
          </div>
          {item.passed ? (
            <span className="badge badge-success">
              <CheckCircle className="w-3 h-3 mr-1" />
              通过
            </span>
          ) : (
            <span className="badge badge-danger">
              <XCircle className="w-3 h-3 mr-1" />
              不通过
            </span>
          )}
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">计算值</span>
            <span className={`font-mono font-bold ${item.passed ? 'text-gray-800' : 'text-danger-600'}`}>
              {item.calculatedValue} {item.unit}
            </span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">允许值</span>
            <span className="font-mono text-gray-500">
              {item.allowableValue} {item.unit}
            </span>
          </div>

          <div className="mt-3">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${getProgressColor()} transition-all duration-500`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-400">0%</span>
              <span
                className={`text-xs font-medium ${
                  ratio > 1 ? 'text-danger-500' : ratio > 0.85 ? 'text-warning-500' : 'text-success-500'
                }`}
              >
                {(ratio * 100).toFixed(1)}%
              </span>
              <span className="text-xs text-gray-400">100%</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-sm text-primary-600 hover:text-primary-700 py-2 border-t border-gray-100"
        >
          <span className="font-medium">验算过程</span>
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {expanded && (
          <div className="mt-3 p-4 bg-gray-50 text-sm font-mono whitespace-pre-line text-gray-700 leading-relaxed">
            {item.process}
          </div>
        )}
      </div>
    </div>
  );
};
