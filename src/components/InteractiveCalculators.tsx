import React, { useState, useEffect } from 'react';
import {
  ProcessNodeId,
  PROCESS_NODES,
  evaluateGmIdPoint,
  generateGmIdCurve,
  calculate5TOtaSizing,
  calculateTwoStageSizing,
  Ota5TSpecInput,
  TwoStageSpecInput,
} from '../utils/analogPhysics';
import { SpiceNetlistBox, InlineMath } from './Math';
import { Sliders, Activity, Cpu } from 'lucide-react';

interface NodeProps {
  processNode: ProcessNodeId;
  onChangeProcessNode: (node: ProcessNodeId) => void;
  onGmIdChange?: (targetGmId: number, lengthUm: number) => void;
  onOtaSpecChange?: (spec: Ota5TSpecInput) => void;
  onTwoStageSpecChange?: (spec: TwoStageSpecInput) => void;
}

export const ProcessNodeToggle: React.FC<NodeProps> = ({ processNode, onChangeProcessNode }) => (
  <div className="flex items-center gap-2 bg-slate-100 border border-slate-300 p-1 text-xs font-ieee-sans text-slate-900">
    <span className="px-2 font-semibold text-slate-800">PDK Process:</span>
    {(['180nm', '65nm'] as ProcessNodeId[]).map((id) => (
      <button
        key={id}
        type="button"
        onClick={() => onChangeProcessNode(id)}
        className={`px-2.5 py-1 font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
          processNode === id
            ? 'bg-[#00629B] text-white'
            : 'bg-white text-slate-800 hover:bg-slate-200/70'
        }`}
      >
        {id === '180nm' ? '180nm (1.8V)' : '65nm (1.2V)'}
      </button>
    ))}
  </div>
);

/* ============================================================================
 * 1. Interactive Transistor Operating-Region (Vgs / Vds) Explorer
 * ============================================================================ */
export const OperatingRegionExplorer: React.FC<NodeProps> = ({
  processNode,
  onChangeProcessNode,
}) => {
  const proc = PROCESS_NODES[processNode];
  const [vgs, setVgs] = useState<number>(0.72);
  const [vds, setVds] = useState<number>(0.9);
  const [widthUm, setWidthUm] = useState<number>(10);
  const [lengthUm, setLengthUm] = useState<number>(proc.lMin * 2);

  const vth = proc.vthN;
  const vov = Math.max(0.02, vgs - vth);
  const vdsSat = Math.max(0.06, vgs - vth);

  // Continuous drain current model (uA)
  const kPrime = proc.uCoxN * (widthUm / lengthUm);
  let idUa = 0;
  let regionLabel = 'Saturation (Active Amplifier Region)';
  let regionStatus: 'nominal' | 'warning' | 'subthreshold' = 'nominal';

  if (vgs < vth - 0.08) {
    idUa = 0.005 * (widthUm / lengthUm) * Math.exp((vgs - vth) / (proc.nSlope * proc.vtThermal));
    regionLabel = 'Cutoff (Depleted Channel)';
    regionStatus = 'warning';
  } else if (vgs <= vth + 0.05) {
    const iSub0 = 0.35 * (widthUm / lengthUm) * Math.exp((vgs - vth) / (proc.nSlope * proc.vtThermal));
    idUa = iSub0 * (1 - Math.exp(-vds / proc.vtThermal)) * (1 + proc.lambda0 * vds);
    regionLabel = vds > 4 * proc.vtThermal
      ? 'Weak Inversion / Subthreshold Saturation (V_DS > 4 U_T)'
      : 'Weak Inversion Triode';
    regionStatus = 'subthreshold';
  } else if (vds < vdsSat) {
    idUa = kPrime * (vov * vds - 0.5 * vds * vds);
    regionLabel = 'Triode / Linear Region (V_DS < V_GS - V_th) — Degraded r_o!';
    regionStatus = 'warning';
  } else {
    idUa = 0.5 * kPrime * vov * vov * (1 + (proc.lambda0 * proc.lMin / lengthUm) * vds);
    regionLabel = 'Strong/Moderate Inversion Saturation (V_DS >= V_DS,sat)';
    regionStatus = 'nominal';
  }

  const gmUs = vgs <= vth + 0.05
    ? idUa / (proc.nSlope * proc.vtThermal)
    : vds < vdsSat
      ? kPrime * vds
      : kPrime * vov;

  const roKohm = vds < vdsSat
    ? 1000 / Math.max(kPrime * (vov - vds), 1)
    : 1000 / Math.max(idUa * (proc.lambda0 * proc.lMin / lengthUm), 0.05);

  const gmRo = (gmUs / 1000) * roKohm;

  // Generate Id vs Vds curve points for SVG
  const vdsMax = proc.vdd;
  const maxScaleUa = Math.max(150, 0.5 * kPrime * Math.pow(proc.vdd * 0.55 - vth, 2) * 1.25);

  const buildCurve = (vgsCurve: number) => {
    const pts: string[] = [];
    const vovC = Math.max(0.03, vgsCurve - vth);
    for (let i = 0; i <= 36; i++) {
      const v = (i / 36) * vdsMax;
      let iVal = 0;
      if (vgsCurve > vth) {
        if (v < vovC) {
          iVal = kPrime * (vovC * v - 0.5 * v * v);
        } else {
          iVal = 0.5 * kPrime * vovC * vovC * (1 + (proc.lambda0 * proc.lMin / lengthUm) * v);
        }
      }
      const x = 55 + (v / vdsMax) * 320;
      const y = 195 - Math.min(165, (iVal / maxScaleUa) * 165);
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return pts.join(' ');
  };

  const dotX = 55 + (Math.min(vds, vdsMax) / vdsMax) * 320;
  const dotY = 195 - Math.min(165, (idUa / maxScaleUa) * 165);
  const satLineX = 55 + (Math.min(vdsSat, vdsMax) / vdsMax) * 320;

  return (
    <div className="my-6 border border-slate-300 bg-white text-slate-900 font-lab-ui">
      <div className="px-5 py-3 bg-[#F8FAFC] border-b border-slate-300 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#00629B]" />
          <h3 className="font-ieee-sans font-bold text-sm text-slate-900">
            Interactive MOSFET Operating-Region (<InlineMath math="V_{GS} / V_{DS}" />) &amp; Small-Signal Explorer
          </h3>
        </div>
        <ProcessNodeToggle processNode={processNode} onChangeProcessNode={onChangeProcessNode} />
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: SVG I_D vs V_DS Characteristic Stage */}
        <div className="lg:col-span-7 border border-slate-300 bg-[#F8FAFC] p-4">
          <div className="flex items-center justify-between mb-2 text-xs font-ieee-sans">
            <span className="font-bold text-slate-900">
              Output Characteristics <InlineMath math="I_D" /> vs. <InlineMath math="V_{DS}" />
            </span>
            <span
              className={`font-ieee-mono font-bold px-2.5 py-0.5 ${
                regionStatus === 'nominal'
                  ? 'text-emerald-900 bg-emerald-100 border border-emerald-300'
                  : regionStatus === 'subthreshold'
                    ? 'text-sky-900 bg-sky-100 border border-sky-300'
                    : 'text-red-900 bg-red-100 border border-red-300'
              }`}
            >
              {regionStatus === 'nominal' ? '● SATURATION' : regionStatus === 'subthreshold' ? '◆ SUBTHRESHOLD' : '▲ TRIODE / CUTOFF'}
            </span>
          </div>

          <svg viewBox="0 0 410 230" className="w-full h-auto bg-white border border-slate-300">
            <line x1="55" y1="195" x2="385" y2="195" stroke="#1E293B" strokeWidth="1.8" />
            <line x1="55" y1="25" x2="55" y2="195" stroke="#1E293B" strokeWidth="1.8" />

            {[vth + 0.15, vth + 0.3, vth + 0.45].map((vRef, idx) => (
              <polyline
                key={idx}
                points={buildCurve(vRef)}
                fill="none"
                stroke="#CBD5E1"
                strokeWidth="1.5"
              />
            ))}

            <polyline points={buildCurve(vgs)} fill="none" stroke="#00629B" strokeWidth="2.8" />

            <line
              x1={satLineX}
              y1="25"
              x2={satLineX}
              y2="195"
              stroke="#B45309"
              strokeWidth="1.6"
              strokeDasharray="4 4"
            />
            <text x={Math.min(330, satLineX + 5)} y="40" fill="#92400E" fontSize="10" fontWeight="bold" fontFamily="monospace">
              V_DS,sat = {vdsSat.toFixed(2)}V
            </text>

            <circle
              cx={dotX}
              cy={dotY}
              r="6"
              fill={regionStatus === 'nominal' ? '#059669' : '#DC2626'}
              stroke="#FFFFFF"
              strokeWidth="2"
            />
            <text x={Math.min(300, dotX + 8)} y={Math.max(38, dotY - 8)} fill="#0F172A" fontSize="10" fontWeight="bold" fontFamily="monospace">
              Q ({vds.toFixed(2)}V, {idUa.toFixed(1)}μA)
            </text>

            <text x="220" y="218" textAnchor="middle" fill="#1E293B" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
              Drain-Source Voltage V_DS (0V to {vdsMax}V)
            </text>
            <text x="18" y="110" textAnchor="middle" transform="rotate(-90 18 110)" fill="#00629B" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
              Drain Current I_D (μA)
            </text>
          </svg>

          <div className="mt-2.5 text-xs font-ieee-sans text-slate-900">
            <strong className="text-[#00629B]">Region Diagnosis: </strong>
            {regionLabel}
          </div>
        </div>

        {/* Right: Control Sliders & Live Small-Signal Readout */}
        <div className="lg:col-span-5 space-y-4 text-slate-900">
          <div className="space-y-3 bg-[#F8FAFC] border border-slate-300 p-4 text-xs font-ieee-sans text-slate-900">
            <div>
              <div className="flex justify-between font-semibold text-slate-900 mb-1">
                <span>Gate-Source Voltage <InlineMath math="V_{GS}" /></span>
                <span className="font-ieee-mono font-bold text-[#00629B]">{vgs.toFixed(2)} V (V_th = {vth} V)</span>
              </div>
              <input
                type="range"
                min={0.2}
                max={proc.vdd}
                step={0.02}
                value={Math.min(vgs, proc.vdd)}
                onChange={(e) => setVgs(parseFloat(e.target.value))}
                className="w-full accent-[#00629B]"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-900 mb-1">
                <span>Drain-Source Voltage <InlineMath math="V_{DS}" /></span>
                <span className="font-ieee-mono font-bold text-[#00629B]">{vds.toFixed(2)} V</span>
              </div>
              <input
                type="range"
                min={0.05}
                max={proc.vdd}
                step={0.02}
                value={Math.min(vds, proc.vdd)}
                onChange={(e) => setVds(parseFloat(e.target.value))}
                className="w-full accent-[#00629B]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex justify-between font-semibold text-slate-900 mb-1">
                  <span>Width <InlineMath math="W" /></span>
                  <span className="font-ieee-mono font-bold text-slate-900">{widthUm} μm</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={50}
                  step={1}
                  value={widthUm}
                  onChange={(e) => setWidthUm(parseFloat(e.target.value))}
                  className="w-full accent-[#00629B]"
                />
              </div>
              <div>
                <div className="flex justify-between font-semibold text-slate-900 mb-1">
                  <span>Length <InlineMath math="L" /></span>
                  <span className="font-ieee-mono font-bold text-slate-900">{lengthUm.toFixed(2)} μm</span>
                </div>
                <input
                  type="range"
                  min={proc.lMin}
                  max={2.0}
                  step={0.05}
                  value={lengthUm}
                  onChange={(e) => setLengthUm(parseFloat(e.target.value))}
                  className="w-full accent-[#00629B]"
                />
              </div>
            </div>
          </div>

          {/* Small-Signal Metrics Table */}
          <div className="grid grid-cols-2 gap-2.5 text-xs font-ieee-mono">
            <div className="border border-slate-300 p-2.5 bg-white">
              <div className="text-slate-700 font-semibold font-ieee-sans">Drain Current I_D</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">{idUa.toFixed(2)} μA</div>
            </div>
            <div className="border border-slate-300 p-2.5 bg-white">
              <div className="text-slate-700 font-semibold font-ieee-sans">Transconductance g_m</div>
              <div className="text-base font-bold text-[#00629B] mt-0.5">{gmUs.toFixed(1)} μS</div>
            </div>
            <div className="border border-slate-300 p-2.5 bg-white">
              <div className="text-slate-700 font-semibold font-ieee-sans">Output Resistance r_o</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">{roKohm.toFixed(1)} kΩ</div>
            </div>
            <div className="border border-slate-300 p-2.5 bg-white">
              <div className="text-slate-700 font-semibold font-ieee-sans">Intrinsic Gain g_m·r_o</div>
              <div className="text-base font-bold text-emerald-800 mt-0.5">{gmRo.toFixed(1)} V/V</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 2. gm/Id & Cgg/Id Lookup Sizing Workbench
 * ============================================================================ */
export const GmIdCalculator: React.FC<NodeProps> = ({
  processNode,
  onChangeProcessNode,
  onGmIdChange,
}) => {
  const proc = PROCESS_NODES[processNode];
  const [deviceType, setDeviceType] = useState<'nmos' | 'pmos'>('nmos');
  const [targetGmId, setTargetGmId] = useState<number>(15);
  const [lengthUm, setLengthUm] = useState<number>(0.36);
  const [targetGbwMHz, setTargetGbwMHz] = useState<number>(50);
  const [loadCapPf, setLoadCapPf] = useState<number>(2.0);

  useEffect(() => {
    if (onGmIdChange) {
      onGmIdChange(targetGmId, lengthUm);
    }
  }, [targetGmId, lengthUm, onGmIdChange]);

  const pt = evaluateGmIdPoint(targetGmId, lengthUm, deviceType, processNode);
  const curve = generateGmIdCurve(lengthUm, deviceType, processNode);

  const requiredGmUs = 2 * Math.PI * targetGbwMHz * loadCapPf; // uS
  const requiredIdUa = requiredGmUs / pt.gmId; // uA
  const requiredWidthUm = requiredIdUa / pt.idOverW; // um
  const totalCggFf = pt.cggOverW * requiredWidthUm; // fF

  return (
    <div className="my-6 border border-slate-300 bg-white text-slate-900 font-lab-ui">
      <div className="px-5 py-3 bg-[#F8FAFC] border-b border-slate-300 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#00629B]" />
          <h3 className="font-ieee-sans font-bold text-sm text-slate-900">
            Interactive <InlineMath math="g_m/I_D" /> &amp; <InlineMath math="C_{gg}/I_D" /> Sizing Lookup Workbench
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 border border-slate-300 p-0.5 text-xs font-ieee-sans">
            {(['nmos', 'pmos'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setDeviceType(t)}
                className={`px-2.5 py-1 font-semibold uppercase cursor-pointer ${
                  deviceType === t ? 'bg-[#00629B] text-white' : 'bg-white text-slate-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <ProcessNodeToggle processNode={processNode} onChangeProcessNode={onChangeProcessNode} />
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 text-slate-900">
        {/* Controls */}
        <div className="lg:col-span-5 space-y-3.5 bg-[#F8FAFC] border border-slate-300 p-4 text-xs font-ieee-sans text-slate-900">
          <div>
            <div className="flex justify-between font-bold text-slate-900 mb-1">
              <span>Target <InlineMath math="g_m / I_D" /> Efficiency</span>
              <span className="font-ieee-mono text-[#00629B]">{targetGmId} V⁻¹ ({pt.region})</span>
            </div>
            <input
              type="range"
              min={5}
              max={25}
              step={0.5}
              value={targetGmId}
              onChange={(e) => setTargetGmId(parseFloat(e.target.value))}
              className="w-full accent-[#00629B]"
            />
            <div className="flex justify-between text-[10px] text-slate-700 font-medium mt-0.5">
              <span>5 V⁻¹ (Strong Inv)</span>
              <span>15 V⁻¹ (Moderate)</span>
              <span>25 V⁻¹ (Weak Inv)</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between font-bold text-slate-900 mb-1">
              <span>Channel Length <InlineMath math="L" /></span>
              <span className="font-ieee-mono text-[#00629B]">{lengthUm.toFixed(2)} μm ({(lengthUm / proc.lMin).toFixed(1)}× L_min)</span>
            </div>
            <input
              type="range"
              min={proc.lMin}
              max={2.0}
              step={0.04}
              value={lengthUm}
              onChange={(e) => setLengthUm(parseFloat(e.target.value))}
              className="w-full accent-[#00629B]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <div className="flex justify-between font-bold text-slate-900 mb-1">
                <span>Target GBW</span>
                <span className="font-ieee-mono text-slate-900">{targetGbwMHz} MHz</span>
              </div>
              <input
                type="range"
                min={5}
                max={250}
                step={5}
                value={targetGbwMHz}
                onChange={(e) => setTargetGbwMHz(parseFloat(e.target.value))}
                className="w-full accent-[#00629B]"
              />
            </div>
            <div>
              <div className="flex justify-between font-bold text-slate-900 mb-1">
                <span>Load <InlineMath math="C_L" /></span>
                <span className="font-ieee-mono text-slate-900">{loadCapPf.toFixed(1)} pF</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={15}
                step={0.5}
                value={loadCapPf}
                onChange={(e) => setLoadCapPf(parseFloat(e.target.value))}
                className="w-full accent-[#00629B]"
              />
            </div>
          </div>

          {/* Lookup Table Extract */}
          <div className="pt-2 border-t border-slate-300 grid grid-cols-2 gap-2 font-ieee-mono">
            <div className="bg-white border border-slate-300 p-2">
              <div className="text-[11px] font-ieee-sans font-semibold text-slate-700">Current Density I_D/W</div>
              <div className="text-sm font-bold text-slate-900">{pt.idOverW} μA/μm</div>
            </div>
            <div className="bg-white border border-slate-300 p-2">
              <div className="text-[11px] font-ieee-sans font-semibold text-slate-700">Inversion Coeff. IC</div>
              <div className="text-sm font-bold text-slate-900">{pt.ic}</div>
            </div>
            <div className="bg-white border border-slate-300 p-2">
              <div className="text-[11px] font-ieee-sans font-semibold text-slate-700">Transit Freq. f_T</div>
              <div className="text-sm font-bold text-amber-800">{pt.ftGHz} GHz</div>
            </div>
            <div className="bg-white border border-slate-300 p-2">
              <div className="text-[11px] font-ieee-sans font-semibold text-slate-700">Intrinsic Gain g_m·r_o</div>
              <div className="text-sm font-bold text-emerald-800">{pt.gmRo} V/V ({(20 * Math.log10(pt.gmRo)).toFixed(1)} dB)</div>
            </div>
          </div>
        </div>

        {/* Right: Synthesized Sizing Output & Lookup Chart */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          <div className="border border-slate-300 p-3 bg-[#F8FAFC]">
            <div className="text-xs font-ieee-sans font-bold text-slate-900 mb-2 flex justify-between">
              <span>Lookup Charts: <InlineMath math="g_m r_o" /> (Green) &amp; <InlineMath math="f_T" /> (Amber) vs. <InlineMath math="g_m/I_D" /></span>
              <span className="font-ieee-mono text-[#00629B]">V* = 2/(g_m/I_D) = {(pt.vov * 1000).toFixed(0)} mV</span>
            </div>
            <svg viewBox="0 0 440 165" className="w-full h-auto bg-white border border-slate-300">
              <line x1="45" y1="138" x2="405" y2="138" stroke="#1E293B" strokeWidth="1.5" />
              <line x1="45" y1="15" x2="45" y2="138" stroke="#1E293B" strokeWidth="1.5" />

              <polyline
                fill="none"
                stroke="#059669"
                strokeWidth="2.5"
                points={curve
                  .map((c) => {
                    const x = 45 + ((c.gmId - 4) / 22) * 355;
                    const y = 138 - Math.min(115, (c.gmRo / 140) * 115);
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                  })
                  .join(' ')}
              />

              <polyline
                fill="none"
                stroke="#D97706"
                strokeWidth="2.5"
                strokeDasharray="5 3"
                points={curve
                  .map((c) => {
                    const x = 45 + ((c.gmId - 4) / 22) * 355;
                    const maxFt = processNode === '65nm' ? 85 : 30;
                    const y = 138 - Math.min(115, (c.ftGHz / maxFt) * 115);
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                  })
                  .join(' ')}
              />

              {(() => {
                const cursorX = 45 + ((pt.gmId - 4) / 22) * 355;
                return (
                  <g>
                    <line x1={cursorX} y1="15" x2={cursorX} y2="138" stroke="#00629B" strokeWidth="2" />
                    <text x={Math.min(340, cursorX + 5)} y="28" fill="#00629B" fontSize="10" fontWeight="bold" fontFamily="monospace">
                      g_m/I_D = {pt.gmId}
                    </text>
                  </g>
                );
              })()}

              <text x="225" y="156" textAnchor="middle" fill="#1E293B" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                Target g_m / I_D (4 V⁻¹ Strong Inversion → 26 V⁻¹ Weak Inversion)
              </text>
            </svg>
          </div>

          {/* Synthesized Physical Dimensions Card */}
          <div className="border border-[#00629B]/40 bg-[#F8FAFC] p-4">
            <div className="text-xs font-ieee-sans font-bold text-[#00629B] uppercase tracking-wider mb-3">
              Computed Transistor Sizing &amp; Bias Point (Step-by-Step <InlineMath math="g_m/I_D" /> Flow)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-ieee-mono">
              <div className="bg-white border border-slate-300 p-2.5">
                <div className="text-slate-700 font-semibold font-ieee-sans">1. Required g_m</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{requiredGmUs.toFixed(1)} μS</div>
              </div>
              <div className="bg-white border border-slate-300 p-2.5">
                <div className="text-slate-700 font-semibold font-ieee-sans">2. Drain Current I_D</div>
                <div className="text-sm font-bold text-[#00629B] mt-0.5">{requiredIdUa.toFixed(2)} μA</div>
              </div>
              <div className="bg-white border border-slate-300 p-2.5">
                <div className="text-slate-700 font-semibold font-ieee-sans">3. Width W = I_D/(I_D/W)</div>
                <div className="text-sm font-bold text-emerald-800 mt-0.5">{requiredWidthUm.toFixed(2)} μm</div>
              </div>
              <div className="bg-white border border-slate-300 p-2.5">
                <div className="text-slate-700 font-semibold font-ieee-sans">4. Aspect Ratio W/L</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{(requiredWidthUm / lengthUm).toFixed(1)}</div>
              </div>
              <div className="bg-white border border-slate-300 p-2.5">
                <div className="text-slate-700 font-semibold font-ieee-sans">5. C_gg / I_D Ratio</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{pt.cggOverId} fF/μA</div>
              </div>
              <div className="bg-white border border-slate-300 p-2.5">
                <div className="text-slate-700 font-semibold font-ieee-sans">6. Total Gate Cap C_gg</div>
                <div className="text-sm font-bold text-amber-800 mt-0.5">{totalCggFf.toFixed(1)} fF</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 3. 5T OTA Live Sizing Calculator + Dynamic SPICE Netlist
 * ============================================================================ */
export const Ota5TCalculator: React.FC<NodeProps> = ({
  processNode,
  onChangeProcessNode,
  onOtaSpecChange,
}) => {
  const [gbwMHz, setGbwMHz] = useState<number>(40);
  const [clPf, setClPf] = useState<number>(2.0);
  const [slewRateVus, setSlewRateVus] = useState<number>(20);
  const [gmIdInput, setGmIdInput] = useState<number>(16);
  const [gmIdLoad, setGmIdLoad] = useState<number>(10);
  const [gmIdTail, setGmIdTail] = useState<number>(10);
  const [lengthUm, setLengthUm] = useState<number>(0.36);

  useEffect(() => {
    if (onOtaSpecChange) {
      onOtaSpecChange({
        nodeId: processNode,
        gbwMHz,
        clPf,
        slewRateVus,
        gmIdInput,
        gmIdLoad,
        gmIdTail,
        lengthUm,
      });
    }
  }, [processNode, gbwMHz, clPf, slewRateVus, gmIdInput, gmIdLoad, gmIdTail, lengthUm, onOtaSpecChange]);

  const res = calculate5TOtaSizing({
    nodeId: processNode,
    gbwMHz,
    clPf,
    slewRateVus,
    gmIdInput,
    gmIdLoad,
    gmIdTail,
    lengthUm,
  });

  return (
    <div className="my-6 border border-slate-300 bg-white text-slate-900 font-lab-ui">
      <div className="px-5 py-3 bg-[#F8FAFC] border-b border-slate-300 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#00629B]" />
          <h3 className="font-ieee-sans font-bold text-sm text-slate-900">
            5-Transistor (5T) OTA Specification-to-Sizing Calculator &amp; Netlist Synthesizer
          </h3>
        </div>
        <ProcessNodeToggle processNode={processNode} onChangeProcessNode={onChangeProcessNode} />
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 text-slate-900">
        {/* Spec Sliders */}
        <div className="lg:col-span-5 space-y-3 bg-[#F8FAFC] border border-slate-300 p-4 text-xs font-ieee-sans text-slate-900">
          <div className="font-bold text-slate-900 border-b border-slate-300 pb-1.5">
            Target Specifications &amp; <InlineMath math="g_m/I_D" /> Choices
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between font-semibold text-slate-900 mb-1">
                <span>GBW Spec</span>
                <span className="font-ieee-mono font-bold text-[#00629B]">{gbwMHz} MHz</span>
              </div>
              <input
                type="range"
                min={5}
                max={150}
                step={5}
                value={gbwMHz}
                onChange={(e) => setGbwMHz(parseFloat(e.target.value))}
                className="w-full accent-[#00629B]"
              />
            </div>
            <div>
              <div className="flex justify-between font-semibold text-slate-900 mb-1">
                <span>Load <InlineMath math="C_L" /></span>
                <span className="font-ieee-mono font-bold text-[#00629B]">{clPf.toFixed(1)} pF</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={10}
                step={0.5}
                value={clPf}
                onChange={(e) => setClPf(parseFloat(e.target.value))}
                className="w-full accent-[#00629B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between font-semibold text-slate-900 mb-1">
                <span>Min Slew Rate</span>
                <span className="font-ieee-mono font-bold text-slate-900">{slewRateVus} V/μs</span>
              </div>
              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={slewRateVus}
                onChange={(e) => setSlewRateVus(parseFloat(e.target.value))}
                className="w-full accent-[#00629B]"
              />
            </div>
            <div>
              <div className="flex justify-between font-semibold text-slate-900 mb-1">
                <span>Length <InlineMath math="L" /></span>
                <span className="font-ieee-mono font-bold text-slate-900">{lengthUm.toFixed(2)} μm</span>
              </div>
              <input
                type="range"
                min={PROCESS_NODES[processNode].lMin}
                max={1.5}
                step={0.05}
                value={lengthUm}
                onChange={(e) => setLengthUm(parseFloat(e.target.value))}
                className="w-full accent-[#00629B]"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between font-semibold text-slate-900 mb-1">
              <span>Input Pair <InlineMath math="(g_m/I_D)_{1,2}" /> (Gain &amp; Offset)</span>
              <span className="font-ieee-mono font-bold text-emerald-800">{gmIdInput} V⁻¹</span>
            </div>
            <input
              type="range"
              min={8}
              max={24}
              step={1}
              value={gmIdInput}
              onChange={(e) => setGmIdInput(parseFloat(e.target.value))}
              className="w-full accent-[#00629B]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between font-semibold text-slate-900 mb-1">
                <span>Mirror <InlineMath math="(g_m/I_D)_{3,4}" /></span>
                <span className="font-ieee-mono font-bold text-slate-900">{gmIdLoad} V⁻¹</span>
              </div>
              <input
                type="range"
                min={6}
                max={18}
                step={1}
                value={gmIdLoad}
                onChange={(e) => setGmIdLoad(parseFloat(e.target.value))}
                className="w-full accent-[#00629B]"
              />
            </div>
            <div>
              <div className="flex justify-between font-semibold text-slate-900 mb-1">
                <span>Tail <InlineMath math="(g_m/I_D)_5" /></span>
                <span className="font-ieee-mono font-bold text-slate-900">{gmIdTail} V⁻¹</span>
              </div>
              <input
                type="range"
                min={6}
                max={18}
                step={1}
                value={gmIdTail}
                onChange={(e) => setGmIdTail(parseFloat(e.target.value))}
                className="w-full accent-[#00629B]"
              />
            </div>
          </div>
        </div>

        {/* Computed Sizing & Performance Matrix */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-ieee-mono">
            <div className="border border-slate-300 p-2.5 bg-[#F8FAFC]">
              <div className="text-slate-700 font-semibold font-ieee-sans">DC Gain A_v0</div>
              <div className="text-base font-bold text-[#00629B]">{res.av0Db} dB ({res.av0Vv} V/V)</div>
            </div>
            <div className="border border-slate-300 p-2.5 bg-[#F8FAFC]">
              <div className="text-slate-700 font-semibold font-ieee-sans">Achieved GBW</div>
              <div className="text-base font-bold text-emerald-800">{res.actualGbwMHz} MHz</div>
            </div>
            <div className="border border-slate-300 p-2.5 bg-[#F8FAFC]">
              <div className="text-slate-700 font-semibold font-ieee-sans">Phase Margin</div>
              <div className="text-base font-bold text-slate-900">{res.phaseMarginDeg}°</div>
            </div>
            <div className="border border-slate-300 p-2.5 bg-[#F8FAFC]">
              <div className="text-slate-700 font-semibold font-ieee-sans">Static Power</div>
              <div className="text-base font-bold text-slate-900">{res.powerUw} μW</div>
            </div>
          </div>

          {/* Device Sizing Table */}
          <div className="overflow-x-auto border border-slate-300 bg-white">
            <table className="w-full text-left border-collapse text-xs font-ieee-mono text-slate-900">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 font-ieee-sans text-slate-900">
                  <th className="py-2 px-3">Transistor</th>
                  <th className="py-2 px-3">Role</th>
                  <th className="py-2 px-3">g_m/I_D</th>
                  <th className="py-2 px-3">I_D (μA)</th>
                  <th className="py-2 px-3">W / L (μm)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-900">
                <tr>
                  <td className="py-2 px-3 font-bold text-[#00629B]">M1, M2 (NMOS)</td>
                  <td className="py-2 px-3 font-ieee-sans text-slate-800">Diff Input Pair</td>
                  <td className="py-2 px-3 text-slate-900">{gmIdInput} V⁻¹</td>
                  <td className="py-2 px-3 text-slate-900">{res.idBranchUa}</td>
                  <td className="py-2 px-3 font-bold text-slate-900">{res.w1Um}u / {lengthUm.toFixed(2)}u</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-amber-800">M3, M4 (PMOS)</td>
                  <td className="py-2 px-3 font-ieee-sans text-slate-800">Active Mirror Load</td>
                  <td className="py-2 px-3 text-slate-900">{gmIdLoad} V⁻¹</td>
                  <td className="py-2 px-3 text-slate-900">{res.idBranchUa}</td>
                  <td className="py-2 px-3 font-bold text-slate-900">{res.w3Um}u / {lengthUm.toFixed(2)}u</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-sky-800">M5 (NMOS)</td>
                  <td className="py-2 px-3 font-ieee-sans text-slate-800">Tail Current Source</td>
                  <td className="py-2 px-3 text-slate-900">{gmIdTail} V⁻¹</td>
                  <td className="py-2 px-3 text-slate-900">{res.iTailUa}</td>
                  <td className="py-2 px-3 font-bold text-slate-900">{res.w5Um}u / {lengthUm.toFixed(2)}u</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-xs font-ieee-mono text-slate-900">
            <div className="border border-slate-300 p-2.5 bg-white">
              <span className="text-slate-700 font-semibold font-ieee-sans block">ICMR Range</span>
              <span className="font-bold text-slate-900">{res.icmrMinV}V to {res.icmrMaxV}V</span>
            </div>
            <div className="border border-slate-300 p-2.5 bg-white">
              <span className="text-slate-700 font-semibold font-ieee-sans block">Output Swing</span>
              <span className="font-bold text-slate-900">{res.voutSwingV} V_pp</span>
            </div>
            <div className="border border-slate-300 p-2.5 bg-white">
              <span className="text-slate-700 font-semibold font-ieee-sans block">R_out (r_o2 || r_o4)</span>
              <span className="font-bold text-slate-900">{res.routkOhm} kΩ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Synced SPICE Netlist */}
      <div className="px-5 pb-5">
        <SpiceNetlistBox
          title="Live Calculator-Synced 5T OTA SPICE Netlist"
          filename={`ota_5t_${processNode}_${gbwMHz}MHz.cir`}
          netlist={res.spiceNetlist}
          description="This netlist updates automatically whenever you adjust any specification or gm/Id slider above."
        />
      </div>
    </div>
  );
};

/* ============================================================================
 * 4. Two-Stage Miller Op-Amp Calculator + Dynamic SPICE Netlist
 * ============================================================================ */
export const TwoStageOpAmpCalculator: React.FC<NodeProps> = ({
  processNode,
  onChangeProcessNode,
  onTwoStageSpecChange,
}) => {
  const [gbwMHz, setGbwMHz] = useState<number>(30);
  const [clPf, setClPf] = useState<number>(5.0);
  const [targetPmDeg, setTargetPmDeg] = useState<number>(62);
  const [gmIdStage1] = useState<number>(16);
  const [gmIdStage2, setGmIdStage2] = useState<number>(12);
  const [lengthUm] = useState<number>(0.36);
  const [nullingMode, setNullingMode] = useState<'none' | 'move_to_inf' | 'cancel_p2'>('move_to_inf');

  useEffect(() => {
    if (onTwoStageSpecChange) {
      onTwoStageSpecChange({
        nodeId: processNode,
        gbwMHz,
        clPf,
        targetPmDeg,
        gmIdStage1,
        gmIdStage2,
        lengthUm,
        nullingMode,
      });
    }
  }, [processNode, gbwMHz, clPf, targetPmDeg, gmIdStage1, gmIdStage2, lengthUm, nullingMode, onTwoStageSpecChange]);

  const res = calculateTwoStageSizing({
    nodeId: processNode,
    gbwMHz,
    clPf,
    targetPmDeg,
    gmIdStage1,
    gmIdStage2,
    lengthUm,
    nullingMode,
  });

  return (
    <div className="my-6 border border-slate-300 bg-white text-slate-900 font-lab-ui">
      <div className="px-5 py-3 bg-[#F8FAFC] border-b border-slate-300 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#00629B]" />
          <h3 className="font-ieee-sans font-bold text-sm text-slate-900">
            Two-Stage Miller Op-Amp Calculator (Pole-Splitting &amp; RHP Zero Compensation)
          </h3>
        </div>
        <ProcessNodeToggle processNode={processNode} onChangeProcessNode={onChangeProcessNode} />
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 text-slate-900">
        <div className="lg:col-span-5 space-y-3 bg-[#F8FAFC] border border-slate-300 p-4 text-xs font-ieee-sans text-slate-900">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between font-semibold text-slate-900 mb-1">
                <span>Target GBW</span>
                <span className="font-ieee-mono font-bold text-[#00629B]">{gbwMHz} MHz</span>
              </div>
              <input
                type="range"
                min={5}
                max={120}
                step={5}
                value={gbwMHz}
                onChange={(e) => setGbwMHz(parseFloat(e.target.value))}
                className="w-full accent-[#00629B]"
              />
            </div>
            <div>
              <div className="flex justify-between font-semibold text-slate-900 mb-1">
                <span>Load <InlineMath math="C_L" /></span>
                <span className="font-ieee-mono font-bold text-[#00629B]">{clPf.toFixed(1)} pF</span>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                step={0.5}
                value={clPf}
                onChange={(e) => setClPf(parseFloat(e.target.value))}
                className="w-full accent-[#00629B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between font-semibold text-slate-900 mb-1">
                <span>Target PM</span>
                <span className="font-ieee-mono font-bold text-slate-900">{targetPmDeg}°</span>
              </div>
              <input
                type="range"
                min={45}
                max={75}
                step={1}
                value={targetPmDeg}
                onChange={(e) => setTargetPmDeg(parseFloat(e.target.value))}
                className="w-full accent-[#00629B]"
              />
            </div>
            <div>
              <div className="flex justify-between font-semibold text-slate-900 mb-1">
                <span>Stage 2 <InlineMath math="(g_m/I_D)_6" /></span>
                <span className="font-ieee-mono font-bold text-slate-900">{gmIdStage2} V⁻¹</span>
              </div>
              <input
                type="range"
                min={8}
                max={20}
                step={1}
                value={gmIdStage2}
                onChange={(e) => setGmIdStage2(parseFloat(e.target.value))}
                className="w-full accent-[#00629B]"
              />
            </div>
          </div>

          <div>
            <div className="font-bold text-slate-900 mb-1.5">
              Nulling Resistor <InlineMath math="R_z" /> Compensation Strategy
            </div>
            <div className="space-y-1.5">
              {(
                [
                  { id: 'none', label: 'R_z = 0 Ω (Uncompensated RHP Feedforward Zero)' },
                  { id: 'move_to_inf', label: 'R_z = 1/g_m6 (Push RHP Zero to Infinity)' },
                  { id: 'cancel_p2', label: 'R_z = (1/g_m6)(1 + C_L/C_c) (LHP Zero Cancels f_p2)' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setNullingMode(opt.id)}
                  className={`w-full text-left px-3 py-1.5 border text-xs font-semibold transition-colors cursor-pointer ${
                    nullingMode === opt.id
                      ? 'bg-[#00629B] text-white border-[#00629B]'
                      : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-ieee-mono">
            <div className="border border-slate-300 p-2.5 bg-[#F8FAFC]">
              <div className="text-slate-700 font-semibold font-ieee-sans">Total DC Gain</div>
              <div className="text-base font-bold text-[#00629B]">{res.avTotalDb} dB</div>
            </div>
            <div className="border border-slate-300 p-2.5 bg-[#F8FAFC]">
              <div className="text-slate-700 font-semibold font-ieee-sans">Miller Cap C_c</div>
              <div className="text-base font-bold text-amber-800">{res.ccPf} pF</div>
            </div>
            <div className="border border-slate-300 p-2.5 bg-[#F8FAFC]">
              <div className="text-slate-700 font-semibold font-ieee-sans">Nulling R_z</div>
              <div className="text-base font-bold text-slate-900">{res.rzOhm} Ω</div>
            </div>
            <div className="border border-slate-300 p-2.5 bg-[#F8FAFC]">
              <div className="text-slate-700 font-semibold font-ieee-sans">Phase Margin</div>
              <div className={`text-base font-bold ${res.phaseMarginDeg >= 60 ? 'text-emerald-800' : 'text-amber-800'}`}>
                {res.phaseMarginDeg}°
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-300 bg-white">
            <table className="w-full text-left border-collapse text-xs font-ieee-mono text-slate-900">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 font-ieee-sans text-slate-900">
                  <th className="py-2 px-3">Stage / Element</th>
                  <th className="py-2 px-3">g_m / Bias</th>
                  <th className="py-2 px-3">Device Dimensions</th>
                  <th className="py-2 px-3">Pole / Zero Freq</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-900">
                <tr>
                  <td className="py-2 px-3 font-bold text-[#00629B]">Stage 1 (M1, M2)</td>
                  <td className="py-2 px-3 text-slate-900">g_m1 = {res.gm1uS} μS (I_tail = {res.iTail1Ua} μA)</td>
                  <td className="py-2 px-3 font-bold text-slate-900">W1 = {res.w1Um}u, W3 = {res.w3Um}u</td>
                  <td className="py-2 px-3 text-slate-900">f_p1 = {res.fp1Hz} Hz</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-emerald-800">Stage 2 (M6, M7)</td>
                  <td className="py-2 px-3 text-slate-900">g_m6 = {res.gm6uS} μS (I_D6 = {res.id6Ua} μA)</td>
                  <td className="py-2 px-3 font-bold text-slate-900">W6 = {res.w6Um}u, W7 = {res.w7Um}u</td>
                  <td className="py-2 px-3 text-slate-900">f_p2 = {res.fp2MHz} MHz</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-bold text-amber-800">Miller Network</td>
                  <td className="py-2 px-3 text-slate-900">C_c = {res.ccPf} pF, R_z = {res.rzOhm} Ω</td>
                  <td className="py-2 px-3 text-slate-900">SR = {res.slewRateVus} V/μs</td>
                  <td className="py-2 px-3 font-semibold text-slate-900">
                    {nullingMode === 'move_to_inf'
                      ? 'f_z1 → ∞'
                      : nullingMode === 'cancel_p2'
                        ? `LHP f_z1 = ${Math.abs(res.fz1MHz)} MHz`
                        : `RHP f_z1 = +${res.fz1MHz} MHz`}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="px-5 pb-5">
        <SpiceNetlistBox
          title="Live Calculator-Synced Two-Stage Op-Amp SPICE Netlist"
          filename={`opamp_2stage_${processNode}_${gbwMHz}MHz.cir`}
          netlist={res.spiceNetlist}
        />
      </div>
    </div>
  );
};

/* ============================================================================
 * 5. Interactive Bode Plot & Phase Margin Visualizer
 * ============================================================================ */
export const BodePlotVisualizer: React.FC = () => {
  const [dcGainDb, setDcGainDb] = useState<number>(72);
  const [fp1Hz, setFp1Hz] = useState<number>(8000);
  const [fp2MHz, setFp2MHz] = useState<number>(85);
  const [fzMHz, setFzMHz] = useState<number>(140);
  const [zeroType, setZeroType] = useState<'rhp' | 'lhp' | 'none'>('rhp');

  const a0Linear = Math.pow(10, dcGainDb / 20);
  const fp2Hz = fp2MHz * 1e6;
  const fzHz = fzMHz * 1e6;

  const evalTransfer = (fHz: number) => {
    const m1 = Math.sqrt(1 + Math.pow(fHz / fp1Hz, 2));
    const m2 = Math.sqrt(1 + Math.pow(fHz / fp2Hz, 2));
    const mz = zeroType === 'none' ? 1 : Math.sqrt(1 + Math.pow(fHz / fzHz, 2));
    const magVv = (a0Linear * mz) / (m1 * m2);
    const magDb = 20 * Math.log10(Math.max(magVv, 1e-4));

    let phaseDeg =
      -(Math.atan(fHz / fp1Hz) * 180) / Math.PI -
      (Math.atan(fHz / fp2Hz) * 180) / Math.PI;
    if (zeroType === 'rhp') {
      phaseDeg -= (Math.atan(fHz / fzHz) * 180) / Math.PI;
    } else if (zeroType === 'lhp') {
      phaseDeg += (Math.atan(fHz / fzHz) * 180) / Math.PI;
    }
    return { magDb, phaseDeg };
  };

  let fuHz = fp1Hz * a0Linear;
  for (let exp = 2; exp <= 9; exp += 0.02) {
    const f = Math.pow(10, exp);
    if (evalTransfer(f).magDb <= 0) {
      fuHz = f;
      break;
    }
  }
  const { phaseDeg: phaseAtFu } = evalTransfer(fuHz);
  const phaseMargin = 180 + phaseAtFu;

  const magPoints: string[] = [];
  const phasePoints: string[] = [];
  for (let i = 0; i <= 70; i++) {
    const logF = 2 + (i / 70) * 7;
    const f = Math.pow(10, logF);
    const { magDb, phaseDeg } = evalTransfer(f);
    const x = 55 + (i / 70) * 350;
    const yMag = 115 - (Math.min(Math.max(magDb, -30), 90) / 90) * 90;
    const yPhase = 155 + (Math.min(Math.max(-phaseDeg, 0), 270) / 270) * 85;
    magPoints.push(`${x.toFixed(1)},${yMag.toFixed(1)}`);
    phasePoints.push(`${x.toFixed(1)},${yPhase.toFixed(1)}`);
  }

  const fuLog = Math.min(Math.max(Math.log10(fuHz), 2), 9);
  const fuX = 55 + ((fuLog - 2) / 7) * 350;

  return (
    <div className="my-6 border border-slate-300 bg-white text-slate-900 font-lab-ui">
      <div className="px-5 py-3 bg-[#F8FAFC] border-b border-slate-300 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#00629B]" />
          <h3 className="font-ieee-sans font-bold text-sm text-slate-900">
            Interactive Bode Plot Visualizer (Poles, RHP/LHP Zeros &amp; Phase Margin)
          </h3>
        </div>
        <span
          className={`text-xs font-ieee-mono font-bold px-2.5 py-0.5 border ${
            phaseMargin >= 60
              ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
              : phaseMargin >= 45
                ? 'bg-amber-100 text-amber-950 border-amber-300'
                : 'bg-red-100 text-red-950 border-red-300'
          }`}
        >
          {phaseMargin >= 60
            ? `● STABLE (PM = ${phaseMargin.toFixed(1)}°)`
            : phaseMargin >= 45
              ? `▲ MARGINAL RINGING (PM = ${phaseMargin.toFixed(1)}°)`
              : `■ UNSTABLE / OSCILLATION (PM = ${phaseMargin.toFixed(1)}°)`}
        </span>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 text-slate-900">
        <div className="lg:col-span-7 border border-slate-300 bg-[#F8FAFC] p-3">
          <svg viewBox="0 0 430 265" className="w-full h-auto bg-white border border-slate-300">
            <line x1="55" y1="115" x2="405" y2="115" stroke="#64748B" strokeWidth="1.2" strokeDasharray="4 4" />
            <text x="50" y="118" textAnchor="end" fill="#334155" fontSize="9" fontFamily="monospace">0 dB</text>
            <text x="50" y="30" textAnchor="end" fill="#00629B" fontSize="9" fontWeight="bold" fontFamily="monospace">+90 dB</text>

            <line x1="55" y1="212" x2="405" y2="212" stroke="#DC2626" strokeWidth="1.2" strokeDasharray="3 3" />
            <text x="50" y="215" textAnchor="end" fill="#B91C1C" fontSize="9" fontWeight="bold" fontFamily="monospace">-180°</text>
            <text x="50" y="160" textAnchor="end" fill="#047857" fontSize="9" fontWeight="bold" fontFamily="monospace">0°</text>

            <polyline points={magPoints.join(' ')} fill="none" stroke="#00629B" strokeWidth="2.6" />
            <polyline points={phasePoints.join(' ')} fill="none" stroke="#059669" strokeWidth="2.4" />

            <line x1={fuX} y1="20" x2={fuX} y2="242" stroke="#D97706" strokeWidth="1.6" />
            <circle cx={fuX} cy="115" r="4.5" fill="#D97706" />
            <text x={Math.min(330, fuX + 5)} y="108" fill="#92400E" fontSize="10" fontWeight="bold" fontFamily="monospace">
              f_u = {(fuHz / 1e6).toFixed(1)} MHz
            </text>

            <text x="230" y="258" textAnchor="middle" fill="#1E293B" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
              Frequency Log₁₀ Scale (100 Hz → 1 GHz) | Top: |H(jω)| dB | Bottom: ∠H(jω) deg
            </text>
          </svg>
        </div>

        <div className="lg:col-span-5 space-y-3 bg-[#F8FAFC] border border-slate-300 p-4 text-xs font-ieee-sans text-slate-900">
          <div>
            <div className="flex justify-between font-semibold text-slate-900 mb-1">
              <span>DC Open-Loop Gain <InlineMath math="A_{v0}" /></span>
              <span className="font-ieee-mono font-bold text-[#00629B]">{dcGainDb} dB</span>
            </div>
            <input
              type="range"
              min={40}
              max={90}
              step={2}
              value={dcGainDb}
              onChange={(e) => setDcGainDb(parseFloat(e.target.value))}
              className="w-full accent-[#00629B]"
            />
          </div>

          <div>
            <div className="flex justify-between font-semibold text-slate-900 mb-1">
              <span>Dominant Pole <InlineMath math="f_{p1}" /></span>
              <span className="font-ieee-mono font-bold text-slate-900">{(fp1Hz / 1000).toFixed(1)} kHz</span>
            </div>
            <input
              type="range"
              min={1000}
              max={50000}
              step={1000}
              value={fp1Hz}
              onChange={(e) => setFp1Hz(parseFloat(e.target.value))}
              className="w-full accent-[#00629B]"
            />
          </div>

          <div>
            <div className="flex justify-between font-semibold text-slate-900 mb-1">
              <span>Non-Dominant Pole <InlineMath math="f_{p2}" /></span>
              <span className="font-ieee-mono font-bold text-emerald-800">{fp2MHz} MHz</span>
            </div>
            <input
              type="range"
              min={10}
              max={300}
              step={5}
              value={fp2MHz}
              onChange={(e) => setFp2MHz(parseFloat(e.target.value))}
              className="w-full accent-[#00629B]"
            />
          </div>

          <div>
            <div className="flex justify-between font-semibold text-slate-900 mb-1">
              <span>Feedforward Zero Magnitude <InlineMath math="|f_{z1}|" /></span>
              <span className="font-ieee-mono font-bold text-amber-800">{fzMHz} MHz</span>
            </div>
            <input
              type="range"
              min={15}
              max={400}
              step={5}
              value={fzMHz}
              onChange={(e) => setFzMHz(parseFloat(e.target.value))}
              className="w-full accent-[#00629B]"
            />
          </div>

          <div className="pt-1">
            <div className="font-bold text-slate-900 mb-1">Zero Polarity Type:</div>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'rhp', label: 'RHP (-90° Lag)' },
                  { id: 'lhp', label: 'LHP (+90° Lead)' },
                  { id: 'none', label: 'No Zero (∞)' },
                ] as const
              ).map((z) => (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => setZeroType(z.id)}
                  className={`py-1.5 px-2 border text-[11px] font-semibold cursor-pointer ${
                    zeroType === z.id
                      ? 'bg-[#00629B] text-white border-[#00629B]'
                      : 'bg-white text-slate-800 border-slate-300'
                  }`}
                >
                  {z.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 6. Bandgap Reference (BGR) Temperature Curve Plotter (PTAT + CTAT)
 * ============================================================================ */
export const BgrCurvePlotter: React.FC = () => {
  const [bjtRatioN, setBjtRatioN] = useState<number>(8);
  const [resRatioK, setResRatioK] = useState<number>(10.05);
  const [curvaturePpm, setCurvaturePpm] = useState<number>(1.8);

  const temps: number[] = [];
  for (let t = -40; t <= 125; t += 5) {
    temps.push(t);
  }

  const evalBgr = (tCelsius: number) => {
    const tKelvin = tCelsius + 273.15;
    const t0 = 300.15;
    const vbe0 = 0.652;
    const dT = tKelvin - t0;
    const vCtat = vbe0 - 0.0018 * dT - curvaturePpm * 1e-7 * dT * dT;
    const vt = (1.380649e-23 * tKelvin) / 1.60217663e-19;
    const vPtat = resRatioK * vt * Math.log(bjtRatioN);
    const vRef = vCtat + vPtat;
    return { tCelsius, vCtat, vPtat, vRef };
  };

  const data = temps.map(evalBgr);
  const vRefs = data.map((d) => d.vRef);
  const vMin = Math.min(...vRefs);
  const vMax = Math.max(...vRefs);
  const vNom = evalBgr(27).vRef;
  const tcPpmPerC = ((vMax - vMin) / (vNom * 165)) * 1e6;

  const refPolyline = data
    .map((d, idx) => {
      const x = 55 + (idx / (data.length - 1)) * 340;
      const deltaMv = (d.vRef - vNom) * 1000;
      const y = 115 - Math.max(-85, Math.min(85, deltaMv * 10));
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="my-6 border border-slate-300 bg-white text-slate-900 font-lab-ui">
      <div className="px-5 py-3 bg-[#F8FAFC] border-b border-slate-300 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#00629B]" />
          <h3 className="font-ieee-sans font-bold text-sm text-slate-900">
            Bandgap Reference (BGR) PTAT + CTAT Curvature &amp; Trim Explorer
          </h3>
        </div>
        <span
          className={`text-xs font-ieee-mono font-bold px-2.5 py-0.5 border ${
            tcPpmPerC < 25
              ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
              : 'bg-amber-100 text-amber-950 border-amber-300'
          }`}
        >
          Box TempCo: {tcPpmPerC.toFixed(1)} ppm/°C | V_REF(27°C) = {vNom.toFixed(4)} V
        </span>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 text-slate-900">
        <div className="lg:col-span-7 border border-slate-300 bg-[#F8FAFC] p-3">
          <div className="text-xs font-ieee-sans font-bold text-slate-900 mb-2 flex justify-between">
            <span>
              <InlineMath math="\Delta V_{REF}(T) = V_{REF}(T) - V_{REF}(27^\circ\text{C})" /> Across Temp (<InlineMath math="-40^\circ\text{C} \to 125^\circ\text{C}" />)
            </span>
            <span className="font-ieee-mono text-emerald-800">
              ΔV_pp = {((vMax - vMin) * 1000).toFixed(2)} mV
            </span>
          </div>
          <svg viewBox="0 0 430 225" className="w-full h-auto bg-white border border-slate-300">
            <line x1="55" y1="115" x2="395" y2="115" stroke="#64748B" strokeWidth="1.2" strokeDasharray="4 4" />
            <line x1="55" y1="20" x2="55" y2="195" stroke="#1E293B" strokeWidth="1.5" />
            <line x1="55" y1="195" x2="395" y2="195" stroke="#1E293B" strokeWidth="1.5" />

            <polyline points={refPolyline} fill="none" stroke="#00629B" strokeWidth="2.8" />

            <text x="48" y="118" textAnchor="end" fill="#334155" fontSize="9" fontFamily="monospace">0 mV</text>
            <text x="48" y="35" textAnchor="end" fill="#334155" fontSize="9" fontFamily="monospace">+8 mV</text>
            <text x="48" y="190" textAnchor="end" fill="#334155" fontSize="9" fontFamily="monospace">-8 mV</text>

            <text x="55" y="212" textAnchor="middle" fill="#1E293B" fontSize="10" fontWeight="bold" fontFamily="monospace">-40°C</text>
            <text x="193" y="212" textAnchor="middle" fill="#00629B" fontSize="10" fontWeight="bold" fontFamily="monospace">27°C (Room)</text>
            <text x="395" y="212" textAnchor="middle" fill="#1E293B" fontSize="10" fontWeight="bold" fontFamily="monospace">+125°C</text>
          </svg>
        </div>

        <div className="lg:col-span-5 space-y-3.5 bg-[#F8FAFC] border border-slate-300 p-4 text-xs font-ieee-sans text-slate-900">
          <div>
            <div className="flex justify-between font-semibold text-slate-900 mb-1">
              <span>Resistor Trim Ratio <InlineMath math="K = R_2 / R_1" /></span>
              <span className="font-ieee-mono font-bold text-[#00629B]">{resRatioK.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={8.5}
              max={11.5}
              step={0.05}
              value={resRatioK}
              onChange={(e) => setResRatioK(parseFloat(e.target.value))}
              className="w-full accent-[#00629B]"
            />
            <div className="text-[11px] text-slate-700 mt-0.5">
              Zero-TC condition at 300K for N={bjtRatioN}: <InlineMath math="K_{opt} = \frac{1.80\text{ mV/K}}{0.08617\text{ mV/K} \cdot \ln N} \approx " />{' '}
              <strong className="text-slate-900">{(1.8 / (0.08617 * Math.log(bjtRatioN))).toFixed(2)}</strong>
            </div>
          </div>

          <div>
            <div className="flex justify-between font-semibold text-slate-900 mb-1">
              <span>BJT Emitter Area Ratio <InlineMath math="N = A_{Q2}/A_{Q1}" /></span>
              <span className="font-ieee-mono font-bold text-slate-900">{bjtRatioN}:1</span>
            </div>
            <div className="flex gap-1.5">
              {[4, 8, 16, 24].map((nVal) => (
                <button
                  key={nVal}
                  type="button"
                  onClick={() => {
                    setBjtRatioN(nVal);
                    setResRatioK(Number((1.8 / (0.08617 * Math.log(nVal))).toFixed(2)));
                  }}
                  className={`flex-1 py-1.5 border font-ieee-mono font-bold cursor-pointer ${
                    bjtRatioN === nVal
                      ? 'bg-[#00629B] text-white border-[#00629B]'
                      : 'bg-white text-slate-800 border-slate-300'
                  }`}
                >
                  N={nVal}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between font-semibold text-slate-900 mb-1">
              <span><InlineMath math="V_{BE}" /> Nonlinear Curvature Factor</span>
              <span className="font-ieee-mono font-bold text-slate-900">{curvaturePpm.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={3.5}
              step={0.1}
              value={curvaturePpm}
              onChange={(e) => setCurvaturePpm(parseFloat(e.target.value))}
              className="w-full accent-[#00629B]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-300 font-ieee-mono">
            <div className="bg-white border border-slate-300 p-2">
              <span className="text-[11px] font-ieee-sans font-semibold text-slate-700 block">V_BE(27°C) CTAT</span>
              <span className="font-bold text-slate-900">{evalBgr(27).vCtat.toFixed(3)} V</span>
            </div>
            <div className="bg-white border border-slate-300 p-2">
              <span className="text-[11px] font-ieee-sans font-semibold text-slate-700 block">V_PTAT(27°C)</span>
              <span className="font-bold text-emerald-800">+{evalBgr(27).vPtat.toFixed(3)} V</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
