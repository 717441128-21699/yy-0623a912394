import React, { useState, useMemo } from 'react';
import {
  CheckCircle, XCircle, ArrowLeft, FileText, AlertTriangle,
  Shield, ShieldAlert, Building2, AlertOctagon, Save, Trash2, GitCompare, X, Trophy, Clock,
} from 'lucide-react';
import { useCalculationStore } from '@/store/calculationStore';
import { ResultCard } from '@/components/ResultCard';
import { getSupportTypeConfig } from '@/utils/materials';
import { rankSchemes } from '@/utils/calculations';
import type { Suggestion, SchemeRankInfo } from '@/types';

export const ResultPage: React.FC = () => {
  const { result, suggestions, params, schemes, resultExpired, calculationVersion, lastVersionDiff, previousResult, adoptedFrom, goToStep, resetCalculation, saveScheme, adoptScheme, deleteScheme } = useCalculationStore();
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

  const rankedData = useMemo(() => rankSchemes({ result, suggestions, label: '当前方案' }, schemes), [result, suggestions, schemes]);
  const currentRank = rankedData.find(r => r.id === '__current__');

  const handleSaveScheme = () => {
    if (!schemeLabel.trim()) return;
    saveScheme(schemeLabel.trim());
    setSchemeLabel('');
    setShowSaveInput(false);
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded border border-amber-300"><Trophy className="w-3 h-3" />推荐</span>;
    if (rank === 2) return <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold rounded border border-gray-300">备选</span>;
    return null;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {adoptedFrom && !resultExpired && (
        <div className="mb-4 p-4 bg-primary-50 border-2 border-primary-300 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0" />
          <div>
            <p className="font-bold text-primary-700">当前方案采用自："{adoptedFrom}"</p>
            <p className="text-sm text-primary-600">参数已加载为该方案配置，如需调整请修改参数后重新验算。</p>
          </div>
        </div>
      )}

      {resultExpired && (
        <div className="mb-4 p-4 bg-warning-50 border-2 border-warning-300 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-warning-500 flex-shrink-0" />
          <div>
            <p className="font-bold text-warning-700">验算结果已过期</p>
            <p className="text-sm text-warning-600">参数已修改，当前显示的结果基于修改前的参数。请重新点击"开始验算"获取最新结果。</p>
          </div>
        </div>
      )}

      {lastVersionDiff.length > 0 && previousResult && !resultExpired && (
        <div className="card p-4 mb-6 border-2 border-primary-200 bg-primary-50/50">
          <h4 className="font-bold text-primary-700 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            版本变更（V{calculationVersion - 1} → V{calculationVersion}）
          </h4>
          <div className="flex flex-wrap gap-2">
            {lastVersionDiff.slice(0, 6).map(d => (
              <span key={d.field} className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded border ${d.isBetter === 'better' ? 'bg-success-50 text-success-700 border-success-200' : d.isBetter === 'worse' ? 'bg-danger-50 text-danger-700 border-danger-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                {d.label}: {d.oldValue}{d.unit} → {d.newValue}{d.unit}
                {d.isBetter === 'better' && <span className="text-success-500">↑好</span>}
                {d.isBetter === 'worse' && <span className="text-danger-500">↓差</span>}
              </span>
            ))}
          </div>
          <p className="text-xs text-primary-600 mt-2">
            结论变化：
            {result.overallPassed && !previousResult.overallPassed ? <span className="text-success-600 font-bold">从不通过变为通过 ✓</span>
              : !result.overallPassed && previousResult.overallPassed ? <span className="text-danger-600 font-bold">从通过变为不通过 ✗</span>
              : result.weakestSafetyRatio < previousResult.weakestSafetyRatio ? <span className="text-success-600">安全储备提升</span>
              : result.weakestSafetyRatio > previousResult.weakestSafetyRatio ? <span className="text-danger-600">安全储备下降</span>
              : <span className="text-gray-500">无明显变化</span>}
          </p>
        </div>
      )}

      <div className={`p-6 mb-6 rounded-lg ${result.overallPassed ? 'bg-gradient-to-r from-success-500 to-success-600' : 'bg-gradient-to-r from-danger-500 to-danger-600'} text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {result.overallPassed ? <Shield className="w-12 h-12" /> : <ShieldAlert className="w-12 h-12" />}
            <div>
              <h2 className="text-2xl font-bold mb-1">{result.overallPassed ? '验算通过' : '验算未通过'} {resultExpired && <span className="text-base font-normal opacity-80">（已过期）</span>}</h2>
              <p className="text-white/80">{config?.name} · {passedCount}/{totalCount} 项验算项通过 · 版本V{calculationVersion}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{((passedCount / totalCount) * 100).toFixed(0)}%</div>
            <div className="text-white/60 text-sm">合格率</div>
          </div>
        </div>
      </div>

      {!result.overallPassed && !resultExpired && (
        <div className="card p-5 mb-6 border-2 border-danger-200 bg-danger-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-danger-500 flex-shrink-0 mt-0.5 animate-blink" />
            <div>
              <h4 className="font-bold text-danger-700 mb-1">最薄弱项警告</h4>
              <p className="text-danger-600 text-sm"><strong>{result.weakestItem}</strong> 为最薄弱环节，安全储备为 <strong>{(1 / result.weakestSafetyRatio * 100).toFixed(1)}%</strong></p>
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
          <h3 className="section-title flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-warning-500" />整改建议</h3>
          <div className="space-y-4">
            {suggestions.map((s, i) => (
              <div key={i} className={`p-4 border rounded-lg ${getPriorityColor(s.priority)}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">{getPriorityIcon(s.priority)}<span className="font-bold">{s.item}</span></div>
                  <span className={`px-2 py-0.5 text-xs font-bold rounded ${s.priority === 'high' ? 'bg-danger-500 text-white' : s.priority === 'medium' ? 'bg-warning-500 text-white' : 'bg-primary-500 text-white'}`}>{getPriorityBadge(s.priority)}优先级</span>
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
            方案比选
          </h3>
          <div className="flex items-center gap-2">
            {schemes.length > 0 && (
              <button onClick={() => setShowCompare(!showCompare)} className="btn-secondary text-sm flex items-center gap-1">
                <GitCompare className="w-4 h-4" />
                {showCompare ? '收起' : `查看比选(${schemes.length + 1})`}
              </button>
            )}
            {!showSaveInput ? (
              <button onClick={() => setShowSaveInput(true)} className="btn-primary text-sm flex items-center gap-1">
                <Save className="w-4 h-4" />保存当前方案
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input type="text" value={schemeLabel} onChange={e => setSchemeLabel(e.target.value)} placeholder="方案名称（如：方案A-间距0.9m）" className="input-field text-sm w-56" onKeyDown={e => e.key === 'Enter' && handleSaveScheme()} />
                <button onClick={handleSaveScheme} className="btn-primary text-sm px-3">保存</button>
                <button onClick={() => { setShowSaveInput(false); setSchemeLabel(''); }} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
            )}
          </div>
        </div>

        {showCompare && rankedData.length > 0 && (
          <>
            <div className="mb-4">
              <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" />推荐排序</h4>
              <div className="space-y-2">
                {rankedData.map(r => (
                  <div key={r.id} className={`p-3 rounded-lg border-2 ${r.id === '__current__' ? 'border-primary-300 bg-primary-50' : 'border-gray-200 bg-white'} ${r.rankInfo.rank === 1 ? 'border-amber-300 bg-amber-50' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${r.rankInfo.rank === 1 ? 'bg-amber-500 text-white' : r.rankInfo.rank === 2 ? 'bg-gray-400 text-white' : 'bg-gray-200 text-gray-600'}`}>
                          {r.rankInfo.rank}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-800">{r.label}</span>
                            {r.id === '__current__' && <span className="px-1.5 py-0.5 bg-primary-500 text-white text-xs rounded">当前</span>}
                            {getRankBadge(r.rankInfo.rank)}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{r.rankInfo.reason}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right text-xs">
                          <div className="text-gray-500">推荐得分 <span className="font-bold text-gray-800 text-sm">{r.rankInfo.score}</span></div>
                          <div className="text-gray-400">合格率{r.rankInfo.passRate}% · 安全储备{r.rankInfo.safetyMargin}%</div>
                        </div>
                        {r.id !== '__current__' && (
                          <button onClick={() => adoptScheme(r.id)} className="px-3 py-1.5 text-xs bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors">
                            采用
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">对比项</th>
                    {rankedData.map(r => (
                      <th key={r.id} className={`border border-gray-200 px-3 py-2 text-center font-medium ${r.id === '__current__' ? 'bg-primary-50 text-primary-600' : 'text-gray-600'}`}>
                        <div className="flex flex-col items-center">
                          <span className="truncate max-w-24">{r.label}</span>
                          <span className="text-xs font-normal">#{r.rankInfo.rank}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2 text-gray-600">支撑类型</td>
                    {rankedData.map(r => {
                      const scheme = schemes.find(s => s.id === r.id);
                      const p = scheme ? scheme.params : params;
                      return <td key={r.id} className="border border-gray-200 px-3 py-2 text-center">{getSupportTypeConfig(p.supportType)?.name}</td>;
                    })}
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2 text-gray-600">立杆纵距</td>
                    {rankedData.map(r => {
                      const scheme = schemes.find(s => s.id === r.id);
                      const p = scheme ? scheme.params : params;
                      return <td key={r.id} className="border border-gray-200 px-3 py-2 text-center font-mono">{p.poleSpacingX}m</td>;
                    })}
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2 text-gray-600">立杆横距</td>
                    {rankedData.map(r => {
                      const scheme = schemes.find(s => s.id === r.id);
                      const p = scheme ? scheme.params : params;
                      return <td key={r.id} className="border border-gray-200 px-3 py-2 text-center font-mono">{p.poleSpacingY}m</td>;
                    })}
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2 text-gray-600">步距</td>
                    {rankedData.map(r => {
                      const scheme = schemes.find(s => s.id === r.id);
                      const p = scheme ? scheme.params : params;
                      return <td key={r.id} className="border border-gray-200 px-3 py-2 text-center font-mono">{p.stepDistance}m</td>;
                    })}
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2 text-gray-600">木方规格</td>
                    {rankedData.map(r => {
                      const scheme = schemes.find(s => s.id === r.id);
                      const p = scheme ? scheme.params : params;
                      return <td key={r.id} className="border border-gray-200 px-3 py-2 text-center font-mono">{p.woodSize}</td>;
                    })}
                  </tr>
                  <tr className="font-bold">
                    <td className="border border-gray-200 px-3 py-2 text-gray-700">合格率</td>
                    {rankedData.map(r => {
                      const res = r.id === '__current__' ? result : schemes.find(s => s.id === r.id)?.result;
                      const rate = res ? (res.passedCount / res.totalCount * 100).toFixed(0) : '0';
                      const passed = res?.overallPassed;
                      return <td key={r.id} className={`border border-gray-200 px-3 py-2 text-center ${passed ? 'text-success-600' : 'text-danger-600'}`}>{rate}%</td>;
                    })}
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2 text-gray-700">最薄弱项</td>
                    {rankedData.map(r => {
                      const res = r.id === '__current__' ? result : schemes.find(s => s.id === r.id)?.result;
                      return <td key={r.id} className="border border-gray-200 px-3 py-2 text-center text-danger-600">{res?.weakestItem || '-'}</td>;
                    })}
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2 text-gray-700">推荐得分</td>
                    {rankedData.map(r => <td key={r.id} className={`border border-gray-200 px-3 py-2 text-center font-bold ${r.rankInfo.rank === 1 ? 'text-amber-600' : 'text-gray-700'}`}>{r.rankInfo.score}</td>)}
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2 text-gray-700">推荐理由</td>
                    {rankedData.map(r => <td key={r.id} className="border border-gray-200 px-3 py-2 text-left text-xs">{r.rankInfo.reason}</td>)}
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2 text-gray-700">主要整改</td>
                    {rankedData.map(r => {
                      const sugs = r.id === '__current__' ? suggestions : schemes.find(s => s.id === r.id)?.suggestions || [];
                      return <td key={r.id} className="border border-gray-200 px-3 py-2 text-left text-xs">{sugs.filter(s => s.priority === 'high').map(s => s.item).join('；') || '无'}</td>;
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}

        {schemes.length === 0 && !showSaveInput && (
          <p className="text-sm text-gray-400 text-center py-4">暂无已保存方案，点击"保存当前方案"开始方案比选</p>
        )}
      </div>

      <div className="card p-6 mb-6">
        <h3 className="section-title flex items-center gap-2"><Building2 className="w-5 h-5 text-primary-500" />验算参数汇总</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="p-3 bg-gray-50 rounded"><div className="text-gray-500 text-xs mb-1">支撑类型</div><div className="font-mono font-medium">{config?.name}</div></div>
          <div className="p-3 bg-gray-50 rounded"><div className="text-gray-500 text-xs mb-1">层高</div><div className="font-mono font-medium">{params.floorHeight}m</div></div>
          <div className="p-3 bg-gray-50 rounded"><div className="text-gray-500 text-xs mb-1">板厚</div><div className="font-mono font-medium">{params.slabThickness}mm</div></div>
          <div className="p-3 bg-gray-50 rounded"><div className="text-gray-500 text-xs mb-1">立杆纵距</div><div className="font-mono font-medium">{params.poleSpacingX}m</div></div>
          <div className="p-3 bg-gray-50 rounded"><div className="text-gray-500 text-xs mb-1">立杆横距</div><div className="font-mono font-medium">{params.poleSpacingY}m</div></div>
          <div className="p-3 bg-gray-50 rounded"><div className="text-gray-500 text-xs mb-1">步距</div><div className="font-mono font-medium">{params.stepDistance}m</div></div>
          <div className="p-3 bg-gray-50 rounded"><div className="text-gray-500 text-xs mb-1">施工荷载</div><div className="font-mono font-medium">{params.constructionLoad}kN/m²</div></div>
          <div className="p-3 bg-gray-50 rounded"><div className="text-gray-500 text-xs mb-1">钢管型号</div><div className="font-mono font-medium">{params.steelPipeType}</div></div>
        </div>
      </div>

      <div className="flex justify-between items-center no-print">
        <button onClick={resetCalculation} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          修改参数
        </button>
        <button onClick={() => goToStep('report')} disabled={resultExpired} className={`btn-success flex items-center gap-2 ${resultExpired ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <FileText className="w-5 h-5" />
          生成计算书
        </button>
      </div>
    </div>
  );
};
