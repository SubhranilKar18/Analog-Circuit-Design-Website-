/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MODULES_DATA, ModuleContent } from './data/modulesData';
import {
  buildDynamicQuizSet,
  DynamicQuizItem,
  QuestionSourceCategory,
} from './data/dynamicQuizBank';
import {
  ProcessNodeId,
  Ota5TSpecInput,
  TwoStageSpecInput,
} from './utils/analogPhysics';
import { downloadLabEngineeringPdfReport } from './utils/pdfReportGenerator';
import {
  InlineMath,
  BlockEquation,
  SectionHeading,
  SubSectionHeading,
  AbstractBox,
  KeyEquationsBox,
  CommonMistakesBox,
} from './components/Math';
import { CircuitFigure, SymbolLegendView } from './components/CircuitSchematics';
import {
  ProcessNodeToggle,
  OperatingRegionExplorer,
  GmIdCalculator,
  Ota5TCalculator,
  TwoStageOpAmpCalculator,
  BodePlotVisualizer,
  BgrCurvePlotter,
} from './components/InteractiveCalculators';
import { EdaAndLtspiceView } from './components/EdaAndLtspiceView';
import { AiAndAgentView } from './components/AiAndAgentView';
import { AnalogAiTutor } from './components/AnalogAiTutor';
import { CircuitVisionSolverAgent } from './components/CircuitVisionSolverAgent';
import {
  SchematicCaptureCanvas,
  PvtAndMonteCarloVisualizer,
  CommonCentroidLayoutGenerator,
  NoiseSpectralAnalyzer,
} from './components/AdvancedAnalogSuites';
import {
  BookOpen,
  CheckSquare,
  Square,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Award,
  Sliders,
  Compass,
  FileCheck2,
  X,
  Sparkles,
  RefreshCw,
  Clock,
  FileDown,
} from 'lucide-react';

type MainView =
  | 'home'
  | 'modules'
  | 'lab'
  | 'doubt_solver'
  | 'eda_ltspice'
  | 'ai_agent_legend';

export default function App() {
  const [activeView, setActiveView] = useState<MainView>('home');
  const [activeModuleId, setActiveModuleId] = useState<number>(1);
  const [processNode, setProcessNode] = useState<ProcessNodeId>('180nm');
  const [showProgressModal, setShowProgressModal] = useState<boolean>(false);
  const [isAiTutorOpen, setIsAiTutorOpen] = useState<boolean>(false);
  const [sharedStudioNetlist, setSharedStudioNetlist] = useState<string | undefined>(undefined);
  const [labGmIdTarget, setLabGmIdTarget] = useState<number>(15);
  const [labGmIdLengthUm, setLabGmIdLengthUm] = useState<number>(0.36);
  const [labOtaSpec, setLabOtaSpec] = useState<Ota5TSpecInput | undefined>(undefined);
  const [labTwoStageSpec, setLabTwoStageSpec] = useState<TwoStageSpecInput | undefined>(undefined);

  // In-memory state for checklists and quiz answers (no localStorage)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});

  // Dynamic quiz state: seeded by current minute so questions evolve over time
  const [quizSetSeed, setQuizSetSeed] = useState<number>(() =>
    Math.floor(Date.now() / 60000) % 100
  );
  const [quizSourceFilter, setQuizSourceFilter] = useState<'ALL' | QuestionSourceCategory>('ALL');
  const [autoRotateQuiz, setAutoRotateQuiz] = useState<boolean>(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(90);
  const [aiGeneratedQuizzes, setAiGeneratedQuizzes] = useState<Record<number, DynamicQuizItem[]>>(
    {}
  );
  const [isGeneratingAiQuiz, setIsGeneratingAiQuiz] = useState<boolean>(false);
  const [aiQuizError, setAiQuizError] = useState<string | null>(null);

  useEffect(() => {
    if (!autoRotateQuiz) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setQuizSetSeed((s) => s + 1);
          return 90;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [autoRotateQuiz]);

  const currentModule: ModuleContent =
    MODULES_DATA.find((m) => m.id === activeModuleId) || MODULES_DATA[0];

  const baseDynamicQuestions = buildDynamicQuizSet(
    currentModule.id,
    quizSetSeed,
    quizSourceFilter
  );

  const moduleNativeQuestions: DynamicQuizItem[] = currentModule.quiz.map((q, idx) => ({
    ...q,
    sourceCategory:
      idx % 3 === 0 ? 'GATE PYQ' : idx % 3 === 1 ? 'Razavi' : 'Allen & Holberg',
    sourceCitation:
      idx % 3 === 0
        ? `GATE EC Conceptual & Numerical Bank · Module ${currentModule.roman}`
        : idx % 3 === 1
          ? `B. Razavi, Design of Analog CMOS ICs · Module ${currentModule.roman}`
          : `Allen & Holberg, CMOS Analog Circuit Design · Module ${currentModule.roman}`,
    difficulty: idx === 0 ? '2-Mark Numerical' : '1-Mark Conceptual',
  }));

  const filteredNative =
    quizSourceFilter === 'ALL'
      ? moduleNativeQuestions
      : moduleNativeQuestions.filter((q) => q.sourceCategory === quizSourceFilter);

  const customAiForModule = (aiGeneratedQuizzes[currentModule.id] || []).filter(
    (q) => quizSourceFilter === 'ALL' || q.sourceCategory === quizSourceFilter
  );

  // Active displayed question set (combines AI-generated, dynamic parametric, and curated GATE/Razavi/Allen & Holberg pool)
  const activeDynamicQuizList: DynamicQuizItem[] = [
    ...customAiForModule,
    ...baseDynamicQuestions,
    ...filteredNative,
  ].slice(0, 5);

  const handleGenerateAiQuizSet = async () => {
    if (isGeneratingAiQuiz) return;
    setIsGeneratingAiQuiz(true);
    setAiQuizError(null);
    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleTitle: `Module ${currentModule.roman}: ${currentModule.title}`,
          sourcePreference: quizSourceFilter,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate AI quiz questions.');
      }
      const rawList = Array.isArray(data.questions) ? data.questions : [];
      const formatted: DynamicQuizItem[] = rawList.map((item: any, i: number) => ({
        id: `ai_m${currentModule.id}_${Date.now()}_${i}`,
        sourceCategory:
          item.sourceCategory === 'GATE PYQ' ||
          item.sourceCategory === 'Razavi' ||
          item.sourceCategory === 'Allen & Holberg'
            ? item.sourceCategory
            : 'GATE PYQ',
        sourceCitation: item.sourceCitation || 'AI-Synthesized GATE / Razavi / Allen & Holberg Problem',
        difficulty: item.difficulty || '2-Mark Numerical',
        question: item.question || '',
        options: Array.isArray(item.options) && item.options.length === 4 ? item.options : ['A', 'B', 'C', 'D'],
        correctIndex:
          typeof item.correctIndex === 'number' && item.correctIndex >= 0 && item.correctIndex <= 3
            ? item.correctIndex
            : 0,
        explanation: item.explanation || '',
      }));

      if (formatted.length > 0) {
        setAiGeneratedQuizzes((prev) => ({
          ...prev,
          [currentModule.id]: formatted,
        }));
      }
    } catch (err: unknown) {
      setAiQuizError(err instanceof Error ? err.message : 'Unable to generate AI quiz set.');
    } finally {
      setIsGeneratingAiQuiz(false);
    }
  };

  const toggleChecklist = (key: string) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectQuizOption = (questionId: string, optionIdx: number) => {
    setQuizAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  // Compute overall mastery metrics in memory
  const totalChecklists = MODULES_DATA.reduce((acc, m) => acc + m.checklistItems.length, 0);
  const completedChecklists = Object.values(checkedItems).filter(Boolean).length;

  const totalQuizQuestions = MODULES_DATA.reduce((acc, m) => acc + m.quiz.length, 0);
  const correctQuizzes = Object.keys(quizAnswers).length;

  const overallPercent = Math.min(
    100,
    Math.round(
      ((completedChecklists + correctQuizzes) / Math.max(1, totalChecklists + totalQuizQuestions)) * 100
    )
  );

  const openModule = (id: number) => {
    setActiveModuleId(id);
    setActiveView('modules');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      {/* Strict 3-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-300 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-8">
        {/* Zone 1: Single Text Element Brand Wordmark */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            setActiveView('home');
          }}
          className="text-lg sm:text-xl font-bold tracking-tight text-[#00629B] font-ieee-serif whitespace-nowrap shrink-0"
        >
          Analog Circuit Design
        </a>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs lg:text-sm font-ieee-sans font-medium text-slate-700">
          {(
            [
              { id: 'home', label: 'Roadmap' },
              { id: 'modules', label: 'Curriculum (1–9)' },
              { id: 'lab', label: 'Interactive Lab' },
              { id: 'doubt_solver', label: 'Doubt Solver' },
              { id: 'eda_ltspice', label: 'EDA & LTspice' },
              { id: 'ai_agent_legend', label: 'AI Agent & Legend' },
            ] as { id: MainView; label: string }[]
          ).map((nav) => (
            <a
              key={nav.id}
              href={`#${nav.id}`}
              onClick={(e) => {
                e.preventDefault();
                setActiveView(nav.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeView === nav.id
                  ? 'text-[#00629B] border-[#00629B] font-semibold'
                  : 'border-transparent hover:text-[#00629B]'
              }`}
            >
              {nav.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsAiTutorOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-ieee-sans font-semibold text-[#00629B] bg-[#F8FAFC] border border-[#00629B] hover:bg-[#E0F2FE]/60 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Tutor</span>
          </button>
          <button
            type="button"
            onClick={() => setShowProgressModal(true)}
            className="px-3.5 py-1.5 text-xs font-ieee-sans font-semibold text-white bg-[#00629B] hover:bg-[#004B76] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Mastery Tracker ({overallPercent}%)
          </button>
        </div>
      </header>

      {/* Mobile Navigation Strip */}
      <div className="md:hidden flex overflow-x-auto border-b border-slate-200 bg-[#F8FAFC] px-3 py-2 gap-2 text-xs font-ieee-sans">
        {(
          [
            { id: 'home', label: 'Roadmap' },
            { id: 'modules', label: 'Modules 1–9' },
            { id: 'lab', label: 'Calculators' },
            { id: 'doubt_solver', label: 'Doubt Solver' },
            { id: 'eda_ltspice', label: 'EDA & LTspice' },
            { id: 'ai_agent_legend', label: 'AI & Legend' },
          ] as { id: MainView; label: string }[]
        ).map((nav) => (
          <button
            key={nav.id}
            type="button"
            onClick={() => setActiveView(nav.id)}
            className={`px-3 py-1 font-medium whitespace-nowrap shrink-0 ${
              activeView === nav.id ? 'bg-[#00629B] text-white' : 'text-slate-700 bg-white border border-slate-200'
            }`}
          >
            {nav.label}
          </button>
        ))}
      </div>

      {/* Main Content Router */}
      <main className="flex-1">
        {/* ====================================================================
         * VIEW 1: HOME & DUAL-TRACK LEARNING ROADMAP
         * ==================================================================== */}
        {activeView === 'home' && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* IEEE Monograph Title Header */}
            <div className="border-b-2 border-slate-900 pb-6 mb-8">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-ieee-sans text-slate-600 mb-3">
                <span>ANALOG IC DESIGN ENGINEERING CURRICULUM · VOL. 1, NO. 1</span>
                <span className="font-ieee-mono">PDK BASELINE: 180nm (1.8V) &amp; 65nm (1.2V) CMOS</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-slate-900 leading-tight tracking-tight max-w-4xl">
                Analog Circuit Design
              </h1>
              <p className="text-base sm:text-lg text-slate-700 mt-3 max-w-3xl leading-relaxed">
                A rigorous, publication-grade engineering curriculum taking you from MOSFET small-signal physics to <InlineMath math="g_m/I_D" /> lookup sizing, Miller-compensated op-amps, LDOs, Bandgap References, SPICE verification, and autonomous AI sizing agents.
              </p>

              {/* Quick Action Bar */}
              <div className="mt-6 flex flex-wrap items-center gap-3 font-ieee-sans text-xs sm:text-sm">
                <button
                  type="button"
                  onClick={() => openModule(1)}
                  className="px-5 py-2.5 bg-[#00629B] text-white font-semibold hover:bg-[#004B76] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Start Module I: MOSFET Foundations →
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('lab')}
                  className="px-4 py-2.5 bg-white border border-slate-300 text-slate-800 font-semibold hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Open Interactive gm/Id &amp; Bode Lab
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('eda_ltspice')}
                  className="px-4 py-2.5 bg-white border border-slate-300 text-slate-800 font-semibold hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  LTspice Beginner Guide &amp; Netlists
                </button>
              </div>
            </div>

            {/* 4-Stage Progression Summary Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {[
                {
                  tier: 'Stage 1 · Beginner (20 hrs)',
                  modules: 'Modules 1 – 3',
                  focus: 'MOSFET Physics, gm/Id & C/Id Methodology, CMOS Inverter Amplifier',
                },
                {
                  tier: 'Stage 2 · Intermediate (22 hrs)',
                  modules: 'Modules 4 – 5',
                  focus: '5T Differential OTA, Two-Stage Miller Op-Amp, Pole-Splitting & RHP Zero',
                },
                {
                  tier: 'Stage 3 · Advanced (30 hrs)',
                  modules: 'Modules 6 – 8',
                  focus: 'LDO Regulators, Bandgap References (CTAT/PTAT), Theoretical vs. SPICE Debugging',
                },
                {
                  tier: 'Stage 4 · Expert (24 hrs)',
                  modules: 'Module 9 + AI Agent Track',
                  focus: 'PVT Corners, Monte Carlo, Pelgrom’s Law, Common-Centroid Layout & Autonomous Agents',
                },
              ].map((s, idx) => (
                <div key={idx} className="border border-slate-300 bg-[#F8FAFC] p-4">
                  <div className="text-xs font-ieee-sans font-bold text-[#00629B]">{s.tier}</div>
                  <div className="text-sm font-bold text-slate-900 mt-1">{s.modules}</div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{s.focus}</p>
                </div>
              ))}
            </div>

            {/* Dual-Track Syllabus Table: Design Without AI vs. Design With AI */}
            <SectionHeading
              id="roadmap-table"
              roman="I"
              title="Complete Curriculum Roadmap: Classical gm/Id Track vs. AI-Augmented Track"
              subtitle="Click any module below to open its full derivation, interactive schematic, worked example, live calculator, and SPICE netlist."
            />

            <div className="space-y-4 my-6">
              {MODULES_DATA.map((mod) => {
                const modChecksDone = mod.checklistItems.filter(
                  (_, i) => checkedItems[`m${mod.id}_c${i}`]
                ).length;
                const modQuizDone = mod.quiz.filter(
                  (q) => quizAnswers[q.id] === q.correctIndex
                ).length;

                return (
                  <div
                    key={mod.id}
                    className="border border-slate-300 bg-white hover:border-[#00629B] transition-colors p-5"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 pb-3 mb-3">
                      <div className="flex flex-wrap items-baseline gap-2.5">
                        <span className="font-ieee-serif font-bold text-lg text-[#00629B]">
                          Module {mod.roman} ({mod.id}.0):
                        </span>
                        <h3 className="text-lg font-bold text-slate-900">{mod.title}</h3>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-ieee-sans text-slate-600 shrink-0">
                        <span>Level: <strong className="text-slate-900">{mod.level}</strong></span>
                        <span>·</span>
                        <span>Est. {mod.estimatedHours} hrs</span>
                        <span>·</span>
                        <span className="font-ieee-mono text-[#00629B]">
                          Checklist {modChecksDone}/{mod.checklistItems.length} · Quiz {modQuizDone}/{mod.quiz.length}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs md:text-sm text-slate-700 mb-3 leading-relaxed">
                      {mod.abstract}
                    </p>

                    {/* Side-by-Side Track Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#F8FAFC] border border-slate-200 p-3.5 text-xs">
                      <div>
                        <div className="font-ieee-sans font-bold text-slate-900 mb-1">
                          Track A — Design Without AI (Classical <InlineMath math="g_m/I_D" /> Flow):
                        </div>
                        <p className="text-slate-700 leading-relaxed">{mod.withoutAiTrack}</p>
                      </div>
                      <div className="border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-3">
                        <div className="font-ieee-sans font-bold text-[#00629B] mb-1">
                          Track B — Design With AI (Computational / Agentic Flow):
                        </div>
                        <p className="text-slate-700 leading-relaxed">{mod.withAiTrack}</p>
                      </div>
                    </div>

                    <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 text-xs font-ieee-sans">
                      <span className="text-slate-500">
                        <strong>Prerequisites:</strong> {mod.prerequisites}
                      </span>
                      <button
                        type="button"
                        onClick={() => openModule(mod.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#00629B] text-white font-semibold hover:bg-[#004B76] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <span>Study Module {mod.roman}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ====================================================================
         * VIEW 2: CURRICULUM MODULES 1–9 (IEEE PAPER + STICKY LEFT TOC)
         * ==================================================================== */}
        {activeView === 'modules' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Sticky Left Sidebar Table of Contents */}
              <aside className="lg:col-span-3 lg:sticky lg:top-20 border border-slate-300 bg-[#F8FAFC] p-4 text-xs font-ieee-sans">
                <div className="font-bold text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-2 mb-3">
                  Curriculum Modules (I–IX)
                </div>
                <div className="space-y-1 mb-5">
                  {MODULES_DATA.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => openModule(m.id)}
                      className={`w-full text-left px-2.5 py-1.5 font-medium transition-colors flex items-center justify-between cursor-pointer ${
                        m.id === currentModule.id
                          ? 'bg-[#00629B] text-white font-semibold'
                          : 'text-slate-700 hover:bg-slate-200/70'
                      }`}
                    >
                      <span className="truncate">{m.shortTitle}</span>
                      <span className="font-ieee-mono text-[10px] opacity-80">{m.roman}</span>
                    </button>
                  ))}
                </div>

                <div className="font-bold text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-2 mb-2.5">
                  Paper Sections (Module {currentModule.roman})
                </div>
                <nav className="space-y-1.5 text-slate-700">
                  {[
                    { id: 'sec-concept', label: 'I. Concept & Intuition' },
                    { id: 'sec-theory', label: 'II. Theory & Derivations' },
                    { id: 'sec-equations', label: 'III. Key Design Equations' },
                    { id: 'sec-sizing', label: 'IV. Hand-Calc & Sizing Flow' },
                    { id: 'sec-worked', label: 'V. Worked Numerical Example' },
                    { id: 'sec-interactive', label: 'VI. Interactive Workbench' },
                    { id: 'sec-verification', label: 'VII. SPICE vs. Hand-Calc Table' },
                    { id: 'sec-mistakes', label: 'VIII. Common Mistakes' },
                    { id: 'sec-quiz', label: 'IX. Checklist & Self-Test Quiz' },
                  ].map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="block py-1 px-2 hover:bg-slate-200/60 hover:text-[#00629B] transition-colors"
                    >
                      {s.label}
                    </a>
                  ))}
                </nav>
              </aside>

              {/* Main IEEE Paper Column */}
              <article className="lg:col-span-9 bg-white border border-slate-300 p-5 sm:p-8 lg:p-10">
                {/* IEEE Paper Header */}
                <div className="border-b-2 border-slate-900 pb-5 mb-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-ieee-sans text-slate-600 mb-2">
                    <span>
                      ANALOG IC DESIGN CURRICULUM · MODULE {currentModule.roman} OF IX
                    </span>
                    <ProcessNodeToggle
                      processNode={processNode}
                      onChangeProcessNode={setProcessNode}
                    />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug">
                    {currentModule.roman}. {currentModule.title}
                  </h1>
                </div>

                {/* Abstract Box */}
                <AbstractBox
                  abstract={currentModule.abstract}
                  indexTerms={currentModule.indexTerms}
                  readingTime={`${currentModule.estimatedHours} Hours`}
                  difficulty={currentModule.level}
                />

                {/* Section I: Concept & Physical Intuition */}
                <SectionHeading
                  id="sec-concept"
                  roman="I"
                  title="Physical Concept & Architectural Intuition"
                />
                <div className="space-y-4 text-slate-800 text-[15px] leading-relaxed">
                  {currentModule.conceptParagraphs.map((p, i) => (
                    <p key={i} className="text-justify">
                      {p}
                    </p>
                  ))}
                </div>

                {/* Interactive SVG Schematic Figure */}
                <CircuitFigure
                  schematicId={currentModule.schematicId}
                  figNumber={currentModule.figNumber}
                  caption={currentModule.figCaption}
                />

                {/* Section II: Rigorous Small-Signal & Large-Signal Theory */}
                <SectionHeading
                  id="sec-theory"
                  roman="II"
                  title="Theoretical Formulation & Analytical Derivations"
                />
                <div className="space-y-5">
                  {currentModule.theoryParagraphs.map((tp, idx) => (
                    <div key={idx}>
                      <SubSectionHeading index="" title={tp.heading} />
                      <p className="text-slate-800 text-[15px] leading-relaxed text-justify">
                        {tp.body}
                      </p>
                      {tp.equationLatex && (
                        <BlockEquation math={tp.equationLatex} number={tp.equationNum} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Section III: Key Equations Box */}
                <div id="sec-equations" className="scroll-mt-24">
                  <KeyEquationsBox equations={currentModule.keyEquations} />
                </div>

                {/* Section IV: Step-by-Step Hand Calculation & Sizing Justification */}
                <SectionHeading
                  id="sec-sizing"
                  roman="IV"
                  title="Systematic Hand-Calculation & gm/Id Sizing Methodology"
                  subtitle="Logical engineering rationale behind every gm/Id and channel-length choice"
                />

                <div className="bg-[#F8FAFC] border border-slate-200 p-5 my-4">
                  <div className="text-xs font-ieee-sans font-bold text-[#00629B] uppercase tracking-wider mb-2.5">
                    Step-by-Step Sizing Algorithm
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-slate-800">
                    {currentModule.handCalcMethodology.map((step, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="overflow-x-auto border border-slate-300 my-5">
                  <table className="w-full text-left border-collapse text-xs md:text-sm">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 font-ieee-sans text-slate-800">
                        <th className="py-2.5 px-3.5">Design Parameter</th>
                        <th className="py-2.5 px-3.5">Recommended Target</th>
                        <th className="py-2.5 px-3.5">Physical Reasoning & Trade-off Justification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {currentModule.sizingJustification.map((sj, idx) => (
                        <tr key={idx}>
                          <td className="py-3 px-3.5 font-semibold text-[#00629B] font-ieee-mono text-xs">
                            {sj.parameter}
                          </td>
                          <td className="py-3 px-3.5 font-ieee-mono text-xs whitespace-nowrap">
                            {sj.recommendedRange}
                          </td>
                          <td className="py-3 px-3.5 text-slate-700 leading-relaxed text-xs md:text-sm">
                            {sj.physicalReasoning}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Section V: Complete Worked Numerical Example */}
                <SectionHeading
                  id="sec-worked"
                  roman="V"
                  title="Worked Design Example with Numbers & Units"
                />
                <div className="border border-slate-300 bg-white p-5 my-4">
                  <div className="bg-[#F8FAFC] border border-slate-200 p-4 mb-4">
                    <div className="text-xs font-ieee-sans font-bold text-[#00629B] uppercase mb-1">
                      Design Problem Statement
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      {currentModule.workedExample.problemStatement}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200 text-xs font-ieee-mono">
                      {currentModule.workedExample.specs.map((sp, i) => (
                        <div key={i}>
                          <span className="text-slate-500 font-ieee-sans">{sp.label}: </span>
                          <span className="font-bold text-slate-900">{sp.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {currentModule.workedExample.steps.map((ws, idx) => (
                      <div key={idx} className="border-b border-slate-200 pb-4 last:border-b-0 last:pb-0">
                        <div className="font-bold text-sm text-[#00629B]">{ws.stepTitle}</div>
                        <p className="text-xs md:text-sm text-slate-700 mt-1">{ws.reasoning}</p>
                        <BlockEquation math={ws.formulaLatex} />
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs font-ieee-mono">
                          <span className="text-slate-700">{ws.calculation}</span>
                          <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                            ⇒ {ws.resultWithUnits}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section VI: Inline Interactive Calculator & Live SPICE Netlist */}
                <SectionHeading
                  id="sec-interactive"
                  roman="VI"
                  title="Interactive Engineering Calculator & Live SPICE Netlist"
                  subtitle="Modify parameters below to explore design trade-offs and export a ready-to-run SPICE netlist"
                />
                {currentModule.inlineTool === 'operating_region' && (
                  <OperatingRegionExplorer
                    processNode={processNode}
                    onChangeProcessNode={setProcessNode}
                  />
                )}
                {currentModule.inlineTool === 'gmid_workbench' && (
                  <GmIdCalculator
                    processNode={processNode}
                    onChangeProcessNode={setProcessNode}
                  />
                )}
                {currentModule.inlineTool === 'ota5t_calc' && (
                  <Ota5TCalculator
                    processNode={processNode}
                    onChangeProcessNode={setProcessNode}
                  />
                )}
                {currentModule.inlineTool === 'opamp2stage_calc' && (
                  <TwoStageOpAmpCalculator
                    processNode={processNode}
                    onChangeProcessNode={setProcessNode}
                  />
                )}
                {currentModule.inlineTool === 'bode_visualizer' && <BodePlotVisualizer />}
                {currentModule.inlineTool === 'bgr_plotter' && <BgrCurvePlotter />}
                {currentModule.id === 8 && (
                  <SchematicCaptureCanvas onSendNetlistToStudio={setSharedStudioNetlist} />
                )}
                {currentModule.id === 9 && (
                  <>
                    <PvtAndMonteCarloVisualizer />
                    <CommonCentroidLayoutGenerator />
                    <NoiseSpectralAnalyzer />
                  </>
                )}

                {/* Section VII: Simulation Steps & Hand-Calc vs. SPICE Verification Table */}
                <SectionHeading
                  id="sec-verification"
                  roman="VII"
                  title="SPICE Simulation Protocol & Hand-Calculation vs. Simulation Table"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                  {currentModule.simulationSteps.map((sim, idx) => (
                    <div key={idx} className="border border-slate-300 bg-[#F8FAFC] p-4 text-xs">
                      <div className="font-ieee-sans font-bold text-[#00629B] text-sm mb-1.5">
                        {sim.analysisType}
                      </div>
                      <pre className="bg-white border border-slate-300 text-slate-900 font-ieee-mono p-2.5 mb-2 overflow-x-auto">
                        <code>{sim.spiceDirective}</code>
                      </pre>
                      <p className="text-slate-700 leading-relaxed">{sim.whatToCheck}</p>
                    </div>
                  ))}
                </div>

                <div className="overflow-x-auto border border-slate-300 my-5">
                  <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 text-xs font-ieee-sans font-bold text-slate-800">
                    Table {currentModule.roman}.1 — Hand-Calculation vs. BSIM4 SPICE Verification Matrix
                  </div>
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#F8FAFC] border-b border-slate-300 font-ieee-sans text-slate-700">
                        <th className="py-2.5 px-3">Metric</th>
                        <th className="py-2.5 px-3">Symbol</th>
                        <th className="py-2.5 px-3">Target Spec</th>
                        <th className="py-2.5 px-3">Hand-Calc</th>
                        <th className="py-2.5 px-3">SPICE Result</th>
                        <th className="py-2.5 px-3">Physical Cause of Any Delta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-ieee-mono">
                      {currentModule.verificationTable.map((row, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-3 font-ieee-sans font-semibold text-slate-900">
                            {row.metric}
                          </td>
                          <td className="py-2.5 px-3 text-[#00629B] font-bold">{row.symbol}</td>
                          <td className="py-2.5 px-3">{row.targetSpec}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{row.handCalcValue}</td>
                          <td className="py-2.5 px-3 font-bold text-emerald-800">
                            {row.typicalSpiceValue}
                          </td>
                          <td className="py-2.5 px-3 font-ieee-sans text-slate-600">
                            {row.discrepancyReason}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Section VIII: Common Mistakes Callout */}
                <div id="sec-mistakes" className="scroll-mt-24">
                  <CommonMistakesBox mistakes={currentModule.commonMistakes} />
                </div>

                {/* Section IX: Verification Checklist, Mini-Project & Self-Test Quiz */}
                <SectionHeading
                  id="sec-quiz"
                  roman="IX"
                  title="Verification Signoff Checklist, Mini-Project & Self-Test Quiz"
                />

                {/* Interactive Checklist */}
                <div className="border border-slate-300 bg-[#F8FAFC] p-5 my-5">
                  <div className="font-ieee-sans font-bold text-sm text-slate-900 mb-3 flex items-center justify-between">
                    <span>Module {currentModule.roman} Pre-Tapeout Verification Checklist</span>
                    <span className="text-xs font-ieee-mono text-[#00629B]">
                      Click items to mark verified in session memory
                    </span>
                  </div>
                  <div className="space-y-2">
                    {currentModule.checklistItems.map((item, idx) => {
                      const key = `m${currentModule.id}_c${idx}`;
                      const isDone = !!checkedItems[key];
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleChecklist(key)}
                          className={`w-full text-left p-3 border flex items-start gap-3 transition-colors cursor-pointer ${
                            isDone
                              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                          }`}
                        >
                          {isDone ? (
                            <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          )}
                          <span className="text-xs md:text-sm">{item}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hands-On Mini-Project */}
                <div className="border border-[#00629B]/40 bg-white p-5 my-5">
                  <div className="text-xs font-ieee-sans font-bold text-[#00629B] uppercase tracking-wider">
                    Hands-On Engineering Mini-Project
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mt-1">
                    {currentModule.miniProject.title}
                  </h4>
                  <p className="text-xs md:text-sm text-slate-700 mt-1.5">
                    {currentModule.miniProject.objective}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs md:text-sm text-slate-800 mt-2.5">
                    {currentModule.miniProject.deliverables.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>

                {/* Dynamic Multi-Source Quiz: GATE PYQ, B. Razavi, and Allen & Holberg */}
                <div className="border border-slate-300 bg-white p-5 my-5">
                  <div className="border-b border-slate-200 pb-3.5 mb-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-ieee-sans font-bold text-sm text-[#00629B]">
                          Module {currentModule.roman} Dynamic Problem Set — GATE PYQs, Razavi &amp; Allen-Holberg
                        </div>
                        <p className="text-xs font-ieee-sans text-slate-600 mt-0.5">
                          Problems dynamically rotate and randomize numerical parameters. Filter by source or generate new AI sets below.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 font-ieee-sans text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setQuizSetSeed((s) => s + 1);
                            setSecondsLeft(90);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#00629B] hover:bg-[#004B76] text-white font-semibold cursor-pointer transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>New Dynamic Set (#{(quizSetSeed % 99) + 1})</span>
                        </button>

                        <button
                          type="button"
                          disabled={isGeneratingAiQuiz}
                          onClick={handleGenerateAiQuizSet}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white font-semibold cursor-pointer transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>
                            {isGeneratingAiQuiz ? 'Generating Set...' : 'AI-Generate Fresh Set'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setAutoRotateQuiz((prev) => !prev);
                            setSecondsLeft(90);
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 border font-semibold cursor-pointer transition-colors ${
                            autoRotateQuiz
                              ? 'bg-amber-50 border-amber-400 text-amber-900'
                              : 'bg-[#F8FAFC] border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {autoRotateQuiz ? `Auto-Rotate: ${secondsLeft}s` : 'Auto-Rotate Timer: OFF'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Source Filter Tabs: All / GATE PYQ / Razavi / Allen & Holberg */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex flex-wrap items-center gap-1.5 font-ieee-sans text-xs">
                        <span className="text-slate-600 font-semibold mr-1">Filter Source:</span>
                        {(
                          [
                            { id: 'ALL', label: 'All Sources (GATE + Textbooks)' },
                            { id: 'GATE PYQ', label: 'GATE EC/EE PYQ' },
                            { id: 'Razavi', label: 'Behzad Razavi (Book)' },
                            { id: 'Allen & Holberg', label: 'Allen & Holberg (Book)' },
                          ] as { id: 'ALL' | QuestionSourceCategory; label: string }[]
                        ).map((src) => (
                          <button
                            key={src.id}
                            type="button"
                            onClick={() => setQuizSourceFilter(src.id)}
                            className={`px-2.5 py-1 border font-semibold cursor-pointer transition-colors ${
                              quizSourceFilter === src.id
                                ? 'bg-[#00629B] border-[#00629B] text-white'
                                : 'bg-[#F8FAFC] border-slate-300 text-slate-800 hover:bg-slate-100'
                            }`}
                          >
                            {src.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {aiQuizError && (
                      <div className="bg-red-50 border border-red-300 text-red-900 px-3 py-2 text-xs font-ieee-sans">
                        <strong>Note: </strong> {aiQuizError}
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    {activeDynamicQuizList.map((q, qIdx) => {
                      const selected = quizAnswers[q.id];
                      const isAnswered = selected !== undefined;
                      const isCorrect = selected === q.correctIndex;

                      const badgeStyle =
                        q.sourceCategory === 'GATE PYQ'
                          ? 'bg-amber-100 border-amber-300 text-amber-950'
                          : q.sourceCategory === 'Razavi'
                            ? 'bg-sky-100 border-sky-300 text-sky-950'
                            : 'bg-purple-100 border-purple-300 text-purple-950';

                      return (
                        <div key={q.id} className="bg-[#F8FAFC] border border-slate-200 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 font-ieee-sans text-[11px]">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-2 py-0.5 border font-bold ${badgeStyle}`}>
                                {q.sourceCategory}
                              </span>
                              <span className="text-slate-700 font-semibold">
                                {q.sourceCitation}
                              </span>
                            </div>
                            <span className="font-ieee-mono text-slate-700 bg-white border border-slate-300 px-2 py-0.5">
                              {q.difficulty}
                            </span>
                          </div>

                          <div className="font-semibold text-sm text-slate-900 mb-3">
                            Q{qIdx + 1}. {q.question}
                          </div>
                          <div className="space-y-2">
                            {q.options.map((opt, oIdx) => {
                              const isChosen = selected === oIdx;
                              let btnStyle = 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50';
                              if (isAnswered) {
                                if (oIdx === q.correctIndex) {
                                  btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold';
                                } else if (isChosen) {
                                  btnStyle = 'bg-red-50 border-red-400 text-red-900';
                                }
                              }
                              return (
                                <button
                                  key={oIdx}
                                  type="button"
                                  onClick={() => selectQuizOption(q.id, oIdx)}
                                  className={`w-full text-left px-3.5 py-2.5 border text-xs md:text-sm flex items-center justify-between gap-2 transition-colors cursor-pointer ${btnStyle}`}
                                >
                                  <span>{opt}</span>
                                  {isAnswered && oIdx === q.correctIndex && (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                                  )}
                                  {isAnswered && isChosen && oIdx !== q.correctIndex && (
                                    <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {isAnswered && (
                            <div
                              className={`mt-3 p-3 border text-xs md:text-sm ${
                                isCorrect
                                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                                  : 'bg-amber-50/70 border-amber-200 text-slate-900'
                              }`}
                            >
                              <strong className="font-ieee-sans">
                                {isCorrect ? 'Correct! ' : 'Step-by-Step Solution: '}
                              </strong>
                              {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Prev / Next Module Footer Navigation */}
                <div className="mt-8 pt-5 border-t border-slate-300 flex items-center justify-between gap-4 font-ieee-sans text-xs sm:text-sm">
                  {currentModule.id > 1 ? (
                    <button
                      type="button"
                      onClick={() => openModule(currentModule.id - 1)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-slate-800 hover:bg-slate-50 font-semibold cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous: Module {currentModule.id - 1}</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  {currentModule.id < MODULES_DATA.length ? (
                    <button
                      type="button"
                      onClick={() => openModule(currentModule.id + 1)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#00629B] text-white hover:bg-[#004B76] font-semibold cursor-pointer"
                    >
                      <span>Next: Module {currentModule.id + 1}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveView('ai_agent_legend')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#00629B] text-white hover:bg-[#004B76] font-semibold cursor-pointer"
                    >
                      <span>Proceed to AI Agent &amp; Legend</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </article>
            </div>
          </div>
        )}

        {/* ====================================================================
         * VIEW 3: CENTRAL INTERACTIVE LAB (ALL 6 CALCULATORS & PLOTTERS)
         * ==================================================================== */}
        {activeView === 'lab' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-lab-ui">
            <div className="border-b-2 border-[#00629B] pb-5 mb-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold text-[#00629B] uppercase tracking-wider">
                  Interactive Analog CAD Workbench
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                  Interactive Sizing Calculators, Bode Visualizer &amp; Netlist Generators
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <ProcessNodeToggle
                  processNode={processNode}
                  onChangeProcessNode={setProcessNode}
                />
                <button
                  type="button"
                  onClick={() =>
                    downloadLabEngineeringPdfReport({
                      processNode,
                      activeNetlist: sharedStudioNetlist,
                      otaSpec: labOtaSpec,
                      twoStageSpec: labTwoStageSpec,
                      gmIdTarget: labGmIdTarget,
                      gmIdLengthUm: labGmIdLengthUm,
                    })
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#00629B] hover:bg-[#004B76] text-white text-xs sm:text-sm font-bold shadow cursor-pointer transition-colors"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Download PDF Report</span>
                </button>
              </div>
            </div>

            <SchematicCaptureCanvas onSendNetlistToStudio={setSharedStudioNetlist} />

            <PvtAndMonteCarloVisualizer />

            <CommonCentroidLayoutGenerator />

            <NoiseSpectralAnalyzer />

            <GmIdCalculator
              processNode={processNode}
              onChangeProcessNode={setProcessNode}
              onGmIdChange={(g, l) => {
                setLabGmIdTarget(g);
                setLabGmIdLengthUm(l);
              }}
            />
            <Ota5TCalculator
              processNode={processNode}
              onChangeProcessNode={setProcessNode}
              onOtaSpecChange={setLabOtaSpec}
            />
            <TwoStageOpAmpCalculator
              processNode={processNode}
              onChangeProcessNode={setProcessNode}
              onTwoStageSpecChange={setLabTwoStageSpec}
            />
            <BodePlotVisualizer />
            <BgrCurvePlotter />
            <OperatingRegionExplorer
              processNode={processNode}
              onChangeProcessNode={setProcessNode}
            />

            <div className="mt-8 border border-[#00629B] bg-[#F8FAFC] p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Export Complete Analog IC Engineering Signoff Report (PDF)
                </h3>
                <p className="text-xs text-slate-700 mt-0.5">
                  Aggregates your current {processNode} PDK parameters, Schematic SPICE netlist (.cir), .op/.meas simulation tables, and 5T OTA / 2-Stage Op-Amp sizing outputs.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  downloadLabEngineeringPdfReport({
                    processNode,
                    activeNetlist: sharedStudioNetlist,
                    otaSpec: labOtaSpec,
                    twoStageSpec: labTwoStageSpec,
                    gmIdTarget: labGmIdTarget,
                    gmIdLengthUm: labGmIdLengthUm,
                  })
                }
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#00629B] hover:bg-[#004B76] text-white text-xs sm:text-sm font-bold shadow cursor-pointer transition-colors"
              >
                <FileDown className="w-4 h-4" />
                <span>Download PDF Report</span>
              </button>
            </div>
          </div>
        )}

        {/* ====================================================================
         * VIEW 3B: DEDICATED DOUBT SOLVER TAB (AI VISION PROBLEM-SOLVER AGENT)
         * ==================================================================== */}
        {activeView === 'doubt_solver' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="border-b-2 border-[#00629B] pb-5 mb-8">
              <div className="text-xs font-ieee-sans font-semibold text-[#00629B] uppercase tracking-wider">
                Multimodal Engineering Doubt Solver Workbench
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                Interactive AI Vision Problem-Solver Agent: Network Analysis, Analog Circuits &amp; Signal Processing
              </h1>
              <p className="text-sm md:text-base text-slate-700 mt-2">
                Upload or paste any handwritten or textbook circuit schematic, GATE EC question, small-signal model, or signal processing problem image to receive a rigorous step-by-step KCL/KVL derivation, transfer function, final boxed numerical answer, and verification netlist/script.
              </p>
            </div>

            <CircuitVisionSolverAgent />
          </div>
        )}

        {/* ====================================================================
         * VIEW 4: EDA TOOLS & LTSPICE BEGINNER GUIDE
         * ==================================================================== */}
        {activeView === 'eda_ltspice' && <EdaAndLtspiceView />}

        {/* ====================================================================
         * VIEW 5: AI/ML IN ANALOG, BUILD AN AI AGENT, SYMBOL LEGEND & REFERENCES
         * ==================================================================== */}
        {activeView === 'ai_agent_legend' && (
          <div>
            <AiAndAgentView />
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
              <SymbolLegendView />
            </div>
          </div>
        )}
      </main>

      {/* In-Memory Mastery & Progress Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#00629B]" />
                <h2 className="text-lg font-bold text-slate-900">
                  Analog Circuit Design Session Progress &amp; Verification Tracker
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowProgressModal(false)}
                className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5 text-center font-ieee-mono text-xs">
              <div className="bg-[#F8FAFC] border border-slate-200 p-3">
                <div className="text-slate-500 font-ieee-sans">Overall Mastery</div>
                <div className="text-xl font-bold text-[#00629B] mt-1">{overallPercent}%</div>
              </div>
              <div className="bg-[#F8FAFC] border border-slate-200 p-3">
                <div className="text-slate-500 font-ieee-sans">Checklists Verified</div>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {completedChecklists} / {totalChecklists}
                </div>
              </div>
              <div className="bg-[#F8FAFC] border border-slate-200 p-3">
                <div className="text-slate-500 font-ieee-sans">Quizzes Solved</div>
                <div className="text-xl font-bold text-emerald-700 mt-1">
                  {correctQuizzes} / {totalQuizQuestions}
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {MODULES_DATA.map((m) => {
                const cDone = m.checklistItems.filter((_, i) => checkedItems[`m${m.id}_c${i}`]).length;
                const qDone = m.quiz.filter((q) => quizAnswers[q.id] === q.correctIndex).length;
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between border border-slate-200 px-3.5 py-2.5 bg-white"
                  >
                    <div>
                      <span className="font-bold text-[#00629B] mr-2">Module {m.roman}:</span>
                      <span className="font-semibold text-slate-900">{m.shortTitle}</span>
                    </div>
                    <div className="flex items-center gap-3 font-ieee-mono">
                      <span>Checklist {cDone}/{m.checklistItems.length}</span>
                      <span>Quiz {qDone}/{m.quiz.length}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowProgressModal(false);
                          openModule(m.id);
                        }}
                        className="px-2.5 py-1 bg-[#00629B] text-white font-ieee-sans font-medium cursor-pointer"
                      >
                        Go
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Quiet IEEE Academic Footer */}
      <footer className="border-t border-slate-200 bg-[#F8FAFC] py-6 px-4 sm:px-8 text-xs font-ieee-sans text-slate-600">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <strong>Analog Circuit Design</strong> · Interactive Analog IC Engineering Monograph &amp; <InlineMath math="g_m/I_D" /> Workbench
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveView('home')}
              className="hover:text-[#00629B] cursor-pointer"
            >
              Curriculum Roadmap
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => setActiveView('lab')}
              className="hover:text-[#00629B] cursor-pointer"
            >
              Interactive Lab
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => setActiveView('ai_agent_legend')}
              className="hover:text-[#00629B] cursor-pointer"
            >
              Symbol Legend &amp; References
            </button>
          </div>
        </div>
      </footer>

      {/* Context-Aware AI Analog Design Tutor Chatbot */}
      <AnalogAiTutor
        isOpen={isAiTutorOpen}
        onToggleOpen={() => setIsAiTutorOpen((prev) => !prev)}
        activeViewLabel={activeView}
        currentModuleTitle={`Module ${currentModule.roman}: ${currentModule.title}`}
        processNode={processNode}
      />
    </div>
  );
}
