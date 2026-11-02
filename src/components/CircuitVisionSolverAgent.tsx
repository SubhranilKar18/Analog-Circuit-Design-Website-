import React, { useState, useRef } from 'react';
import {
  Upload,
  Camera,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  FileText,
  Cpu,
  Activity,
  Network,
} from 'lucide-react';
import { BlockEquation, SpiceNetlistBox, InlineMath } from './Math';

export type ProblemDomain = 'network_analysis' | 'analog_circuit' | 'signal_processing';

interface SolvedProblemResponse {
  detectedDomain: string;
  extractedProblemStatement: string;
  extractedComponents: Array<{
    symbol: string;
    valueAndConnection: string;
  }>;
  governingEquations: Array<{
    lawName: string;
    latex: string;
  }>;
  derivationSteps: Array<{
    stepTitle: string;
    explanation: string;
    equationLatex: string;
    stepResult: string;
  }>;
  finalAnswerSummary: string;
  finalAnswerLatex: string;
  verificationCodeTitle: string;
  verificationCodeFilename: string;
  verificationCode: string;
  commonPitfalls: string[];
}

export const CircuitVisionSolverAgent: React.FC = () => {
  const [domain, setDomain] = useState<ProblemDomain>('analog_circuit');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/png');
  const [imageFileName, setImageFileName] = useState<string>('');
  const [problemText, setProblemText] = useState<string>('');
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [solution, setSolution] = useState<SolvedProblemResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }
    setErrorMsg(null);
    setImageFileName(file.name);
    setImageMimeType(file.type || 'image/png');

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImagePreviewUrl(dataUrl);
      const commaIdx = dataUrl.indexOf(',');
      if (commaIdx !== -1) {
        setImageBase64(dataUrl.slice(commaIdx + 1));
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          handleFileChange(file);
          break;
        }
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  /**
   * Generates a crisp synthetic schematic problem image on an HTML5 canvas so
   * students can test the Vision Problem Solver with one click.
   */
  const loadSampleDiagramImage = (sampleType: ProblemDomain) => {
    setDomain(sampleType);
    setErrorMsg(null);

    const canvas = document.createElement('canvas');
    canvas.width = 760;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // White paper background + border
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#00629B';
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 17px sans-serif';

    if (sampleType === 'network_analysis') {
      ctx.fillText(
        'Problem [Network Analysis]: Find Thevenin V_th, R_th & Laplace I_L(s) at node A-B',
        26,
        38
      );
      ctx.font = '14px monospace';
      ctx.fillStyle = '#1E293B';
      ctx.fillText('V_S = 12V u(t) ──[ R1 = 4 kΩ ]──┬──[ R2 = 2 kΩ ]──┬── Node A', 35, 95);
      ctx.fillText('                                │                 │', 35, 120);
      ctx.fillText('                           [ R3 = 4 kΩ ]     [ C = 100 nF ] (Load)', 35, 145);
      ctx.fillText('                                │                 │', 35, 170);
      ctx.fillText('GND (0V) ───────────────────────┴─────────────────┴── Node B', 35, 195);
      ctx.fillStyle = '#00629B';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(
        'Find: (1) V_th and R_th seen by capacitor C across A-B, (2) Time constant τ, (3) v_C(t) for t >= 0.',
        26,
        255
      );
      setProblemText(
        'From the circuit image: Vs = 12V step source, R1 = 4 kOhm, R3 = 4 kOhm shunt, R2 = 2 kOhm series, driving load capacitor C = 100 nF across terminals A-B (initially uncharged). Find Vth, Rth, time constant tau, and vC(t) for t >= 0.'
      );
      setImageFileName('sample_network_thevenin_rc.png');
    } else if (sampleType === 'analog_circuit') {
      ctx.fillText(
        'Problem [Analog IC Analysis]: Common-Source MOSFET Amplifier with Source Degeneration R_S',
        26,
        38
      );
      ctx.font = '14px monospace';
      ctx.fillStyle = '#1E293B';
      ctx.fillText('V_DD = 1.8V ──[ R_D = 10 kΩ ]──┬── V_out', 40, 90);
      ctx.fillText('                               │ (Drain)', 40, 115);
      ctx.fillText('V_in ─────────┤ Gate  NMOS M1 (gm = 2.0 mS, ro = ∞)', 40, 140);
      ctx.fillText('                               │ (Source)', 40, 165);
      ctx.fillText('GND ──────────[ R_S = 0.5 kΩ ]─┘', 40, 190);
      ctx.fillStyle = '#00629B';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(
        'Given: gm = 2.0 mS, RD = 10 kΩ, RS = 0.5 kΩ (neglect body effect & ro). Find G_m,eff and Voltage Gain Av = Vout/Vin.',
        26,
        255
      );
      setProblemText(
        'From the schematic image: NMOS Common-Source amplifier with source degeneration resistor RS = 0.5 kOhm, drain resistor RD = 10 kOhm, and transconductance gm = 2.0 mS (neglect ro and body effect). Find the effective transconductance Gm, output resistance Rout, and voltage gain Av = Vout / Vin.'
      );
      setImageFileName('sample_analog_cs_degeneration.png');
    } else {
      ctx.fillText(
        'Problem [Signal Processing]: Continuous-Time LTI Transfer Function H(s) & Impulse Response h(t)',
        26,
        38
      );
      ctx.font = '15px monospace';
      ctx.fillStyle = '#1E293B';
      ctx.fillText('x(t) ──► [  H(s) = (s + 2) / (s^2 + 5s + 6)  ] ──► y(t)', 40, 110);
      ctx.fillText('System is Causal and Stable (ROC: Re(s) > -2)', 40, 155);
      ctx.fillStyle = '#00629B';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(
        'Find: (1) Poles and Zeros of H(s), (2) Partial fraction expansion, (3) Causal impulse response h(t), (4) Step response.',
        26,
        245
      );
      setProblemText(
        'From the signal processing diagram: A causal LTI system has Laplace transfer function H(s) = (s + 2) / (s^2 + 5s + 6). Determine (1) the poles and zeros, (2) whether the system is BIBO stable, (3) the impulse response h(t) via partial fractions, and (4) the unit step response y_step(t).'
      );
      setImageFileName('sample_dsp_lti_transfer_function.png');
    }

    const dataUrl = canvas.toDataURL('image/png');
    setImagePreviewUrl(dataUrl);
    setImageMimeType('image/png');
    const commaIdx = dataUrl.indexOf(',');
    if (commaIdx !== -1) {
      setImageBase64(dataUrl.slice(commaIdx + 1));
    }
  };

  const clearImage = () => {
    setImagePreviewUrl(null);
    setImageBase64(null);
    setImageFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSolveProblem = async () => {
    if (isSolving) return;
    if (!imageBase64 && !problemText.trim()) {
      setErrorMsg('Please upload/paste an image of the problem or load a sample diagram first.');
      return;
    }

    setIsSolving(true);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/solve-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          imageBase64,
          mimeType: imageMimeType,
          problemText,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Failed with status ${response.status}`);
      }
      setSolution(data.solution);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to solve the uploaded problem.'
      );
    } finally {
      setIsSolving(false);
    }
  };

  return (
    <div
      onPaste={handlePaste}
      className="my-7 border-2 border-[#00629B] bg-white text-slate-900 font-lab-ui"
    >
      {/* Top Banner */}
      <div className="bg-[#00629B] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Camera className="w-5 h-5 shrink-0" />
          <div>
            <h3 className="font-bold text-sm sm:text-base leading-tight text-white">
              Multimodal AI Problem-Solver Agent (Image / Schematic → Step-by-Step Solution + SPICE/Python)
            </h3>
            <p className="text-[11px] text-sky-100 mt-0.5">
              Upload or paste (`Ctrl+V`) any handwritten/textbook circuit or equation image for Network Analysis, Analog IC Analysis, or Signal Processing
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Step 1: Select Domain & Quick Sample Loader */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F8FAFC] border border-slate-300 p-3.5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-800 mr-1">1. Select Domain:</span>
            {(
              [
                {
                  id: 'network_analysis',
                  label: 'Network Analysis (KCL/KVL, Thevenin, s-Domain)',
                  icon: <Network className="w-3.5 h-3.5" />,
                },
                {
                  id: 'analog_circuit',
                  label: 'Analog Circuit Analysis (MOSFET/BJT/Op-Amp)',
                  icon: <Cpu className="w-3.5 h-3.5" />,
                },
                {
                  id: 'signal_processing',
                  label: 'Signal Processing (LTI, Laplace/Fourier/Z)',
                  icon: <Activity className="w-3.5 h-3.5" />,
                },
              ] as { id: ProblemDomain; label: string; icon: React.ReactNode }[]
            ).map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDomain(d.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold border transition-colors cursor-pointer ${
                  domain === d.id
                    ? 'bg-[#00629B] border-[#00629B] text-white'
                    : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                }`}
              >
                {d.icon}
                <span>{d.label}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-600 font-semibold">Try 1-Click Sample Image:</span>
            <button
              type="button"
              onClick={() => loadSampleDiagramImage('network_analysis')}
              className="px-2.5 py-1 bg-white border border-slate-300 hover:border-[#00629B] text-[#00629B] font-semibold cursor-pointer"
            >
              Thevenin RC Network
            </button>
            <button
              type="button"
              onClick={() => loadSampleDiagramImage('analog_circuit')}
              className="px-2.5 py-1 bg-white border border-slate-300 hover:border-[#00629B] text-[#00629B] font-semibold cursor-pointer"
            >
              MOSFET CS w/ R_S
            </button>
            <button
              type="button"
              onClick={() => loadSampleDiagramImage('signal_processing')}
              className="px-2.5 py-1 bg-white border border-slate-300 hover:border-[#00629B] text-[#00629B] font-semibold cursor-pointer"
            >
              LTI H(s) Impulse
            </button>
          </div>
        </div>

        {/* Step 2: Image Dropzone + Additional Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left: Image Upload / Preview */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="lg:col-span-6 border-2 border-dashed border-slate-300 hover:border-[#00629B] bg-[#F8FAFC] p-4 flex flex-col items-center justify-center text-center transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e.target.files?.[0])}
              className="hidden"
            />

            {imagePreviewUrl ? (
              <div className="w-full space-y-2.5">
                <div className="flex items-center justify-between text-xs bg-white border border-slate-300 px-3 py-1.5">
                  <span className="font-ieee-mono font-semibold text-slate-900 truncate">
                    {imageFileName || 'Captured Circuit Image'}
                  </span>
                  <button
                    type="button"
                    onClick={clearImage}
                    className="inline-flex items-center gap-1 text-red-700 hover:text-red-900 font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
                <div className="border border-slate-300 bg-white p-2 flex items-center justify-center max-h-56 overflow-hidden">
                  <img
                    src={imagePreviewUrl}
                    alt="Uploaded circuit or signal processing problem"
                    className="max-h-52 w-auto object-contain"
                  />
                </div>
              </div>
            ) : (
              <div className="py-6 space-y-2.5">
                <Upload className="w-8 h-8 text-[#00629B] mx-auto" />
                <div className="text-sm font-bold text-slate-900">
                  Drop a Circuit / Signal Problem Image Here, or Click to Upload
                </div>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Supports textbook screenshots, GATE question snapshots, LTspice schematics, or handwritten equations (PNG, JPG, WEBP). You can also press{' '}
                  <code className="font-ieee-mono bg-white border border-slate-300 px-1 py-0.5 text-slate-900">
                    Ctrl+V
                  </code>{' '}
                  to paste from clipboard!
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#00629B] hover:bg-[#004B76] text-white text-xs font-bold cursor-pointer transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Image File</span>
                </button>
              </div>
            )}
          </div>

          {/* Right: Optional Problem Context / Custom Question & Solve Action */}
          <div className="lg:col-span-6 flex flex-col justify-between border border-slate-300 bg-[#F8FAFC] p-4 space-y-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-900">
                2. Optional Problem Notes / Specific Quantities to Find (or Type Full Problem Without Image):
              </label>
              <textarea
                value={problemText}
                onChange={(e) => setProblemText(e.target.value)}
                rows={5}
                placeholder="e.g., Find the Thevenin impedance Z_th(s), small-signal voltage gain Av = Vout/Vin, input-referred noise, or inverse Z-transform x[n]..."
                className="w-full bg-white border border-slate-300 focus:border-[#00629B] focus:outline-none p-3 text-xs md:text-sm text-slate-900 resize-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
              <div className="text-[11px] text-slate-600">
                Outputs KaTeX derivation + runnable SPICE / Python verification code
              </div>
              <button
                type="button"
                disabled={isSolving}
                onClick={handleSolveProblem}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00629B] hover:bg-[#004B76] disabled:bg-slate-400 text-white text-xs sm:text-sm font-bold cursor-pointer transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isSolving
                    ? 'Analyzing Schematic & Deriving Solution...'
                    : 'Solve Problem with AI Agent'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="border border-red-300 bg-red-50 p-3.5 text-xs md:text-sm text-red-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-700" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Step 3: Rendered Structured Engineering Solution */}
        {solution && (
          <div className="border-t-2 border-[#00629B] pt-5 space-y-5">
            {/* Header & Extracted Problem Statement */}
            <div className="bg-[#F8FAFC] border border-slate-300 p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 bg-[#00629B] text-white text-xs font-bold">
                  {solution.detectedDomain || 'Engineering Problem Solution'}
                </span>
                <span className="text-xs font-ieee-mono text-emerald-900 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 font-bold">
                  Step-by-Step Symbolic &amp; Numerical Derivation
                </span>
              </div>
              <div className="text-xs md:text-sm text-slate-900 leading-relaxed pt-1">
                <strong>Extracted Problem &amp; Topology: </strong>
                {solution.extractedProblemStatement}
              </div>
            </div>

            {/* Extracted Circuit / Signal Parameters Table */}
            {Array.isArray(solution.extractedComponents) &&
              solution.extractedComponents.length > 0 && (
                <div className="overflow-x-auto border border-slate-300">
                  <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#00629B]" />
                    <span>Extracted Circuit Elements &amp; Signal Parameters</span>
                  </div>
                  <table className="w-full text-left border-collapse text-xs text-slate-900">
                    <thead>
                      <tr className="bg-[#F8FAFC] border-b border-slate-300">
                        <th className="py-2 px-3 w-1/4">Symbol / Element</th>
                        <th className="py-2 px-3">Extracted Value, Units &amp; Node Connection</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {solution.extractedComponents.map((comp, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-ieee-mono font-bold text-[#00629B]">
                            {comp.symbol}
                          </td>
                          <td className="py-2 px-3 text-slate-900">{comp.valueAndConnection}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            {/* Governing Theorems & Laws */}
            {Array.isArray(solution.governingEquations) &&
              solution.governingEquations.length > 0 && (
                <div className="border border-slate-300 bg-[#F8FAFC] p-4 space-y-2">
                  <div className="text-xs font-bold text-[#00629B] uppercase tracking-wider">
                    Governing Network Laws, Small-Signal Equations &amp; Transform Identities
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {solution.governingEquations.map((eq, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 p-3">
                        <div className="text-xs font-bold text-slate-900 mb-1">{eq.lawName}</div>
                        <BlockEquation math={eq.latex} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Step-by-Step Mathematical Derivation */}
            {Array.isArray(solution.derivationSteps) && solution.derivationSteps.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-bold text-[#00629B] border-b border-slate-200 pb-1.5">
                  Step-by-Step Analytical &amp; Numerical Solution
                </div>
                {solution.derivationSteps.map((st, idx) => (
                  <div key={idx} className="border border-slate-300 bg-white p-4 space-y-2">
                    <div className="font-bold text-xs md:text-sm text-[#00629B]">
                      Step {idx + 1}: {st.stepTitle}
                    </div>
                    <p className="text-xs md:text-sm text-slate-800 leading-relaxed">
                      {st.explanation}
                    </p>
                    {st.equationLatex && <BlockEquation math={st.equationLatex} />}
                    {st.stepResult && (
                      <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-ieee-mono font-bold text-emerald-900">
                        ⇒ {st.stepResult}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Final Boxed Answer */}
            <div className="border-2 border-emerald-600 bg-emerald-50/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <span>Final Verified Solution</span>
              </div>
              <p className="text-xs md:text-sm font-semibold text-slate-900">
                {solution.finalAnswerSummary}
              </p>
              {solution.finalAnswerLatex && (
                <div className="bg-white border border-emerald-300 px-3 py-1">
                  <BlockEquation math={solution.finalAnswerLatex} />
                </div>
              )}
            </div>

            {/* Auto-Generated SPICE Netlist or Python Verification Script */}
            {solution.verificationCode && (
              <SpiceNetlistBox
                title={
                  solution.verificationCodeTitle ||
                  'Automated SPICE / Python Verification Script'
                }
                filename={solution.verificationCodeFilename || 'verify_problem.cir'}
                netlist={solution.verificationCode}
                description="Run this auto-generated SPICE deck or Python script to independently verify the AI Agent's analytical derivation."
              />
            )}

            {/* Common Pitfalls */}
            {Array.isArray(solution.commonPitfalls) && solution.commonPitfalls.length > 0 && (
              <div className="border border-amber-300 bg-amber-50/40 p-4 text-xs md:text-sm space-y-1.5">
                <div className="font-bold text-amber-950">
                  Common Exam &amp; Design Pitfalls on This Problem:
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-800">
                  {solution.commonPitfalls.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
