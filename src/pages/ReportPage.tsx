import React, { useRef, useState } from 'react';
import {
  Download,
  Printer,
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building2,
  AlertOctagon,
  Loader2,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useCalculationStore } from '@/store/calculationStore';
import { SUPPORT_TYPE_CONFIGS } from '@/utils/materials';
import type { CheckItemResult, Suggestion } from '@/types';

export const ReportPage: React.FC = () => {
  const { projectInfo, params, result, suggestions, goToStep } = useCalculationStore();
  const reportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  if (!result) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="card p-12 max-w-lg mx-auto">
          <AlertOctagon className="w-16 h-16 text-warning-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">暂无验算结果</h2>
          <p className="text-gray-500 mb-6">请先进行验算后再生成报告</p>
          <button onClick={() => goToStep('input')} className="btn-primary">
            前往参数录入
          </button>
        </div>
      </div>
    );
  }

  const supportTypeConfig = SUPPORT_TYPE_CONFIGS.find((c) => c.type === params.supportType);

  const checkItems: CheckItemResult[] = [
    result.bendingStrength,
    result.shearStrength,
    result.stiffness,
    result.stability,
    result.fastenerSliding,
  ];

  const passedCount = checkItems.filter((item) => item.passed).length;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const exportToPDF = async () => {
    if (!reportRef.current || exporting) return;

    setExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      const heightLeft = imgHeight * ratio;
      let position = 0;

      pdf.addImage(imgData, 'PNG', imgX, position, imgWidth * ratio, heightLeft);

      const fileName = projectInfo.projectName
        ? `${projectInfo.projectName}_模板支撑安全验算书.pdf`
        : '模板支撑安全验算书.pdf';

      pdf.save(fileName);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDF导出失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getPriorityText = (priority: Suggestion['priority']) => {
    switch (priority) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6 no-print">
        <button
          onClick={() => goToStep('result')}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回结果
        </button>
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="btn-secondary flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            打印
          </button>
          <button
            onClick={exportToPDF}
            disabled={exporting}
            className={`btn-primary flex items-center gap-2 ${
              exporting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {exporting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            {exporting ? '导出中...' : '导出PDF'}
          </button>
        </div>
      </div>

      <div
        ref={reportRef}
        className="bg-white mx-auto shadow-lg"
        style={{ width: '210mm', minHeight: '297mm', padding: '20mm' }}
      >
        <div className="text-center mb-8 pb-4 border-b-2 border-gray-800">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">模板支撑安全验算书</h1>
          <p className="text-gray-500 text-sm">Template Support Safety Calculation Report</p>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
            一、项目概况
          </h2>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-2 text-gray-500 w-32">项目名称</td>
                <td className="py-2 font-medium">
                  {projectInfo.projectName || '____________________'}
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 text-gray-500">支撑类型</td>
                <td className="py-2 font-medium">{supportTypeConfig?.name}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 text-gray-500">编制人</td>
                <td className="py-2 font-medium">
                  {projectInfo.preparedBy || '____________________'}
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 text-gray-500">编制日期</td>
                <td className="py-2 font-medium">
                  {projectInfo.preparedDate ? formatDate(projectInfo.preparedDate) : '____________________'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
            二、计算参数
          </h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-3 text-left border border-gray-200 font-medium">
                  参数名称
                </th>
                <th className="py-2 px-3 text-center border border-gray-200 font-medium">
                  数值
                </th>
                <th className="py-2 px-3 text-center border border-gray-200 font-medium">
                  单位
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 px-3 border border-gray-200">层高</td>
                <td className="py-2 px-3 text-center border border-gray-200 font-mono">
                  {params.floorHeight}
                </td>
                <td className="py-2 px-3 text-center border border-gray-200">m</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="py-2 px-3 border border-gray-200">板厚</td>
                <td className="py-2 px-3 text-center border border-gray-200 font-mono">
                  {params.slabThickness}
                </td>
                <td className="py-2 px-3 text-center border border-gray-200">mm</td>
              </tr>
              <tr>
                <td className="py-2 px-3 border border-gray-200">梁宽</td>
                <td className="py-2 px-3 text-center border border-gray-200 font-mono">
                  {params.beamWidth}
                </td>
                <td className="py-2 px-3 text-center border border-gray-200">mm</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="py-2 px-3 border border-gray-200">梁高</td>
                <td className="py-2 px-3 text-center border border-gray-200 font-mono">
                  {params.beamHeight}
                </td>
                <td className="py-2 px-3 text-center border border-gray-200">mm</td>
              </tr>
              <tr>
                <td className="py-2 px-3 border border-gray-200">立杆纵距</td>
                <td className="py-2 px-3 text-center border border-gray-200 font-mono">
                  {params.poleSpacingX}
                </td>
                <td className="py-2 px-3 text-center border border-gray-200">m</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="py-2 px-3 border border-gray-200">立杆横距</td>
                <td className="py-2 px-3 text-center border border-gray-200 font-mono">
                  {params.poleSpacingY}
                </td>
                <td className="py-2 px-3 text-center border border-gray-200">m</td>
              </tr>
              <tr>
                <td className="py-2 px-3 border border-gray-200">步距</td>
                <td className="py-2 px-3 text-center border border-gray-200 font-mono">
                  {params.stepDistance}
                </td>
                <td className="py-2 px-3 text-center border border-gray-200">m</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="py-2 px-3 border border-gray-200">施工荷载</td>
                <td className="py-2 px-3 text-center border border-gray-200 font-mono">
                  {params.constructionLoad}
                </td>
                <td className="py-2 px-3 text-center border border-gray-200">kN/m²</td>
              </tr>
              <tr>
                <td className="py-2 px-3 border border-gray-200">木方规格</td>
                <td className="py-2 px-3 text-center border border-gray-200 font-mono">
                  {params.woodSize}
                </td>
                <td className="py-2 px-3 text-center border border-gray-200">mm</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="py-2 px-3 border border-gray-200">钢管型号</td>
                <td className="py-2 px-3 text-center border border-gray-200 font-mono">
                  {params.steelPipeType}
                </td>
                <td className="py-2 px-3 text-center border border-gray-200">mm</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
            三、验算结论
          </h2>
          <div
            className={`p-4 mb-4 rounded ${
              result.overallPassed
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {result.overallPassed ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <XCircle className="w-8 h-8 text-red-600" />
              )}
              <div>
                <p className="font-bold text-lg">
                  {result.overallPassed
                    ? '验算结论：合格'
                    : '验算结论：不合格'}
                </p>
                <p className="text-sm text-gray-600">
                  {passedCount}/{checkItems.length} 项验算项通过，合格率 {((passedCount / checkItems.length) * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </div>

          <h3 className="font-bold text-gray-700 mb-3">分项验算结果：</h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-3 text-left border border-gray-200 font-medium">
                  验算项目
                </th>
                <th className="py-2 px-3 text-center border border-gray-200 font-medium">
                  计算值
                </th>
                <th className="py-2 px-3 text-center border border-gray-200 font-medium">
                  允许值
                </th>
                <th className="py-2 px-3 text-center border border-gray-200 font-medium">
                  单位
                </th>
                <th className="py-2 px-3 text-center border border-gray-200 font-medium">
                  结论
                </th>
              </tr>
            </thead>
            <tbody>
              {checkItems.map((item, index) => (
                <tr
                  key={index}
                  className={
                    item.name === result.weakestItem ? 'bg-yellow-50' : index % 2 === 1 ? 'bg-gray-50' : ''
                  }
                >
                  <td className="py-2 px-3 border border-gray-200">
                    {item.name}
                    {item.name === result.weakestItem && (
                      <span className="ml-2 text-xs text-yellow-600 font-bold">
                        ★最薄弱项
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-center border border-gray-200 font-mono">
                    {item.calculatedValue}
                  </td>
                  <td className="py-2 px-3 text-center border border-gray-200 font-mono">
                    {item.allowableValue}
                  </td>
                  <td className="py-2 px-3 text-center border border-gray-200">
                    {item.unit}
                  </td>
                  <td className="py-2 px-3 text-center border border-gray-200">
                    {item.passed ? (
                      <span className="text-green-600 font-medium">✓ 通过</span>
                    ) : (
                      <span className="text-red-600 font-medium">✗ 不通过</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
            四、验算过程摘要
          </h2>
          {checkItems.map((item, index) => (
            <div key={index} className="mb-4 p-4 bg-gray-50 rounded">
              <h4 className="font-bold text-gray-700 mb-2">
                {index + 1}. {item.name}
              </h4>
              <p className="text-xs text-gray-500 font-mono mb-2">
                计算公式：{item.formula}
              </p>
              <pre className="text-xs font-mono text-gray-600 whitespace-pre-wrap leading-relaxed bg-white p-3 rounded border border-gray-200">
                {item.process}
              </pre>
            </div>
          ))}
        </div>

        {suggestions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              五、整改建议
            </h2>
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`p-4 rounded border ${
                    suggestion.priority === 'high'
                      ? 'bg-red-50 border-red-200'
                      : suggestion.priority === 'medium'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                        suggestion.priority === 'high'
                          ? 'text-red-500'
                          : suggestion.priority === 'medium'
                          ? 'text-yellow-500'
                          : 'text-blue-500'
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-800">
                          {suggestion.item}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs font-bold rounded ${
                            suggestion.priority === 'high'
                              ? 'bg-red-500 text-white'
                              : suggestion.priority === 'medium'
                              ? 'bg-yellow-500 text-white'
                              : 'bg-blue-500 text-white'
                          }`}
                        >
                          {getPriorityText(suggestion.priority)}优先级
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">
                        <strong>问题：</strong>
                        {suggestion.problem}
                      </p>
                      <p className="text-sm text-gray-700">
                        <strong>建议：</strong>
                        {suggestion.suggestion}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-6 border-t border-gray-300">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Building2 className="w-4 h-4" />
            <p>
              本验算依据《建筑施工模板安全技术规范》JGJ162-2008 和《建筑施工扣件式钢管脚手架安全技术规范》JGJ130-2011 编制，结果仅供参考。
            </p>
          </div>
          <div className="text-center mt-4 text-xs text-gray-400">
            <p>— 模板支撑安全验算系统生成 —</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-6 no-print">
        <button
          onClick={() => goToStep('result')}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回结果
        </button>
        <button
          onClick={exportToPDF}
          disabled={exporting}
          className={`btn-success flex items-center gap-2 ${
            exporting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {exporting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <FileText className="w-5 h-5" />
          )}
          {exporting ? '导出中...' : '导出计算书'}
        </button>
      </div>
    </div>
  );
};
