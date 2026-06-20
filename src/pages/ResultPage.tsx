import React, { useState } from 'react';
import {
  CheckCircle, XCircle, ArrowLeft, FileText, AlertTriangle,
  Shield, ShieldAlert, Building2, AlertOctagon, Save, Trash2, GitCompare, X,
} from 'lucide-react';
import { useCalculationStore } from '@/store/calculationStore';
import { ResultCard } from '@/components/ResultCard';
import { getSupportTypeConfig } from '@/utils/materials';
import type { Suggestion, SchemeRecord } from '@/types';

export const ResultPage: React.FC = () => {
  const { result, suggestions, params, schemes, goToStep, resetCalculation, saveScheme, deleteScheme } = useCalculationStore();
  const [showCompare, setShowCompare] = useState(false);
  const [schemeLabel, setSchemeLabel] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  if (!result) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="card p-12 max-w-lg mx-auto">
          <AlertOctagon className="w-16 h-16 text-warning-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">暂无验算结果</h2>
          <p className="text-gray-500 mb-6">请先在参数录入页面填写参数并进行验算</p>
          <button onClick={() => goToStep('input')} className="btn-primary">前往参数录入</button>
        </div>
      </div>
    );
  }

  const config = getSupportTypeConfig(params.supportType);
  const passedCount = result.passedCount;
  const totalCount = result.totalCount;

  const getPriorityColor = (p: Suggestion['priority']) => {
    if (p === 'high') return 'bg-danger-50 border-danger-200 text-danger-700';
    if (p === 'medium') return 'bg-warning-50 border-warning-200 text-warning-700';
    return 'bg-primary-50 border-primary-200 text-primary-700';
  };
  const getPriorityBadge = (p: Suggestion['priority']) => p === 'high' ? '高' : p === 'medium' ? '中' : '低';
  const getPriorityIcon = (p: Suggestion['priority']) => {
    if (p === 'high') return <AlertOctagon className="w-4 h-4" />;
    if (p === 'medium') return <AlertTriangle className="w-4 h-4" />;
    return <span className="w-4 h-4 inline-block text-center leading-4 text-xs font-bold">⬇</span>;
  };

  const handleSaveScheme = () => {
    if (!schemeLabel.trim()) return;
    saveScheme(schemeLabel.trim());
    setSchemeLabel('');
    setShowSaveInput(false);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className={`p-6 mb-6 rounded-lg ${result.overallPassed ? 'bg-gradient-to-r from-success-500 to-success-600' : 'bg-gradient-to-r from-danger-500 to-danger-600'} text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {result.overallPassed ? <Shield className="w-12 h-12" /> : <ShieldAlert className="w-12 h-12" />}
            <div>
              <h2 className="text-2xl font-bold mb-1">{result.overallPassed ? '验算通过' : '验算未通过'}</h2>
              <p className="text-white/80">{config?.name} · {passedCount}/{totalCount} 项验算项通过</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{((passedCount / totalCount) * 100).toFixed(0)}%</div>
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
              <p className="text-danger-600 text-sm"><strong>{result.weakestItem}</strong> 为最薄弱环节，安全储备为 <strong>{(1 / result.weakestSafetyRatio * 100).toFixed(1)}%</strong>，请重点关注并采取加固措施。</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {result.items.map((item, idx) => (
          <ResultCard key={idx} item={item} isWeakest={item.name === result.weakestItem} />
        ))}
      </div>

      {suggestions.length > 0 && (
        <div className="card p-6 mb-6">
          <h3 className="section-title flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning-500" />
            整改建议
          </h3>
          <div className="space-y-4">
            {suggestions.map((s, i) => (
              <div key={i} className={`p-4 border rounded-lg ${getPriorityColor(s.priority)}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getPriorityIcon(s.priority)}
                    <span className="font-bold">{s.item}</span>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-bold rounded ${s.priority === 'high' ? 'bg-danger-500 text-white' : s.priority === 'medium' ? 'bg-warning-500 text-white' : 'bg-primary-500 text-white'}`}>
                    {getPriorityBadge(s.priority)}优先级
                  </span>
                </div>
                <p className="text-sm mb-2 opacity-90"><strong>问题：</strong>{s.problem}</p>
                <p className="text-sm opacity-90"><strong>建议：</strong>{s.suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title flex items-center gap-2 mb-0">
            <GitCompare className="w-5 h-5 text-primary-500" />
            工况对比
          </h3>
          <div className="flex items-center gap-2">
            {schemes.length > 0 && (
              <button onClick={() => setShowCompare(!showCompare)} className="btn-secondary text-sm flex items-center gap-1">
                <GitCompare className="w-4 h-4" />
                {showCompare ? '收起对比' : `查看对比(${schemes.length})`}
              </button>
            )}
            {!showSaveInput ? (
              <button onClick={() => setShowSaveInput(true)} className="btn-primary text-sm flex items-center gap-1">
                <Save className="w-4 h-4" />
                保存当前方案
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text" value={schemeLabel} onChange={e => setSchemeLabel(e.target.value)}
                  placeholder="方案名称（如：方案A-间距0.9m）" className="input-field text-sm w-56"
                  onKeyDown={e => e.key === 'Enter' && handleSaveScheme()}
                />
                <button onClick={handleSaveScheme} className="btn-primary text-sm px-3">保存</button>
                <button onClick={() => { setShowSaveInput(false); setSchemeLabel(''); }} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {showCompare && schemes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">对比项</th>
                  <th className="border border-gray-200 px-3 py-2 text-center font-medium text-primary-600 bg-primary-50">当前方案</th>
                  {schemes.map(s => (
                    <th key={s.id} className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-600">
                      <div className="flex items-center justify-between">
                        <span className="truncate max-w-24">{s.label}</span>
                        <button onClick={() => deleteScheme(s.id)} className="ml-1 text-gray-300 hover:text-danger-500 flex-shrink-0">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 px-3 py-2 text-gray-600">支撑类型</td>
                  <td className="border border-gray-200 px-3 py-2 text-center font-medium bg-primary-50">{config?.name}</td>
                  {schemes.map(s => <td key={s.id} className="border border-gray-200 px-3 py-2 text-center">{getSupportTypeConfig(s.params.supportType)?.name}</td>)}
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2 text-gray-600">立杆纵距</td>
                  <td className="border border-gray-200 px-3 py-2 text-center font-mono bg-primary-50">{params.poleSpacingX}m</td>
                  {schemes.map(s => <td key={s.id} className="border border-gray-200 px-3 py-2 text-center font-mono">{s.params.poleSpacingX}m</td>)}
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2 text-gray-600">立杆横距</td>
                  <td className="border border-gray-200 px-3 py-2 text-center font-mono bg-primary-50">{params.poleSpacingY}m</td>
                  {schemes.map(s => <td key={s.id} className="border border-gray-200 px-3 py-2 text-center font-mono">{s.params.poleSpacingY}m</td>)}
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2 text-gray-600">步距</td>
                  <td className="border border-gray-200 px-3 py-2 text-center font-mono bg-primary-50">{params.stepDistance}m</td>
                  {schemes.map(s => <td key={s.id} className="border border-gray-200 px-3 py-2 text-center font-mono">{s.params.stepDistance}m</td>)}
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2 text-gray-600">木方规格</td>
                  <td className="border border-gray-200 px-3 py-2 text-center font-mono bg-primary-50">{params.woodSize}</td>
                  {schemes.map(s => <td key={s.id} className="border border-gray-200 px-3 py-2 text-center font-mono">{s.params.woodSize}</td>)}
                </tr>
                <tr className="font-bold">
                  <td className="border border-gray-200 px-3 py-2 text-gray-700">合格率</td>
                  <td className={`border border-gray-200 px-3 py-2 text-center bg-primary-50 ${result.overallPassed ? 'text-success-600' : 'text-danger-600'}`}>
                    {((passedCount / totalCount) * 100).toFixed(0)}%
                  </td>
                  {schemes.map(s => {
                    const rate = s.result.totalCount > 0 ? (s.result.passedCount / s.result.totalCount * 100).toFixed(0) : '0';
                    return <td key={s.id} className={`border border-gray-200 px-3 py-2 text-center ${s.result.overallPassed ? 'text-success-600' : 'text-danger-600'}`}>{rate}%</td>;
                  })}
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2 text-gray-700">最薄弱项</td>
                  <td className="border border-gray-200 px-3 py-2 text-center text-danger-600 bg-primary-50">{result.weakestItem}</td>
                  {schemes.map(s => <td key={s.id} className="border border-gray-200 px-3 py-2 text-center text-danger-600">{s.result.weakestItem}</td>)}
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2 text-gray-700">总体结论</td>
                  <td className="border border-gray-200 px-3 py-2 text-center bg-primary-50">
                    {result.overallPassed ? <span className="text-success-600 font-bold flex items-center justify-center gap-1"><CheckCircle className="w-4 h-4" />通过</span> : <span className="text-danger-600 font-bold flex items-center justify-center gap-1"><XCircle className="w-4 h-4" />不通过</span>}
                  </td>
                  {schemes.map(s => (
                    <td key={s.id} className="border border-gray-200 px-3 py-2 text-center">
                      {s.result.overallPassed ? <span className="text-success-600 font-bold flex items-center justify-center gap-1"><CheckCircle className="w-4 h-4" />通过</span> : <span className="text-danger-600 font-bold flex items-center justify-center gap-1"><XCircle className="w-4 h-4" />不通过</span>}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2 text-gray-700">主要整改</td>
                  <td className="border border-gray-200 px-3 py-2 text-left text-xs bg-primary-50">{suggestions.filter(s => s.priority === 'high').map(s => s.item).join('；') || '无'}</td>
                  {schemes.map(s => <td key={s.id} className="border border-gray-200 px-3 py-2 text-left text-xs">{s.suggestions.filter(sg => sg.priority === 'high').map(sg => sg.item).join('；') || '无'}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {schemes.length === 0 && !showSaveInput && (
          <p className="text-sm text-gray-400 text-center py-4">暂无已保存方案，点击"保存当前方案"开始工况对比</p>
        )}
      </div>

      <div className="card p-6 mb-6">
        <h3 className="section-title flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary-500" />
          验算参数汇总
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-gray-500 text-xs mb-1">支撑类型</div>
            <div className="font-mono font-medium">{config?.name}</div>
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
            <div className="font-mono font-medium">{params.constructionLoad}kN/m²</div>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-gray-500 text-xs mb-1">钢管型号</div>
            <div className="font-mono font-medium">{params.steelPipeType}</div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center no-print">
        <button onClick={resetCalculation} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          修改参数
        </button>
        <button onClick={() => goToStep('report')} className="btn-success flex items-center gap-2">
          <FileText className="w-5 h-5" />
          生成计算书
        </button>
      </div>
    </div>
  );
};
