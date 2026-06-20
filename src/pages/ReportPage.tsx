import React, { useRef, useState } from 'react';
import {
  Download, Printer, ArrowLeft, FileText, CheckCircle, XCircle, AlertTriangle, Building2, AlertOctagon, Loader2, BookOpen,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useCalculationStore } from '@/store/calculationStore';
import { getSupportTypeConfig, getFieldsForType } from '@/utils/materials';
import { generateReportEnhancement, generateComparisonSummary } from '@/utils/calculations';
import type { Suggestion, SupportParams } from '@/types';

const paramLabels: Record<string, string> = {
  floorHeight: '层高', slabThickness: '板厚', beamWidth: '梁宽', beamHeight: '梁高',
  poleSpacingX: '立杆纵距', poleSpacingY: '立杆横距', stepDistance: '步距',
  constructionLoad: '施工荷载', woodSize: '木方规格', steelPipeType: '钢管型号',
  templateThickness: '模板厚度', templateElasticModulus: '模板弹性模量',
  topCantilever: '顶托悬臂长度', diagonalBrace: '纵横向剪刀撑', scissorsBrace: '水平剪刀撑', sweepPole: '扫地杆',
};

const paramUnits: Record<string, string> = {
  floorHeight: 'm', slabThickness: 'mm', beamWidth: 'mm', beamHeight: 'mm',
  poleSpacingX: 'm', poleSpacingY: 'm', stepDistance: 'm',
  constructionLoad: 'kN/m²', templateThickness: 'mm', templateElasticModulus: 'N/mm²',
  topCantilever: 'mm',
};

export const ReportPage: React.FC = () => {
  const { projectInfo, params, result, suggestions, schemes, calculationVersion, goToStep } = useCalculationStore();
  const reportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  if (!result) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="card p-12 max-w-lg mx-auto">
          <AlertOctagon className="w-16 h-16 text-warning-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">暂无验算结果</h2>
          <p className="text-gray-500 mb-6">请先进行验算后再生成报告</p>
          <button onClick={() => goToStep('input')} className="btn-primary">前往参数录入</button>
        </div>
      </div>
    );
  }

  const config = getSupportTypeConfig(params.supportType);
  const enhancement = generateReportEnhancement(params, result);
  const comparisonSummary = generateComparisonSummary(params, result, suggestions, schemes);
  const fields = getFieldsForType(params.supportType);
  const passedCount = result.passedCount;
  const totalCount = result.totalCount;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const getParamDisplayValue = (field: string) => {
    const val = params[field as keyof SupportParams];
    if (typeof val === 'boolean') return val ? '已设置' : '未设置';
    return String(val);
  };

  const exportToPDF = async () => {
    if (!reportRef.current || exporting) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const totalHeight = imgHeight * ratio;
      let position = 0;
      let remaining = totalHeight;
      while (remaining > 0) {
        if (position > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -position, imgWidth * ratio, totalHeight);
        remaining -= pdfHeight;
        position += pdfHeight;
      }
      const fileName = projectInfo.projectName ? `${projectInfo.projectName}_模板支撑安全验算书.pdf` : '模板支撑安全验算书.pdf';
      pdf.save(fileName);
    } catch (e) {
      console.error('PDF export failed:', e);
      alert('PDF导出失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  const getPriorityText = (p: Suggestion['priority']) => p === 'high' ? '高' : p === 'medium' ? '中' : '低';

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6 no-print">
        <button onClick={() => goToStep('result')} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> 返回结果
        </button>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2">
            <Printer className="w-4 h-4" /> 打印
          </button>
          <button onClick={exportToPDF} disabled={exporting} className={`btn-primary flex items-center gap-2 ${exporting ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {exporting ? '导出中...' : '导出PDF'}
          </button>
        </div>
      </div>

      <div ref={reportRef} className="bg-white mx-auto shadow-lg" style={{ width: '210mm', minHeight: '297mm', padding: '20mm' }}>
        <div className="text-center mb-8 pb-4 border-b-2 border-gray-800">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">模板支撑安全验算书</h1>
          <p className="text-gray-500 text-sm">Template Support Safety Calculation Report · V{calculationVersion}</p>
          <p className="text-gray-400 text-xs mt-1">（专项施工方案附件草稿）</p>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">一、项目概况</h2>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-gray-100"><td className="py-2 text-gray-500 w-32">项目名称</td><td className="py-2 font-medium">{projectInfo.projectName || '____________________'}</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 text-gray-500">支撑类型</td><td className="py-2 font-medium">{config?.name}</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 text-gray-500">编制人</td><td className="py-2 font-medium">{projectInfo.preparedBy || '____________________'}</td></tr>
              <tr className="border-b border-gray-100"><td className="py-2 text-gray-500">编制日期</td><td className="py-2 font-medium">{projectInfo.preparedDate ? formatDate(projectInfo.preparedDate) : '____________________'}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">二、方案版本与比选</h2>
          <div className="space-y-3 text-sm">
            <div>
              <h4 className="font-bold text-gray-700 mb-1">当前工况版本</h4>
              <p className="text-gray-600 pl-4">本计算书基于第 <strong>V{calculationVersion}</strong> 版验算结果生成，支撑类型为{config?.name}，立杆纵距{params.poleSpacingX}m、横距{params.poleSpacingY}m、步距{params.stepDistance}m。</p>
            </div>
            {schemes.length > 0 && (
              <div>
                <h4 className="font-bold text-gray-700 mb-1">方案比选结论</h4>
                <p className="text-gray-600 pl-4">{comparisonSummary}</p>
                <table className="w-full text-xs border-collapse mt-2 ml-4" style={{ maxWidth: '90%' }}>
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-1 px-2 border border-gray-200 font-medium text-left">方案</th>
                      <th className="py-1 px-2 border border-gray-200 font-medium text-center">版本</th>
                      <th className="py-1 px-2 border border-gray-200 font-medium text-center">合格率</th>
                      <th className="py-1 px-2 border border-gray-200 font-medium text-center">结论</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-primary-50">
                      <td className="py-1 px-2 border border-gray-200 font-medium">当前方案</td>
                      <td className="py-1 px-2 border border-gray-200 text-center font-mono">V{calculationVersion}</td>
                      <td className="py-1 px-2 border border-gray-200 text-center">{((passedCount / totalCount) * 100).toFixed(0)}%</td>
                      <td className="py-1 px-2 border border-gray-200 text-center">{result.overallPassed ? <span className="text-green-700">通过</span> : <span className="text-red-700">不通过</span>}</td>
                    </tr>
                    {schemes.map(s => (
                      <tr key={s.id}>
                        <td className="py-1 px-2 border border-gray-200">{s.label}</td>
                        <td className="py-1 px-2 border border-gray-200 text-center font-mono">V{s.version}</td>
                        <td className="py-1 px-2 border border-gray-200 text-center">{(s.result.passedCount / s.result.totalCount * 100).toFixed(0)}%</td>
                        <td className="py-1 px-2 border border-gray-200 text-center">{s.result.overallPassed ? <span className="text-green-700">通过</span> : <span className="text-red-700">不通过</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {schemes.length === 0 && (
              <div>
                <h4 className="font-bold text-gray-700 mb-1">方案比选</h4>
                <p className="text-gray-500 pl-4">本方案为当前唯一验算工况，未进行方案比选。</p>
              </div>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">三、方案摘要</h2>
          <div className="space-y-3 text-sm">
            <div>
              <h4 className="font-bold text-gray-700 mb-1 flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary-500" />采用规范</h4>
              <ul className="list-disc pl-6 text-gray-600 space-y-0.5">
                {enhancement.standards.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-700 mb-1">荷载组合说明</h4>
              <p className="text-gray-600 pl-4">{enhancement.loadCombination}</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-700 mb-1">最不利工况说明</h4>
              <p className="text-gray-600 pl-4">{enhancement.worstCaseDesc}</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-700 mb-1">验算项目</h4>
              <div className="flex flex-wrap gap-1 pl-4">
                {config?.checkFocus.map(f => <span key={f} className="inline-block px-2 py-0.5 bg-primary-50 text-primary-600 text-xs border border-primary-200">{f}</span>)}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">四、计算参数</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-3 text-left border border-gray-200 font-medium">参数名称</th>
                <th className="py-2 px-3 text-center border border-gray-200 font-medium">数值</th>
                <th className="py-2 px-3 text-center border border-gray-200 font-medium">单位</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((f, i) => (
                <tr key={f.field} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                  <td className="py-2 px-3 border border-gray-200">{paramLabels[f.field] || f.label}</td>
                  <td className="py-2 px-3 text-center border border-gray-200 font-mono">{getParamDisplayValue(f.field)}</td>
                  <td className="py-2 px-3 text-center border border-gray-200">{paramUnits[f.field] || f.unit || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">五、验算结论</h2>
          <div className={`p-4 mb-4 rounded ${result.overallPassed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-3">
              {result.overallPassed ? <CheckCircle className="w-8 h-8 text-green-600" /> : <XCircle className="w-8 h-8 text-red-600" />}
              <div>
                <p className="font-bold text-lg">{result.overallPassed ? '验算结论：合格' : '验算结论：不合格'}</p>
                <p className="text-sm text-gray-600">{passedCount}/{totalCount} 项验算项通过，合格率 {((passedCount / totalCount) * 100).toFixed(0)}%</p>
              </div>
            </div>
          </div>
          <h3 className="font-bold text-gray-700 mb-3">分项验算结果：</h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-3 text-left border border-gray-200 font-medium">验算项目</th>
                <th className="py-2 px-3 text-center border border-gray-200 font-medium">类别</th>
                <th className="py-2 px-3 text-center border border-gray-200 font-medium">计算值</th>
                <th className="py-2 px-3 text-center border border-gray-200 font-medium">允许值</th>
                <th className="py-2 px-3 text-center border border-gray-200 font-medium">单位</th>
                <th className="py-2 px-3 text-center border border-gray-200 font-medium">结论</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((item, idx) => (
                <tr key={idx} className={item.name === result.weakestItem ? 'bg-yellow-50' : idx % 2 === 1 ? 'bg-gray-50' : ''}>
                  <td className="py-2 px-3 border border-gray-200">
                    {item.name}
                    {item.name === result.weakestItem && <span className="ml-2 text-xs text-yellow-600 font-bold">★最薄弱项</span>}
                  </td>
                  <td className="py-2 px-3 text-center border border-gray-200 text-gray-500">{item.category}</td>
                  <td className="py-2 px-3 text-center border border-gray-200 font-mono">{item.calculatedValue}</td>
                  <td className="py-2 px-3 text-center border border-gray-200 font-mono">{item.allowableValue}</td>
                  <td className="py-2 px-3 text-center border border-gray-200">{item.unit}</td>
                  <td className="py-2 px-3 text-center border border-gray-200">
                    {item.passed ? <span className="text-green-600 font-medium">✓ 通过</span> : <span className="text-red-600 font-medium">✗ 不通过</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">六、验算过程摘要</h2>
          {result.items.map((item, idx) => (
            <div key={idx} className="mb-4 p-4 bg-gray-50 rounded">
              <h4 className="font-bold text-gray-700 mb-2">{idx + 1}. {item.name}</h4>
              <p className="text-xs text-gray-500 font-mono mb-2">计算公式：{item.formula}</p>
              <pre className="text-xs font-mono text-gray-600 whitespace-pre-wrap leading-relaxed bg-white p-3 rounded border border-gray-200">{item.process}</pre>
            </div>
          ))}
        </div>

        {suggestions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">七、整改建议</h2>
            <div className="space-y-3">
              {suggestions.map((s, i) => (
                <div key={i} className={`p-4 rounded border ${s.priority === 'high' ? 'bg-red-50 border-red-200' : s.priority === 'medium' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}`}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${s.priority === 'high' ? 'text-red-500' : s.priority === 'medium' ? 'text-yellow-500' : 'text-blue-500'}`} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-800">{s.item}</span>
                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${s.priority === 'high' ? 'bg-red-500 text-white' : s.priority === 'medium' ? 'bg-yellow-500 text-white' : 'bg-blue-500 text-white'}`}>
                          {getPriorityText(s.priority)}优先级
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-1"><strong>问题：</strong>{s.problem}</p>
                      <p className="text-sm text-gray-700"><strong>建议：</strong>{s.suggestion}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">八、审核提示</h2>
          <div className="p-4 bg-amber-50 border border-amber-300 rounded">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800 leading-relaxed">{enhancement.reviewNote}</p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-300">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Building2 className="w-4 h-4" />
            <p>本验算书依据 {enhancement.standards.join('、')} 编制，结果仅供参考，最终验算需经专业人员审核确认。</p>
          </div>
          <div className="text-center mt-4 text-xs text-gray-400"><p>— 模板支撑安全验算系统生成 —</p></div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-6 no-print">
        <button onClick={() => goToStep('result')} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> 返回结果
        </button>
        <button onClick={exportToPDF} disabled={exporting} className={`btn-success flex items-center gap-2 ${exporting ? 'opacity-50 cursor-not-allowed' : ''}`}>
          {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
          {exporting ? '导出中...' : '导出计算书'}
        </button>
      </div>
    </div>
  );
};
