import React, { useState } from 'react';

export type SchematicId =
  | 'mosfet_models'
  | 'gmid_curves'
  | 'inverter'
  | 'ota5t'
  | 'opamp2stage'
  | 'ldo'
  | 'bgr'
  | 'verification_tb'
  | 'layout_centroid';

type HighlightMode = 'all' | 'dc_bias' | 'ac_signal' | 'compensation';

interface CircuitFigureProps {
  schematicId: SchematicId;
  figNumber: string;
  caption: string;
}

export const CircuitFigure: React.FC<CircuitFigureProps> = ({
  schematicId,
  figNumber,
  caption,
}) => {
  const [mode, setMode] = useState<HighlightMode>('all');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const isHighlighted = (target: HighlightMode) => mode === 'all' || mode === target;

  return (
    <figure className="my-7 border border-slate-300 bg-white">
      {/* Interactive Toolbar */}
      <div className="px-4 py-2.5 bg-[#F8FAFC] border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-ieee-sans text-slate-700">
          <span className="font-bold text-[#00629B]">{figNumber}</span>
          <span>·</span>
          <span>Interactive Signal &amp; Bias Path Inspector</span>
        </div>
        <div className="flex items-center gap-1 bg-slate-200/70 p-0.5">
          {(
            [
              { id: 'all', label: 'Full Schematic' },
              { id: 'dc_bias', label: 'DC Bias Path' },
              { id: 'ac_signal', label: 'AC Signal Flow' },
              { id: 'compensation', label: 'Loads / Feedback' },
            ] as { id: HighlightMode; label: string }[]
          ).map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setMode(btn.id)}
              className={`px-2.5 py-1 text-xs font-ieee-sans font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                mode === btn.id
                  ? 'bg-[#00629B] text-white'
                  : 'text-slate-700 hover:bg-white/70'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="p-4 md:p-6 flex flex-col items-center justify-center bg-white overflow-x-auto">
        {schematicId === 'mosfet_models' && (
          <MosfetCrossSectionAndSmallSignal mode={mode} onHoverNode={setHoveredNode} />
        )}
        {schematicId === 'gmid_curves' && (
          <GmIdDesignSpaceDiagram mode={mode} onHoverNode={setHoveredNode} />
        )}
        {schematicId === 'inverter' && (
          <CmosInverterSchematic isHighlighted={isHighlighted} onHoverNode={setHoveredNode} />
        )}
        {schematicId === 'ota5t' && (
          <Ota5TSchematic isHighlighted={isHighlighted} onHoverNode={setHoveredNode} />
        )}
        {schematicId === 'opamp2stage' && (
          <TwoStageOpAmpSchematic isHighlighted={isHighlighted} onHoverNode={setHoveredNode} />
        )}
        {schematicId === 'ldo' && (
          <LdoRegulatorSchematic isHighlighted={isHighlighted} onHoverNode={setHoveredNode} />
        )}
        {schematicId === 'bgr' && (
          <BandgapReferenceSchematic isHighlighted={isHighlighted} onHoverNode={setHoveredNode} />
        )}
        {schematicId === 'verification_tb' && (
          <VerificationTestbenchSchematic isHighlighted={isHighlighted} onHoverNode={setHoveredNode} />
        )}
        {schematicId === 'layout_centroid' && (
          <CommonCentroidLayoutDiagram isHighlighted={isHighlighted} onHoverNode={setHoveredNode} />
        )}
      </div>

      {/* Live Node Inspection Bar */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs font-ieee-sans">
        <div className="text-slate-700">
          <span className="font-semibold text-[#00629B]">Inspector: </span>
          {hoveredNode ? (
            <span className="font-ieee-mono text-slate-900">{hoveredNode}</span>
          ) : (
            <span className="text-slate-500">
              Hover over any transistor, node, or current path in the diagram above to inspect terminal physics and impedances.
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-[11px] font-ieee-sans text-slate-600">
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-[#0284C7] inline-block" /> DC Bias Current
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-[#059669] inline-block" /> AC Small-Signal Path
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-[#D97706] inline-block" /> Feedback / Compensation
          </span>
        </div>
      </div>

      {/* IEEE Standard Figure Caption */}
      <figcaption className="px-5 py-3 bg-[#F8FAFC] border-t border-slate-200 text-xs md:text-sm font-ieee-serif text-slate-800 text-center">
        <strong className="font-bold">{figNumber}.</strong> {caption}
      </figcaption>
    </figure>
  );
};

/* ============================================================================
 * 1. MOSFET Cross-Section & Small-Signal Hybrid-Pi Diagram
 * ============================================================================ */
const MosfetCrossSectionAndSmallSignal: React.FC<{
  mode: HighlightMode;
  onHoverNode: (info: string | null) => void;
}> = ({ mode, onHoverNode }) => (
  <svg viewBox="0 0 760 290" className="w-full max-w-3xl h-auto select-none">
    {/* Left Panel: Physical Cross-Section */}
    <text x="180" y="22" textAnchor="middle" className="fill-[#00629B] font-bold text-[13px] font-ieee-sans">
      (a) NMOS Physical Cross-Section (Saturation Pinch-Off)
    </text>

    {/* p-substrate */}
    <rect
      x="30"
      y="95"
      width="300"
      height="155"
      fill="#F1F5F9"
      stroke="#334155"
      strokeWidth="1.5"
      onMouseEnter={() => onHoverNode('p-type Substrate (Body/Bulk B): Tied to lowest potential (GND for NMOS) to reverse-bias source/drain junctions.')}
      onMouseLeave={() => onHoverNode(null)}
    />
    <text x="180" y="225" textAnchor="middle" className="fill-slate-600 text-[12px] font-ieee-serif italic">
      p-type Silicon Substrate (Body, B) — N_A
    </text>

    {/* n+ Source and Drain Wells */}
    <rect
      x="50"
      y="95"
      width="65"
      height="55"
      fill="#BAE6FD"
      stroke="#0284C7"
      strokeWidth="1.5"
      onMouseEnter={() => onHoverNode('n+ Source Diffusion: Heavily doped electron reservoir; Vs sets reference for Vgs.')}
      onMouseLeave={() => onHoverNode(null)}
    />
    <text x="82" y="127" textAnchor="middle" className="fill-slate-900 font-bold text-[12px] font-ieee-mono">
      n+ Source
    </text>

    <rect
      x="245"
      y="95"
      width="65"
      height="55"
      fill="#BAE6FD"
      stroke="#0284C7"
      strokeWidth="1.5"
      onMouseEnter={() => onHoverNode('n+ Drain Diffusion: Collects channel electrons; Vds > Vds,sat causes pinch-off near drain.')}
      onMouseLeave={() => onHoverNode(null)}
    />
    <text x="277" y="127" textAnchor="middle" className="fill-slate-900 font-bold text-[12px] font-ieee-mono">
      n+ Drain
    </text>

    {/* Tapered Inversion Channel + Depletion Region */}
    <polygon
      points="115,95 245,95 230,101 115,118"
      fill="#059669"
      fillOpacity={mode === 'dc_bias' || mode === 'all' ? '0.8' : '0.35'}
      onMouseEnter={() => onHoverNode('Tapered Inversion Channel: Electron density Q_inv(x) = Cox*(Vgs - Vth - V(x)); pinches off at x = L_eff.')}
      onMouseLeave={() => onHoverNode(null)}
    />
    <path
      d="M 45 155 Q 180 185 318 195"
      fill="none"
      stroke="#64748B"
      strokeWidth="1.5"
      strokeDasharray="4 4"
    />
    <text x="180" y="168" textAnchor="middle" className="fill-slate-500 text-[11px] font-ieee-sans">
      Depletion Region Boundary (W_dep widens toward Drain)
    </text>

    {/* Gate Oxide (SiO2) & Polysilicon/Metal Gate */}
    <rect x="110" y="82" width="140" height="13" fill="#E2E8F0" stroke="#475569" strokeWidth="1.2" />
    <text x="180" y="92" textAnchor="middle" className="fill-slate-700 text-[9px] font-ieee-mono">
      t_ox (C_ox = ε_ox / t_ox)
    </text>
    <rect
      x="110"
      y="56"
      width="140"
      height="26"
      fill="#00629B"
      onMouseEnter={() => onHoverNode('Gate Electrode (G): Controls vertical electric field across gate oxide (Cox).')}
      onMouseLeave={() => onHoverNode(null)}
    />
    <text x="180" y="73" textAnchor="middle" className="fill-white font-bold text-[11px] font-ieee-mono">
      GATE (G)
    </text>

    {/* Terminal Leads */}
    <line x1="82" y1="95" x2="82" y2="42" stroke="#1E293B" strokeWidth="2" />
    <circle cx="82" cy="40" r="3.5" fill="#1E293B" />
    <text x="82" y="32" textAnchor="middle" className="fill-slate-900 font-bold text-[11px] font-ieee-mono">
      S
    </text>

    <line x1="180" y1="56" x2="180" y2="42" stroke="#1E293B" strokeWidth="2" />
    <circle cx="180" cy="40" r="3.5" fill="#1E293B" />
    <text x="195" y="43" className="fill-slate-900 font-bold text-[11px] font-ieee-mono">
      G
    </text>

    <line x1="277" y1="95" x2="277" y2="42" stroke="#1E293B" strokeWidth="2" />
    <circle cx="277" cy="40" r="3.5" fill="#1E293B" />
    <text x="277" y="32" textAnchor="middle" className="fill-slate-900 font-bold text-[11px] font-ieee-mono">
      D
    </text>

    {/* Right Panel: High-Frequency Hybrid-Pi Small-Signal Model */}
    <text x="565" y="22" textAnchor="middle" className="fill-[#00629B] font-bold text-[13px] font-ieee-sans">
      (b) High-Frequency Small-Signal Hybrid-π Model
    </text>

    {/* Gate Input Node */}
    <circle cx="400" cy="115" r="4" fill="#00629B" />
    <text x="385" y="119" textAnchor="end" className="fill-slate-900 font-bold text-[12px] font-ieee-mono">
      G
    </text>
    <line x1="404" y1="115" x2="455" y2="115" stroke="#1E293B" strokeWidth="1.8" />

    {/* Cgs */}
    <line x1="455" y1="115" x2="455" y2="155" stroke="#1E293B" strokeWidth="1.8" />
    <line x1="442" y1="155" x2="468" y2="155" stroke="#00629B" strokeWidth="2.5" />
    <line x1="442" y1="163" x2="468" y2="163" stroke="#00629B" strokeWidth="2.5" />
    <line x1="455" y1="163" x2="455" y2="215" stroke="#1E293B" strokeWidth="1.8" />
    <text x="435" y="163" textAnchor="end" className="fill-[#00629B] font-bold text-[12px] font-ieee-mono">
      C_gs
    </text>
    <text x="455" y="142" textAnchor="middle" className="fill-emerald-700 font-bold text-[11px] font-ieee-mono">
      + v_gs -
    </text>

    {/* Cgd (Miller feedback cap) */}
    <line x1="455" y1="115" x2="455" y2="65" stroke="#D97706" strokeWidth="1.8" />
    <line x1="455" y1="65" x2="520" y2="65" stroke="#D97706" strokeWidth="1.8" />
    <line x1="520" y1="53" x2="520" y2="77" stroke="#D97706" strokeWidth="2.5" />
    <line x1="528" y1="53" x2="528" y2="77" stroke="#D97706" strokeWidth="2.5" />
    <line x1="528" y1="65" x2="600" y2="65" stroke="#D97706" strokeWidth="1.8" />
    <line x1="600" y1="65" x2="600" y2="115" stroke="#D97706" strokeWidth="1.8" />
    <text x="524" y="45" textAnchor="middle" className="fill-amber-700 font-bold text-[12px] font-ieee-mono">
      C_gd (Miller Cap)
    </text>

    {/* Dependent Current Source gm * vgs */}
    <line x1="545" y1="115" x2="710" y2="115" stroke="#1E293B" strokeWidth="1.8" />
    <line x1="545" y1="115" x2="545" y2="140" stroke="#059669" strokeWidth="1.8" />
    <polygon
      points="545,140 567,165 545,190 523,165"
      fill="#ECFDF5"
      stroke="#059669"
      strokeWidth="2"
      onMouseEnter={() => onHoverNode('Voltage-Controlled Current Source (gm * vgs): Converts gate overdrive modulation into small-signal drain current.')}
      onMouseLeave={() => onHoverNode(null)}
    />
    <line x1="545" y1="152" x2="545" y2="177" stroke="#059669" strokeWidth="2" />
    <polygon points="541,173 549,173 545,181" fill="#059669" />
    <line x1="545" y1="190" x2="545" y2="215" stroke="#059669" strokeWidth="1.8" />
    <text x="574" y="169" className="fill-emerald-800 font-bold text-[12px] font-ieee-mono">
      g_m v_gs
    </text>

    {/* Output Resistance ro = 1/gds */}
    <line x1="645" y1="115" x2="645" y2="142" stroke="#1E293B" strokeWidth="1.8" />
    <rect
      x="635"
      y="142"
      width="20"
      height="45"
      fill="#F8FAFC"
      stroke="#1E293B"
      strokeWidth="1.8"
      onMouseEnter={() => onHoverNode('Small-Signal Output Resistance ro = 1 / gds = 1 / (lambda * Id): Determines intrinsic voltage gain gm*ro.')}
      onMouseLeave={() => onHoverNode(null)}
    />
    <line x1="645" y1="187" x2="645" y2="215" stroke="#1E293B" strokeWidth="1.8" />
    <text x="662" y="168" className="fill-slate-900 font-bold text-[12px] font-ieee-mono">
      r_o = 1/g_ds
    </text>

    {/* Drain Node & Source Reference Ground */}
    <circle cx="710" cy="115" r="4" fill="#00629B" />
    <text x="722" y="119" className="fill-slate-900 font-bold text-[12px] font-ieee-mono">
      D
    </text>

    <line x1="400" y1="215" x2="710" y2="215" stroke="#1E293B" strokeWidth="1.8" />
    <text x="385" y="219" textAnchor="end" className="fill-slate-900 font-bold text-[12px] font-ieee-mono">
      S / B
    </text>
    {/* Ground Symbol */}
    <line x1="545" y1="215" x2="545" y2="232" stroke="#1E293B" strokeWidth="1.8" />
    <line x1="531" y1="232" x2="559" y2="232" stroke="#1E293B" strokeWidth="2" />
    <line x1="536" y1="238" x2="554" y2="238" stroke="#1E293B" strokeWidth="2" />
    <line x1="541" y1="244" x2="549" y2="244" stroke="#1E293B" strokeWidth="2" />
  </svg>
);

/* ============================================================================
 * 2. gm/Id Inversion Regions & Tradeoff Space SVG
 * ============================================================================ */
const GmIdDesignSpaceDiagram: React.FC<{
  mode: HighlightMode;
  onHoverNode: (info: string | null) => void;
}> = ({ onHoverNode }) => (
  <svg viewBox="0 0 740 270" className="w-full max-w-3xl h-auto select-none">
    {/* Axes */}
    <line x1="70" y1="225" x2="680" y2="225" stroke="#1E293B" strokeWidth="2" />
    <line x1="70" y1="30" x2="70" y2="225" stroke="#1E293B" strokeWidth="2" />
    <line x1="680" y1="30" x2="680" y2="225" stroke="#D97706" strokeWidth="2" />

    {/* Region Background Zones */}
    <rect
      x="72"
      y="32"
      width="175"
      height="191"
      fill="#E0F2FE"
      fillOpacity="0.45"
      onMouseEnter={() => onHoverNode('Weak Inversion (IC < 0.1, gm/Id ≈ 20–28 V^-1): Maximum current efficiency & intrinsic gain, lowest speed (fT), large area.')}
      onMouseLeave={() => onHoverNode(null)}
    />
    <rect
      x="247"
      y="32"
      width="225"
      height="191"
      fill="#D1FAE5"
      fillOpacity="0.45"
      onMouseEnter={() => onHoverNode('Moderate Inversion Sweet-Spot (0.1 < IC < 10, gm/Id ≈ 10–18 V^-1): Optimal product of transconductance efficiency and transit frequency fT.')}
      onMouseLeave={() => onHoverNode(null)}
    />
    <rect
      x="472"
      y="32"
      width="206"
      height="191"
      fill="#FEF3C7"
      fillOpacity="0.45"
      onMouseEnter={() => onHoverNode('Strong Inversion (IC > 10, gm/Id ≈ 4–9 V^-1): High transit frequency fT & good current mirror matching, high Vds,sat overhead.')}
      onMouseLeave={() => onHoverNode(null)}
    />

    {/* Zone Labels */}
    <text x="158" y="48" textAnchor="middle" className="fill-sky-900 font-bold text-[11px] font-ieee-sans">
      WEAK INVERSION (IC &lt; 0.1)
    </text>
    <text x="360" y="48" textAnchor="middle" className="fill-emerald-900 font-bold text-[11px] font-ieee-sans">
      MODERATE INVERSION (0.1 &lt; IC &lt; 10)
    </text>
    <text x="575" y="48" textAnchor="middle" className="fill-amber-900 font-bold text-[11px] font-ieee-sans">
      STRONG INVERSION (IC &gt; 10)
    </text>

    {/* gm/Id Curve (Blue) */}
    <path
      d="M 80,68 L 195,72 Q 300,80 410,140 T 665,205"
      fill="none"
      stroke="#00629B"
      strokeWidth="3"
    />
    <text x="160" y="62" className="fill-[#00629B] font-bold text-[12px] font-ieee-mono">
      g_m / I_D (V⁻¹) [Left Axis]
    </text>

    {/* fT Curve (Amber) */}
    <path
      d="M 80,218 Q 260,210 380,145 T 665,62"
      fill="none"
      stroke="#D97706"
      strokeWidth="2.8"
      strokeDasharray="6 3"
    />
    <text x="565" y="72" className="fill-amber-800 font-bold text-[12px] font-ieee-mono">
      f_T (GHz) [Right Axis]
    </text>

    {/* FoM Peak Curve: gm/Id * fT (Emerald) */}
    <path
      d="M 80,205 Q 230,150 355,88 Q 480,105 665,170"
      fill="none"
      stroke="#059669"
      strokeWidth="2.5"
    />
    <circle cx="355" cy="96" r="5" fill="#059669" />
    <text x="355" y="82" textAnchor="middle" className="fill-emerald-800 font-bold text-[11px] font-ieee-sans">
      Peak (g_m/I_D)·f_T FoM (g_m/I_D ≈ 12–15 V⁻¹)
    </text>

    {/* Axis Labels */}
    <text x="375" y="255" textAnchor="middle" className="fill-slate-800 font-bold text-[12px] font-ieee-sans">
      Log₁₀ Normalized Drain Current Density I_D / (W/L)  or  Inversion Coefficient (IC) →
    </text>
    <text x="32" y="130" textAnchor="middle" transform="rotate(-90 32 130)" className="fill-[#00629B] font-bold text-[12px] font-ieee-sans">
      g_m / I_D (V⁻¹)
    </text>
    <text x="718" y="130" textAnchor="middle" transform="rotate(90 718 130)" className="fill-amber-800 font-bold text-[12px] font-ieee-sans">
      Transit Freq. f_T (GHz)
    </text>
  </svg>
);

/* ============================================================================
 * 3. CMOS Inverter Schematic (Digital Gate + Analog Transresistance Bias)
 * ============================================================================ */
const CmosInverterSchematic: React.FC<{
  isHighlighted: (m: HighlightMode) => boolean;
  onHoverNode: (info: string | null) => void;
}> = ({ isHighlighted, onHoverNode }) => (
  <svg viewBox="0 0 680 280" className="w-full max-w-2xl h-auto select-none">
    {/* VDD Rail */}
    <line x1="160" y1="28" x2="280" y2="28" stroke="#00629B" strokeWidth="3" />
    <text x="220" y="19" textAnchor="middle" className="fill-[#00629B] font-bold text-[12px] font-ieee-mono">
      V_DD (1.8V)
    </text>
    <line x1="220" y1="28" x2="220" y2="58" stroke="#1E293B" strokeWidth="2" />

    {/* PMOS M_P */}
    <g
      onMouseEnter={() => onHoverNode('PMOS Pull-Up (M_P): Provides g_mp and r_op; sized W_P ≈ (2.5–3)*W_N to equalize mobility (u_n/u_p) for V_M = VDD/2.')}
      onMouseLeave={() => onHoverNode(null)}
      className="cursor-pointer"
    >
      <line x1="192" y1="58" x2="192" y2="102" stroke="#1E293B" strokeWidth="2.2" />
      <circle cx="185" cy="80" r="4" fill="white" stroke="#1E293B" strokeWidth="2" />
      <line x1="200" y1="54" x2="200" y2="106" stroke="#00629B" strokeWidth="2.5" />
      <line x1="200" y1="58" x2="220" y2="58" stroke="#1E293B" strokeWidth="2" />
      <line x1="200" y1="102" x2="220" y2="102" stroke="#1E293B" strokeWidth="2" />
      {/* Body tied to VDD */}
      <line x1="200" y1="80" x2="245" y2="80" stroke="#64748B" strokeWidth="1.5" />
      <line x1="245" y1="80" x2="245" y2="28" stroke="#64748B" strokeWidth="1.5" />
      <text x="255" y="75" className="fill-slate-800 font-bold text-[12px] font-ieee-mono">
        M_P (g_mp, r_op)
      </text>
    </g>

    {/* Center Output Node */}
    <line
      x1="220"
      y1="102"
      x2="220"
      y2="168"
      stroke={isHighlighted('dc_bias') ? '#0284C7' : '#1E293B'}
      strokeWidth="2.2"
    />
    <line
      x1="220"
      y1="135"
      x2="420"
      y2="135"
      stroke={isHighlighted('ac_signal') ? '#059669' : '#1E293B'}
      strokeWidth="2.5"
    />
    <circle cx="220" cy="135" r="4" fill="#059669" />
    <circle cx="420" cy="135" r="4" fill="#059669" />
    <text x="432" y="139" className="fill-emerald-800 font-bold text-[13px] font-ieee-mono">
      V_out [A_v = -(g_mn + g_mp)(r_on || r_op)]
    </text>

    {/* Optional Self-Bias Resistor Rf (Feedback) */}
    <g
      opacity={isHighlighted('compensation') ? 1 : 0.35}
      onMouseEnter={() => onHoverNode('Large Feedback Resistor R_F: Biases inverter explicitly at V_out = V_in = V_M (peak gain region) for analog amplifier operation.')}
      onMouseLeave={() => onHoverNode(null)}
    >
      <line x1="125" y1="135" x2="125" y2="38" stroke="#D97706" strokeWidth="1.6" strokeDasharray="4 3" />
      <line x1="125" y1="38" x2="345" y2="38" stroke="#D97706" strokeWidth="1.6" strokeDasharray="4 3" />
      <rect x="275" y="30" width="46" height="16" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.6" />
      <text x="298" y="42" textAnchor="middle" className="fill-amber-900 font-bold text-[10px] font-ieee-mono">
        R_F (Bias)
      </text>
      <line x1="345" y1="38" x2="345" y2="135" stroke="#D97706" strokeWidth="1.6" strokeDasharray="4 3" />
    </g>

    {/* NMOS M_N */}
    <g
      onMouseEnter={() => onHoverNode('NMOS Pull-Down (M_N): Provides g_mn and r_on; operates in saturation alongside M_P near V_in = V_M.')}
      onMouseLeave={() => onHoverNode(null)}
      className="cursor-pointer"
    >
      <line x1="192" y1="168" x2="192" y2="212" stroke="#1E293B" strokeWidth="2.2" />
      <line x1="200" y1="164" x2="200" y2="216" stroke="#00629B" strokeWidth="2.5" />
      <line x1="200" y1="168" x2="220" y2="168" stroke="#1E293B" strokeWidth="2" />
      <line x1="200" y1="212" x2="220" y2="212" stroke="#1E293B" strokeWidth="2" />
      {/* Body tied to GND */}
      <line x1="200" y1="190" x2="245" y2="190" stroke="#64748B" strokeWidth="1.5" />
      <line x1="245" y1="190" x2="245" y2="242" stroke="#64748B" strokeWidth="1.5" />
      <text x="255" y="195" className="fill-slate-800 font-bold text-[12px] font-ieee-mono">
        M_N (g_mn, r_on)
      </text>
    </g>

    {/* Input Gate Line */}
    <line x1="150" y1="80" x2="181" y2="80" stroke="#059669" strokeWidth="2.2" />
    <line x1="150" y1="190" x2="192" y2="190" stroke="#059669" strokeWidth="2.2" />
    <line x1="150" y1="80" x2="150" y2="190" stroke="#059669" strokeWidth="2.2" />
    <line x1="85" y1="135" x2="150" y2="135" stroke="#059669" strokeWidth="2.5" />
    <circle cx="85" cy="135" r="4" fill="#059669" />
    <text x="73" y="139" textAnchor="end" className="fill-emerald-800 font-bold text-[13px] font-ieee-mono">
      V_in
    </text>

    {/* Load Capacitor CL */}
    <line x1="380" y1="135" x2="380" y2="175" stroke="#1E293B" strokeWidth="1.8" />
    <line x1="366" y1="175" x2="394" y2="175" stroke="#00629B" strokeWidth="2.5" />
    <line x1="366" y1="183" x2="394" y2="183" stroke="#00629B" strokeWidth="2.5" />
    <line x1="380" y1="183" x2="380" y2="242" stroke="#1E293B" strokeWidth="1.8" />
    <text x="402" y="183" className="fill-[#00629B] font-bold text-[12px] font-ieee-mono">
      C_L
    </text>

    {/* Ground Rail */}
    <line x1="220" y1="212" x2="220" y2="242" stroke="#1E293B" strokeWidth="2" />
    <line x1="180" y1="242" x2="400" y2="242" stroke="#1E293B" strokeWidth="2" />
    <line x1="275" y1="250" x2="305" y2="250" stroke="#1E293B" strokeWidth="2" />
    <line x1="283" y1="257" x2="297" y2="257" stroke="#1E293B" strokeWidth="2" />
  </svg>
);

/* ============================================================================
 * 4. 5-Transistor (5T) OTA Schematic
 * ============================================================================ */
const Ota5TSchematic: React.FC<{
  isHighlighted: (m: HighlightMode) => boolean;
  onHoverNode: (info: string | null) => void;
}> = ({ isHighlighted, onHoverNode }) => (
  <svg viewBox="0 0 740 340" className="w-full max-w-3xl h-auto select-none">
    {/* VDD Rail */}
    <line x1="160" y1="25" x2="580" y2="25" stroke="#00629B" strokeWidth="3" />
    <text x="370" y="16" textAnchor="middle" className="fill-[#00629B] font-bold text-[12px] font-ieee-mono">
      V_DD Supply Rail
    </text>

    {/* Left Branch (M3 Diode-Connected PMOS + M1 Input NMOS) */}
    <line x1="250" y1="25" x2="250" y2="55" stroke="#1E293B" strokeWidth="2" />
    {/* M3 PMOS */}
    <g
      onMouseEnter={() => onHoverNode('M3 (Diode-Connected PMOS Load): Gate tied to Drain (node V_mir); Low impedance ~ 1/gm3, sets mirror pole f_p2 = gm3 / (2*pi*C_mir).')}
      onMouseLeave={() => onHoverNode(null)}
      className="cursor-pointer"
    >
      <line x1="250" y1="55" x2="270" y2="55" stroke="#1E293B" strokeWidth="2" />
      <line x1="250" y1="95" x2="270" y2="95" stroke="#1E293B" strokeWidth="2" />
      <line x1="270" y1="50" x2="270" y2="100" stroke="#D97706" strokeWidth="2.5" />
      <line x1="278" y1="55" x2="278" y2="95" stroke="#1E293B" strokeWidth="2.2" />
      <circle cx="283" cy="75" r="3.5" fill="white" stroke="#1E293B" strokeWidth="1.8" />
      <text x="190" y="78" className="fill-amber-900 font-bold text-[12px] font-ieee-mono">
        M_3 (PMOS)
      </text>
    </g>

    {/* M4 PMOS Active Mirror Load */}
    <line x1="470" y1="25" x2="470" y2="55" stroke="#1E293B" strokeWidth="2" />
    <g
      onMouseEnter={() => onHoverNode('M4 (PMOS Current Mirror Load): Mirrors I_D1 to output node; high output resistance r_o4 forms Av = gm1*(ro2 || ro4).')}
      onMouseLeave={() => onHoverNode(null)}
      className="cursor-pointer"
    >
      <line x1="470" y1="55" x2="450" y2="55" stroke="#1E293B" strokeWidth="2" />
      <line x1="470" y1="95" x2="450" y2="95" stroke="#1E293B" strokeWidth="2" />
      <line x1="450" y1="50" x2="450" y2="100" stroke="#D97706" strokeWidth="2.5" />
      <line x1="442" y1="55" x2="442" y2="95" stroke="#1E293B" strokeWidth="2.2" />
      <circle cx="437" cy="75" r="3.5" fill="white" stroke="#1E293B" strokeWidth="1.8" />
      <text x="485" y="78" className="fill-amber-900 font-bold text-[12px] font-ieee-mono">
        M_4 (r_o4)
      </text>
    </g>

    {/* Current Mirror Gate Connection + Diode Short */}
    <line
      x1="287"
      y1="75"
      x2="433"
      y2="75"
      stroke={isHighlighted('compensation') ? '#D97706' : '#1E293B'}
      strokeWidth="2.2"
    />
    <line x1="250" y1="112" x2="325" y2="112" stroke="#D97706" strokeWidth="2" />
    <line x1="325" y1="112" x2="325" y2="75" stroke="#D97706" strokeWidth="2" />
    <circle cx="325" cy="75" r="3.5" fill="#D97706" />
    <circle cx="250" cy="112" r="3.5" fill="#D97706" />
    <text x="360" y="68" textAnchor="middle" className="fill-amber-800 font-bold text-[11px] font-ieee-mono">
      V_mir (1/g_m3)
    </text>

    {/* Vertical Drain Lines */}
    <line
      x1="250"
      y1="95"
      x2="250"
      y2="155"
      stroke={isHighlighted('ac_signal') ? '#059669' : '#1E293B'}
      strokeWidth="2.2"
    />
    <line
      x1="470"
      y1="95"
      x2="470"
      y2="155"
      stroke={isHighlighted('ac_signal') ? '#059669' : '#1E293B'}
      strokeWidth="2.2"
    />

    {/* Output Node Vout */}
    <line
      x1="470"
      y1="128"
      x2="615"
      y2="128"
      stroke={isHighlighted('ac_signal') ? '#059669' : '#1E293B'}
      strokeWidth="2.6"
    />
    <circle cx="470" cy="128" r="4" fill="#059669" />
    <circle cx="615" cy="128" r="4" fill="#059669" />
    <text x="625" y="132" className="fill-emerald-800 font-bold text-[13px] font-ieee-mono">
      V_out
    </text>
    <text x="625" y="148" className="fill-slate-600 text-[11px] font-ieee-mono">
      R_out = r_o2 || r_o4
    </text>

    {/* Load Capacitor CL */}
    <line x1="585" y1="128" x2="585" y2="175" stroke="#1E293B" strokeWidth="1.8" />
    <line x1="572" y1="175" x2="598" y2="175" stroke="#00629B" strokeWidth="2.5" />
    <line x1="572" y1="183" x2="598" y2="183" stroke="#00629B" strokeWidth="2.5" />
    <line x1="585" y1="183" x2="585" y2="215" stroke="#1E293B" strokeWidth="1.8" />
    <line x1="575" y1="215" x2="595" y2="215" stroke="#1E293B" strokeWidth="2" />
    <text x="605" y="184" className="fill-[#00629B] font-bold text-[12px] font-ieee-mono">
      C_L
    </text>

    {/* Differential Input Pair M1 & M2 */}
    <g
      onMouseEnter={() => onHoverNode('M1 (Non-Inverting Input NMOS): Sets GBW = gm1 / (2*pi*CL); typically biased in Moderate/Weak Inversion (gm/Id = 15–20 V^-1) for low noise and offset.')}
      onMouseLeave={() => onHoverNode(null)}
      className="cursor-pointer"
    >
      <line x1="222" y1="155" x2="222" y2="195" stroke="#059669" strokeWidth="2.2" />
      <line x1="230" y1="150" x2="230" y2="200" stroke="#059669" strokeWidth="2.5" />
      <line x1="230" y1="155" x2="250" y2="155" stroke="#1E293B" strokeWidth="2" />
      <line x1="230" y1="195" x2="250" y2="195" stroke="#1E293B" strokeWidth="2" />
      <line x1="160" y1="175" x2="222" y2="175" stroke="#059669" strokeWidth="2.2" />
      <circle cx="160" cy="175" r="4" fill="#059669" />
      <text x="150" y="179" textAnchor="end" className="fill-emerald-800 font-bold text-[12px] font-ieee-mono">
        V_inp (+)
      </text>
      <text x="262" y="180" className="fill-emerald-900 font-bold text-[12px] font-ieee-mono">
        M_1 (g_m1)
      </text>
    </g>

    <g
      onMouseEnter={() => onHoverNode('M2 (Inverting Input NMOS): Matched to M1 via common-centroid layout; output resistance ro2 in parallel with ro4.')}
      onMouseLeave={() => onHoverNode(null)}
      className="cursor-pointer"
    >
      <line x1="498" y1="155" x2="498" y2="195" stroke="#059669" strokeWidth="2.2" />
      <line x1="490" y1="150" x2="490" y2="200" stroke="#059669" strokeWidth="2.5" />
      <line x1="470" y1="155" x2="490" y2="155" stroke="#1E293B" strokeWidth="2" />
      <line x1="470" y1="195" x2="490" y2="195" stroke="#1E293B" strokeWidth="2" />
      <line x1="498" y1="175" x2="550" y2="175" stroke="#059669" strokeWidth="2.2" />
      <circle cx="550" cy="175" r="4" fill="#059669" />
      <text x="560" y="179" className="fill-emerald-800 font-bold text-[12px] font-ieee-mono">
        V_inn (-)
      </text>
      <text x="410" y="180" className="fill-emerald-900 font-bold text-[12px] font-ieee-mono">
        M_2 (g_m2)
      </text>
    </g>

    {/* Common Source Tail Node Vtail */}
    <line x1="250" y1="195" x2="250" y2="220" stroke="#1E293B" strokeWidth="2" />
    <line x1="470" y1="195" x2="470" y2="220" stroke="#1E293B" strokeWidth="2" />
    <line x1="250" y1="220" x2="470" y2="220" stroke="#0284C7" strokeWidth="2.2" />
    <circle cx="360" cy="220" r="4" fill="#0284C7" />
    <text x="372" y="213" className="fill-sky-800 font-bold text-[11px] font-ieee-mono">
      V_tail (Virtual AC GND)
    </text>

    {/* Tail Current Source M5 */}
    <line x1="360" y1="220" x2="360" y2="245" stroke="#0284C7" strokeWidth="2.2" />
    <g
      onMouseEnter={() => onHoverNode('M5 (Tail Current Source NMOS): Sets I_tail = 2*I_D1 and Slew Rate SR = I_tail / CL; high r_o5 improves Common-Mode Rejection Ratio (CMRR).')}
      onMouseLeave={() => onHoverNode(null)}
      className="cursor-pointer"
    >
      <line x1="332" y1="245" x2="332" y2="285" stroke="#0284C7" strokeWidth="2.2" />
      <line x1="340" y1="240" x2="340" y2="290" stroke="#0284C7" strokeWidth="2.5" />
      <line x1="340" y1="245" x2="360" y2="245" stroke="#1E293B" strokeWidth="2" />
      <line x1="340" y1="285" x2="360" y2="285" stroke="#1E293B" strokeWidth="2" />
      <line x1="265" y1="265" x2="332" y2="265" stroke="#0284C7" strokeWidth="2" />
      <circle cx="265" cy="265" r="3.5" fill="#0284C7" />
      <text x="255" y="269" textAnchor="end" className="fill-sky-800 font-bold text-[12px] font-ieee-mono">
        V_bias
      </text>
      <text x="375" y="270" className="fill-sky-900 font-bold text-[12px] font-ieee-mono">
        M_5 (I_tail, r_o5)
      </text>
    </g>

    {/* Ground */}
    <line x1="360" y1="285" x2="360" y2="308" stroke="#1E293B" strokeWidth="2" />
    <line x1="342" y1="308" x2="378" y2="308" stroke="#1E293B" strokeWidth="2.2" />
    <line x1="348" y1="315" x2="372" y2="315" stroke="#1E293B" strokeWidth="2.2" />
    <line x1="354" y1="322" x2="366" y2="322" stroke="#1E293B" strokeWidth="2.2" />
  </svg>
);

/* ============================================================================
 * 5. Two-Stage Miller-Compensated Op-Amp Schematic (IEEE Transistor-Level)
 * ============================================================================ */
const TwoStageOpAmpSchematic: React.FC<{
  isHighlighted: (m: HighlightMode) => boolean;
  onHoverNode: (info: string | null) => void;
}> = ({ isHighlighted, onHoverNode }) => (
  <svg viewBox="0 0 780 350" className="w-full max-w-4xl h-auto select-none">
    {/* Global VDD Rail */}
    <line x1="60" y1="26" x2="710" y2="26" stroke="#00629B" strokeWidth="3" />
    <circle cx="85" cy="26" r="3.5" fill="#00629B" />
    <circle cx="205" cy="26" r="3.5" fill="#00629B" />
    <circle cx="355" cy="26" r="3.5" fill="#00629B" />
    <circle cx="605" cy="26" r="3.5" fill="#00629B" />
    <text x="385" y="16" textAnchor="middle" className="fill-[#00629B] font-bold text-[12px] font-ieee-mono">
      V_DD Supply Rail (Bias Mirror M_8 + Stage 1 Diff-OTA M_1–M_5 + Stage 2 Common-Source M_6–M_7)
    </text>

    {/* ==================== BIAS REFERENCE BRANCH (I_BIAS + Diode NMOS M8) ==================== */}
    <g
      opacity={isHighlighted('dc_bias') ? 1 : 0.35}
      onMouseEnter={() =>
        onHoverNode(
          'Bias Reference (I_BIAS + Diode-Connected M_8): Generates V_bias to mirror tail current I_D5 (Stage 1) and active sink current I_D7 (Stage 2).'
        )
      }
      onMouseLeave={() => onHoverNode(null)}
      className="cursor-pointer"
    >
      {/* I_BIAS Current Source */}
      <line x1="85" y1="26" x2="85" y2="68" stroke="#0284C7" strokeWidth="2" />
      <circle cx="85" cy="86" r="18" fill="#F0F9FF" stroke="#0284C7" strokeWidth="2.2" />
      <line x1="85" y1="75" x2="85" y2="93" stroke="#0284C7" strokeWidth="2.2" />
      <polygon points="81,90 89,90 85,98" fill="#0284C7" />
      <text x="108" y="88" className="fill-sky-900 font-bold text-[11px] font-ieee-mono">
        I_BIAS
      </text>
      <line x1="85" y1="104" x2="85" y2="245" stroke="#0284C7" strokeWidth="2" />

      {/* Diode-Connected NMOS M8 (Gate facing right) */}
      <line x1="85" y1="245" x2="99" y2="245" stroke="#1E293B" strokeWidth="2" />
      <line x1="85" y1="285" x2="99" y2="285" stroke="#1E293B" strokeWidth="2" />
      <line x1="99" y1="240" x2="99" y2="290" stroke="#0284C7" strokeWidth="2.6" />
      <line x1="106" y1="245" x2="106" y2="285" stroke="#0284C7" strokeWidth="2.2" />
      <polygon points="91,281 85,285 91,289" fill="#0284C7" />
      {/* Diode Drain-to-Gate connection on M8 */}
      <line x1="85" y1="226" x2="124" y2="226" stroke="#0284C7" strokeWidth="2" />
      <line x1="124" y1="226" x2="124" y2="265" stroke="#0284C7" strokeWidth="2" />
      <circle cx="85" cy="226" r="3.5" fill="#0284C7" />
      <circle cx="124" cy="265" r="3.5" fill="#0284C7" />
      <text x="76" y="268" textAnchor="end" className="fill-sky-900 font-bold text-[11px] font-ieee-mono">
        M_8
      </text>
      {/* V_bias distribution bus from M8 gate to M5 gate */}
      <line x1="106" y1="265" x2="252" y2="265" stroke="#0284C7" strokeWidth="2.2" />
      <text x="178" y="257" textAnchor="middle" className="fill-sky-800 font-bold text-[11px] font-ieee-mono">
        V_bias
      </text>
    </g>

    {/* ==================== STAGE 1 PMOS ACTIVE LOAD MIRROR (M3, M4) ==================== */}
    <g
      opacity={isHighlighted('dc_bias') || isHighlighted('ac_signal') ? 1 : 0.35}
      onMouseEnter={() =>
        onHoverNode(
          'M_3 & M_4 (Stage 1 PMOS Current Mirror Load): M_3 is diode-connected (gate tied to drain); M_4 mirrors I_D1 to convert differential current into single-ended voltage at high-Z Node V_1.'
        )
      }
      onMouseLeave={() => onHoverNode(null)}
      className="cursor-pointer"
    >
      {/* M3 (Left PMOS, Gate facing right, Diode-Connected) */}
      <line x1="205" y1="26" x2="205" y2="62" stroke="#1E293B" strokeWidth="2" />
      <line x1="205" y1="62" x2="219" y2="62" stroke="#1E293B" strokeWidth="2" />
      <polygon points="211,58 219,62 211,66" fill="#0284C7" />
      <line x1="205" y1="98" x2="219" y2="98" stroke="#1E293B" strokeWidth="2" />
      <line x1="219" y1="57" x2="219" y2="103" stroke="#0284C7" strokeWidth="2.6" />
      <line x1="226" y1="62" x2="226" y2="98" stroke="#1E293B" strokeWidth="2.2" />
      <circle cx="230" cy="80" r="3.5" fill="white" stroke="#1E293B" strokeWidth="1.8" />
      <text x="195" y="83" textAnchor="end" className="fill-slate-900 font-bold text-[11.5px] font-ieee-mono">
        M_3
      </text>

      {/* M4 (Right PMOS, Gate facing left) */}
      <line x1="355" y1="26" x2="355" y2="62" stroke="#1E293B" strokeWidth="2" />
      <line x1="341" y1="62" x2="355" y2="62" stroke="#1E293B" strokeWidth="2" />
      <polygon points="349,58 341,62 349,66" fill="#059669" />
      <line x1="341" y1="98" x2="355" y2="98" stroke="#1E293B" strokeWidth="2" />
      <line x1="341" y1="57" x2="341" y2="103" stroke="#059669" strokeWidth="2.6" />
      <line x1="334" y1="62" x2="334" y2="98" stroke="#1E293B" strokeWidth="2.2" />
      <circle cx="330" cy="80" r="3.5" fill="white" stroke="#1E293B" strokeWidth="1.8" />
      <text x="365" y="83" className="fill-slate-900 font-bold text-[11.5px] font-ieee-mono">
        M_4
      </text>

      {/* Gate bus + Diode connection tying M3 Gate to M3 Drain */}
      <line x1="234" y1="80" x2="326" y2="80" stroke="#0284C7" strokeWidth="2" />
      <line x1="265" y1="80" x2="265" y2="122" stroke="#0284C7" strokeWidth="2" />
      <line x1="205" y1="122" x2="265" y2="122" stroke="#0284C7" strokeWidth="2" />
      <circle cx="265" cy="80" r="3.5" fill="#0284C7" />
      <circle cx="205" cy="122" r="3.5" fill="#0284C7" />
    </g>

    {/* Stage 1 Drain Vertical Columns */}
    <line x1="205" y1="98" x2="205" y2="155" stroke="#1E293B" strokeWidth="2" />
    <line x1="355" y1="98" x2="355" y2="155" stroke="#059669" strokeWidth="2.4" />

    {/* ==================== STAGE 1 NMOS DIFFERENTIAL PAIR (M1, M2) ==================== */}
    <g
      opacity={isHighlighted('ac_signal') ? 1 : 0.35}
      onMouseEnter={() =>
        onHoverNode(
          'M_1 (Inverting V_in-) & M_2 (Non-Inverting V_in+): Differential transconductance stage setting GBW = g_m1 / (2π · C_c) and Stage 1 gain A_v1 = g_m1 · (r_o2 || r_o4).'
        )
      }
      onMouseLeave={() => onHoverNode(null)}
      className="cursor-pointer"
    >
      {/* M1 (Inverting Input V_in-, Gate facing left) */}
      <line x1="177" y1="155" x2="177" y2="195" stroke="#059669" strokeWidth="2.2" />
      <line x1="184" y1="150" x2="184" y2="200" stroke="#059669" strokeWidth="2.8" />
      <line x1="184" y1="155" x2="205" y2="155" stroke="#1E293B" strokeWidth="2" />
      <line x1="184" y1="195" x2="205" y2="195" stroke="#1E293B" strokeWidth="2" />
      <polygon points="197,191 205,195 197,199" fill="#059669" />
      <line x1="138" y1="175" x2="177" y2="175" stroke="#059669" strokeWidth="2.2" />
      <circle cx="138" cy="175" r="4" fill="#FFFFFF" stroke="#059669" strokeWidth="2.2" />
      <text x="130" y="171" textAnchor="end" className="fill-emerald-800 font-bold text-[11.5px] font-ieee-mono">
        V_in- (-)
      </text>
      <text x="213" y="178" className="fill-emerald-950 font-bold text-[11.5px] font-ieee-mono">
        M_1 (g_m1)
      </text>

      {/* M2 (Non-Inverting Input V_in+, Gate facing right) */}
      <line x1="383" y1="155" x2="383" y2="195" stroke="#059669" strokeWidth="2.2" />
      <line x1="376" y1="150" x2="376" y2="200" stroke="#059669" strokeWidth="2.8" />
      <line x1="355" y1="155" x2="376" y2="155" stroke="#1E293B" strokeWidth="2" />
      <line x1="355" y1="195" x2="376" y2="195" stroke="#1E293B" strokeWidth="2" />
      <polygon points="363,191 355,195 363,199" fill="#059669" />
      <line x1="383" y1="175" x2="408" y2="175" stroke="#059669" strokeWidth="2.2" />
      <circle cx="408" cy="175" r="4" fill="#FFFFFF" stroke="#059669" strokeWidth="2.2" />
      <text x="415" y="179" className="fill-emerald-800 font-bold text-[11px] font-ieee-mono">
        V_in+ (+)
      </text>
      <text x="347" y="178" textAnchor="end" className="fill-emerald-950 font-bold text-[11.5px] font-ieee-mono">
        M_2 (g_m2)
      </text>
    </g>

    {/* ==================== STAGE 1 TAIL NODE & TAIL SINK M5 ==================== */}
    <line x1="205" y1="195" x2="205" y2="220" stroke="#1E293B" strokeWidth="2" />
    <line x1="355" y1="195" x2="355" y2="220" stroke="#1E293B" strokeWidth="2" />
    <line x1="205" y1="220" x2="355" y2="220" stroke="#0284C7" strokeWidth="2.2" />
    <circle cx="280" cy="220" r="3.8" fill="#0284C7" />
    <text x="290" y="214" className="fill-sky-800 font-bold text-[10.5px] font-ieee-mono">
      V_tail
    </text>
    <line x1="280" y1="220" x2="280" y2="245" stroke="#0284C7" strokeWidth="2.2" />

    <g
      opacity={isHighlighted('dc_bias') ? 1 : 0.35}
      onMouseEnter={() =>
        onHoverNode(
          'M_5 (Stage 1 Tail Current Sink NMOS): Sets I_tail and internal Slew Rate SR_1 = I_tail / C_c.'
        )
      }
      onMouseLeave={() => onHoverNode(null)}
      className="cursor-pointer"
    >
      <line x1="252" y1="245" x2="252" y2="285" stroke="#0284C7" strokeWidth="2.2" />
      <line x1="259" y1="240" x2="259" y2="290" stroke="#0284C7" strokeWidth="2.6" />
      <line x1="259" y1="245" x2="280" y2="245" stroke="#1E293B" strokeWidth="2" />
      <line x1="259" y1="285" x2="280" y2="285" stroke="#1E293B" strokeWidth="2" />
      <polygon points="272,281 280,285 272,289" fill="#0284C7" />
      <text x="290" y="270" className="fill-sky-950 font-bold text-[11.5px] font-ieee-mono">
        M_5 (I_tail)
      </text>
    </g>

    {/* ==================== INTERSTAGE NODE V_1 & STAGE 2 PMOS M6 ==================== */}
    {/* Node V_1 routing from Stage 1 output (M4/M2 drain at 355, 118) directly to Stage 2 M6 gate (570, 80) */}
    <circle cx="355" cy="118" r="4" fill="#059669" />
    <line x1="355" y1="118" x2="400" y2="118" stroke="#059669" strokeWidth="2.4" />
    <line x1="400" y1="118" x2="400" y2="80" stroke="#059669" strokeWidth="2.4" />
    <line x1="400" y1="80" x2="570" y2="80" stroke="#059669" strokeWidth="2.4" />
    <text x="485" y="70" textAnchor="middle" className="fill-emerald-800 font-bold text-[11.5px] font-ieee-mono">
      Node V_1 (Stage 1 Out / M_6 Gate)
    </text>

    {/* Stage 2 Common-Source PMOS M6 (at x=605, y=80) */}
    <g
      opacity={isHighlighted('ac_signal') ? 1 : 0.35}
      onMouseEnter={() =>
        onHoverNode(
          'M_6 (Stage 2 Common-Source PMOS): High g_m6 provides second-stage gain A_v2 = -g_m6 · (r_o6 || r_o7) and places non-dominant output pole f_p2 = g_m6 / (2π · C_L).'
        )
      }
      onMouseLeave={() => onHoverNode(null)}
      className="cursor-pointer"
    >
      <line x1="605" y1="26" x2="605" y2="62" stroke="#1E293B" strokeWidth="2" />
      <line x1="585" y1="62" x2="605" y2="62" stroke="#1E293B" strokeWidth="2" />
      <polygon points="593,58 585,62 593,66" fill="#059669" />
      <line x1="585" y1="98" x2="605" y2="98" stroke="#1E293B" strokeWidth="2" />
      <line x1="585" y1="57" x2="585" y2="103" stroke="#059669" strokeWidth="2.8" />
      <line x1="578" y1="62" x2="578" y2="98" stroke="#059669" strokeWidth="2.2" />
      <circle cx="574" cy="80" r="3.5" fill="white" stroke="#059669" strokeWidth="1.8" />
      <text x="615" y="78" className="fill-emerald-950 font-bold text-[11.5px] font-ieee-mono">
        M_6 (CS PMOS)
      </text>
      <text x="615" y="92" className="fill-emerald-800 text-[10px] font-ieee-mono">
        A_v2 = -g_m6(r_o6||r_o7)
      </text>
    </g>

    {/* ==================== MILLER COMPENSATION FEEDBACK NETWORK (C_c + R_z) ==================== */}
    <g
      opacity={isHighlighted('compensation') ? 1 : 0.35}
      onMouseEnter={() =>
        onHoverNode(
          'Miller Compensation Feedback Loop (C_c + R_z): Bridges across Stage 2 between M_6 Gate (Node V_1) and M_6 Drain (V_out). Splits poles via Miller multiplication and cancels RHP zero when R_z = (1/g_m6)·(1 + C_L/C_c).'
        )
      }
      onMouseLeave={() => onHoverNode(null)}
      className="cursor-pointer"
    >
      {/* Tap from M6 Gate Node V_1 at (440, 80) down to V_out feedback level y=145 */}
      <circle cx="440" cy="80" r="4" fill="#D97706" />
      <line x1="440" y1="80" x2="440" y2="145" stroke="#D97706" strokeWidth="2.3" />
      <line x1="440" y1="145" x2="478" y2="145" stroke="#D97706" strokeWidth="2.3" />

      {/* IEEE Parallel-Plate Miller Compensation Capacitor C_c */}
      <line x1="478" y1="129" x2="478" y2="161" stroke="#D97706" strokeWidth="3.2" />
      <line x1="488" y1="129" x2="488" y2="161" stroke="#D97706" strokeWidth="3.2" />
      <text x="483" y="121" textAnchor="middle" className="fill-amber-900 font-bold text-[11.5px] font-ieee-mono">
        C_c (Miller)
      </text>

      {/* Series connection from C_c to Nulling Resistor R_z */}
      <line x1="488" y1="145" x2="520" y2="145" stroke="#D97706" strokeWidth="2.3" />

      {/* IEEE Zig-Zag Nulling Resistor R_z */}
      <polyline
        points="520,145 525,136 533,154 541,136 549,154 557,136 565,154 570,145"
        fill="none"
        stroke="#D97706"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <text x="545" y="126" textAnchor="middle" className="fill-amber-900 font-bold text-[11.5px] font-ieee-mono">
        R_z (Nulling)
      </text>

      {/* Feedback termination directly onto Stage 2 V_out node (605, 145) */}
      <line x1="570" y1="145" x2="605" y2="145" stroke="#D97706" strokeWidth="2.3" />
    </g>

    {/* ==================== STAGE 2 OUTPUT COLUMN & CURRENT SINK M7 ==================== */}
    <line x1="605" y1="98" x2="605" y2="245" stroke="#059669" strokeWidth="2.4" />
    <line x1="605" y1="145" x2="720" y2="145" stroke="#059669" strokeWidth="2.6" />
    <circle cx="605" cy="145" r="4.2" fill="#059669" />
    <circle cx="685" cy="145" r="3.8" fill="#059669" />
    <circle cx="720" cy="145" r="4.2" fill="#FFFFFF" stroke="#059669" strokeWidth="2.4" />
    <text x="730" y="149" className="fill-emerald-900 font-bold text-[13px] font-ieee-mono">
      V_out
    </text>

    {/* Stage 2 NMOS Current Sink Load M7 */}
    <g
      opacity={isHighlighted('dc_bias') ? 1 : 0.35}
      onMouseEnter={() =>
        onHoverNode(
          'M_7 (Stage 2 Current Sink Load NMOS): Biased from V_bias; supplies DC current I_D7 to bias M_6 and sets external Slew Rate SR_2 = I_D7 / (C_L + C_c).'
        )
      }
      onMouseLeave={() => onHoverNode(null)}
      className="cursor-pointer"
    >
      <line x1="577" y1="245" x2="577" y2="285" stroke="#0284C7" strokeWidth="2.2" />
      <line x1="584" y1="240" x2="584" y2="290" stroke="#0284C7" strokeWidth="2.6" />
      <line x1="584" y1="245" x2="605" y2="245" stroke="#1E293B" strokeWidth="2" />
      <line x1="584" y1="285" x2="605" y2="285" stroke="#1E293B" strokeWidth="2" />
      <polygon points="597,281 605,285 597,289" fill="#0284C7" />
      <line x1="528" y1="265" x2="577" y2="265" stroke="#0284C7" strokeWidth="2.2" />
      <circle cx="528" cy="265" r="3.8" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2" />
      <text x="520" y="269" textAnchor="end" className="fill-sky-800 font-bold text-[11px] font-ieee-mono">
        V_bias
      </text>
      <text x="615" y="270" className="fill-sky-950 font-bold text-[11.5px] font-ieee-mono">
        M_7 (I_D7)
      </text>
    </g>

    {/* Load Capacitor C_L */}
    <line x1="685" y1="145" x2="685" y2="205" stroke="#1E293B" strokeWidth="2" />
    <line x1="671" y1="205" x2="699" y2="205" stroke="#00629B" strokeWidth="2.8" />
    <line x1="671" y1="214" x2="699" y2="214" stroke="#00629B" strokeWidth="2.8" />
    <line x1="685" y1="214" x2="685" y2="308" stroke="#1E293B" strokeWidth="2" />
    <text x="705" y="213" className="fill-[#00629B] font-bold text-[12px] font-ieee-mono">
      C_L
    </text>

    {/* Common Ground Rail */}
    <line x1="85" y1="285" x2="85" y2="308" stroke="#1E293B" strokeWidth="2" />
    <line x1="280" y1="285" x2="280" y2="308" stroke="#1E293B" strokeWidth="2" />
    <line x1="605" y1="285" x2="605" y2="308" stroke="#1E293B" strokeWidth="2" />
    <line x1="65" y1="308" x2="705" y2="308" stroke="#1E293B" strokeWidth="2.4" />
    <circle cx="280" cy="308" r="3.5" fill="#1E293B" />
    <circle cx="605" cy="308" r="3.5" fill="#1E293B" />
    {/* IEEE Ground Symbol */}
    <line x1="440" y1="308" x2="440" y2="318" stroke="#1E293B" strokeWidth="2.2" />
    <line x1="422" y1="318" x2="458" y2="318" stroke="#1E293B" strokeWidth="2.4" />
    <line x1="428" y1="325" x2="452" y2="325" stroke="#1E293B" strokeWidth="2.2" />
    <line x1="434" y1="332" x2="446" y2="332" stroke="#1E293B" strokeWidth="2" />
  </svg>
);

/* ============================================================================
 * 6. Low-Dropout Regulator (LDO) Schematic (IEEE Symbols)
 * ============================================================================ */
const LdoRegulatorSchematic: React.FC<{
  isHighlighted: (m: HighlightMode) => boolean;
  onHoverNode: (info: string | null) => void;
}> = ({ onHoverNode }) => (
  <svg viewBox="0 0 740 310" className="w-full max-w-3xl h-auto select-none">
    {/* Unregulated Input VIN */}
    <line x1="80" y1="32" x2="430" y2="32" stroke="#00629B" strokeWidth="3" />
    <circle cx="80" cy="32" r="4" fill="#00629B" />
    <text x="95" y="22" className="fill-[#00629B] font-bold text-[12px] font-ieee-mono">
      V_IN (Unregulated Supply)
    </text>

    {/* Error Amplifier Triangle */}
    <polygon
      points="170,85 170,165 265,125"
      fill="#F8FAFC"
      stroke="#00629B"
      strokeWidth="2.2"
      onMouseEnter={() =>
        onHoverNode(
          'Error Amplifier (EA): Compares V_fb against V_ref; high DC loop gain yields tight line/load regulation.'
        )
      }
      onMouseLeave={() => onHoverNode(null)}
    />
    <text x="180" y="108" className="fill-slate-900 font-bold text-[13px] font-ieee-mono">
      -
    </text>
    <text x="180" y="148" className="fill-slate-900 font-bold text-[13px] font-ieee-mono">
      +
    </text>
    <text x="206" y="129" textAnchor="middle" className="fill-[#00629B] font-bold text-[11px] font-ieee-sans">
      A_EA
    </text>

    {/* Vref Input */}
    <line x1="100" y1="105" x2="170" y2="105" stroke="#0284C7" strokeWidth="2" />
    <circle cx="100" cy="105" r="3.5" fill="#0284C7" />
    <text x="90" y="109" textAnchor="end" className="fill-sky-800 font-bold text-[12px] font-ieee-mono">
      V_REF (1.2V BGR)
    </text>

    {/* EA Output driving PMOS Pass Gate */}
    <line x1="265" y1="125" x2="365" y2="125" stroke="#059669" strokeWidth="2.2" />
    <line x1="365" y1="125" x2="365" y2="78" stroke="#059669" strokeWidth="2.2" />
    <line x1="365" y1="78" x2="399" y2="78" stroke="#059669" strokeWidth="2.2" />
    <text x="315" y="117" textAnchor="middle" className="fill-emerald-800 font-bold text-[11px] font-ieee-mono">
      V_gate (C_par)
    </text>

    {/* IEEE PMOS Pass Device M_PASS */}
    <g
      onMouseEnter={() =>
        onHoverNode(
          'PMOS Pass Transistor (M_PASS): Low dropout V_DO = I_load * R_on; large W creates large gate capacitance C_gs/C_gd.'
        )
      }
      onMouseLeave={() => onHoverNode(null)}
      className="cursor-pointer"
    >
      <line x1="430" y1="32" x2="430" y2="58" stroke="#1E293B" strokeWidth="2.2" />
      <line x1="412" y1="58" x2="430" y2="58" stroke="#1E293B" strokeWidth="2.2" />
      <polygon points="420,54 412,58 420,62" fill="#059669" />
      <line x1="412" y1="98" x2="430" y2="98" stroke="#1E293B" strokeWidth="2.2" />
      <line x1="412" y1="53" x2="412" y2="103" stroke="#059669" strokeWidth="3" />
      <line x1="405" y1="58" x2="405" y2="98" stroke="#059669" strokeWidth="2.4" />
      <circle cx="401" cy="78" r="3.5" fill="white" stroke="#059669" strokeWidth="1.8" />
      <text x="440" y="76" className="fill-emerald-950 font-bold text-[11.5px] font-ieee-mono">
        M_PASS (Power PMOS)
      </text>
      <text x="440" y="90" className="fill-emerald-800 text-[10px] font-ieee-mono">
        W/L = 2000μ/0.18μ
      </text>
    </g>

    {/* Regulated VOUT Rail */}
    <line x1="430" y1="98" x2="430" y2="125" stroke="#059669" strokeWidth="2.5" />
    <line x1="430" y1="125" x2="650" y2="125" stroke="#059669" strokeWidth="2.8" />
    <circle cx="430" cy="125" r="4" fill="#059669" />
    <circle cx="560" cy="125" r="4" fill="#059669" />
    <circle cx="650" cy="125" r="4" fill="#FFFFFF" stroke="#059669" strokeWidth="2.2" />
    <text x="660" y="129" className="fill-emerald-900 font-bold text-[13px] font-ieee-mono">
      V_OUT
    </text>

    {/* IEEE Zig-Zag Resistive Feedback Divider R_fb1, R_fb2 */}
    <line x1="430" y1="125" x2="430" y2="148" stroke="#D97706" strokeWidth="2" />
    <polyline
      points="430,148 422,153 438,160 422,167 438,174 422,181 430,186"
      fill="none"
      stroke="#D97706"
      strokeWidth="2.3"
      strokeLinejoin="round"
    />
    <text x="446" y="171" className="fill-amber-900 font-bold text-[11px] font-ieee-mono">
      R_fb1
    </text>
    <line x1="430" y1="186" x2="430" y2="215" stroke="#D97706" strokeWidth="2" />
    <circle cx="430" cy="200" r="3.5" fill="#D97706" />

    {/* Feedback return line to EA (+) */}
    <line x1="145" y1="200" x2="430" y2="200" stroke="#D97706" strokeWidth="2" />
    <line x1="145" y1="200" x2="145" y2="145" stroke="#D97706" strokeWidth="2" />
    <line x1="145" y1="145" x2="170" y2="145" stroke="#D97706" strokeWidth="2" />
    <text x="285" y="193" textAnchor="middle" className="fill-amber-800 font-bold text-[11px] font-ieee-mono">
      V_fb = β · V_OUT
    </text>

    <polyline
      points="430,215 422,220 438,227 422,234 438,241 422,248 430,253"
      fill="none"
      stroke="#D97706"
      strokeWidth="2.3"
      strokeLinejoin="round"
    />
    <text x="446" y="238" className="fill-amber-900 font-bold text-[11px] font-ieee-mono">
      R_fb2
    </text>
    <line x1="430" y1="253" x2="430" y2="275" stroke="#1E293B" strokeWidth="2" />

    {/* Output Capacitor Cout + IEEE Zig-Zag R_ESR */}
    <line x1="560" y1="125" x2="560" y2="160" stroke="#1E293B" strokeWidth="2" />
    <line x1="546" y1="160" x2="574" y2="160" stroke="#00629B" strokeWidth="2.8" />
    <line x1="546" y1="168" x2="574" y2="168" stroke="#00629B" strokeWidth="2.8" />
    <text x="582" y="168" className="fill-[#00629B] font-bold text-[11px] font-ieee-mono">
      C_out
    </text>
    <line x1="560" y1="168" x2="560" y2="195" stroke="#1E293B" strokeWidth="2" />
    <polyline
      points="560,195 552,200 568,207 552,214 568,221 552,228 560,233"
      fill="none"
      stroke="#1E293B"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <text x="576" y="218" className="fill-slate-800 font-bold text-[11px] font-ieee-mono">
      R_ESR (Zero f_z,esr)
    </text>
    <line x1="560" y1="233" x2="560" y2="275" stroke="#1E293B" strokeWidth="2" />

    {/* Ground Rail */}
    <line x1="400" y1="275" x2="600" y2="275" stroke="#1E293B" strokeWidth="2.4" />
    <line x1="495" y1="275" x2="495" y2="285" stroke="#1E293B" strokeWidth="2.2" />
    <line x1="479" y1="285" x2="511" y2="285" stroke="#1E293B" strokeWidth="2.4" />
    <line x1="485" y1="291" x2="505" y2="291" stroke="#1E293B" strokeWidth="2.2" />
    <line x1="491" y1="297" x2="499" y2="297" stroke="#1E293B" strokeWidth="2" />
  </svg>
);

/* ============================================================================
 * 7. Bandgap Reference (BGR) Schematic (IEEE Symbols)
 * ============================================================================ */
const BandgapReferenceSchematic: React.FC<{
  isHighlighted: (m: HighlightMode) => boolean;
  onHoverNode: (info: string | null) => void;
}> = ({ onHoverNode }) => (
  <svg viewBox="0 0 740 315" className="w-full max-w-3xl h-auto select-none">
    {/* VDD Rail */}
    <line x1="180" y1="25" x2="620" y2="25" stroke="#00629B" strokeWidth="3" />
    <text x="400" y="16" textAnchor="middle" className="fill-[#00629B] font-bold text-[12px] font-ieee-mono">
      V_DD Supply (Equal-Current PMOS Mirror M_P1–M_P3 + PTAT/CTAT BJT Core)
    </text>

    {/* IEEE PMOS Current Mirror M_P1, M_P2, M_P3 */}
    {[
      { x: 260, label: 'M_P1' },
      { x: 410, label: 'M_P2' },
      { x: 560, label: 'M_P3' },
    ].map((pm, idx) => (
      <g
        key={idx}
        onMouseEnter={() =>
          onHoverNode(
            `${pm.label} (PMOS Mirror Branch ${idx + 1}): Matched W/L enforces equal PTAT branch current I_PTAT = V_T·ln(N)/R_1.`
          )
        }
        onMouseLeave={() => onHoverNode(null)}
        className="cursor-pointer"
      >
        <line x1={pm.x} y1="25" x2={pm.x} y2="48" stroke="#1E293B" strokeWidth="2" />
        <line x1={pm.x - 14} y1="48" x2={pm.x} y2="48" stroke="#1E293B" strokeWidth="2" />
        <polygon points={`${pm.x - 6},44 ${pm.x - 14},48 ${pm.x - 6},52`} fill="#0284C7" />
        <line x1={pm.x - 14} y1="80" x2={pm.x} y2="80" stroke="#1E293B" strokeWidth="2" />
        <line x1={pm.x - 14} y1="43" x2={pm.x - 14} y2="85" stroke="#0284C7" strokeWidth="2.6" />
        <line x1={pm.x - 20} y1="48" x2={pm.x - 20} y2="80" stroke="#0284C7" strokeWidth="2.2" />
        <circle cx={pm.x - 24} cy="64" r="3.2" fill="white" stroke="#0284C7" strokeWidth="1.8" />
        <text x={pm.x + 8} y="68" className="fill-sky-950 font-bold text-[11px] font-ieee-mono">
          {pm.label}
        </text>
      </g>
    ))}

    {/* PMOS Gate Mirror Bus driven by Error Op-Amp */}
    <line x1="233" y1="64" x2="533" y2="64" stroke="#0284C7" strokeWidth="1.8" />
    <circle cx="383" cy="64" r="3" fill="#0284C7" />

    {/* Op-Amp Enforcing V_X = V_Y */}
    <polygon
      points="315,110 315,160 375,135"
      fill="#F8FAFC"
      stroke="#00629B"
      strokeWidth="2"
      onMouseEnter={() =>
        onHoverNode('Error Op-Amp: Forces virtual short V_X = V_Y so R_1 drops exactly ΔV_BE = V_T * ln(N).')
      }
      onMouseLeave={() => onHoverNode(null)}
    />
    <text x="323" y="127" className="fill-slate-900 font-bold text-[11px] font-ieee-mono">-</text>
    <text x="323" y="152" className="fill-slate-900 font-bold text-[11px] font-ieee-mono">+</text>
    <line x1="375" y1="135" x2="383" y2="135" stroke="#0284C7" strokeWidth="1.8" />
    <line x1="383" y1="135" x2="383" y2="64" stroke="#0284C7" strokeWidth="1.8" />

    {/* Branch 1 (Node X -> Q1 Area = 1) */}
    <line x1="260" y1="80" x2="260" y2="215" stroke="#1E293B" strokeWidth="2" />
    <circle cx="260" cy="123" r="3.5" fill="#059669" />
    <line x1="260" y1="123" x2="315" y2="123" stroke="#059669" strokeWidth="1.8" />
    <text x="248" y="125" textAnchor="end" className="fill-emerald-800 font-bold text-[11px] font-ieee-mono">
      V_X
    </text>

    {/* Branch 2 (Node Y -> IEEE Zig-Zag R1 -> Q2 Area = N) */}
    <line x1="410" y1="80" x2="410" y2="165" stroke="#1E293B" strokeWidth="2" />
    <circle cx="410" cy="148" r="3.5" fill="#059669" />
    <line x1="315" y1="148" x2="410" y2="148" stroke="#059669" strokeWidth="1.8" />
    <text x="422" y="151" className="fill-emerald-800 font-bold text-[11px] font-ieee-mono">
      V_Y = V_X
    </text>

    <polyline
      points="410,165 402,170 418,177 402,184 418,191 402,198 410,203"
      fill="none"
      stroke="#059669"
      strokeWidth="2.3"
      strokeLinejoin="round"
    />
    <text x="426" y="188" className="fill-emerald-900 font-bold text-[11px] font-ieee-mono">
      R_1 (ΔV_BE / R_1)
    </text>
    <line x1="410" y1="203" x2="410" y2="215" stroke="#1E293B" strokeWidth="2" />

    {/* Branch 3 Output Vref = V_BE3 + (R2/R1)*V_T*ln(N) */}
    <line x1="560" y1="80" x2="560" y2="155" stroke="#059669" strokeWidth="2.2" />
    <line x1="560" y1="115" x2="645" y2="115" stroke="#059669" strokeWidth="2.5" />
    <circle cx="560" cy="115" r="4" fill="#059669" />
    <circle cx="645" cy="115" r="4" fill="#FFFFFF" stroke="#059669" strokeWidth="2.2" />
    <text x="655" y="119" className="fill-emerald-900 font-bold text-[12.5px] font-ieee-mono">
      V_REF ≈ 1.205 V
    </text>

    <polyline
      points="560,155 552,161 568,169 552,177 568,185 552,193 560,199"
      fill="none"
      stroke="#059669"
      strokeWidth="2.3"
      strokeLinejoin="round"
    />
    <text x="576" y="180" className="fill-emerald-900 font-bold text-[11px] font-ieee-mono">
      R_2 (PTAT Gain)
    </text>
    <line x1="560" y1="199" x2="560" y2="215" stroke="#1E293B" strokeWidth="2" />

    {/* IEEE BJT Symbols Q1, Q2, Q3 */}
    {[
      { x: 260, label: 'Q_1 (1x)', sub: 'V_BE1' },
      { x: 410, label: 'Q_2 (N=8)', sub: 'V_BE2' },
      { x: 560, label: 'Q_3 (1x)', sub: '+V_BE3' },
    ].map((bjt, idx) => (
      <g key={idx}>
        <circle cx={bjt.x} cy="238" r="20" fill="#F8FAFC" stroke="#1E293B" strokeWidth="1.8" />
        <line x1={bjt.x - 24} y1="238" x2={bjt.x - 7} y2="238" stroke="#1E293B" strokeWidth="2" />
        <line x1={bjt.x - 24} y1="238" x2={bjt.x - 24} y2="282" stroke="#1E293B" strokeWidth="1.8" />
        <line x1={bjt.x - 7} y1="226" x2={bjt.x - 7} y2="250" stroke="#00629B" strokeWidth="2.8" />
        <line x1={bjt.x - 7} y1="232" x2={bjt.x} y2="222" stroke="#1E293B" strokeWidth="2" />
        <line x1={bjt.x} y1="222" x2={bjt.x} y2="215" stroke="#1E293B" strokeWidth="2" />
        <line x1={bjt.x - 7} y1="244" x2={bjt.x} y2="254" stroke="#1E293B" strokeWidth="2" />
        <line x1={bjt.x} y1="254" x2={bjt.x} y2="282" stroke="#1E293B" strokeWidth="2" />
        <text x={bjt.x + 24} y="236" className="fill-slate-900 font-bold text-[11px] font-ieee-mono">
          {bjt.label}
        </text>
        <text x={bjt.x + 24} y="249" className="fill-slate-600 text-[9.5px] font-ieee-mono">
          {bjt.sub}
        </text>
      </g>
    ))}

    {/* Ground Rail */}
    <line x1="220" y1="282" x2="600" y2="282" stroke="#1E293B" strokeWidth="2.4" />
  </svg>
);

/* ============================================================================
 * 8. Open-Loop AC & Closed-Loop Stability Verification Testbench (IEEE Symbols)
 * ============================================================================ */
const VerificationTestbenchSchematic: React.FC<{
  isHighlighted: (m: HighlightMode) => boolean;
  onHoverNode: (info: string | null) => void;
}> = ({ onHoverNode }) => (
  <svg viewBox="0 0 740 240" className="w-full max-w-3xl h-auto select-none">
    <text x="370" y="22" textAnchor="middle" className="fill-[#00629B] font-bold text-[13px] font-ieee-sans">
      DC-Closed / AC-Open Loop Stability & Gain Testbench (L_loop = 1 GH, C_couple = 1 GF)
    </text>

    {/* Op-Amp Symbol */}
    <polygon
      points="270,70 270,170 390,120"
      fill="#F8FAFC"
      stroke="#00629B"
      strokeWidth="2.2"
      onMouseEnter={() =>
        onHoverNode(
          'Device Under Test (DUT): Biased in closed-loop at DC via L_loop so high-gain output does not saturate against rails.'
        )
      }
      onMouseLeave={() => onHoverNode(null)}
    />
    <text x="282" y="101" className="fill-slate-900 font-bold text-[14px] font-ieee-mono">-</text>
    <text x="282" y="147" className="fill-slate-900 font-bold text-[14px] font-ieee-mono">+</text>
    <text x="315" y="124" className="fill-[#00629B] font-bold text-[12px] font-ieee-mono">DUT</text>

    {/* Non-Inverting VCM */}
    <line x1="175" y1="143" x2="270" y2="143" stroke="#0284C7" strokeWidth="2" />
    <circle cx="175" cy="143" r="3.5" fill="#0284C7" />
    <text x="165" y="147" textAnchor="end" className="fill-sky-900 font-bold text-[12px] font-ieee-mono">
      V_CM (0.9V DC)
    </text>

    {/* Output Node & CL */}
    <line x1="390" y1="120" x2="560" y2="120" stroke="#059669" strokeWidth="2.5" />
    <circle cx="485" cy="120" r="4" fill="#059669" />
    <circle cx="530" cy="120" r="3.8" fill="#059669" />
    <circle cx="560" cy="120" r="4" fill="#FFFFFF" stroke="#059669" strokeWidth="2.2" />
    <text x="570" y="124" className="fill-emerald-900 font-bold text-[13px] font-ieee-mono">
      V_out
    </text>

    {/* IEEE Coiled DC Feedback Inductor L_loop = 1 GH */}
    <line x1="485" y1="120" x2="485" y2="52" stroke="#D97706" strokeWidth="2.2" />
    <line x1="485" y1="52" x2="395" y2="52" stroke="#D97706" strokeWidth="2.2" />
    <path
      d="M 325,52 C 325,38 342,38 342,52 C 342,38 359,38 359,52 C 359,38 376,38 376,52 C 376,38 395,38 395,52"
      fill="none"
      stroke="#D97706"
      strokeWidth="2.4"
      onMouseEnter={() =>
        onHoverNode(
          'L_loop = 1 GH (DC Short, AC Open): Establishes exact DC unity-gain bias point while breaking feedback loop for AC sweep.'
        )
      }
      onMouseLeave={() => onHoverNode(null)}
      className="cursor-pointer"
    />
    <text x="360" y="36" textAnchor="middle" className="fill-amber-900 font-bold text-[11px] font-ieee-mono">
      L_loop = 1 GH (DC Short / AC Open)
    </text>
    <line x1="220" y1="52" x2="325" y2="52" stroke="#D97706" strokeWidth="2.2" />
    <line x1="220" y1="52" x2="220" y2="97" stroke="#D97706" strokeWidth="2.2" />
    <line x1="220" y1="97" x2="270" y2="97" stroke="#D97706" strokeWidth="2.2" />
    <circle cx="220" cy="97" r="3.8" fill="#D97706" />

    {/* IEEE Parallel-Plate AC Coupling Capacitor C_couple = 1 GF */}
    <line x1="125" y1="97" x2="168" y2="97" stroke="#059669" strokeWidth="2.2" />
    <line x1="168" y1="83" x2="168" y2="111" stroke="#059669" strokeWidth="3.2" />
    <line x1="178" y1="83" x2="178" y2="111" stroke="#059669" strokeWidth="3.2" />
    <line x1="178" y1="97" x2="220" y2="97" stroke="#059669" strokeWidth="2.2" />
    <text x="173" y="76" textAnchor="middle" className="fill-emerald-900 font-bold text-[11px] font-ieee-mono">
      C_couple = 1 GF
    </text>
    <circle cx="125" cy="97" r="4" fill="#FFFFFF" stroke="#059669" strokeWidth="2.2" />
    <text x="115" y="101" textAnchor="end" className="fill-emerald-800 font-bold text-[12px] font-ieee-mono">
      V_ac (AC=1)
    </text>

    {/* Load Capacitor CL */}
    <line x1="530" y1="120" x2="530" y2="158" stroke="#1E293B" strokeWidth="1.8" />
    <line x1="516" y1="158" x2="544" y2="158" stroke="#00629B" strokeWidth="2.8" />
    <line x1="516" y1="166" x2="544" y2="166" stroke="#00629B" strokeWidth="2.8" />
    <line x1="530" y1="166" x2="530" y2="198" stroke="#1E293B" strokeWidth="1.8" />
    <line x1="518" y1="198" x2="542" y2="198" stroke="#1E293B" strokeWidth="2.2" />
    <text x="552" y="167" className="fill-[#00629B] font-bold text-[12px] font-ieee-mono">
      C_L
    </text>
  </svg>
);

/* ============================================================================
 * 9. Common-Centroid ABBA Layout & Guard/Dummy Ring Diagram
 * ============================================================================ */
const CommonCentroidLayoutDiagram: React.FC<{
  isHighlighted: (m: HighlightMode) => boolean;
  onHoverNode: (info: string | null) => void;
}> = ({ onHoverNode }) => (
  <svg viewBox="0 0 740 265" className="w-full max-w-3xl h-auto select-none">
    <text x="210" y="22" textAnchor="middle" className="fill-[#00629B] font-bold text-[13px] font-ieee-sans">
      (a) 2D Common-Centroid Array (A B B A / B A A B) + Dummy Ring
    </text>

    {/* Outer Guard Ring */}
    <rect
      x="30"
      y="35"
      width="355"
      height="205"
      fill="#F8FAFC"
      stroke="#64748B"
      strokeWidth="2"
      strokeDasharray="6 3"
      onMouseEnter={() => onHoverNode('Substrate Tap Guard Ring: Surround matched differential pair to absorb minority carriers and equalize local substrate potential.')}
      onMouseLeave={() => onHoverNode(null)}
    />

    {/* Dummy Cells on Left & Right */}
    <rect x="48" y="55" width="38" height="165" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
    <text x="67" y="142" textAnchor="middle" transform="rotate(-90 67 142)" className="fill-slate-700 font-bold text-[11px] font-ieee-mono">
      DUMMY (D)
    </text>

    <rect x="330" y="55" width="38" height="165" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
    <text x="349" y="142" textAnchor="middle" transform="rotate(-90 349 142)" className="fill-slate-700 font-bold text-[11px] font-ieee-mono">
      DUMMY (D)
    </text>

    {/* Top Row: A1 B1 B2 A2 */}
    {[
      { label: 'M1_A1', x: 96, color: '#BAE6FD', border: '#0284C7' },
      { label: 'M2_B1', x: 154, color: '#A7F3D0', border: '#059669' },
      { label: 'M2_B2', x: 212, color: '#A7F3D0', border: '#059669' },
      { label: 'M1_A2', x: 270, color: '#BAE6FD', border: '#0284C7' },
    ].map((cell, i) => (
      <g
        key={`top-${i}`}
        onMouseEnter={() => onHoverNode(`Unit Finger ${cell.label}: Center of mass for M1 (A) and M2 (B) coincide at (X_c, Y_c), canceling linear X and Y oxide/doping gradients.`)}
        onMouseLeave={() => onHoverNode(null)}
        className="cursor-pointer"
      >
        <rect x={cell.x} y="55" width="50" height="75" fill={cell.color} stroke={cell.border} strokeWidth="2" />
        <text x={cell.x + 25} y="97" textAnchor="middle" className="fill-slate-900 font-bold text-[11px] font-ieee-mono">
          {cell.label}
        </text>
      </g>
    ))}

    {/* Bottom Row: B3 A3 A4 B4 */}
    {[
      { label: 'M2_B3', x: 96, color: '#A7F3D0', border: '#059669' },
      { label: 'M1_A3', x: 154, color: '#BAE6FD', border: '#0284C7' },
      { label: 'M1_A4', x: 212, color: '#BAE6FD', border: '#0284C7' },
      { label: 'M2_B4', x: 270, color: '#A7F3D0', border: '#059669' },
    ].map((cell, i) => (
      <g
        key={`bot-${i}`}
        onMouseEnter={() => onHoverNode(`Unit Finger ${cell.label}: Cross-coupled in Metal-1/Metal-2 so both transistors share identical center of gravity.`)}
        onMouseLeave={() => onHoverNode(null)}
        className="cursor-pointer"
      >
        <rect x={cell.x} y="145" width="50" height="75" fill={cell.color} stroke={cell.border} strokeWidth="2" />
        <text x={cell.x + 25} y="187" textAnchor="middle" className="fill-slate-900 font-bold text-[11px] font-ieee-mono">
          {cell.label}
        </text>
      </g>
    ))}

    {/* Center of Gravity Crosshair */}
    <circle cx="208" cy="137.5" r="6" fill="#DC2626" />
    <text x="208" y="254" textAnchor="middle" className="fill-red-700 font-bold text-[11px] font-ieee-sans">
      ● Shared Centroid (X_c, Y_c) for M1 and M2
    </text>

    {/* Right Panel: PVT Corner Space (NMOS vs PMOS Speed) */}
    <text x="570" y="22" textAnchor="middle" className="fill-[#00629B] font-bold text-[13px] font-ieee-sans">
      (b) 5-Corner Process Space (TT, FF, SS, FS, SF)
    </text>
    <rect x="445" y="45" width="250" height="190" fill="#F8FAFC" stroke="#334155" strokeWidth="1.5" />
    <line x1="445" y1="140" x2="695" y2="140" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="4 4" />
    <line x1="570" y1="45" x2="570" y2="235" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="4 4" />

    <polygon points="480,205 660,205 660,75 480,75" fill="#00629B" fillOpacity="0.08" stroke="#00629B" strokeWidth="1.8" />
    <circle cx="570" cy="140" r="5" fill="#00629B" />
    <text x="580" y="136" className="fill-[#00629B] font-bold text-[12px] font-ieee-mono">TT (Nominal)</text>

    <circle cx="660" cy="75" r="5" fill="#059669" />
    <text x="650" y="67" textAnchor="end" className="fill-emerald-800 font-bold text-[11px] font-ieee-mono">FF (Fast N, Fast P)</text>

    <circle cx="480" cy="205" r="5" fill="#DC2626" />
    <text x="490" y="222" className="fill-red-800 font-bold text-[11px] font-ieee-mono">SS (Slow N, Slow P)</text>

    <circle cx="660" cy="205" r="5" fill="#D97706" />
    <text x="652" y="222" textAnchor="end" className="fill-amber-800 font-bold text-[11px] font-ieee-mono">FS (Fast N, Slow P)</text>

    <circle cx="480" cy="75" r="5" fill="#D97706" />
    <text x="488" y="67" className="fill-amber-800 font-bold text-[11px] font-ieee-mono">SF (Slow N, Fast P)</text>

    <text x="570" y="254" textAnchor="middle" className="fill-slate-700 font-bold text-[11px] font-ieee-sans">
      NMOS Mobility / Speed → (Vertical: PMOS Speed)
    </text>
  </svg>
);

/* ============================================================================
 * Component Symbol Legend Page / Section
 * ============================================================================ */
export const SymbolLegendView: React.FC = () => {
  const symbols = [
    {
      name: '4-Terminal NMOS Transistor',
      spice: 'M1 drain gate source bulk NMOS W=10u L=0.18u',
      terminals: 'D (Drain), G (Gate), S (Source), B (Bulk/Body)',
      physics:
        'Conducts electrons when V_GS > V_thn. Current flows D -> S; Bulk B is tied to GND (or source in isolated triple-well processes) to prevent forward-biasing body diodes.',
      svg: (
        <svg viewBox="0 0 140 110" className="w-32 h-24">
          <line x1="20" y1="55" x2="52" y2="55" stroke="#1E293B" strokeWidth="2" />
          <line x1="52" y1="30" x2="52" y2="80" stroke="#1E293B" strokeWidth="2.5" />
          <line x1="60" y1="25" x2="60" y2="85" stroke="#00629B" strokeWidth="2.8" />
          <line x1="60" y1="32" x2="90" y2="32" stroke="#1E293B" strokeWidth="2" />
          <line x1="90" y1="32" x2="90" y2="12" stroke="#1E293B" strokeWidth="2" />
          <line x1="60" y1="78" x2="90" y2="78" stroke="#1E293B" strokeWidth="2" />
          <line x1="90" y1="78" x2="90" y2="98" stroke="#1E293B" strokeWidth="2" />
          <line x1="60" y1="55" x2="110" y2="55" stroke="#64748B" strokeWidth="1.8" />
          <polygon points="78,74 88,78 78,82" fill="#00629B" />
          <text x="12" y="59" className="text-[11px] font-ieee-mono font-bold fill-slate-900">G</text>
          <text x="96" y="20" className="text-[11px] font-ieee-mono font-bold fill-slate-900">D</text>
          <text x="96" y="96" className="text-[11px] font-ieee-mono font-bold fill-slate-900">S</text>
          <text x="115" y="59" className="text-[11px] font-ieee-mono font-bold fill-slate-600">B</text>
        </svg>
      ),
    },
    {
      name: '4-Terminal PMOS Transistor',
      spice: 'M2 drain gate source bulk PMOS W=25u L=0.18u',
      terminals: 'S (Source at top/higher V), G (Gate), D (Drain), B (N-Well Body)',
      physics:
        'Conducts holes when V_SG > |V_thp| (gate pulled low relative to source). Source is connected toward VDD; N-Well body B is tied to VDD (or source to eliminate body effect).',
      svg: (
        <svg viewBox="0 0 140 110" className="w-32 h-24">
          <line x1="20" y1="55" x2="44" y2="55" stroke="#1E293B" strokeWidth="2" />
          <circle cx="48" cy="55" r="4" fill="white" stroke="#1E293B" strokeWidth="2" />
          <line x1="52" y1="30" x2="52" y2="80" stroke="#1E293B" strokeWidth="2.5" />
          <line x1="60" y1="25" x2="60" y2="85" stroke="#00629B" strokeWidth="2.8" />
          <line x1="60" y1="32" x2="90" y2="32" stroke="#1E293B" strokeWidth="2" />
          <line x1="90" y1="32" x2="90" y2="12" stroke="#1E293B" strokeWidth="2" />
          <line x1="60" y1="78" x2="90" y2="78" stroke="#1E293B" strokeWidth="2" />
          <line x1="90" y1="78" x2="90" y2="98" stroke="#1E293B" strokeWidth="2" />
          <line x1="60" y1="55" x2="110" y2="55" stroke="#64748B" strokeWidth="1.8" />
          <polygon points="72,28 62,32 72,36" fill="#00629B" />
          <text x="12" y="59" className="text-[11px] font-ieee-mono font-bold fill-slate-900">G</text>
          <text x="96" y="20" className="text-[11px] font-ieee-mono font-bold fill-slate-900">S</text>
          <text x="96" y="96" className="text-[11px] font-ieee-mono font-bold fill-slate-900">D</text>
          <text x="115" y="59" className="text-[11px] font-ieee-mono font-bold fill-slate-600">B</text>
        </svg>
      ),
    },
    {
      name: 'Bipolar Junction Transistor (BJT — NPN / Substrate PNP)',
      spice: 'Q1 collector base emitter PNP_BJT AREA=8',
      terminals: 'C (Collector), B (Base), E (Emitter)',
      physics:
        'Exponential collector current I_C = I_S * exp(V_BE / V_T). Used in Bandgap References (BGR) to generate CTAT V_BE (~ -1.8 mV/K) and PTAT ΔV_BE = V_T * ln(N).',
      svg: (
        <svg viewBox="0 0 140 110" className="w-32 h-24">
          <circle cx="72" cy="55" r="28" fill="#F8FAFC" stroke="#1E293B" strokeWidth="1.8" />
          <line x1="20" y1="55" x2="58" y2="55" stroke="#1E293B" strokeWidth="2" />
          <line x1="58" y1="35" x2="58" y2="75" stroke="#00629B" strokeWidth="3" />
          <line x1="58" y1="45" x2="88" y2="25" stroke="#1E293B" strokeWidth="2" />
          <line x1="88" y1="25" x2="88" y2="10" stroke="#1E293B" strokeWidth="2" />
          <line x1="58" y1="65" x2="88" y2="85" stroke="#1E293B" strokeWidth="2" />
          <line x1="88" y1="85" x2="88" y2="100" stroke="#1E293B" strokeWidth="2" />
          <polygon points="78,83 87,85 83,76" fill="#00629B" />
          <text x="12" y="59" className="text-[11px] font-ieee-mono font-bold fill-slate-900">B</text>
          <text x="95" y="20" className="text-[11px] font-ieee-mono font-bold fill-slate-900">C</text>
          <text x="95" y="96" className="text-[11px] font-ieee-mono font-bold fill-slate-900">E</text>
        </svg>
      ),
    },
    {
      name: 'Integrated Poly / Diffusion Resistor (R)',
      spice: 'R1 node_p node_n 12.5k',
      terminals: '2 Symmetric Terminals (Plus substratitic parasitic capacitance in layout)',
      physics:
        'Follows Ohm’s Law V = I*R; produces white Johnson-Nyquist thermal noise v_n^2 = 4*k*T*R*Δf. Ratio matching (R2/R1) is accurate to <0.1%, whereas absolute sheet resistance varies ±20% across PVT.',
      svg: (
        <svg viewBox="0 0 140 110" className="w-32 h-24">
          <line x1="15" y1="55" x2="40" y2="55" stroke="#1E293B" strokeWidth="2" />
          <polyline
            points="40,55 46,40 56,70 66,40 76,70 86,40 94,70 100,55"
            fill="none"
            stroke="#00629B"
            strokeWidth="2.5"
          />
          <line x1="100" y1="55" x2="125" y2="55" stroke="#1E293B" strokeWidth="2" />
          <text x="70" y="28" textAnchor="middle" className="text-[12px] font-ieee-mono font-bold fill-slate-900">R = R_□(L/W)</text>
        </svg>
      ),
    },
    {
      name: 'MIM / MOM Capacitor (C)',
      spice: 'CC n_stg1 vout 2.2p',
      terminals: 'Top Plate (Lower parasitic cap to substrate) & Bottom Plate (Shielded)',
      physics:
        'Impedance Z_C = 1 / (s*C); current I = C * (dV/dt). In Miller compensation, connect bottom plate toward low-impedance output node (V_out) so bottom-plate substrate parasitics load C_L rather than high-Z node V_1.',
      svg: (
        <svg viewBox="0 0 140 110" className="w-32 h-24">
          <line x1="70" y1="15" x2="70" y2="48" stroke="#1E293B" strokeWidth="2" />
          <line x1="42" y1="48" x2="98" y2="48" stroke="#00629B" strokeWidth="3.2" />
          <line x1="42" y1="60" x2="98" y2="60" stroke="#00629B" strokeWidth="3.2" />
          <line x1="70" y1="60" x2="70" y2="95" stroke="#1E293B" strokeWidth="2" />
          <text x="104" y="46" className="text-[10px] font-ieee-mono fill-slate-600">Top</text>
          <text x="104" y="68" className="text-[10px] font-ieee-mono fill-slate-600">Bot</text>
        </svg>
      ),
    },
    {
      name: 'Independent DC Bias Current Source (I_BIAS)',
      spice: 'IBIAS vdd vbias DC 20u',
      terminals: 'Positive Node (Current enters) -> Negative Node (Current exits)',
      physics:
        'Ideal constant current source (R_out = ∞) used to feed a diode-connected reference MOSFET in testbenches. In silicon, replaced by a Bandgap-derived PTAT or constant-g_m reference circuit.',
      svg: (
        <svg viewBox="0 0 140 110" className="w-32 h-24">
          <line x1="70" y1="12" x2="70" y2="33" stroke="#1E293B" strokeWidth="2" />
          <circle cx="70" cy="55" r="22" fill="#E0F2FE" stroke="#0284C7" strokeWidth="2.2" />
          <line x1="70" y1="42" x2="70" y2="66" stroke="#0284C7" strokeWidth="2.5" />
          <polygon points="65,61 75,61 70,71" fill="#0284C7" />
          <line x1="70" y1="77" x2="70" y2="98" stroke="#1E293B" strokeWidth="2" />
          <text x="100" y="59" className="text-[11px] font-ieee-mono font-bold fill-sky-900">I_BIAS</text>
        </svg>
      ),
    },
    {
      name: 'Supply Rail (V_DD) & Reference Ground (GND / Node 0)',
      spice: 'VDD vdd 0 DC 1.8',
      terminals: 'Global Supply vdd & SPICE Reference Node 0',
      physics:
        'Every SPICE circuit MUST have a DC path to Node 0 (GND) from every node so the nodal conductance matrix is non-singular.',
      svg: (
        <svg viewBox="0 0 140 110" className="w-32 h-24">
          <line x1="20" y1="28" x2="60" y2="28" stroke="#00629B" strokeWidth="3" />
          <line x1="40" y1="28" x2="40" y2="60" stroke="#1E293B" strokeWidth="2" />
          <text x="40" y="20" textAnchor="middle" className="text-[11px] font-ieee-mono font-bold fill-[#00629B]">V_DD</text>

          <line x1="95" y1="35" x2="95" y2="65" stroke="#1E293B" strokeWidth="2" />
          <line x1="77" y1="65" x2="113" y2="65" stroke="#1E293B" strokeWidth="2.5" />
          <line x1="83" y1="73" x2="107" y2="73" stroke="#1E293B" strokeWidth="2.5" />
          <line x1="90" y1="81" x2="100" y2="81" stroke="#1E293B" strokeWidth="2.5" />
          <text x="95" y="96" textAnchor="middle" className="text-[11px] font-ieee-mono font-bold fill-slate-800">GND (0)</text>
        </svg>
      ),
    },
  ];

  return (
    <div className="my-6 border border-slate-300 bg-white p-6">
      <div className="border-b border-slate-200 pb-3 mb-5">
        <h3 className="text-lg font-bold text-[#00629B]">
          Circuit Schematic Symbol Legend & SPICE Terminal Convention
        </h3>
        <p className="text-xs md:text-sm font-ieee-sans text-slate-600 mt-1">
          Standardized 4-terminal MOSFET, BJT, and passive element notation used across all Analog Circuit Design schematics and netlists.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {symbols.map((sym, i) => (
          <div key={i} className="border border-slate-200 p-4 flex flex-col sm:flex-row items-center sm:items-start gap-4 bg-[#F8FAFC]">
            <div className="bg-white border border-slate-200 p-2 shrink-0 flex items-center justify-center">
              {sym.svg}
            </div>
            <div className="flex-1 text-xs space-y-1.5">
              <div className="font-bold text-sm text-slate-900 font-ieee-serif">{sym.name}</div>
              <div className="font-ieee-mono text-[11px] bg-white border border-slate-300 text-[#00629B] font-semibold px-2 py-1 overflow-x-auto">
                {sym.spice}
              </div>
              <div className="font-ieee-sans text-slate-700">
                <strong className="text-slate-900">Terminals: </strong>
                {sym.terminals}
              </div>
              <p className="text-slate-600 leading-relaxed">{sym.physics}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
