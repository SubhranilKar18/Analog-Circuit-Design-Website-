import React, { useState } from 'react';
import { SectionHeading, SubSectionHeading, SpiceNetlistBox, InlineMath } from './Math';
import { SpiceSimulatorStudio } from './SpiceSimulatorStudio';
import { Terminal, Wrench, AlertTriangle, CheckCircle2, Cpu, FileCode2, Layers } from 'lucide-react';

export const EdaAndLtspiceView: React.FC = () => {
  const [activeCircuitTab, setActiveCircuitTab] = useState<'inverter' | 'ota5t' | 'opamp2' | 'ldo' | 'bgr'>('ota5t');

  const edaTools = [
    {
      name: 'Cadence Virtuoso Studio & Spectre / APS',
      category: 'Commercial Industry Standard (Foundry Signoff)',
      whenToUse:
        'Used by >80% of commercial analog/mixed-signal semiconductor companies for schematic capture (Composer), layout (Layout XL with connectivity-driven LVS), and golden SPICE/RF simulation (Spectre, Spectre RF, PSS/PAC).',
      installAndFirstSim: [
        'Accessed via university/corporate Linux server (RHEL/Rocky Linux) with commercial PDK (e.g., TSMC 180nm/65nm/28nm).',
        'Source your setup script (source cshrc.cadence) and launch with virtuoso & in your project workspace directory.',
        'Open Library Manager -> File -> New -> CellView (schematic), press "i" to instantiate nmos4/pmos4 from analogLib or foundry PDK, wire with "w", and launch ADE Explorer / Assembler to run dc, ac, tran, stb (loop stability), and pss.',
      ],
    },
    {
      name: 'Synopsys Custom Compiler & HSPICE / FineSim',
      category: 'Commercial Golden Reference Simulator & Layout Suite',
      whenToUse:
        'HSPICE is the semiconductor industry’s historical golden reference for ultra-accurate BSIM/FinFET transistor modeling, high-speed memory/SerDes characterization, and PVT/Monte Carlo signoff.',
      installAndFirstSim: [
        'Run batch netlist simulations from terminal via hspice input_circuit.sp -o output.lis.',
        'Use Synopsys WaveView (wv &) or Custom Compiler SAE to inspect .tr0 (transient), .ac0 (AC), and .sw0 (DC sweep) binary waveforms.',
        'Include foundry corner blocks using .lib "models_180nm.lib" TT.',
      ],
    },
    {
      name: 'Siemens EDA Tanner (S-Edit, T-Spice, L-Edit)',
      category: 'Commercial Mid-Market, MEMS & Academic IC Suite',
      whenToUse:
        'Fast learning curve on Windows/Linux; widely used for sensors, MEMS interface ASICs, BCD power management ICs, and university tapeout classes.',
      installAndFirstSim: [
        'Launch S-Edit, import your foundry OpenAccess/Tanner PDK library, place MOSFETs, and attach SPICE model libraries in T-Spice setup.',
        'Use L-Edit for DRC-driven physical polygon layout and Calibre/HiPer Verify for LVS.',
      ],
    },
    {
      name: 'Xschem + ngspice + Magic / KLayout (Open-Source Silicon Tapeout Stack)',
      category: '100% Free & Open-Source Foundry Flow (SkyWater SKY130 & GF180MCU)',
      whenToUse:
        'The premier open-source IC design flow capable of real silicon tapeouts (via Efabless ChipIgnite / TinyTapeout). Uses real manufacturable foundry PDKs (130nm SKY130 and 180nm GF180MCU).',
      installAndFirstSim: [
        'Install via IIC-OSIC-TOOLS Docker container (docker run -it hpretl/iic-osic-tools) or install xschem, ngspice, magic, netgen, and open_pdks via Ubuntu/macOS package managers.',
        'Launch with xschem --rcfile $PDK_ROOT/sky130A/libs.tech/xschem/xschemrc.',
        'Place sky130_fd_pr/nfet_01v8 and pfet_01v8 symbols, click "Netlist", and click "Simulate" to invoke ngspice interactively.',
      ],
    },
    {
      name: 'LTspice (Analog Devices)',
      category: 'Free Desktop SPICE Simulator (Fastest Learning & Prototyping)',
      whenToUse:
        'Best tool for rapid equation verification, learning analog IC topologies, generating gm/Id lookup curves, and testing loop stability on Windows/macOS before moving to full Cadence/Xschem layout.',
      installAndFirstSim: [
        'Download free from analog.com/ltspice (native Windows & macOS installers).',
        'Press Ctrl+N for a new schematic, press F2 and select "nmos4" / "pmos4", press "S" to drop a .model or .include SPICE directive, and click the "Run" (running person) icon.',
      ],
    },
    {
      name: 'Python (NumPy, SciPy, Matplotlib, PySpice / NgSpice-Py)',
      category: 'Data-Driven gm/Id Sizing, Optimization & AI Agent Automation',
      whenToUse:
        'Essential for modern gm/Id table interpolation, automated ngspice batch sweeps, post-processing Monte Carlo histograms, and building LLM/Bayesian Optimization sizing agents.',
      installAndFirstSim: [
        'Install with pip install numpy scipy matplotlib pandas PySpice.',
        'Invoke ngspice in batch mode via subprocess.run(["ngspice", "-b", "-r", "rawfile.raw", "netlist.cir"]) and parse .meas outputs in Python.',
      ],
    },
    {
      name: 'MATLAB & Simulink (Mixed-Signal & Control Loop Modeling)',
      category: 'System-Level Behavioral Modeling & gm/Id Toolkit',
      whenToUse:
        'Used with Boris Murmann’s open-source MATLAB gm/Id Starter Kit (lookup.m) and for behavioral modeling of PLLs, Delta-Sigma ADCs, and LDO pole-zero trajectories.',
      installAndFirstSim: [
        'Download the Murmann gm/Id Starter Kit scripts, load 180nm/65nm .mat structures, and call gm_id = lookup(nch, "GM_ID", "ID_W", id_w, "L", 0.36).',
      ],
    },
  ];

  const ltspiceStepCards = [
    {
      step: 'Step 1',
      title: 'Interface Tour & Essential Keyboard Shortcuts',
      shortcut: 'F2 (Component) · F3 (Wire) · F4 (Net Name) · G (GND) · S (SPICE Directive)',
      body: 'Never waste time hunting through menus. Press F2 to place components, F3 to draw wires, G to drop reference Ground (Node 0), F4 to label nodes (e.g., vout, vinp, vmir, vtail), Ctrl+R to rotate, Ctrl+E to mirror (crucial for current mirrors!), and S to insert SPICE directives (.op, .ac, .model).',
    },
    {
      step: 'Step 2',
      title: 'Always Use 4-Terminal MOSFET Symbols (nmos4 & pmos4)',
      shortcut: 'Right-Click Symbol → Set W, L, AD, AS, PD, PS',
      body: 'The default 3-terminal "nmos" symbol in LTspice hides the bulk terminal and defaults to a discrete power MOSFET! For IC design, ALWAYS press F2 and choose "nmos4" and "pmos4". Connect NMOS bulk to GND (or source if triple-well) and PMOS bulk to VDD. Right-click the symbol to set Model Name, Length (L), and Width (W).',
    },
    {
      step: 'Step 3',
      title: 'Where to Get Realistic IC Transistor Models (.include / .lib)',
      shortcut: '.include sky130_tt.pm  or  .lib "gf180mcu.lib" typical',
      body: 'You can use three tiers of models in LTspice/ngspice: (1) Built-in calibrated LEVEL=1 / LEVEL=3 models for textbook hand-calc matching; (2) ASU Predictive Technology Models (PTM 180nm, 65nm, 45nm BSIM4 files); or (3) Real foundry open PDKs (SkyWater SKY130 and GlobalFoundries GF180MCU). Place the model file in the same folder as your .asc schematic and press "S" to add .include model_file.txt.',
    },
    {
      step: 'Step 4',
      title: 'Master the 7 Core SPICE Simulation Directives',
      shortcut: '.op · .dc · .ac · .tran · .noise · .step · .temp',
      body: 'Every analog verification flow runs in sequence: (1) .op checks DC bias currents and Vds - Vdsat margins in the Error Log (Ctrl+L); (2) .dc sweeps input range or generates gm/Id curves; (3) .ac sweeps frequency (dec 100 1 1G) for Gain, GBW, PM, and PSRR; (4) .tran checks large-signal Slew Rate and step overshoot; (5) .noise computes input-referred thermal/1/f noise; and (6) .step / .temp sweeps parameters and temperature (-40 to 125°C).',
    },
  ];

  const circuitNetlists: Record<
    typeof activeCircuitTab,
    { title: string; filename: string; guide: string[]; netlist: string }
  > = {
    inverter: {
      title: 'Circuit 1: CMOS Inverter (VTC Sweep + Analog Push-Pull Amplifier)',
      filename: 'ltspice_01_cmos_inverter.cir',
      guide: [
        'Place one pmos4 (M_P) above one nmos4 (M_N). Connect M_P source and bulk to vdd (1.8V), and M_N source and bulk to 0 (GND).',
        'Tie both gates together as vin and both drains together as vout with C_L = 1 pF to GND.',
        'Run the .dc sweep first to observe the VTC switching threshold V_M = 0.90 V and peak gain |d(V(vout))| > 30 V/V.',
      ],
      netlist: `* LTspice / ngspice Complete Netlist: 180nm CMOS Inverter Amplifier
.param VDD_VAL = 1.8
VDD vdd 0 DC {VDD_VAL}
VIN vin 0 DC 0.90 AC 1

* Complementary Push-Pull Stage (Sized for V_M = 0.90V)
MP vout vin vdd vdd PMOS_180 W=4.3u L=0.54u
MN vout vin 0   0   NMOS_180 W=1.3u L=0.54u
CL vout 0 1.0p

.model NMOS_180 NMOS (LEVEL=1 VTO=0.45 KP=270u LAMBDA=0.028)
.model PMOS_180 PMOS (LEVEL=1 VTO=-0.48 KP=75u LAMBDA=0.032)

* Uncomment .dc for VTC or .ac for small-signal Bode plot:
* .dc VIN 0 1.8 0.002
.op
.ac dec 100 100 1G
.meas AC gain_db MAX mag(V(vout))
.meas AC gbw_hz WHEN mag(V(vout))=1
.end`,
    },
    ota5t: {
      title: 'Circuit 2: 5-Transistor (5T) Differential OTA with Automated .meas',
      filename: 'ltspice_02_5t_ota.cir',
      guide: [
        'Place NMOS input pair M1, M2 sharing common tail node vtail driven by tail current source M5.',
        'Place PMOS active load M3, M4 at the top; mirror M3 (gate tied to drain at vmir) and take single-ended output at vout (drain of M2 and M4).',
        'After running, press Ctrl+L in LTspice to view the SPICE Error Log containing exact .meas results for DC Gain, GBW, and Phase Margin.',
      ],
      netlist: `* LTspice / ngspice Complete Netlist: 180nm 5-Transistor (5T) OTA
.param VDD_VAL = 1.8
.param VCM_VAL = 0.9

VDD vdd 0 DC {VDD_VAL}
VCM vcm 0 DC {VCM_VAL}
VINP vinp vcm DC 0 AC 0.5
VINN vinn vcm DC 0 AC -0.5

* Bias Reference Branch (62.8uA Tail Current)
IBIAS vdd vbias DC 62.8u
MREF vbias vbias 0 0 NMOS_180 W=5.6u L=0.36u

* 5T OTA Core
M1 vmir vinp vtail 0 NMOS_180 W=8.4u L=0.36u
M2 vout vinn vtail 0 NMOS_180 W=8.4u L=0.36u
M3 vmir vmir vdd vdd PMOS_180 W=10.1u L=0.54u
M4 vout vmir vdd vdd PMOS_180 W=10.1u L=0.54u
M5 vtail vbias 0 0 NMOS_180 W=5.6u L=0.36u

CL vout 0 2.0p

.model NMOS_180 NMOS (LEVEL=1 VTO=0.45 KP=270u LAMBDA=0.035)
.model PMOS_180 PMOS (LEVEL=1 VTO=-0.48 KP=75u LAMBDA=0.028)

.op
.ac dec 100 10 1G
.meas AC dc_gain_db MAX mag(V(vout))
.meas AC gbw_hz WHEN mag(V(vout))=1
.meas AC pm_deg FIND (180+ph(V(vout))) WHEN mag(V(vout))=1
.end`,
    },
    opamp2: {
      title: 'Circuit 3: Two-Stage Miller Op-Amp with Nulling Resistor Rz',
      filename: 'ltspice_03_twostage_opamp.cir',
      guide: [
        'Cascade the 5T OTA first stage (output node n_stg1) into a common-source PMOS second stage M6 loaded by current sink M7.',
        'Connect Miller compensation capacitor C_c = 1.25 pF in series with nulling resistor R_z = 442 Ω between n_stg1 and vout.',
        'Use the L_big = 1 GH, C_big = 1 GF feedback loop to lock DC V(vout) = VCM = 0.90 V automatically.',
      ],
      netlist: `* LTspice / ngspice Complete Netlist: Two-Stage Miller Op-Amp (DC-Closed / AC-Open Loop)
VDD vdd 0 DC 1.8
VCM vcm 0 DC 0.9
VAC in_ac 0 DC 0 AC 1

* DC-Closed / AC-Open Loop Stability Network
L_BIG vout vinn 1G
C_BIG in_ac vinn 1G

* Bias Network
IBIAS vdd vbias 30u
M8 vbias vbias 0 0 NMOS_180 W=6.0u L=0.36u

* Stage 1: Differential Pair + Active Mirror
M1 n_mir vcm n_tail 0 NMOS_180 W=6.5u L=0.36u
M2 n_stg1 vinn n_tail 0 NMOS_180 W=6.5u L=0.36u
M3 n_mir n_mir vdd vdd PMOS_180 W=8.0u L=0.36u
M4 n_stg1 n_mir vdd vdd PMOS_180 W=8.0u L=0.36u
M5 n_tail vbias 0 0 NMOS_180 W=6.0u L=0.36u

* Stage 2: Common-Source Output Stage (Matched Current Density to M3/M4)
M6 vout n_stg1 vdd vdd PMOS_180 W=96.0u L=0.36u
M7 vout vbias 0 0 NMOS_180 W=36.0u L=0.36u

* Miller Compensation (Cc + Nulling Resistor Rz)
RZ n_stg1 n_c 442
CC n_c vout 1.25p
CL vout 0 5.0p

.model NMOS_180 NMOS (LEVEL=1 VTO=0.45 KP=270u LAMBDA=0.035)
.model PMOS_180 PMOS (LEVEL=1 VTO=-0.48 KP=75u LAMBDA=0.040)

.op
.ac dec 100 1 1G
.meas AC av0_db MAX mag(V(vout))
.meas AC gbw_hz WHEN mag(V(vout))=1
.meas AC pm_deg FIND (180+ph(V(vout))) WHEN mag(V(vout))=1
.end`,
    },
    ldo: {
      title: 'Circuit 4: PMOS-Pass Low-Dropout Regulator (LDO) — PSRR & Load Transient',
      filename: 'ltspice_04_pmos_ldo.cir',
      guide: [
        'Wire the Error Amplifier with V_REF = 1.20 V on the inverting (-) input and V_fb from R_fb1/R_fb2 on the non-inverting (+) input (since the PMOS pass stage inverts).',
        'Include C_out = 1 μF with explicit series resistor R_ESR = 0.8 Ω to observe the stabilizing LHP ESR zero.',
        'Run .tran to observe load transient droop when I_load steps from 100 μA to 20 mA in 100 ns.',
      ],
      netlist: `* LTspice / ngspice Complete Netlist: PMOS Low-Dropout Regulator (LDO)
VIN vin 0 DC 1.8 AC 1
VREF vref 0 DC 1.20

* Behavioral Error Amplifier (Av = 60dB, Rout = 150k, Pole = 20kHz)
E_EA n_ea 0 VALUE = { LIMIT(1000*(V(vfb) - V(vref)), 0, V(vin)) }
R_EA n_ea vgate 150k
C_EA vgate 0 50f

* PMOS Pass Device (W = 2667um, L = 0.20um)
MPASS vout vgate vin vin PMOS_180 W=2667u L=0.20u

* Feedback Divider (Vout = 1.50V, Bleed = 15uA)
RFB1 vout vfb 20k
RFB2 vfb 0 80k

* Output Capacitor with Stabilizing ESR
COUT vout n_esr 1.0u
RESR n_esr 0 0.80

* Dynamic Load Current Step (100uA -> 20mA -> 100uA)
ILOAD vout 0 PULSE(100u 20m 5u 100n 100n 20u 50u)

.model PMOS_180 PMOS (LEVEL=1 VTO=-0.48 KP=75u LAMBDA=0.05)

.tran 20n 50u
.meas TRAN vout_nom FIND V(vout) AT 4u
.meas TRAN vout_min MIN V(vout) FROM 5u TO 15u
.meas TRAN load_reg_mv PARAM (vout_nom - vout_min)*1000
.end`,
    },
    bgr: {
      title: 'Circuit 5: Bandgap Voltage Reference (BGR) Temperature Sweep (-40°C to +125°C)',
      filename: 'ltspice_05_bandgap_bgr.cir',
      guide: [
        'Use PNP BJT Q1 (area=1) and Q2 (area=8) driven by equal PMOS current mirror branches.',
        'Set R_1 = 3.58 kΩ and R_2 = 36.0 kΩ (ratio K = 10.05) to cancel the -1.80 mV/K CTAT slope of V_BE at 27°C.',
        'Run .dc temp -40 125 1 and check the SPICE Error Log for the automated Box-Method ppm/°C measurement!',
      ],
      netlist: `* LTspice / ngspice Complete Netlist: Kuijk Bandgap Reference (-40C to 125C Sweep)
VDD vdd 0 DC 1.8

* Equal-Current PTAT Core Driven by Clamped Op-Amp Loop
I_PTAT1 vdd vx DC 15u
I_PTAT2 vdd vy DC 15u
G_OPAMP vdd vref VALUE = { 1e-3 * (V(vy) - V(vx)) }

* Branch 1: Unit PNP BJT (Area = 1)
Q1 0 0 vx PNP_SUB AREA=1

* Branch 2: 8x Area PNP BJT + R1 (Drops dVbe = VT*ln(8) = 53.8mV)
R1 vy n_q2 3.583k
Q2 0 0 n_q2 PNP_SUB AREA=8

* Output Reference Branch: Vref = Vbe3 + (R2/R1)*dVbe
I_OUT vdd vref DC 15u
R2 vref n_q3 36.01k
Q3 0 0 n_q3 PNP_SUB AREA=1

.model PNP_SUB PNP (IS=1e-16 BF=100 VAF=50 EG=1.12 XTI=3)

.dc temp -40 125 1
.meas DC vref_27 FIND V(vref) AT 27
.meas DC vref_max MAX V(vref)
.meas DC vref_min MIN V(vref)
.meas DC tc_ppm_per_c PARAM ((vref_max - vref_min) / (vref_27 * 165)) * 1e6
.end`,
    },
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="border-b-2 border-[#00629B] pb-5 mb-8">
        <div className="text-xs font-ieee-sans font-semibold text-[#00629B] uppercase tracking-wider">
          Section X · Practical CAD Environment & Simulation Masterclass
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
          Analog IC EDA Toolchain & Complete LTspice / ngspice Beginner-to-Pro Guide
        </h1>
        <p className="text-sm md:text-base text-slate-700 mt-2">
          When to use commercial foundry suites versus open-source silicon flows, how to install and configure PDK models, and how to simulate and extract every analog metric using automated <code className="font-ieee-mono text-xs bg-slate-100 px-1.5 py-0.5">.meas</code> scripts.
        </p>
      </div>

      {/* Part I: EDA Toolchain Comparison */}
      <SectionHeading
        id="eda-tools"
        roman="I"
        title="Best Analog IC Design Tools & When to Use Each"
        subtitle="Commercial Foundry Signoff Suites vs. Open-Source Silicon Flows (SKY130 / GF180MCU) & Scripting Tools"
      />

      <div className="space-y-4 my-6">
        {edaTools.map((tool, idx) => (
          <div key={idx} className="border border-slate-300 bg-white p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 pb-2.5 mb-3">
              <h3 className="text-lg font-bold text-[#00629B] flex items-center gap-2">
                <Cpu className="w-4 h-4 shrink-0" />
                <span>{tool.name}</span>
              </h3>
              <span className="text-xs font-ieee-sans text-slate-600 font-medium">{tool.category}</span>
            </div>
            <p className="text-sm text-slate-800 mb-3">
              <strong className="font-ieee-sans text-slate-900">When to Use: </strong>
              {tool.whenToUse}
            </p>
            <div className="bg-[#F8FAFC] border border-slate-200 p-3.5">
              <div className="text-xs font-ieee-sans font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#00629B]" />
                <span>Beginner Setup & First Simulation Steps:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-xs md:text-sm text-slate-700">
                {tool.installAndFirstSim.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          </div>
        ))}
      </div>

      {/* Part II: LTspice Step-by-Step Beginner Guide */}
      <SectionHeading
        id="ltspice-guide"
        roman="II"
        title="LTspice Absolute Beginner Walkthrough (Step Cards)"
        subtitle="From Fresh Installation and PDK Model Inclusion (.include / .lib) to 4-Terminal MOSFET Wiring"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-6">
        {ltspiceStepCards.map((card, idx) => (
          <div key={idx} className="border border-slate-300 bg-white flex flex-col justify-between">
            <div className="p-4">
              <div className="flex items-center justify-between text-xs font-ieee-sans font-bold text-[#00629B] border-b border-slate-200 pb-2 mb-2.5">
                <span>{card.step}: {card.title}</span>
              </div>
              <div className="bg-slate-100 border border-slate-300 text-[#00629B] font-bold font-ieee-mono text-[11px] px-2.5 py-1.5 mb-3">
                {card.shortcut}
              </div>
              <p className="text-xs md:text-sm text-slate-700 leading-relaxed">{card.body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Open PDK & BSIM Model Integration Card */}
      <SubSectionHeading index="II-A." title="How to Load SKY130, GF180MCU, or BSIM4 Models in LTspice & ngspice" />
      <div className="border border-slate-300 bg-[#F8FAFC] p-5 my-4 text-sm space-y-3">
        <p className="text-slate-800">
          To simulate with real integrated circuit transistors instead of discrete power MOSFETs, download either a single-file Predictive Technology Model (e.g., <code className="font-ieee-mono text-xs bg-white border border-slate-200 px-1.5 py-0.5">180nm_bsim4.pm</code> from ASU PTM) or an open-source foundry model from <strong>SkyWater SKY130</strong> / <strong>GlobalFoundries GF180MCU</strong>:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-ieee-sans">
          <div className="bg-white border border-slate-200 p-3.5">
            <div className="font-bold text-[#00629B] mb-1">1. Place nmos4 & pmos4</div>
            <p className="text-slate-600">
              Press <code className="font-ieee-mono">F2</code>, choose <code className="font-ieee-mono">nmos4</code>, Ctrl+Right-Click the symbol, and set <code className="font-ieee-mono">Value = NMOS_180</code> (or <code className="font-ieee-mono">sky130_fd_pr__nfet_01v8</code> if using a <code className="font-ieee-mono">.subckt</code> with <code className="font-ieee-mono">Prefix = X</code>).
            </p>
          </div>
          <div className="bg-white border border-slate-200 p-3.5">
            <div className="font-bold text-[#00629B] mb-1">2. Add .include or .lib</div>
            <p className="text-slate-600">
              Press <code className="font-ieee-mono">S</code> and enter <code className="font-ieee-mono">.include models_180nm.lib</code> (for single model files) or <code className="font-ieee-mono">.lib "sky130.lib.spice" tt</code> (for corner libraries).
            </p>
          </div>
          <div className="bg-white border border-slate-200 p-3.5">
            <div className="font-bold text-[#00629B] mb-1">3. Parameterize W and L</div>
            <p className="text-slate-600">
              Set <code className="font-ieee-mono">L={'{L_VAL}'}</code> and <code className="font-ieee-mono">W={'{W_VAL}'}</code> in curly braces so you can sweep geometry using <code className="font-ieee-mono">.step param W_VAL 2u 20u 2u</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Part III: Built-In Live SPICE Simulator & Step-by-Step Netlist Library */}
      <SectionHeading
        id="ltspice-netlists"
        roman="III"
        title="Built-In Live SPICE Simulator & Step-by-Step Netlist Workbench"
        subtitle="Edit any SPICE netlist directly in the browser to run .op, .dc, .ac, .tran, and .meas or copy-paste into LTspice / ngspice"
      />

      <SpiceSimulatorStudio />

      <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 border border-slate-300 my-4">
        {(
          [
            { id: 'inverter', label: '1. CMOS Inverter' },
            { id: 'ota5t', label: '2. 5T OTA' },
            { id: 'opamp2', label: '3. Two-Stage Op-Amp' },
            { id: 'ldo', label: '4. PMOS LDO Regulator' },
            { id: 'bgr', label: '5. Bandgap Reference (BGR)' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveCircuitTab(tab.id)}
            className={`px-3.5 py-2 text-xs font-ieee-sans font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeCircuitTab === tab.id
                ? 'bg-[#00629B] text-white'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="border border-slate-300 bg-white p-5">
        <h3 className="text-base font-bold text-slate-900 mb-2">
          {circuitNetlists[activeCircuitTab].title}
        </h3>
        <ul className="list-disc list-inside space-y-1 text-xs md:text-sm text-slate-700 mb-4">
          {circuitNetlists[activeCircuitTab].guide.map((g, i) => (
            <li key={i}>{g}</li>
          ))}
        </ul>
        <SpiceNetlistBox
          title={circuitNetlists[activeCircuitTab].title}
          filename={circuitNetlists[activeCircuitTab].filename}
          netlist={circuitNetlists[activeCircuitTab].netlist}
        />
      </div>

      {/* Part IV: Automated .meas Measurement Cookbook */}
      <SectionHeading
        id="meas-cookbook"
        roman="IV"
        title="Automated SPICE .meas Recipes for Every Specification"
        subtitle="Extract exact numerical figures of merit in the SPICE Error Log without manual cursor dragging"
      />

      <div className="overflow-x-auto border border-slate-300 my-5">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 font-ieee-sans text-slate-800">
              <th className="py-2.5 px-3">Circuit Metric</th>
              <th className="py-2.5 px-3">Analysis</th>
              <th className="py-2.5 px-3">Copy-Paste SPICE .meas Directive</th>
              <th className="py-2.5 px-3">What It Computes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-ieee-mono">
            <tr>
              <td className="py-2.5 px-3 font-ieee-sans font-semibold">DC Open-Loop Gain (dB)</td>
              <td className="py-2.5 px-3">.ac</td>
              <td className="py-2.5 px-3 text-[#00629B]">.meas AC av0_db MAX mag(V(vout))</td>
              <td className="py-2.5 px-3 font-ieee-sans text-slate-600">Peak small-signal magnitude in dB</td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-ieee-sans font-semibold">Unity-Gain Bandwidth (GBW)</td>
              <td className="py-2.5 px-3">.ac</td>
              <td className="py-2.5 px-3 text-[#00629B]">.meas AC gbw_hz WHEN mag(V(vout))=1</td>
              <td className="py-2.5 px-3 font-ieee-sans text-slate-600">Frequency where |V(vout)| crosses 1 V/V (0 dB)</td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-ieee-sans font-semibold">Phase Margin (PM)</td>
              <td className="py-2.5 px-3">.ac</td>
              <td className="py-2.5 px-3 text-[#00629B]">.meas AC pm_deg FIND (180+ph(V(vout))) WHEN mag(V(vout))=1</td>
              <td className="py-2.5 px-3 font-ieee-sans text-slate-600">Phase margin in degrees at unity-gain crossover</td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-ieee-sans font-semibold">PSRR at 10 kHz</td>
              <td className="py-2.5 px-3">.ac (AC=1 on VDD)</td>
              <td className="py-2.5 px-3 text-[#00629B]">.meas AC psrr_10k FIND mag(V(vout)) AT 10k</td>
              <td className="py-2.5 px-3 font-ieee-sans text-slate-600">Supply ripple attenuation at 10 kHz</td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-ieee-sans font-semibold">LDO Line Regulation</td>
              <td className="py-2.5 px-3">.dc VIN 1.6 2.0 0.01</td>
              <td className="py-2.5 px-3 text-[#00629B]">.meas DC line_reg PARAM (MAX(V(vout))-MIN(V(vout)))/0.4</td>
              <td className="py-2.5 px-3 font-ieee-sans text-slate-600">ΔV_out / ΔV_in across supply window (V/V)</td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-ieee-sans font-semibold">BGR Box-Method TempCo</td>
              <td className="py-2.5 px-3">.dc temp -40 125 1</td>
              <td className="py-2.5 px-3 text-[#00629B]">.meas DC tc_ppm PARAM ((MAX(V(vref))-MIN(V(vref)))/(1.2*165))*1e6</td>
              <td className="py-2.5 px-3 font-ieee-sans text-slate-600">Temperature coefficient in ppm/°C</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Part V: SPICE Troubleshooting Guide */}
      <SectionHeading
        id="spice-troubleshooting"
        roman="V"
        title="Troubleshooting SPICE Convergence, Floating Nodes & Model Errors"
        subtitle="Rapid fixes for the 4 most common simulation errors encountered in LTspice and ngspice"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-5">
        {[
          {
            err: 'Error: "Singular Matrix: Check node n004" or "Floating Node"',
            cause:
              'A circuit node is connected only to capacitors or MOSFET gates with zero DC resistive path to Ground (Node 0), making the nodal conductance matrix G non-invertible at DC.',
            fix: 'Ensure every schematic has a Ground symbol (Node 0), and add a large 1 GΩ resistor to ground (or set .options gmin=1e-12 rshunt=1e12) on purely capacitive nodes.',
          },
          {
            err: 'Error: "Analysis Failed: Iteration limit reached" or "Time step too small"',
            cause:
              'Newton-Raphson solver cannot converge because an idealized behavioral source has a discontinuous derivative or a positive feedback loop (e.g., BGR startup or latch) is switching infinitely fast.',
            fix: 'Add .options noopiter gminsteps=0 srcsteps=0 or use the Gear solver (.options method=gear reltol=0.003) and add 10–50 fF realistic parasitic capacitance to high-impedance switching nodes.',
          },
          {
            err: 'Error: "Unknown subckt called in: xm1 ..." vs "Can’t find definition of model"',
            cause:
              'Mismatch between a .model primitive (which requires Prefix = MN / MP) and a .subckt macro-model (which requires Ctrl+Right-Click -> Prefix = X).',
            fix: 'Open your PDK model file in a text editor: if it starts with .model, keep Prefix = MN/MP; if it starts with .subckt, change the symbol Prefix to X.',
          },
          {
            err: 'Symptom: Drain current is 1000× larger than hand calculation',
            cause:
              'Entered W=10 and L=0.18 without the "u" (micron) suffix! SPICE interprets bare numbers in METERS (W = 10 meters, L = 18 cm!).',
            fix: 'Always append "u" (e.g., W=10u L=0.18u) or add .options scale=1e-6 if using dimensionless grid units.',
          },
        ].map((item, idx) => (
          <div key={idx} className="border border-slate-300 bg-white p-4 text-xs md:text-sm space-y-2">
            <div className="font-bold text-red-800 flex items-center gap-1.5 font-ieee-mono text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{item.err}</span>
            </div>
            <p className="text-slate-700">
              <strong className="text-slate-900 font-ieee-sans">Physical / Numerical Cause: </strong>
              {item.cause}
            </p>
            <p className="text-emerald-900 flex items-start gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>
                <strong className="font-ieee-sans">Solution: </strong>
                {item.fix}
              </span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
