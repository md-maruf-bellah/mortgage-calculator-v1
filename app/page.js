'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { RefreshCw, Sparkles, Lock } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { calculateMortgage, calculateAllTerms } from '@/lib/mortgage';
import NavBar from '@/components/NavBar';
import LoanInputPanel from '@/components/LoanInputPanel';
import ResultsPanel from '@/components/ResultsPanel';
import SummaryGrid from '@/components/SummaryGrid';
import ChartsSection from '@/components/ChartsSection';
import ComparisonTable from '@/components/ComparisonTable';
import ManageFieldsModal from '@/components/ManageFieldsModal';
import ManageLoanTermsModal from '@/components/ManageLoanTermsModal';
import AffordabilityWidget from '@/components/AffordabilityWidget';
import AmortizationTable from '@/components/AmortizationTable';
import HistoryPanel from '@/components/HistoryPanel';
import PDFExportButton from '@/components/PDFExportButton';
import PermissionGate from '@/components/auth/PermissionGate';

const DEFAULT_INPUTS = {
  loanAmount: 300000,
  interestRate: 6.5,
  downPayment: 20000,
  propertyTaxes: 3600,
  homeInsurance: 1200,
  pmi: 0.5,
  hoaFees: 100,
  extraMonthlyPayment: 0,
};

const DEFAULT_TERMS = [5, 10, 15, 20, 25, 30];

export default function HomePage() {
  const { user, can, loading: authLoading } = useAuth();
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [customFields, setCustomFields] = useState([]);
  const [activeTab, setActiveTab] = useState(30);
  const [loanTerms, setLoanTerms] = useState(DEFAULT_TERMS);
  const [results, setResults] = useState(null);
  const [allTermsResults, setAllTermsResults] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showFieldsModal, setShowFieldsModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeSection, setActiveSection] = useState('calculator');
  const sessionId = useRef(`session-${Date.now()}`);

  // Determine if user can calculate (unauthenticated users still can; logged in users need perm)
  const canCalculate = !user || can('calculator:calculate');
  const canExportPDF  = !user || can('calculator:export_pdf');
  const canViewHistory = !user || can('history:view_own');
  const canManageFields = can('fields:create') || can('fields:edit');
  const canManageTerms  = can('loan_terms:create') || can('loan_terms:edit');

  useEffect(() => {
    fetch('/api/loan-terms')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data.length > 0) {
          const active = d.data.filter(t => t.isActive).map(t => t.years);
          if (active.length > 0) {
            setLoanTerms(active.sort((a, b) => a - b));
            const def = d.data.find(t => t.isDefault);
            if (def) setActiveTab(def.years);
          }
        }
      }).catch(() => {});

    fetch('/api/fields')
      .then(r => r.json())
      .then(d => {
        if (d.success) setCustomFields(d.data.filter(f => f.isActive));
      }).catch(() => {});
  }, []);

  const handleCalculate = useCallback(async () => {
    if (!canCalculate) { toast.error('You don\'t have permission to calculate'); return; }
    setIsCalculating(true);
    try {
      const params = { ...inputs, loanTermYears: activeTab, customFields };
      const current = calculateMortgage(params);
      const all = calculateAllTerms(params, loanTerms);
      setResults({ ...current, loanTermYears: activeTab });
      setAllTermsResults(all);
      // Save to history if authenticated
      if (user) {
        fetch('/api/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...params, sessionId: sessionId.current }),
        }).catch(() => {});
      }
      toast.success('Calculation complete!');
    } catch (err) {
      toast.error('Calculation failed: ' + err.message);
    } finally {
      setIsCalculating(false);
    }
  }, [inputs, activeTab, customFields, loanTerms, canCalculate, user]);

  useEffect(() => { if (!authLoading) handleCalculate(); }, [authLoading]);

  const handleInputChange = (key, value) => {
    setInputs(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const handleTabChange = (term) => {
    setActiveTab(term);
    const params = { ...inputs, loanTermYears: term, customFields };
    const current = calculateMortgage(params);
    setResults({ ...current, loanTermYears: term });
  };

  const currentTermResult = allTermsResults.find(r => r.term === activeTab);

  return (
    <div className="min-h-screen">
      <NavBar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onHistoryToggle={() => setShowHistory(s => !s)}
        showHistory={showHistory}
      />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-72 flex-shrink-0">
            <LoanInputPanel
              inputs={inputs}
              customFields={customFields}
              onInputChange={handleInputChange}
              onCalculate={handleCalculate}
              onManageFields={canManageFields ? () => setShowFieldsModal(true) : null}
              onManageTerms={canManageTerms ? () => setShowTermsModal(true) : null}
              isCalculating={isCalculating}
              canCalculate={canCalculate}
              canManageFields={canManageFields}
              canManageTerms={canManageTerms}
            />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-6">

            {activeSection === 'calculator' && (
              <>
                {/* Term tabs toolbar */}
                <div className="glass-card p-5">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <button onClick={handleCalculate} disabled={isCalculating || !canCalculate}
                        className={`flex items-center gap-2 py-2 px-4 text-sm ${canCalculate ? 'btn-green' : 'btn-secondary opacity-50 cursor-not-allowed'}`}>
                        {isCalculating ? <RefreshCw size={14} className="animate-spin" /> : canCalculate ? <Sparkles size={14} /> : <Lock size={14} />}
                        {isCalculating ? 'Calculating...' : canCalculate ? 'Show All Results' : 'No Permission'}
                      </button>
                      <span className="text-slate-600 text-sm font-semibold" style={{ fontFamily: 'Syne, sans-serif' }}>Results</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {loanTerms.map(term => (
                        <button key={term} onClick={() => handleTabChange(term)}
                          className={`term-tab ${activeTab === term ? 'active' : ''}`}>
                          {term} Yr
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {currentTermResult && <ResultsPanel result={currentTermResult} inputs={inputs} />}
                {allTermsResults.length > 0 && (
                  <SummaryGrid results={allTermsResults} activeTab={activeTab} onTabChange={handleTabChange} />
                )}
                {results && allTermsResults.length > 0 && (
                  <ChartsSection result={results} allTerms={allTermsResults} />
                )}

                {/* PDF export — permission-gated */}
                {results && (
                  <div className="flex justify-end">
                    {canExportPDF ? (
                      <PDFExportButton inputs={inputs} results={results} allTermsResults={allTermsResults} />
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-slate-600 px-4 py-2 rounded-xl border border-white/[0.06]">
                        <Lock size={13} />
                        <span style={{ fontFamily: 'Syne, sans-serif' }}>PDF export requires Loan Officer role or higher</span>
                      </div>
                    )}
                  </div>
                )}

                {allTermsResults.length > 0 && <ComparisonTable results={allTermsResults} inputs={inputs} />}
              </>
            )}

            {activeSection === 'amortization' && (
              <PermissionGate permission="calculator:view"
                fallback={<LockedSection message="You need calculator access to view amortization schedules." />}>
                {results
                  ? <AmortizationTable result={results} inputs={inputs} />
                  : <EmptySection icon="📊" message="Run a calculation first to see amortization schedule." />}
              </PermissionGate>
            )}

            {activeSection === 'affordability' && (
              <PermissionGate permission="calculator:view"
                fallback={<LockedSection message="You need calculator access to view affordability analysis." />}>
                {results
                  ? <AffordabilityWidget result={results} inputs={inputs} />
                  : <EmptySection icon="📈" message="Run a calculation first to see affordability analysis." />}
              </PermissionGate>
            )}
          </div>

          {/* History panel */}
          {showHistory && canViewHistory && (
            <div className="w-80 flex-shrink-0">
              <HistoryPanel
                sessionId={sessionId.current}
                onClose={() => setShowHistory(false)}
                onLoad={saved => { setInputs(saved); setShowHistory(false); toast.success('Inputs loaded!'); }}
              />
            </div>
          )}
        </div>
      </div>

      {showFieldsModal && canManageFields && (
        <ManageFieldsModal customFields={customFields} onUpdate={setCustomFields} onClose={() => setShowFieldsModal(false)} />
      )}
      {showTermsModal && canManageTerms && (
        <ManageLoanTermsModal loanTerms={loanTerms}
          onUpdate={terms => { setLoanTerms(terms); if (!terms.includes(activeTab)) setActiveTab(terms[0]); }}
          onClose={() => setShowTermsModal(false)} />
      )}
    </div>
  );
}

function LockedSection({ message }) {
  return (
    <div className="glass-card p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
        <Lock size={24} className="text-slate-600" />
      </div>
      <p className="text-slate-500 text-sm">{message}</p>
    </div>
  );
}

function EmptySection({ icon, message }) {
  return (
    <div className="glass-card p-12 text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <p className="text-slate-500 text-sm">{message}</p>
    </div>
  );
}
