import { StepNav } from '@/components/StepNav';
import { ParamsInput } from '@/pages/ParamsInput';
import { ResultPage } from '@/pages/ResultPage';
import { ReportPage } from '@/pages/ReportPage';
import { useCalculationStore } from '@/store/calculationStore';

export default function App() {
  const { currentStep, result, goToStep } = useCalculationStore();

  const renderPage = () => {
    switch (currentStep) {
      case 'input':
        return <ParamsInput />;
      case 'result':
        return <ResultPage />;
      case 'report':
        return <ReportPage />;
      default:
        return <ParamsInput />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <StepNav
        currentStep={currentStep}
        onStepChange={goToStep}
        hasResult={!!result}
      />
      <main>{renderPage()}</main>
    </div>
  );
}
