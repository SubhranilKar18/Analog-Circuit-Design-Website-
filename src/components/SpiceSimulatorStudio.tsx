import React, { useState, useEffect, useMemo } from 'react';
import {
  Play,
  Terminal,
  Cpu,
  FileCode2,
  RotateCcw,
  Sliders,
  Download,
  Copy,
  Check,
  Zap,
  Crosshair,
  ChevronRight,
  Database,
} from 'lucide-react';
import {
  initNgspiceWasmKernel,
  executeNgspiceWasmDeck,
  evaluateNgspiceCliCommand,
  NgspiceWasmSimulationBundle,
} from '../utils/ngspiceWasmEngine';

type PresetId = 'ota5t' | 'opamp2' | 'inverter' | 'ldo' | 'bgr';
type ResultTab =
  | 'ac_bode'
  | 'op_table'
  | 'tran_wave'
  | 'dc_sweep'
  | 'ngspice_cli'
  | 'raw_vectors';

const SPICE_PRESETS: Record<
  PresetId,
  {
    label: string;
    shortTag: string;
    defaultIbiasUa: number;
    defaultW1Um: number;
    defaultLUm: number;
    defaultClPf: number;
    defaultCcPf: number;
    defaultRzOhm: number;
    netlist: string;
  }
> = {
  ota5t: {
    label: '1. 5T Differential OTA (.op + .ac + .tran)',
    shortTag: '5T-OTA',
    defaultIbiasUa: 50,
    defaultW1Um: 18.5,
    defaultLUm: 0.45,
    defaultClPf: 2.0,
    defaultCcPf: 0,
    defaultRzOhm: 0,
    netlist: `* 5-Transistor CMOS Differential OTA (180nm 1.8V)
VDD vdd 0 DC 1.8
VCM vcm 0 DC 0.9
VINP vinp vcm DC 0 AC 0.5
VINN vinn vcm DC 0 AC -0.5

* Tail Bias Current & Reference
IBIAS vdd vbias DC 50u
MREF vbias vbias 0 0 NMOS_180 W=16u L=0.50u

* NMOS Differential Input Pair (gm/Id ~ 15 V^-1)
M1 vmir vinp vtail 0 NMOS_180 W=18.5u L=0.45u
M2 vout vinn vtail 0 NMOS_180 W=18.5u L=0.45u

* PMOS Active Current Mirror Load
M3 vmir vmir vdd vdd PMOS_180 W=28.0u L=0.50u
M4 vout vmir vdd vdd PMOS_180 W=28.0u L=0.50u

* NMOS Tail Current Sink
M5 vtail vbias 0 0 NMOS_180 W=16.0u L=0.50u

CL vout 0 2.0p

.model NMOS_180 NMOS (LEVEL=1 VTO=0.45 KP=270u LAMBDA=0.032)
.model PMOS_180 PMOS (LEVEL=1 VTO=-0.48 KP=75u LAMBDA=0.036)

.op
.ac dec 100 10 10G
.tran 1n 200n
.meas AC dc_gain_db MAX mag(V(vout))
.meas AC gbw_hz WHEN mag(V(vout))=1
.meas AC pm_deg FIND (180+ph(V(vout))) WHEN mag(V(vout))=1
.end`,
  },
  opamp2: {
    label: '2. Two-Stage Miller Op-Amp (.op + .ac + .tran)',
    shortTag: '2-Stage Miller',
    defaultIbiasUa: 44,
    defaultW1Um: 18.0,
    defaultLUm: 0.5,
    defaultClPf: 4.0,
    defaultCcPf: 1.4,
    defaultRzOhm: 240,
    netlist: `* Two-Stage Miller-Compensated CMOS Op-Amp with Nulling Rz
VDD vdd 0 DC 1.8
VCM vcm 0 DC 0.9
VINP vinp vcm DC 0 AC 1.0
LFB vout vinn 1G
CFB vinn vcm 1G

* Stage 1 Bias & Differential Input Pair
IBIAS vdd vbias DC 44u
M1 vmir vinp vtail 0 NMOS_180 W=18.0u L=0.50u
M2 v1   vinn vtail 0 NMOS_180 W=18.0u L=0.50u
M3 vmir vmir vdd vdd PMOS_180 W=24.0u L=0.50u
M4 v1   vmir vdd vdd PMOS_180 W=24.0u L=0.50u
M5 vtail vbias 0 0   NMOS_180 W=15.0u L=0.50u

* Stage 2 Common-Source Gain Stage + Miller Cc + Nulling Rz
M6 vout v1 vdd vdd   PMOS_180 W=78.0u L=0.36u
M7 vout vbias 0 0    NMOS_180 W=33.0u L=0.50u
RZ v1 n_cc 240
CC n_cc vout 1.4p
CL vout 0 4.0p

.model NMOS_180 NMOS (LEVEL=1 VTO=0.45 KP=270u LAMBDA=0.028)
.model PMOS_180 PMOS (LEVEL=1 VTO=-0.48 KP=75u LAMBDA=0.032)

.op
.ac dec 100 10 10G
.tran 1n 250n
.end`,
  },
  inverter: {
    label: '3. CMOS Push-Pull Inverter Amplifier (.dc VTC + .ac)',
    shortTag: 'Inverter Amp',
    defaultIbiasUa: 65,
    defaultW1Um: 6.0,
    defaultLUm: 0.36,
    defaultClPf: 1.0,
    defaultCcPf: 0,
    defaultRzOhm: 0,
    netlist: `* CMOS Push-Pull Inverter Analog Amplifier (Self-Biased at V_M)
VDD vdd 0 DC 1.8
VIN vin 0 DC 0.9 AC 1.0

MN vout vin 0 0     NMOS_180 W=6.0u L=0.36u
MP vout vin vdd vdd PMOS_180 W=21.6u L=0.36u

CL vout 0 1.0p

.model NMOS_180 NMOS (LEVEL=1 VTO=0.45 KP=270u LAMBDA=0.04)
.model PMOS_180 PMOS (LEVEL=1 VTO=-0.48 KP=75u LAMBDA=0.045)

.op
.dc VIN 0 1.8 0.03
.ac dec 100 10 10G
.end`,
  },
  ldo: {
    label: '4. PMOS Low-Dropout (LDO) Regulator (.op + .ac + .tran)',
    shortTag: 'PMOS LDO',
    defaultIbiasUa: 60,
    defaultW1Um: 24.0,
    defaultLUm: 0.5,
    defaultClPf: 10.0,
    defaultCcPf: 0,
    defaultRzOhm: 1,
    netlist: `* PMOS Low-Dropout (LDO) Linear Voltage Regulator (Vout = 1.50V)
VDD vdd 0 DC 1.8
VREF vref 0 DC 0.90
IBIAS vdd vbias DC 60u

* Error Amplifier Stage + Large PMOS Pass Device
M1 vgate vref vtail 0 NMOS_180 W=24.0u L=0.50u
M2 vgate vfb  vtail 0 NMOS_180 W=24.0u L=0.50u
MPASS vout vgate vdd vdd PMOS_180 W=800u L=0.25u

RFB1 vout vfb 20k
RFB2 vfb 0 30k
COUT vout 0 10.0p
RZ vout n_esr 1

.model NMOS_180 NMOS (LEVEL=1 VTO=0.45 KP=270u LAMBDA=0.03)
.model PMOS_180 PMOS (LEVEL=1 VTO=-0.48 KP=75u LAMBDA=0.04)

.op
.ac dec 100 10 10G
.tran 10n 500n
.end`,
  },
  bgr: {
    label: '5. Kuijk Bandgap Reference (.dc temp -40°C to +125°C)',
    shortTag: 'Bandgap BGR',
    defaultIbiasUa: 30,
    defaultW1Um: 32.0,
    defaultLUm: 0.72,
    defaultClPf: 2.0,
    defaultCcPf: 0,
    defaultRzOhm: 0,
    netlist: `* CMOS Kuijk Bandgap Voltage Reference (N = 8 PNP Ratio)
VDD vdd 0 DC 1.8
IBIAS_PTAT vdd vbias DC 30u

* PMOS Current Mirror Branches Feeding Q1 (Area=1) and Q2 (Area=8)
M1 vx vgate vdd vdd PMOS_180 W=32.0u L=0.72u
M2 vy vgate vdd vdd PMOS_180 W=32.0u L=0.72u
M3 vref vgate vdd vdd PMOS_180 W=32.0u L=0.72u

R1 vy n_q2 3.58k
R2 vref n_q3 35.9k

.model PNP_SUB PNP (IS=1e-16 BF=50)
.model PMOS_180 PMOS (LEVEL=1 VTO=-0.48 KP=75u LAMBDA=0.025)

.op
.dc temp -40 125 3
.end`,
  },
};

export interface SpiceSimulatorStudioProps {
  externalNetlist?: string;
}

export const SpiceSimulatorStudio: React.FC<SpiceSimulatorStudioProps> = ({
  externalNetlist,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<PresetId>('ota5t');
  const [netlistCode, setNetlistCode] = useState<string>(SPICE_PRESETS.ota5t.netlist);
  const [activeTab, setActiveTab] = useState<ResultTab>('ac_bode');
  const [autoSimulate, setAutoSimulate] = useState<boolean>(true);
  const [wasmReady, setWasmReady] = useState<boolean>(false);
  const [copiedNetlist, setCopiedNetlist] = useState<boolean>(false);

  // Real-time parametric sliders synced with the SPICE deck
  const [ibiasUa, setIbiasUa] = useState<number>(SPICE_PRESETS.ota5t.defaultIbiasUa);
  const [w1Um, setW1Um] = useState<number>(SPICE_PRESETS.ota5t.defaultW1Um);
  const [lUm, setLUm] = useState<number>(SPICE_PRESETS.ota5t.defaultLUm);
  const [clPf, setClPf] = useState<number>(SPICE_PRESETS.ota5t.defaultClPf);
  const [ccPf, setCcPf] = useState<number>(SPICE_PRESETS.ota5t.defaultCcPf);
  const [rzOhm, setRzOhm] = useState<number>(SPICE_PRESETS.ota5t.defaultRzOhm);

  // Interactive waveform probe cursor index (0..100%)
  const [cursorPercent, setCursorPercent] = useState<number>(62);

  // Interactive NGSpice CLI state
  const [cliInput, setCliInput] = useState<string>('print @m1[gm] @m1[id]');
  const [cliHistory, setCliHistory] = useState<Array<{ cmd: string; output: string[] }>>([
    {
      cmd: 'version -f',
      output: [
        '******',
        '** ngspice-42 WebAssembly (WASM-64 IEEE-754 f64 Linear & Nonlinear MNA Engine)',
        '** Compiled for In-Browser Interactive Analog IC Verification',
        '******',
      ],
    },
  ]);

  const [simBundle, setSimBundle] = useState<NgspiceWasmSimulationBundle>(() =>
    executeNgspiceWasmDeck(SPICE_PRESETS.ota5t.netlist)
  );

  // Initialize the in-memory WebAssembly binary kernel on mount
  useEffect(() => {
    let mounted = true;
    initNgspiceWasmKernel().then((exportsObj) => {
      if (mounted && exportsObj) {
        setWasmReady(true);
        setSimBundle(executeNgspiceWasmDeck(netlistCode));
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Sync external netlist if passed from another tool
  useEffect(() => {
    if (externalNetlist && externalNetlist.trim().length > 10) {
      setNetlistCode(externalNetlist);
      setSimBundle(executeNgspiceWasmDeck(externalNetlist));
    }
  }, [externalNetlist]);

  const simResult = simBundle.output;

  const handleLoadPreset = (id: PresetId) => {
    const preset = SPICE_PRESETS[id];
    setSelectedPreset(id);
    setIbiasUa(preset.defaultIbiasUa);
    setW1Um(preset.defaultW1Um);
    setLUm(preset.defaultLUm);
    setClPf(preset.defaultClPf);
    setCcPf(preset.defaultCcPf);
    setRzOhm(preset.defaultRzOhm);
    setNetlistCode(preset.netlist);
    setSimBundle(executeNgspiceWasmDeck(preset.netlist));
    if (id === 'bgr' || id === 'inverter') {
      setActiveTab('dc_sweep');
    } else {
      setActiveTab('ac_bode');
    }
  };

  const handleRunSpice = (overrideDeck?: string) => {
    const deckToRun = overrideDeck ?? netlistCode;
    const bundle = executeNgspiceWasmDeck(deckToRun);
    setSimBundle(bundle);
  };

  // Rewrite specific parameters in the netlist when sliders move
  const syncSlidersToNetlist = (
    nextIbias: number,
    nextW1: number,
    nextL: number,
    nextCl: number,
    nextCc: number,
    nextRz: number
  ) => {
    const lines = netlistCode.split('\n');
    const updated = lines.map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('*') || !trimmed) return line;
      const firstTok = trimmed.split(/\s+/)[0].toUpperCase();

      if (firstTok.startsWith('IBIAS')) {
        return line.replace(/DC\s+[^\s]+/i, `DC ${nextIbias}u`);
      }
      if (firstTok === 'M1' || firstTok === 'M2' || firstTok === 'MN') {
        return line
          .replace(/W\s*=\s*[^\s]+/i, `W=${nextW1.toFixed(1)}u`)
          .replace(/L\s*=\s*[^\s]+/i, `L=${nextL.toFixed(2)}u`);
      }
      if (firstTok === 'CL' || firstTok === 'COUT') {
        const toks = trimmed.split(/\s+/);
        if (toks.length >= 4) {
          toks[3] = `${nextCl.toFixed(2)}p`;
          return toks.join(' ');
        }
      }
      if (firstTok === 'CC' && nextCc > 0) {
        const toks = trimmed.split(/\s+/);
        if (toks.length >= 4) {
          toks[3] = `${nextCc.toFixed(2)}p`;
          return toks.join(' ');
        }
      }
      if (firstTok === 'RZ') {
        const toks = trimmed.split(/\s+/);
        if (toks.length >= 4) {
          toks[3] = `${Math.round(nextRz)}`;
          return toks.join(' ');
        }
      }
      return line;
    });

    const newDeck = updated.join('\n');
    setNetlistCode(newDeck);
    if (autoSimulate) {
      handleRunSpice(newDeck);
    }
  };

  const handleNetlistTextChange = (nextText: string) => {
    setNetlistCode(nextText);
    if (autoSimulate) {
      handleRunSpice(nextText);
    }
  };

  const handleExecuteCli = (cmdText?: string) => {
    const commandToRun = (cmdText ?? cliInput).trim();
    if (!commandToRun) return;
    const res = evaluateNgspiceCliCommand(commandToRun, netlistCode, simBundle);
    let activeBundle = simBundle;
    if (res.updatedNetlist) {
      setNetlistCode(res.updatedNetlist);
      activeBundle = executeNgspiceWasmDeck(res.updatedNetlist);
      setSimBundle(activeBundle);
    }
    if (res.targetTab) {
      setActiveTab(res.targetTab);
    }
    setCliHistory((prev) => [
      ...prev,
      {
        cmd: commandToRun,
        output: res.replyLines,
      },
    ]);
    if (!cmdText) {
      setCliInput('');
    }
  };

  const handleCopyNetlist = () => {
    navigator.clipboard.writeText(netlistCode);
    setCopiedNetlist(true);
    setTimeout(() => setCopiedNetlist(false), 1800);
  };

  const handleDownloadCir = () => {
    const blob = new Blob([netlistCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analog_circuit_${selectedPreset}.cir`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    const rows = [
      'freq_hz,log10_freq,mag_db,phase_deg',
      ...simResult.acResponse.map(
        (p) => `${p.freqHz.toExponential(4)},${p.logFreq},${p.magDb},${p.phaseDeg}`
      ),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ngspice_wasm_${selectedPreset}_ac.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Build SVG polylines for AC Bode Plot + Cursor probe coordinates
  const { magPolyline, phasePolyline, acCursorPoint } = useMemo(() => {
    const mPts: string[] = [];
    const pPts: string[] = [];
    const pts = simResult.acResponse;
    pts.forEach((pt) => {
      const x = 55 + ((pt.logFreq - 1) / 9) * 355;
      const yMag = 140 - (Math.max(-40, Math.min(100, pt.magDb)) / 100) * 105;
      const yPh = 205 + (Math.max(-270, Math.min(0, pt.phaseDeg)) / -270) * 85;
      mPts.push(`${x.toFixed(1)},${yMag.toFixed(1)}`);
      pPts.push(`${x.toFixed(1)},${yPh.toFixed(1)}`);
    });

    const idx = Math.min(
      pts.length - 1,
      Math.max(0, Math.round((cursorPercent / 100) * (pts.length - 1)))
    );
    const cPt = pts[idx] || { freqHz: 1e6, logFreq: 6, magDb: 0, phaseDeg: -90 };
    const cx = 55 + ((cPt.logFreq - 1) / 9) * 355;
    const cyMag = 140 - (Math.max(-40, Math.min(100, cPt.magDb)) / 100) * 105;
    const cyPh = 205 + (Math.max(-270, Math.min(0, cPt.phaseDeg)) / -270) * 85;

    return {
      magPolyline: mPts.join(' '),
      phasePolyline: pPts.join(' '),
      acCursorPoint: { ...cPt, cx, cyMag, cyPh },
    };
  }, [simResult, cursorPercent]);

  // Build SVG polyline for Transient or DC Sweep + Cursor coordinates
  const buildWavePolyline = (
    points: Array<{ x: number; yPrimary: number; ySecondary?: number }>
  ) => {
    if (points.length === 0) {
      return {
        prim: '',
        sec: '',
        xMin: 0,
        xMax: 1,
        yMin: 0,
        yMax: 1.8,
        cursor: { xVal: 0, yPrim: 0, ySec: 0, cx: 60, cy: 120 },
      };
    }
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.yPrimary);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = Math.min(...ys) * 0.96;
    const yMax = Math.max(...ys) * 1.04 + 1e-4;

    const prim = points
      .map((p) => {
        const x = 60 + ((p.x - xMin) / Math.max(1e-6, xMax - xMin)) * 350;
        const y = 210 - ((p.yPrimary - yMin) / Math.max(1e-6, yMax - yMin)) * 165;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    const sec = points
      .map((p) => {
        const x = 60 + ((p.x - xMin) / Math.max(1e-6, xMax - xMin)) * 350;
        const val = p.ySecondary ?? p.yPrimary;
        const y = 210 - ((val - yMin) / Math.max(1e-6, yMax - yMin)) * 165;
        return `${x.toFixed(1)},${Math.max(30, Math.min(220, y)).toFixed(1)}`;
      })
      .join(' ');

    const idx = Math.min(
      points.length - 1,
      Math.max(0, Math.round((cursorPercent / 100) * (points.length - 1)))
    );
    const cPt = points[idx];
    const cx = 60 + ((cPt.x - xMin) / Math.max(1e-6, xMax - xMin)) * 350;
    const cy = 210 - ((cPt.yPrimary - yMin) / Math.max(1e-6, yMax - yMin)) * 165;

    return {
      prim,
      sec,
      xMin,
      xMax,
      yMin,
      yMax,
      cursor: {
        xVal: cPt.x,
        yPrim: cPt.yPrimary,
        ySec: cPt.ySecondary ?? cPt.yPrimary,
        cx,
        cy,
      },
    };
  };

  const tranPlot = useMemo(
    () => buildWavePolyline(simResult.tranResponse.points),
    [simResult, cursorPercent]
  );
  const dcPlot = useMemo(
    () => buildWavePolyline(simResult.dcSweep.points),
    [simResult, cursorPercent]
  );

  const formatFreq = (hz: number) => {
    if (hz >= 1e9) return `${(hz / 1e9).toFixed(2)} GHz`;
    if (hz >= 1e6) return `${(hz / 1e6).toFixed(2)} MHz`;
    if (hz >= 1e3) return `${(hz / 1e3).toFixed(2)} kHz`;
    return `${hz.toFixed(1)} Hz`;
  };

  return (
    <div className="my-7 border-2 border-[#00629B] bg-white text-slate-900 font-lab-ui shadow-sm">
      {/* Top WebAssembly NGSpice Studio Header Bar */}
      <div className="bg-[#00629B] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Cpu className="w-5 h-5 shrink-0 text-sky-200" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base leading-tight text-white">
                SpiceSimulatorStudio — In-Browser WebAssembly NGSpice Engine
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-ieee-mono font-bold bg-emerald-500/25 border border-emerald-300/60 text-emerald-100">
                <Zap className="w-3 h-3" />
                {wasmReady || simBundle.stats.wasmReady
                  ? `WASM-64 MNA READY · ${simBundle.stats.execTimeMs} ms`
                  : `MNA ENGINE READY · ${simBundle.stats.execTimeMs} ms`}
              </span>
            </div>
            <p className="text-[11px] text-sky-100 mt-0.5">
              Real-time WebAssembly SPICE execution (.op / .dc / .ac / .tran / .meas) with interactive parameter sliders, crosshair probes &amp; NGSpice CLI
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-1.5 text-xs bg-[#004B76] px-2.5 py-1.5 border border-sky-400/40 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoSimulate}
              onChange={(e) => setAutoSimulate(e.target.checked)}
              className="accent-emerald-400"
            />
            <span className="font-semibold text-sky-100">Real-Time Auto-Sim</span>
          </label>

          <button
            type="button"
            onClick={() => handleRunSpice()}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow cursor-pointer transition-colors"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Run WASM NGSpice</span>
          </button>
        </div>
      </div>

      {/* Preset Selector Strip + Export Actions */}
      <div className="bg-[#F8FAFC] border-b border-slate-300 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-bold text-slate-800 mr-1">Circuit Deck Presets:</span>
          {(Object.keys(SPICE_PRESETS) as PresetId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => handleLoadPreset(id)}
              className={`px-2.5 py-1.5 font-semibold border transition-colors cursor-pointer ${
                selectedPreset === id
                  ? 'bg-[#00629B] border-[#00629B] text-white'
                  : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
              }`}
            >
              {SPICE_PRESETS[id].label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopyNetlist}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold cursor-pointer"
          >
            {copiedNetlist ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                <span className="text-emerald-800">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#00629B]" />
                <span>Copy .cir</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleDownloadCir}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#00629B]" />
            <span>.cir</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Vectors .csv</span>
          </button>
        </div>
      </div>

      {/* Real-Time Hardware-in-the-Loop Parametric Tuning Bar */}
      <div className="bg-slate-50 border-b border-slate-300 px-5 py-3">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-bold text-slate-900 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#00629B]" />
            <span>
              Real-Time Parametric Circuit Explorer (Modifies SPICE Netlist &amp; Re-Evaluates WASM MNA Matrix Live)
            </span>
          </span>
          <span className="font-ieee-mono text-[11px] text-slate-600">
            MNA Matrix: {simBundle.stats.matrixSize}×{simBundle.stats.matrixSize} · NR Iterations: {simBundle.stats.nrIterations} · Vectors: {simBundle.stats.vectorCount}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="bg-white border border-slate-300 p-2">
            <div className="flex justify-between font-semibold text-slate-800 mb-1">
              <span>I_BIAS</span>
              <span className="font-ieee-mono text-[#00629B] font-bold">{ibiasUa} μA</span>
            </div>
            <input
              type="range"
              min={10}
              max={160}
              step={2}
              value={ibiasUa}
              onChange={(e) => {
                const v = Number(e.target.value);
                setIbiasUa(v);
                syncSlidersToNetlist(v, w1Um, lUm, clPf, ccPf, rzOhm);
              }}
              className="w-full accent-[#00629B] cursor-pointer"
            />
          </div>

          <div className="bg-white border border-slate-300 p-2">
            <div className="flex justify-between font-semibold text-slate-800 mb-1">
              <span>W₁,₂ (Input)</span>
              <span className="font-ieee-mono text-[#00629B] font-bold">{w1Um.toFixed(1)} μm</span>
            </div>
            <input
              type="range"
              min={4}
              max={80}
              step={0.5}
              value={w1Um}
              onChange={(e) => {
                const v = Number(e.target.value);
                setW1Um(v);
                syncSlidersToNetlist(ibiasUa, v, lUm, clPf, ccPf, rzOhm);
              }}
              className="w-full accent-[#00629B] cursor-pointer"
            />
          </div>

          <div className="bg-white border border-slate-300 p-2">
            <div className="flex justify-between font-semibold text-slate-800 mb-1">
              <span>Length L</span>
              <span className="font-ieee-mono text-[#00629B] font-bold">{lUm.toFixed(2)} μm</span>
            </div>
            <input
              type="range"
              min={0.18}
              max={1.2}
              step={0.02}
              value={lUm}
              onChange={(e) => {
                const v = Number(e.target.value);
                setLUm(v);
                syncSlidersToNetlist(ibiasUa, w1Um, v, clPf, ccPf, rzOhm);
              }}
              className="w-full accent-[#00629B] cursor-pointer"
            />
          </div>

          <div className="bg-white border border-slate-300 p-2">
            <div className="flex justify-between font-semibold text-slate-800 mb-1">
              <span>Load C_L</span>
              <span className="font-ieee-mono text-[#00629B] font-bold">{clPf.toFixed(1)} pF</span>
            </div>
            <input
              type="range"
              min={0.4}
              max={15.0}
              step={0.2}
              value={clPf}
              onChange={(e) => {
                const v = Number(e.target.value);
                setClPf(v);
                syncSlidersToNetlist(ibiasUa, w1Um, lUm, v, ccPf, rzOhm);
              }}
              className="w-full accent-[#00629B] cursor-pointer"
            />
          </div>

          <div className="bg-white border border-slate-300 p-2">
            <div className="flex justify-between font-semibold text-slate-800 mb-1">
              <span>Miller C_C</span>
              <span className="font-ieee-mono text-[#00629B] font-bold">
                {ccPf > 0 ? `${ccPf.toFixed(1)} pF` : 'N/A'}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={6.0}
              step={0.1}
              value={ccPf}
              disabled={selectedPreset !== 'opamp2'}
              onChange={(e) => {
                const v = Number(e.target.value);
                setCcPf(v);
                syncSlidersToNetlist(ibiasUa, w1Um, lUm, clPf, v, rzOhm);
              }}
              className="w-full accent-[#00629B] cursor-pointer disabled:opacity-40"
            />
          </div>

          <div className="bg-white border border-slate-300 p-2">
            <div className="flex justify-between font-semibold text-slate-800 mb-1">
              <span>Nulling R_Z</span>
              <span className="font-ieee-mono text-[#00629B] font-bold">
                {selectedPreset === 'opamp2' ? `${rzOhm} Ω` : 'N/A'}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1000}
              step={10}
              value={rzOhm}
              disabled={selectedPreset !== 'opamp2'}
              onChange={(e) => {
                const v = Number(e.target.value);
                setRzOhm(v);
                syncSlidersToNetlist(ibiasUa, w1Um, lUm, clPf, ccPf, v);
              }}
              className="w-full accent-[#00629B] cursor-pointer disabled:opacity-40"
            />
          </div>
        </div>
      </div>

      {/* Main Split Workbench: Left = Editable SPICE Netlist, Right = Waveforms, CLI & Operating Point Table */}
      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive SPICE Netlist Editor */}
        <div className="lg:col-span-5 border border-slate-300 bg-[#F8FAFC] flex flex-col">
          <div className="px-3.5 py-2 bg-slate-100 border-b border-slate-300 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <FileCode2 className="w-4 h-4 text-[#00629B]" />
              <span>Editable NGSpice Deck ({SPICE_PRESETS[selectedPreset].shortTag}.cir)</span>
            </span>
            <button
              type="button"
              onClick={() => handleLoadPreset(selectedPreset)}
              className="inline-flex items-center gap-1 text-slate-700 hover:text-[#00629B] font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Deck</span>
            </button>
          </div>
          <textarea
            value={netlistCode}
            onChange={(e) => handleNetlistTextChange(e.target.value)}
            rows={19}
            spellCheck={false}
            className="w-full p-3.5 font-ieee-mono text-xs text-slate-900 bg-white focus:outline-none leading-relaxed resize-y"
          />
          <div className="px-3.5 py-2.5 bg-[#F8FAFC] border-t border-slate-300 flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-700">
              Edit <code className="font-ieee-mono font-bold text-[#00629B]">W=</code>,{' '}
              <code className="font-ieee-mono font-bold text-[#00629B]">L=</code>,{' '}
              <code className="font-ieee-mono font-bold text-[#00629B]">IBIAS</code>, or{' '}
              <code className="font-ieee-mono font-bold text-[#00629B]">.model</code> parameters
            </span>
            <button
              type="button"
              onClick={() => handleRunSpice()}
              className="px-3.5 py-1.5 bg-[#00629B] hover:bg-[#004B76] text-white font-bold cursor-pointer"
            >
              Simulate Now →
            </button>
          </div>
        </div>

        {/* Right: Automated .meas Strip + Multi-Tab Waveform, Operating Point & NGSpice CLI Viewer */}
        <div className="lg:col-span-7 space-y-4">
          {/* Top Automated .meas Readout Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
            {simResult.measResults.map((m, idx) => (
              <div key={idx} className="border border-slate-300 bg-[#F8FAFC] p-2.5">
                <div className="text-[10px] font-bold uppercase text-slate-600 truncate">
                  {m.name}
                </div>
                <div className="font-ieee-mono font-bold text-sm text-[#00629B] mt-0.5">
                  {m.valueStr}
                </div>
              </div>
            ))}
          </div>

          {/* Result Viewer Tabs */}
          <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 border border-slate-300 text-xs">
            {(
              [
                { id: 'ac_bode', label: '.ac Bode & Cursor' },
                { id: 'op_table', label: '.op Transistor Table' },
                { id: 'tran_wave', label: '.tran Step & Slew' },
                { id: 'dc_sweep', label: '.dc VTC / Temp Sweep' },
                { id: 'ngspice_cli', label: 'NGSpice CLI (ngspice ->)' },
                { id: 'raw_vectors', label: 'WASM Rawfile & Log' },
              ] as { id: ResultTab; label: string }[]
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-2.5 py-1.5 font-semibold transition-colors cursor-pointer ${
                  activeTab === t.id
                    ? 'bg-[#00629B] text-white'
                    : 'bg-white text-slate-800 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Interactive Waveform Cursor Control Bar (shown on plot tabs) */}
          {(activeTab === 'ac_bode' ||
            activeTab === 'tran_wave' ||
            activeTab === 'dc_sweep') && (
            <div className="bg-slate-50 border border-slate-300 px-3.5 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <Crosshair className="w-4 h-4 text-[#00629B]" />
                <span>Interactive Measurement Cursor:</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={cursorPercent}
                  onChange={(e) => setCursorPercent(Number(e.target.value))}
                  className="w-32 sm:w-44 accent-[#00629B] cursor-pointer"
                />
              </div>

              {activeTab === 'ac_bode' && (
                <div className="flex flex-wrap items-center gap-3 font-ieee-mono text-xs">
                  <span>
                    f = <strong className="text-[#00629B]">{formatFreq(acCursorPoint.freqHz)}</strong>
                  </span>
                  <span>
                    |H(jω)| = <strong className="text-[#00629B]">{acCursorPoint.magDb.toFixed(2)} dB</strong>
                  </span>
                  <span>
                    ∠H(jω) = <strong className="text-amber-700">{acCursorPoint.phaseDeg.toFixed(1)}°</strong>
                  </span>
                </div>
              )}

              {activeTab === 'tran_wave' && (
                <div className="flex flex-wrap items-center gap-3 font-ieee-mono text-xs">
                  <span>
                    t = <strong className="text-[#00629B]">{tranPlot.cursor.xVal.toFixed(1)} ns</strong>
                  </span>
                  <span>
                    V(vout) = <strong className="text-[#00629B]">{tranPlot.cursor.yPrim.toFixed(4)} V</strong>
                  </span>
                  <span>
                    V(vin) = <strong className="text-slate-700">{tranPlot.cursor.ySec.toFixed(3)} V</strong>
                  </span>
                </div>
              )}

              {activeTab === 'dc_sweep' && (
                <div className="flex flex-wrap items-center gap-3 font-ieee-mono text-xs">
                  <span>
                    X = <strong className="text-[#00629B]">{dcPlot.cursor.xVal}</strong>
                  </span>
                  <span>
                    V_out = <strong className="text-[#00629B]">{dcPlot.cursor.yPrim.toFixed(4)} V</strong>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Tab 1: .ac Bode Magnitude & Phase Plot */}
          {activeTab === 'ac_bode' && (
            <div className="border border-slate-300 bg-[#F8FAFC] p-4">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-900">
                  AC Small-Signal Frequency Response — Magnitude (dB) &amp; Phase (°)
                </span>
                <span className="font-ieee-mono font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-2 py-0.5">
                  {simResult.measResults[2]?.valueStr
                    ? `PM = ${simResult.measResults[2].valueStr}`
                    : ''}
                </span>
              </div>
              <svg viewBox="0 0 430 315" className="w-full h-auto bg-white border border-slate-300">
                {/* 0 dB line & -180 deg line */}
                <line x1="55" y1="140" x2="410" y2="140" stroke="#94A3B8" strokeDasharray="3,3" />
                <text x="48" y="143" textAnchor="end" fill="#334155" className="text-[9px] font-ieee-mono">
                  0 dB
                </text>
                <text x="48" y="55" textAnchor="end" fill="#334155" className="text-[9px] font-ieee-mono">
                  80 dB
                </text>

                <line x1="55" y1="262" x2="410" y2="262" stroke="#EF4444" strokeDasharray="3,3" />
                <text x="48" y="265" textAnchor="end" fill="#B91C1C" className="text-[9px] font-ieee-mono">
                  -180°
                </text>
                <text x="48" y="210" textAnchor="end" fill="#334155" className="text-[9px] font-ieee-mono">
                  0°
                </text>

                {/* Axes */}
                <line x1="55" y1="25" x2="55" y2="165" stroke="#334155" strokeWidth="1.5" />
                <line x1="55" y1="165" x2="410" y2="165" stroke="#334155" strokeWidth="1.5" />
                <line x1="55" y1="190" x2="55" y2="290" stroke="#334155" strokeWidth="1.5" />
                <line x1="55" y1="290" x2="410" y2="290" stroke="#334155" strokeWidth="1.5" />

                {/* Curves */}
                <polyline fill="none" stroke="#00629B" strokeWidth="2.5" points={magPolyline} />
                <polyline fill="none" stroke="#D97706" strokeWidth="2.2" points={phasePolyline} />

                {/* Interactive Crosshair Probe Line & Markers */}
                <line
                  x1={acCursorPoint.cx}
                  y1="25"
                  x2={acCursorPoint.cx}
                  y2="290"
                  stroke="#0F172A"
                  strokeWidth="1.2"
                  strokeDasharray="2,2"
                />
                <circle
                  cx={acCursorPoint.cx}
                  cy={acCursorPoint.cyMag}
                  r="4"
                  fill="#00629B"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
                <circle
                  cx={acCursorPoint.cx}
                  cy={acCursorPoint.cyPh}
                  r="4"
                  fill="#D97706"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />

                <text x="62" y="38" fill="#00629B" className="text-[10px] font-bold">
                  |V(vout)/V(vin)| [dB]
                </text>
                <text x="62" y="202" fill="#B45309" className="text-[10px] font-bold">
                  Phase ∠V(vout) [deg]
                </text>
                <text x="232" y="308" textAnchor="middle" fill="#0F172A" className="text-[10px] font-bold">
                  Frequency log₁₀(f) [10 Hz → 10 GHz]
                </text>
              </svg>
            </div>
          )}

          {/* Tab 2: .op Transistor Operating Point Table */}
          {activeTab === 'op_table' && (
            <div className="border border-slate-300 bg-white overflow-x-auto">
              <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-300 text-xs font-bold text-slate-900 flex items-center justify-between">
                <span>DC Operating Point (.op) — MOSFET BSIM/EKV Small-Signal &amp; Saturation Table</span>
                <span className="font-ieee-mono text-[11px] text-[#00629B]">
                  V(vdd) = {simResult.nodeVoltages[0]?.voltageV.toFixed(2)} V
                </span>
              </div>
              <table className="w-full text-left border-collapse text-xs text-slate-900 font-ieee-mono">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-slate-300">
                    <th className="py-2 px-2.5">Device</th>
                    <th className="py-2 px-2.5">W/L (μm)</th>
                    <th className="py-2 px-2.5">I_D (μA)</th>
                    <th className="py-2 px-2.5">g_m (μS)</th>
                    <th className="py-2 px-2.5">g_m/I_D</th>
                    <th className="py-2 px-2.5">r_o (kΩ)</th>
                    <th className="py-2 px-2.5">|V_DS| / V_dsat</th>
                    <th className="py-2 px-2.5">Region</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {simResult.transistorOps.map((t, i) => (
                    <tr key={i}>
                      <td className="py-2 px-2.5 font-bold text-[#00629B]">
                        {t.name} ({t.type})
                      </td>
                      <td className="py-2 px-2.5">
                        {t.wUm}/{t.lUm}
                      </td>
                      <td className="py-2 px-2.5 font-bold">{t.idUa}</td>
                      <td className="py-2 px-2.5">{t.gmUs}</td>
                      <td className="py-2 px-2.5 text-[#00629B] font-bold">{t.gmId}</td>
                      <td className="py-2 px-2.5">{t.roKohm}</td>
                      <td className="py-2 px-2.5">
                        {Math.abs(t.vdsV).toFixed(2)}V / {t.vdsatV.toFixed(2)}V
                      </td>
                      <td className="py-2 px-2.5">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold border ${
                            t.region.includes('Sat')
                              ? 'bg-emerald-100 border-emerald-300 text-emerald-950'
                              : 'bg-amber-100 border-amber-300 text-amber-950'
                          }`}
                        >
                          {t.region}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 3: .tran Step Response */}
          {activeTab === 'tran_wave' && (
            <div className="border border-slate-300 bg-[#F8FAFC] p-4">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-900">
                  Transient (.tran) Unity-Gain Step Response &amp; Slew Rate Trajectory
                </span>
                <span className="font-ieee-mono font-bold text-[#00629B]">
                  SR = {simResult.measResults[3]?.valueStr}
                </span>
              </div>
              <svg viewBox="0 0 430 245" className="w-full h-auto bg-white border border-slate-300">
                <line x1="60" y1="25" x2="60" y2="210" stroke="#334155" strokeWidth="1.5" />
                <line x1="60" y1="210" x2="410" y2="210" stroke="#334155" strokeWidth="1.5" />
                <polyline
                  fill="none"
                  stroke="#94A3B8"
                  strokeWidth="1.8"
                  strokeDasharray="4,3"
                  points={tranPlot.sec}
                />
                <polyline fill="none" stroke="#00629B" strokeWidth="2.6" points={tranPlot.prim} />

                {/* Interactive Crosshair */}
                <line
                  x1={tranPlot.cursor.cx}
                  y1="25"
                  x2={tranPlot.cursor.cx}
                  y2="210"
                  stroke="#0F172A"
                  strokeWidth="1.2"
                  strokeDasharray="2,2"
                />
                <circle
                  cx={tranPlot.cursor.cx}
                  cy={tranPlot.cursor.cy}
                  r="4"
                  fill="#00629B"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />

                <text x="68" y="42" fill="#00629B" className="text-[10px] font-bold">
                  Solid Blue: V(vout) · Dashed Gray: Input Step V(vin)
                </text>
                <text x="52" y="35" textAnchor="end" fill="#0F172A" className="text-[9px] font-ieee-mono">
                  {tranPlot.yMax.toFixed(2)}V
                </text>
                <text x="52" y="210" textAnchor="end" fill="#0F172A" className="text-[9px] font-ieee-mono">
                  {tranPlot.yMin.toFixed(2)}V
                </text>
                <text x="235" y="232" textAnchor="middle" fill="#0F172A" className="text-[10px] font-bold">
                  {simResult.tranResponse.xLabel} (0 → {tranPlot.xMax.toFixed(0)} ns)
                </text>
              </svg>
            </div>
          )}

          {/* Tab 4: .dc Sweep */}
          {activeTab === 'dc_sweep' && (
            <div className="border border-slate-300 bg-[#F8FAFC] p-4">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-900">
                  DC Sweep (.dc) — {simResult.dcSweep.yLabel} vs. {simResult.dcSweep.xLabel}
                </span>
              </div>
              <svg viewBox="0 0 430 245" className="w-full h-auto bg-white border border-slate-300">
                <line x1="60" y1="25" x2="60" y2="210" stroke="#334155" strokeWidth="1.5" />
                <line x1="60" y1="210" x2="410" y2="210" stroke="#334155" strokeWidth="1.5" />
                <polyline fill="none" stroke="#00629B" strokeWidth="2.6" points={dcPlot.prim} />

                {/* Interactive Crosshair */}
                <line
                  x1={dcPlot.cursor.cx}
                  y1="25"
                  x2={dcPlot.cursor.cx}
                  y2="210"
                  stroke="#0F172A"
                  strokeWidth="1.2"
                  strokeDasharray="2,2"
                />
                <circle
                  cx={dcPlot.cursor.cx}
                  cy={dcPlot.cursor.cy}
                  r="4"
                  fill="#00629B"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />

                <text x="52" y="35" textAnchor="end" fill="#0F172A" className="text-[9px] font-ieee-mono">
                  {dcPlot.yMax.toFixed(3)}V
                </text>
                <text x="52" y="210" textAnchor="end" fill="#0F172A" className="text-[9px] font-ieee-mono">
                  {dcPlot.yMin.toFixed(3)}V
                </text>
                <text x="235" y="232" textAnchor="middle" fill="#0F172A" className="text-[10px] font-bold">
                  {simResult.dcSweep.xLabel} ({dcPlot.xMin} → {dcPlot.xMax})
                </text>
              </svg>
            </div>
          )}

          {/* Tab 5: Interactive NGSpice CLI Console */}
          {activeTab === 'ngspice_cli' && (
            <div className="border border-slate-300 bg-[#F8FAFC] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-[#00629B]" />
                  <span>Interactive NGSpice-42 WebAssembly Shell (ngspice -&gt;)</span>
                </span>
                <div className="flex flex-wrap gap-1">
                  {[
                    'op',
                    'display',
                    'print @m1[gm] @m1[id]',
                    'alter ibias = 80u',
                    'status',
                    'help',
                  ].map((quickCmd) => (
                    <button
                      key={quickCmd}
                      type="button"
                      onClick={() => handleExecuteCli(quickCmd)}
                      className="px-2 py-0.5 bg-white border border-slate-300 hover:bg-slate-100 font-ieee-mono text-[11px] text-[#00629B] font-semibold cursor-pointer"
                    >
                      {quickCmd}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-slate-300 p-3 font-ieee-mono text-xs text-slate-900 max-h-64 overflow-y-auto space-y-2.5">
                {cliHistory.map((item, idx) => (
                  <div key={idx}>
                    <div className="font-bold text-[#00629B]">
                      ngspice {idx + 1} -&gt; {item.cmd}
                    </div>
                    <div className="pl-3 mt-0.5 space-y-0.5 text-slate-800">
                      {item.output.map((line, lIdx) => (
                        <div key={lIdx} className="whitespace-pre-wrap">
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleExecuteCli();
                }}
                className="flex items-center gap-2"
              >
                <div className="flex-1 flex items-center bg-white border border-slate-300 px-3 py-1.5">
                  <span className="font-ieee-mono text-xs font-bold text-[#00629B] mr-2 shrink-0">
                    ngspice {cliHistory.length + 1} -&gt;
                  </span>
                  <input
                    type="text"
                    value={cliInput}
                    onChange={(e) => setCliInput(e.target.value)}
                    placeholder="Type ngspice command (e.g. print all, display, alter ibias = 90u, status, help)..."
                    className="w-full font-ieee-mono text-xs text-slate-900 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-[#00629B] hover:bg-[#004B76] text-white text-xs font-bold cursor-pointer"
                >
                  <span>Execute</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}

          {/* Tab 6: WASM Rawfile Vector Table & Raw Output Log */}
          {activeTab === 'raw_vectors' && (
            <div className="space-y-3">
              <div className="border border-slate-300 bg-white overflow-x-auto">
                <div className="px-3.5 py-2 bg-slate-100 border-b border-slate-300 text-xs font-bold text-slate-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-[#00629B]" />
                    <span>WASM Linear Memory Rawfile Vector Store (plot: wasm_sim_1)</span>
                  </span>
                  <span className="font-ieee-mono text-[11px] text-slate-700">
                    {(simBundle.stats.wasmMemoryBytes / 1024).toFixed(0)} KiB Page Allocated
                  </span>
                </div>
                <table className="w-full text-left border-collapse text-xs font-ieee-mono text-slate-900">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-slate-300">
                      <th className="py-1.5 px-2.5">Vector Name</th>
                      <th className="py-1.5 px-2.5">Type</th>
                      <th className="py-1.5 px-2.5">Length</th>
                      <th className="py-1.5 px-2.5">Unit</th>
                      <th className="py-1.5 px-2.5">Min Value</th>
                      <th className="py-1.5 px-2.5">Max Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {simBundle.vectors.map((v, i) => (
                      <tr key={i}>
                        <td className="py-1.5 px-2.5 font-bold text-[#00629B]">{v.name}</td>
                        <td className="py-1.5 px-2.5">{v.type}</td>
                        <td className="py-1.5 px-2.5">{v.length}</td>
                        <td className="py-1.5 px-2.5">{v.unit}</td>
                        <td className="py-1.5 px-2.5">{v.minVal.toPrecision(4)}</td>
                        <td className="py-1.5 px-2.5">{v.maxVal.toPrecision(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <pre className="bg-white border border-slate-300 text-slate-900 font-ieee-mono text-[11px] p-4 overflow-x-auto leading-relaxed max-h-64">
                <code>{simResult.rawLog}</code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
