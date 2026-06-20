import React from 'react';
import { AlertTriangle, XCircle, CheckCircle, Info } from 'lucide-react';
import type { ValidationResult } from '@/types';

interface ValidationPanelProps {
  results: ValidationResult[];
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({ results }) => {
  const missingFields = results.filter((r) => r.status === 'missing');
  const outOfRangeFields = results.filter((r) => r.status === 'outOfRange');
  const validFields = results.filter((r) => r.status === 'valid');

  if (results.length === 0) return null;

  return (
    <div className="card p-5 sticky top-4">
      <div className="flex items-center gap-2 mb-4">
        <Info className="w-5 h-5 text-primary-500" />
        <h3 className="font-bold text-primary-700">参数校验</h3>
      </div>

      <div className="space-y-3">
        {missingFields.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 text-danger-500 text-sm font-medium">
              <XCircle className="w-4 h-4" />
              缺失参数 ({missingFields.length})
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 font-medium">参数</th>
                  <th className="pb-2 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {missingFields.map((field) => (
                  <tr key={field.field} className="border-b border-gray-50">
                    <td className="py-2 text-gray-700">{field.label}</td>
                    <td className="py-2 text-danger-500">请填写</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {outOfRangeFields.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 text-warning-500 text-sm font-medium">
              <AlertTriangle className="w-4 h-4" />
              超出常用范围 ({outOfRangeFields.length})
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 font-medium">参数</th>
                  <th className="pb-2 font-medium text-right">当前值</th>
                  <th className="pb-2 font-medium text-right">常用范围</th>
                </tr>
              </thead>
              <tbody>
                {outOfRangeFields.map((field) => (
                  <tr key={field.field} className="border-b border-gray-50">
                    <td className="py-2 text-gray-700">{field.label}</td>
                    <td className="py-2 text-right font-mono text-warning-600">
                      {field.value}
                      {field.unit}
                    </td>
                    <td className="py-2 text-right text-gray-500 font-mono">
                      {field.min}-{field.max}
                      {field.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {validFields.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 text-success-500 text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              参数正常 ({validFields.length})
            </div>
            <div className="flex flex-wrap gap-1">
              {validFields.map((field) => (
                <span
                  key={field.field}
                  className="inline-flex items-center px-2 py-0.5 bg-success-50 text-success-600 text-xs rounded"
                >
                  {field.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {missingFields.length > 0 && (
        <div className="mt-4 p-3 bg-danger-50 border border-danger-200 text-sm text-danger-600">
          请先填写所有必填参数后再进行验算
        </div>
      )}
    </div>
  );
};
