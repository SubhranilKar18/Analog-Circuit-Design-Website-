import { SchematicId } from '../components/CircuitSchematics';

export interface ModuleEquation {
  name: string;
  latex: string;
  eqNum: string;
  units: string;
  note: string;
}

export interface ModuleMistake {
  mistake: string;
  consequence: string;
  fix: string;
}

export interface WorkedStep {
  stepTitle: string;
  reasoning: string;
  formulaLatex: string;
  calculation: string;
  resultWithUnits: string;
}

export interface VerificationRow {
  metric: string;
  symbol: string;
  targetSpec: string;
  handCalcValue: string;
  typicalSpiceValue: string;
  discrepancyReason: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ModuleContent {
  id: number;
  roman: string;
  shortTitle: string;
  title: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  estimatedHours: number;
  prerequisites: string;
  withoutAiTrack: string;
  withAiTrack: string;
  abstract: string;
  indexTerms: string[];
  schematicId: SchematicId;
  figNumber: string;
  figCaption: string;
  inlineTool:
    | 'operating_region'
    | 'gmid_workbench'
    | 'ota5t_calc'
    | 'opamp2stage_calc'
    | 'bode_visualizer'
    | 'bgr_plotter';
  conceptParagraphs: string[];
  theoryParagraphs: {
    heading: string;
    body: string;
    equationLatex?: string;
    equationNum?: string;
  }[];
  keyEquations: ModuleEquation[];
  handCalcMethodology: string[];
  sizingJustification: {
    parameter: string;
    recommendedRange: string;
    physicalReasoning: string;
  }[];
  workedExample: {
    problemStatement: string;
    specs: { label: string; value: string }[];
    steps: WorkedStep[];
  };
  simulationSteps: {
    analysisType: string;
    spiceDirective: string;
    whatToCheck: string;
  }[];
  verificationTable: VerificationRow[];
  commonMistakes: ModuleMistake[];
  checklistItems: string[];
  miniProject: {
    title: string;
    objective: string;
    deliverables: string[];
  };
  quiz: QuizQuestion[];
}

export const MODULES_DATA: ModuleContent[] = [
  /* ==========================================================================
   * MODULE 1: MOSFET Foundations & Small-Signal Physics
   * ========================================================================== */
  {
    id: 1,
    roman: 'I',
    shortTitle: '1. MOSFET Foundations',
    title: 'MOSFET Operation Regions, Small-Signal Physics, Intrinsic Gain & Transit Frequency',
    level: 'Beginner',
    estimatedHours: 6,
    prerequisites: 'Basic KVL/KCL, RC frequency response, semiconductor PN junction basics',
    withoutAiTrack: 'Derive hybrid-π small-signal equivalences by hand and sweep DC operating points (.op / .dc) in LTspice/ngspice.',
    withAiTrack: 'Auto-extract BSIM4 small-signal parameters across bias grids using Python + ngspice batch scripts to build surrogate lookup tables.',
    abstract:
      'Every analog integrated circuit relies on the metal-oxide-semiconductor field-effect transistor (MOSFET) acting as a voltage-controlled current source. This module establishes the physical mechanisms governing subthreshold (weak inversion), moderate inversion, triode, and saturation regimes, derives the complete small-signal hybrid-π model including channel-length modulation and gate-drain overlap capacitances, and formulates the two fundamental transistor figures of merit: intrinsic voltage gain (gm·ro) and unity-current-gain transit frequency (fT).',
    indexTerms: [
      'MOSFET operating regions',
      'transconductance (gm)',
      'output conductance (gds)',
      'hybrid-pi model',
      'intrinsic gain (gm*ro)',
      'transit frequency (fT)',
    ],
    schematicId: 'mosfet_models',
    figNumber: 'Fig. 1.1',
    figCaption:
      'NMOS physical cross-section in saturation showing channel pinch-off and depletion widening alongside the high-frequency small-signal hybrid-π equivalent circuit [1], [2].',
    inlineTool: 'operating_region',
    conceptParagraphs: [
      'In digital CMOS design, a transistor is treated as an ideal binary switch: either Cutoff (open) or deeply in Strong-Inversion Triode (closed). In contrast, analog IC design exploits the continuous transconductance behavior of the MOSFET in the Saturation (Active) region, where a small perturbation in Gate-Source voltage (v_gs) produces a proportional change in Drain current (i_d = g_m v_gs) while remaining largely immune to Drain-Source voltage variations.',
      'To become an expert analog designer, you must develop physical intuition for how the three degrees of freedom under your direct control—Gate Width (W), Channel Length (L), and DC Bias Current (I_D)—simultaneously dictate transconductance (g_m), output resistance (r_o = 1/g_ds), parasitic capacitances (C_gs, C_gd, C_db), thermal/flicker noise, and threshold mismatch.',
    ],
    theoryParagraphs: [
      {
        heading: '1.1 Operating Regions: Cutoff, Triode, Saturation, and Subthreshold',
        body: 'When V_GS exceeds the threshold voltage V_th, mobile electrons accumulate beneath the gate oxide to form an inversion channel. Define the overdrive voltage V_ov = V_GS - V_th. As long as V_DS < V_ov, the inversion layer spans continuously from source to drain and the device behaves like a voltage-controlled resistor (Triode region). Once V_DS >= V_DS,sat (approximately V_ov in strong inversion, or ~4 U_T ≈ 104 mV in weak inversion), the channel potential near the drain equals V_GS - V_th, pinching off the inversion layer. Electrons are swept across the narrow drain depletion region by the lateral electric field [1].',
        equationLatex:
          'I_D = \\frac{1}{2}\\mu_n C_{ox}\\frac{W}{L}(V_{GS}-V_{th})^2(1 + \\lambda V_{DS}) \\quad \\text{for } V_{DS} \\ge V_{GS}-V_{th}',
        equationNum: '1.1',
      },
      {
        heading: '1.2 Small-Signal Parameters: gm, gmb, and gds (ro)',
        body: 'Linearizing the drain current around a quiescent DC operating point Q(V_GS, V_DS, I_D) via a first-order Taylor expansion yields three small-signal conductances: gate transconductance g_m = ∂I_D/∂V_GS, bulk transconductance g_mb = ∂I_D/∂V_BS = η g_m (where η ≈ 0.15–0.25 represents the body-effect factor), and output conductance g_ds = ∂I_D/∂V_DS = 1/r_o caused by Channel-Length Modulation (CLM) and Drain-Induced Barrier Lowering (DIBL) [2].',
        equationLatex:
          'g_m = \\frac{\\partial I_D}{\\partial V_{GS}} = \\sqrt{2\\mu_n C_{ox}\\frac{W}{L}I_D} = \\frac{2I_D}{V_{ov}}, \\qquad r_o = \\frac{1}{g_{ds}} = \\frac{1}{\\lambda I_D} = \\frac{V_A}{I_D}',
        equationNum: '1.2',
      },
      {
        heading: '1.3 Intrinsic Gain (gm·ro) and Transit Frequency (fT)',
        body: 'The maximum voltage amplification achievable from a single transistor loaded by an ideal current source is its intrinsic gain A_intr = g_m r_o. Conversely, the fundamental speed limit of the device is its transit frequency f_T—the frequency at which the short-circuit small-signal current gain |i_d / i_g| drops to unity (0 dB) [4], [5].',
        equationLatex:
          'A_{\\text{intr}} = g_m r_o = \\frac{2 V_A}{V_{ov}} \\propto \\frac{L}{V_{ov}}, \\qquad f_T = \\frac{g_m}{2\\pi (C_{gs} + C_{gd} + C_{gb})} \\approx \\frac{3\\mu_n V_{ov}}{4\\pi L^2}',
        equationNum: '1.3',
      },
    ],
    keyEquations: [
      {
        name: 'Strong-Inversion Transconductance',
        latex: 'g_m = \\frac{2 I_D}{V_{GS}-V_{th}} = \\sqrt{2\\mu C_{ox}\\frac{W}{L}I_D}',
        eqNum: '1.2a',
        units: 'S (A/V)',
        note: 'Valid in strong inversion (V_ov > 150 mV); bounded by I_D/(n U_T) in weak inversion.',
      },
      {
        name: 'Small-Signal Output Resistance',
        latex: 'r_o = \\frac{1}{g_{ds}} = \\frac{V_A}{I_D} = \\frac{L}{\\lambda_0 L_{\\min} I_D}',
        eqNum: '1.2b',
        units: 'Ω (V/A)',
        note: 'Scales nearly linearly with channel length L and inversely with drain current I_D.',
      },
      {
        name: 'Intrinsic Voltage Gain',
        latex: 'A_{\\text{intr}} = g_m r_o = \\left(\\frac{g_m}{I_D}\\right) V_A',
        eqNum: '1.3a',
        units: 'V/V',
        note: 'Typically 25–60 V/V in 180nm CMOS; drops to 10–25 V/V in 65nm CMOS.',
      },
      {
        name: 'Unity-Current-Gain Transit Frequency',
        latex: 'f_T = \\frac{g_m}{2\\pi C_{gg}} \\approx \\frac{3 \\mu_n (V_{GS}-V_{th})}{4\\pi L^2}',
        eqNum: '1.3b',
        units: 'Hz',
        note: 'Degrades as 1/L^2 in long channel and 1/L in velocity-saturated short channels.',
      },
    ],
    handCalcMethodology: [
      'Identify the process baseline parameters: μ_n C_ox, V_th0, minimum length L_min, and Early voltage factor V_A per unit length.',
      'Select channel length L: choose L = 1× to 2× L_min for high-speed RF/wideband stages, or L = 3× to 8× L_min for high-gain op-amps, current mirrors, and bandgap references.',
      'Establish the overdrive V_ov (or g_m/I_D) based on signal swing and speed requirements, then compute I_D and W/L.',
      'Calculate C_gs = (2/3) W L C_ox + W C_ov and C_gd = W C_ov to determine input/Miller capacitance loading.',
    ],
    sizingJustification: [
      {
        parameter: 'Channel Length L = 0.36 μm to 0.72 μm (2×–4× L_min in 180nm)',
        recommendedRange: '2× to 5× L_min for general analog blocks',
        physicalReasoning:
          'At L = L_min (0.18 μm), Drain-Induced Barrier Lowering (DIBL) and Channel-Length Modulation severely degrade r_o, reducing intrinsic gain gm*ro below 20 V/V. Doubling L to 0.36 μm nearly doubles r_o and halves threshold mismatch σ(ΔV_th) with an acceptable f_T penalty.',
      },
      {
        parameter: 'Overdrive Voltage V_ov = 100 mV to 200 mV',
        recommendedRange: '80 mV (input pairs) to 250 mV (current mirrors)',
        physicalReasoning:
          'Lower V_ov (higher gm/Id) maximizes transconductance per microamp of current and leaves maximum voltage headroom V_DD - V_ds,sat, whereas higher V_ov improves current-mirror V_th matching.',
      },
    ],
    workedExample: {
      problemStatement:
        'Design and characterize a single 180nm NMOS transistor biased at I_D = 50 μA with channel length L = 0.36 μm (2× L_min) and target overdrive V_ov = 0.16 V. Compute W, g_m, r_o, intrinsic gain A_intr, C_gs, and transit frequency f_T.',
      specs: [
        { label: 'Process Node', value: '180nm CMOS (V_DD = 1.8 V, μ_n C_ox = 270 μA/V², C_ox = 8.6 fF/μm²)' },
        { label: 'Bias Current I_D', value: '50 μA' },
        { label: 'Channel Length L', value: '0.36 μm (V_A ≈ 25 V at L = 0.36 μm)' },
        { label: 'Target Overdrive V_ov', value: '0.16 V' },
      ],
      steps: [
        {
          stepTitle: 'Step 1: Compute Required Transconductance g_m',
          reasoning: 'Using the square-law / moderate-inversion relation g_m = 2 I_D / V_ov:',
          formulaLatex: 'g_m = \\frac{2 I_D}{V_{ov}}',
          calculation: 'g_m = (2 × 50 μA) / 0.16 V = 625 μA/V',
          resultWithUnits: 'g_m = 625 μS (0.625 mS)',
        },
        {
          stepTitle: 'Step 2: Solve for Aspect Ratio (W/L) and Gate Width W',
          reasoning: 'Invert the saturation current equation I_D = 0.5 * μ_n C_ox * (W/L) * V_ov^2:',
          formulaLatex: '\\frac{W}{L} = \\frac{2 I_D}{\\mu_n C_{ox} V_{ov}^2}',
          calculation: 'W/L = (2 × 50 μA) / (270 μA/V² × 0.16² V²) = 100 / 6.912 = 14.47 => W = 14.47 × 0.36 μm',
          resultWithUnits: 'W = 5.21 μm (W/L = 14.5)',
        },
        {
          stepTitle: 'Step 3: Compute Output Resistance r_o and Intrinsic Gain A_intr',
          reasoning: 'At L = 0.36 μm, the Early voltage is V_A = 25 V. Output resistance is V_A / I_D:',
          formulaLatex: 'r_o = \\frac{V_A}{I_D}, \\qquad A_{\\text{intr}} = g_m r_o',
          calculation: 'r_o = 25 V / 50 μA = 500 kΩ; A_intr = 0.625 mS × 500 kΩ = 312.5 V/V (or via EKV ~ 156 V/V with DIBL)',
          resultWithUnits: 'r_o = 500 kΩ, g_m·r_o = 49.9 dB',
        },
        {
          stepTitle: 'Step 4: Compute Gate Capacitance C_gs and Transit Frequency f_T',
          reasoning: 'Include intrinsic saturation gate-channel capacitance (2/3 W L C_ox) plus overlap capacitance (C_ov ≈ 0.35 fF/μm):',
          formulaLatex: 'C_{gs} = \\frac{2}{3} W L C_{ox} + W C_{ov}, \\qquad f_T = \\frac{g_m}{2\\pi (C_{gs}+C_{gd})}',
          calculation: 'C_gs = 0.667 × 5.21 × 0.36 × 8.6 + 5.21 × 0.35 = 10.75 + 1.82 = 12.57 fF; C_gd = 1.82 fF; f_T = 625 μS / (2π × 14.39 fF)',
          resultWithUnits: 'C_gg = 14.39 fF, f_T = 6.91 GHz',
        },
      ],
    },
    simulationSteps: [
      {
        analysisType: 'DC Operating Point (.op)',
        spiceDirective: '.op',
        whatToCheck:
          'Inspect the SPICE error log for Id, Vgs, Vds, Vth, Vdsat, gm, gds, Cgs, and Cgd. Verify directly that Vds > Vdsat + 50mV.',
      },
      {
        analysisType: 'Family of Curves Sweep (.dc)',
        spiceDirective: '.dc VDS 0 1.8 0.01 VGS 0.4 1.2 0.1',
        whatToCheck:
          'Plot Id(M1) vs VDS and verify the flat saturation slope (1/ro) and the quadratic/exponential spacing of curves with VGS.',
      },
    ],
    verificationTable: [
      {
        metric: 'Drain Current',
        symbol: 'I_D',
        targetSpec: '50.0 μA',
        handCalcValue: '50.0 μA',
        typicalSpiceValue: '49.6 μA',
        discrepancyReason: 'Threshold voltage shift with L (reverse short-channel effect) in BSIM4.',
      },
      {
        metric: 'Transconductance',
        symbol: 'g_m',
        targetSpec: '>= 550 μS',
        handCalcValue: '625 μS',
        typicalSpiceValue: '582 μS',
        discrepancyReason: 'Vertical field mobility degradation and moderate-inversion transition factor n > 1.',
      },
      {
        metric: 'Output Resistance',
        symbol: 'r_o',
        targetSpec: '>= 400 kΩ',
        handCalcValue: '500 kΩ',
        typicalSpiceValue: '445 kΩ',
        discrepancyReason: 'DIBL and substrate-current-induced body effect (SCBE) at higher V_DS.',
      },
      {
        metric: 'Transit Frequency',
        symbol: 'f_T',
        targetSpec: '> 5.0 GHz',
        handCalcValue: '6.91 GHz',
        typicalSpiceValue: '6.40 GHz',
        discrepancyReason: 'Fringing gate-bulk capacitance C_gb and extrinsic junction layout parasitics.',
      },
    ],
    commonMistakes: [
      {
        mistake: 'Assuming V_DS,sat = V_GS - V_th holds in subthreshold (weak inversion) when V_GS < V_th.',
        consequence:
          'Square-law predicts V_DS,sat <= 0 V when V_GS <= V_th, leading beginners to bias weak-inversion transistors with insufficient V_DS.',
        fix: 'In weak inversion, saturation requires V_DS >= 4 U_T ≈ 105 mV so the drain-to-source Boltzmann back-injection exp(-V_DS/U_T) vanishes (< 2%).',
      },
      {
        mistake: 'Forgetting to connect the 4th terminal (Body/Bulk B) to the correct rail (GND for NMOS, VDD for PMOS).',
        consequence:
          'Floating bulk nodes cause convergence errors in SPICE or forward-bias the source-bulk PN junction, clamping signals and drawing massive substrate current.',
        fix: 'Always use 4-terminal MOSFET symbols (nmos4 / pmos4) and explicitly wire NMOS bulk to 0 (or isolated p-well source) and PMOS bulk to VDD (or n-well source).',
      },
    ],
    checklistItems: [
      'Verified V_DS > V_DS,sat + 50 mV margin in the SPICE .op operating point report.',
      'Checked that NMOS bulk is tied to GND (or source if triple-well) and PMOS bulk is tied to VDD.',
      'Extracted actual g_m, g_ds, C_gs, and C_gd from .op log rather than relying solely on textbook KP.',
      'Verified intrinsic gain g_m * r_o at the chosen channel length L meets the stage gain budget.',
    ],
    miniProject: {
      title: 'Mini-Project 1: Characterize 180nm vs. 65nm Intrinsic Gain and fT Curves',
      objective:
        'Using the interactive Operating-Region Explorer above and LTspice, compare a transistor biased at I_D = 50 μA in 180nm (L=0.36μm) versus 65nm (L=0.13μm).',
      deliverables: [
        'Tabulate g_m, r_o, g_m*r_o, and f_T for both process nodes.',
        'Explain why 65nm achieves >3× higher f_T but suffers nearly 2× lower intrinsic gain g_m*r_o.',
      ],
    },
    quiz: [
      {
        id: 'm1_q1',
        question:
          'If you double the channel length L of a MOSFET in strong inversion while keeping Both Drain Current I_D and Overdrive V_ov constant (by also doubling W), what happens to g_m and f_T?',
        options: [
          'g_m stays constant, while f_T drops by a factor of ~4 (since C_gs scales with W*L ~ L^2)',
          'Both g_m and f_T double',
          'g_m drops by 2× and f_T stays constant',
          'Both g_m and f_T remain unchanged',
        ],
        correctIndex: 0,
        explanation:
          'Because I_D and V_ov are held constant (meaning W/L is held constant while L doubles, so W also doubles), g_m = 2*I_D/V_ov remains unchanged. However, gate area W*L increases by 2 × 2 = 4×, quadrupling C_gg and reducing f_T = g_m / (2π C_gg) by a factor of 4.',
      },
      {
        id: 'm1_q2',
        question:
          'What is the minimum Drain-Source voltage V_DS required to keep a MOSFET in saturation when biased in deep weak inversion (subthreshold, V_GS < V_th)?',
        options: [
          'Approximately 4 U_T ≈ 100–110 mV at room temperature',
          'Zero volts (0 V)',
          'At least V_th (450 mV)',
          'Half of the supply voltage (V_DD / 2)',
        ],
        correctIndex: 0,
        explanation:
          'In weak inversion, transport is governed by thermal diffusion: I_D = I_0 exp((V_GS-V_th)/(n U_T)) * (1 - exp(-V_DS/U_T)). Once V_DS exceeds 4 U_T (~104 mV at 300 K), exp(-4) = 0.018, so drain current becomes >98% independent of V_DS.',
      },
    ],
  },

  /* ==========================================================================
   * MODULE 2: Systematic Design Methodology — Square-Law vs. gm/Id & C/Id
   * ========================================================================== */
  {
    id: 2,
    roman: 'II',
    shortTitle: '2. gm/Id Methodology',
    title: 'Systematic Design Methodology: Square-Law Breakdown, gm/Id Lookup Flow & Cgg/Id Sizing',
    level: 'Beginner',
    estimatedHours: 8,
    prerequisites: 'Module 1 (MOSFET small-signal model, gm, ro, fT)',
    withoutAiTrack: 'Generate pre-characterized gm/Id vs Id/W, fT, and gm*ro charts in LTspice/ngspice and size circuits via manual chart lookup.',
    withAiTrack: 'Vectorize PDK lookup tables in Python (NumPy/SciPy) to perform instant vectorized pareto-front sweeps across L and gm/Id.',
    abstract:
      'Classical textbook square-law equations fail by 50%–300% in sub-180nm CMOS processes due to velocity saturation, vertical-field mobility degradation, DIBL, and moderate-inversion operation. This module presents the industry-standard gm/Id and Cgg/Id ("C-over-Id") design methodology pioneered by Jespers and Murmann [5]. We define the Inversion Coefficient (IC), quantify the fundamental trade-off between transconductance efficiency (gm/Id), transit speed (fT), and intrinsic gain (gm·ro), and show step-by-step how to generate and apply SPICE-exact lookup charts.',
    indexTerms: [
      'gm/Id methodology',
      'Inversion Coefficient (IC)',
      'moderate inversion',
      'current density (Id/W)',
      'Cgg/Id methodology',
      'figure of merit (gm/Id * fT)',
    ],
    schematicId: 'gmid_curves',
    figNumber: 'Fig. 2.1',
    figCaption:
      'Universal transconductance efficiency (gm/Id), transit frequency (fT), and their product figure of merit (gm/Id · fT) plotted across Weak, Moderate, and Strong Inversion regimes [5].',
    inlineTool: 'gmid_workbench',
    conceptParagraphs: [
      'Why does square-law sizing fail in modern IC design? In a 180nm or 65nm process with V_DD = 1.2V–1.8V, stacking three or four transistors between VDD and GND leaves only 150–250 mV of V_DS per device. Consequently, transistors are almost never biased in deep strong inversion (V_ov > 300 mV); instead, they operate in Moderate Inversion (V_ov ≈ 80–150 mV, IC ≈ 0.1–10) or Weak Inversion (IC < 0.1), where square-law equations break down completely.',
      'The gm/Id methodology replaces approximate analytical equations with a single universal designknob: the transconductance-to-current ratio gm/Id (in V^-1). Because gm/Id, normalized current density Id/W (in μA/μm), f_T, and gm*ro are width-independent functions of gate bias, a single 1D DC sweep of a unit-width transistor in SPICE captures the exact BSIM4 physics once and for all.',
    ],
    theoryParagraphs: [
      {
        heading: '2.1 The Universal Parameter gm/Id and Effective Overdrive V*',
        body: 'Regardless of technology node, gm/Id measures how much transconductance you purchase per unit of DC bias current invested. It is bounded at the top by thermodynamics in weak inversion—where gm/Id = 1/(n U_T) ≈ 28 V^-1 at 300K—and decreases monotonically in strong inversion as gm/Id = 2/V_ov. Designers define the effective overdrive V* = 2/(gm/Id), which serves as a smooth, continuous measure of V_DS,sat across all inversion regions [5].',
        equationLatex:
          '\\frac{g_m}{I_D} = \\frac{\\partial (\\ln I_D)}{\\partial V_{GS}} \\in [4\\text{ V}^{-1},\\; 28\\text{ V}^{-1}], \\qquad V^* = \\frac{2}{g_m / I_D} \\approx V_{DS,\\text{sat}}',
        equationNum: '2.1',
      },
      {
        heading: '2.2 Inversion Coefficient (IC) and EKV Normalization',
        body: 'The Inversion Coefficient IC normalizes the drain current against the technology-specific moderate-inversion center current I_spec = 2 n μ C_ox U_T^2 (W/L). When IC = 1, the asymptotic weak-inversion and strong-inversion tangents intersect [3], [5].',
        equationLatex:
          'IC = \\frac{I_D}{2 n \\mu C_{ox} U_T^2 (W/L)}, \\qquad \\frac{g_m}{I_D} \\approx \\frac{1}{n U_T \\sqrt{\\frac{1}{2} + \\frac{1}{4}IC + \\sqrt{IC}}}',
        equationNum: '2.2',
      },
      {
        heading: '2.3 The "C over Id" (Cgg/Id) Approach for Direct Bandwidth Sizing',
        body: 'When a transistor drives a capacitive load or another stage, its intrinsic speed is directly tied to the ratio of its gate capacitance to drain current: C_gg / I_D = (g_m / I_D) / (2π f_T). Using C_gg/I_D lookup charts allows you to compute exact self-loading parasitic capacitance before even computing the physical width W!',
        equationLatex:
          '\\frac{C_{gg}}{I_D} = \\frac{g_m / I_D}{2\\pi f_T} \\quad [\\text{fF}/\\mu\\text{A}], \\qquad W = \\frac{I_D}{(I_D / W)_{\\text{lookup}}}',
        equationNum: '2.3',
      },
    ],
    keyEquations: [
      {
        name: 'Weak-Inversion Upper Bound',
        latex: '\\left(\\frac{g_m}{I_D}\\right)_{\\max} = \\frac{1}{n U_T} \\approx 26\\text{--}29\\text{ V}^{-1}',
        eqNum: '2.1a',
        units: 'V⁻¹ (S/A)',
        note: 'Set by thermal voltage U_T = kT/q = 25.85 mV and subthreshold slope factor n ≈ 1.3.',
      },
      {
        name: 'Width Extraction from Current Density',
        latex: 'W = \\frac{I_D}{J_D(g_m/I_D, L)} = \\frac{I_D}{(I_D / W)_{\\text{chart}}}',
        eqNum: '2.2a',
        units: 'μm',
        note: 'Exact across all inversion regions because Id/W is uniquely determined by gm/Id and L.',
      },
      {
        name: 'Bandwidth-Power Figure of Merit',
        latex: '\\text{FoM}_{\\text{BW}} = \\left(\\frac{g_m}{I_D}\\right) \\cdot f_T',
        eqNum: '2.3a',
        units: 'GHz/V',
        note: 'Peaks in Moderate Inversion (gm/Id ≈ 12–16 V⁻¹), making it the optimal region for low-power amplifiers.',
      },
    ],
    handCalcMethodology: [
      'Step 1: Determine required transconductance g_m from the circuit bandwidth/noise spec (e.g., g_m = 2π · GBW · C_L).',
      'Step 2: Select gm/Id based on the transistor role: 15–22 V⁻¹ for input differential pairs (high gain, low offset, low V_gs), 12–16 V⁻¹ for general gain stages (peak FoM), or 6–10 V⁻¹ for current mirrors and tail sources (good matching and small C_gs/C_gd).',
      'Step 3: Select channel length L from the gm*ro vs. gm/Id chart to meet the target DC voltage gain A_v0 = (gm*ro)_eff.',
      'Step 4: Compute drain current I_D = g_m / (gm/Id).',
      'Step 5: Read normalized current density (I_D/W) from the lookup chart at your chosen (gm/Id, L) and compute Gate Width W = I_D / (I_D/W).',
    ],
    sizingJustification: [
      {
        parameter: 'Differential Input Pair: gm/Id = 15 to 20 V⁻¹ (V* = 100–130 mV)',
        recommendedRange: '15–20 V⁻¹ (Moderate-to-Weak Inversion)',
        physicalReasoning:
          'Maximizes g_m for a given tail current budget, minimizes input-referred thermal noise (v_n^2 ∝ 1/g_m) and input-referred offset (V_os = ΔI_D / g_m).',
      },
      {
        parameter: 'Current Mirrors & Bias Sources: gm/Id = 7 to 10 V⁻¹ (V* = 200–285 mV)',
        recommendedRange: '7–10 V⁻¹ (Strong Inversion)',
        physicalReasoning:
          'In a current mirror, threshold voltage mismatch ΔV_th produces a current error ΔI/I = (gm/Id) · ΔV_th. Choosing a small gm/Id (large V*) minimizes current mirror mismatch and increases mirror pole frequency f_p,mir = g_m / (2π C_gs).',
      },
    ],
    workedExample: {
      problemStatement:
        'Using the gm/Id methodology in 180nm CMOS, size an NMOS common-source transconductor to achieve g_m = 1.0 mS with an intrinsic gain g_m*r_o >= 45 V/V and minimum power consumption, operating in moderate inversion at gm/Id = 16 V⁻¹.',
      specs: [
        { label: 'Required Transconductance g_m', value: '1.0 mS (1000 μS)' },
        { label: 'Target Intrinsic Gain g_m·r_o', value: '>= 45 V/V (33.1 dB)' },
        { label: 'Chosen Transconductance Efficiency', value: 'g_m / I_D = 16 V⁻¹ (V* = 125 mV)' },
      ],
      steps: [
        {
          stepTitle: 'Step 1: Compute Required Drain Current I_D',
          reasoning: 'Divide target g_m directly by the chosen gm/Id ratio:',
          formulaLatex: 'I_D = \\frac{g_m}{(g_m / I_D)}',
          calculation: 'I_D = 1000 μS / 16 V⁻¹ = 62.5 μA',
          resultWithUnits: 'I_D = 62.5 μA',
        },
        {
          stepTitle: 'Step 2: Select Channel Length L from gm*ro Chart',
          reasoning: 'From the 180nm lookup chart at gm/Id = 16 V⁻¹: L = 0.18 μm gives gm*ro = 26 V/V (too low), while L = 0.36 μm gives gm*ro = 49.4 V/V (meets spec with margin).',
          formulaLatex: 'L = 0.36\\;\\mu\\text{m} \\implies g_m r_o = 49.4\\text{ V/V}',
          calculation: 'Select L = 0.36 μm (2× L_min)',
          resultWithUnits: 'L = 0.36 μm',
        },
        {
          stepTitle: 'Step 3: Look Up Current Density (I_D/W) and Compute Width W',
          reasoning: 'At gm/Id = 16 V⁻¹ and L = 0.36 μm, the 180nm NMOS lookup table gives I_D/W = 3.74 μA/μm:',
          formulaLatex: 'W = \\frac{I_D}{(I_D / W)_{\\text{lookup}}}',
          calculation: 'W = 62.5 μA / (3.74 μA/μm) = 16.71 μm',
          resultWithUnits: 'W = 16.71 μm (e.g., 4 fingers × 4.18 μm)',
        },
        {
          stepTitle: 'Step 4: Extract Self-Loading Gate Capacitance via Cgg/Id',
          reasoning: 'At gm/Id = 16 V⁻¹ and L = 0.36 μm, C_gg/I_D = 0.78 fF/μA (f_T = 3.26 GHz):',
          formulaLatex: 'C_{gg} = I_D \\cdot \\left(\\frac{C_{gg}}{I_D}\\right)',
          calculation: 'C_gg = 62.5 μA × 0.78 fF/μA = 48.75 fF',
          resultWithUnits: 'C_gg = 48.8 fF',
        },
      ],
    },
    simulationSteps: [
      {
        analysisType: '1D Characterization Sweep for Lookup Table Generation',
        spiceDirective: '.dc VGS 0.1 1.8 0.01\n.step param L_VAL list 0.18u 0.36u 0.54u 0.72u 1.0u',
        whatToCheck:
          'Fix W = 10μm and VDS = VDD/2 = 0.9V. Plot deriv(Id(M1))/Id(M1) for gm/Id, and Id(M1)/10u for Id/W.',
      },
      {
        analysisType: 'Verify Sized Point in .op',
        spiceDirective: '.op',
        whatToCheck:
          'Confirm that plugging W = 16.71μm, L = 0.36μm, and I_D = 62.5μA into SPICE yields g_m within ±2% of 1.0 mS on the very first run.',
      },
    ],
    verificationTable: [
      {
        metric: 'Transconductance',
        symbol: 'g_m',
        targetSpec: '1.00 mS',
        handCalcValue: '1.00 mS (via gm/Id)',
        typicalSpiceValue: '0.996 mS',
        discrepancyReason: '< 0.5% error because lookup table uses the exact same BSIM4 model!',
      },
      {
        metric: 'Drain Current',
        symbol: 'I_D',
        targetSpec: '62.5 μA',
        handCalcValue: '62.5 μA',
        typicalSpiceValue: '62.5 μA',
        discrepancyReason: 'Forced by tail/bias current mirror.',
      },
      {
        metric: 'Intrinsic Gain',
        symbol: 'g_m·r_o',
        targetSpec: '>= 45 V/V',
        handCalcValue: '49.4 V/V',
        typicalSpiceValue: '48.9 V/V',
        discrepancyReason: 'Slight V_DS difference between characterization V_DS=0.9V and actual circuit V_DS.',
      },
    ],
    commonMistakes: [
      {
        mistake: 'Choosing a large gm/Id (e.g., 20 V⁻¹) for a current mirror transistor.',
        consequence:
          'Current mirror relative error is ΔI_D / I_D = (gm/Id) · ΔV_th. At gm/Id = 20 V⁻¹, a mere 5 mV V_th mismatch causes a 10% DC current error!',
        fix: 'Always bias current mirrors in strong inversion (gm/Id = 6–10 V⁻¹) where V* is large (200–300 mV) so V_th mismatch is suppressed.',
      },
      {
        mistake: 'Characterizing the gm/Id lookup chart at V_DS = 1.8V when the actual transistor operates at V_DS = 0.35V.',
        consequence:
          'DIBL shifts V_th and g_ds with V_DS, causing the lookup width W and r_o to be inaccurate by 10%–20%.',
        fix: 'Generate lookup charts at a realistic average V_DS (e.g., V_DD/2 or 0.5V), or use a 3D lookup table indexed by (L, V_GS, V_DS).',
      },
    ],
    checklistItems: [
      'Selected gm/Id according to device function (high gm/Id for input pairs, low gm/Id for mirrors).',
      'Verified V* = 2/(gm/Id) fits comfortably within the DC voltage headroom of the branch.',
      'Checked that transistor width W is split into an even number of fingers (N_f) with unit finger width W_f <= 5–10 μm to minimize gate resistance.',
      'Verified f_T at the chosen gm/Id is at least 10× higher than the target circuit GBW.',
    ],
    miniProject: {
      title: 'Mini-Project 2: Generate Your Own 180nm gm/Id vs. Id/W Chart in LTspice',
      objective:
        'Run a parameterized .step channel-length sweep on a unit-width NMOS (W=10μm) and plot gm/Id on the X-axis against Id/W on a logarithmic Y-axis.',
      deliverables: [
        'Use the LTspice waveform expression d(Id(M1))/Id(M1) to plot gm/Id directly.',
        'Size a transistor for g_m = 500 μS at gm/Id = 15 V⁻¹ and verify the result in a separate .op testbench.',
      ],
    },
    quiz: [
      {
        id: 'm2_q1',
        question:
          'Why should a current mirror be biased at a LOW gm/Id (e.g., 7–9 V⁻¹) while an amplifier input differential pair is biased at a HIGH gm/Id (e.g., 16–20 V⁻¹)?',
        options: [
          'Input pairs need small V_os = ΔI/(gm) (which improves at high gm/Id), whereas current mirrors need small current error ΔI/I = (gm/Id)·ΔV_th (which improves at low gm/Id)',
          'Current mirrors require maximum subthreshold operation to save area',
          'High gm/Id reduces gate capacitance C_gs in current mirrors',
          'Input pairs require large overdrive V_ov to maximize CMRR',
        ],
        correctIndex: 0,
        explanation:
          'For an input pair, input-referred offset is V_os = ΔV_th; furthermore, any load current mismatch ΔI_load translates to input offset as ΔI_load / g_m1, which is minimized by maximizing g_m1 (high gm/Id). For a current mirror, drain current mismatch is ΔI/I = (gm/Id)·ΔV_th, which is minimized by making gm/Id small.',
      },
      {
        id: 'm2_q2',
        question:
          'In the gm/Id methodology, if you know the required transconductance g_m = 2 mS and you choose gm/Id = 16 V⁻¹, what is the required DC drain current I_D?',
        options: ['125 μA', '32 mA', '8 μA', '250 μA'],
        correctIndex: 0,
        explanation:
          'I_D = g_m / (gm/Id) = 2 mS / 16 V⁻¹ = 0.002 / 16 = 125 μA.',
      },
    ],
  },

  /* ==========================================================================
   * MODULE 3: CMOS Inverter — Digital Gate & Push-Pull Analog Amplifier
   * ========================================================================== */
  {
    id: 3,
    roman: 'III',
    shortTitle: '3. CMOS Inverter Amplifier',
    title: 'CMOS Inverter: Voltage Transfer Characteristic, Noise Margins, Delay & Analog Push-Pull Amplifier',
    level: 'Beginner',
    estimatedHours: 6,
    prerequisites: 'Modules 1 & 2',
    withoutAiTrack: 'Derive V_M, V_IL, V_IH, and self-biased gm_eff = gm_n + gm_p by hand and simulate DC VTC and AC gain in SPICE.',
    withAiTrack: 'Optimize W_P/W_N ratio across process corners (FS/SF) to center switching threshold V_M = VDD/2.',
    abstract:
      'While universally known as the foundational digital logic gate, the complementary MOS (CMOS) inverter is also one of the most current-efficient push-pull (Class-AB) analog transconductors available in deep-submicron CMOS. This module analyzes the five operating regions along the Voltage Transfer Characteristic (VTC), derives the switching threshold V_M, static noise margins (NM_L, NM_H), propagation delay (t_p), and dynamic power (C_L V_DD^2 f), and demonstrates how resistive self-biasing transforms the inverter into a high-efficiency gm-reuse analog amplifier with effective transconductance gm_eff = gm_n + gm_p.',
    indexTerms: [
      'Voltage Transfer Characteristic (VTC)',
      'switching threshold (VM)',
      'noise margins (NML, NMH)',
      'current-reuse amplifier',
      'inverter-based OTA',
    ],
    schematicId: 'inverter',
    figNumber: 'Fig. 3.1',
    figCaption:
      'CMOS push-pull inverter configured with optional high-resistance self-bias feedback (R_F) to bias M_N and M_P simultaneously in saturation at V_in = V_out = V_M [1], [6].',
    inlineTool: 'operating_region',
    conceptParagraphs: [
      'When V_in transitions from 0V to V_DD, the CMOS inverter passes through five distinct transistor operating combinations. Near the midpoint V_in = V_out = V_M (the switching threshold), BOTH the NMOS pull-down M_N and the PMOS pull-up M_P operate simultaneously in saturation! In this narrow transition zone, the inverter exhibits a steep negative slope dV_out/dV_in = -A_v.',
      'By connecting a large feedback resistor R_F (or switched-capacitor auto-zero loop) between output and input, the inverter automatically biases itself at V_in = V_out = V_M. Because the same DC bias current I_D flows through both M_P and M_N in series, their small-signal transconductances add in parallel (g_m,eff = g_mn + g_mp), doubling the gm/Id efficiency to nearly 35–50 V⁻¹!',
    ],
    theoryParagraphs: [
      {
        heading: '3.1 Switching Threshold V_M and Symmetric Sizing',
        body: 'At V_in = V_out = V_M, both M_N and M_P have V_DS = V_GS and are therefore guaranteed to be in saturation. Equating I_DN = I_DP yields the exact expression for V_M. Setting V_M = V_DD / 2 requires k_p = k_n, meaning W_P / W_N = μ_n / μ_p ≈ 2.5 to 3.5 [1].',
        equationLatex:
          'V_M = \\frac{V_{thn} + \\sqrt{\\frac{k_p}{k_n}}(V_{DD} - |V_{thp}|)}{1 + \\sqrt{\\frac{k_p}{k_n}}}, \\qquad \\text{where } \\frac{k_p}{k_n} = \\frac{\\mu_p (W/L)_P}{\\mu_n (W/L)_N}',
        equationNum: '3.1',
      },
      {
        heading: '3.2 Noise Margins (NM_L, NM_H) and Propagation Delay',
        body: 'The unity-gain points on the VTC where dV_out/dV_in = -1 define the maximum low input V_IL and minimum high input V_IH. Static noise margins are NM_L = V_IL - V_OL and NM_H = V_OH - V_IH. For large-signal switching driving load C_L, propagation delay t_p is governed by average saturation charging current [6]:',
        equationLatex:
          't_{pHL} \\approx \\frac{0.69 C_L V_{DD}}{2 I_{D,\\text{satN}}}, \\qquad P_{\\text{total}} = \\alpha C_L V_{DD}^2 f_{\\text{clk}} + I_{sc} V_{DD} + I_{\\text{leak}} V_{DD}',
        equationNum: '3.2',
      },
      {
        heading: '3.3 Push-Pull Analog Amplifier Small-Signal Gain and GBW',
        body: 'Biased at V_in = V_M, the AC input drives both gates in phase. Current reuse doubles the effective transconductance while placing the NMOS and PMOS output resistances in parallel:',
        equationLatex:
          'A_{v0} = -(g_{mn} + g_{mp})(r_{on} \\parallel r_{op}), \\qquad \\text{GBW} = \\frac{g_{mn} + g_{mp}}{2\\pi C_L}',
        equationNum: '3.3',
      },
    ],
    keyEquations: [
      {
        name: 'Switching Threshold (Midpoint)',
        latex: 'V_M = \\frac{V_{DD}}{2} \\iff \\left(\\frac{W}{L}\\right)_P = \\frac{\\mu_n}{\\mu_p}\\left(\\frac{W}{L}\\right)_N \\approx 3.2\\left(\\frac{W}{L}\\right)_N',
        eqNum: '3.1a',
        units: 'V',
        note: 'Centers output voltage swing and maximizes symmetrical noise margins.',
      },
      {
        name: 'Current-Reuse Small-Signal Gain',
        latex: 'A_{v0} = -(g_{mn} + g_{mp})(r_{on} \\parallel r_{op})',
        eqNum: '3.3a',
        units: 'V/V',
        note: 'Achieves 30–40 dB gain from a single supply branch with 2× transconductance efficiency.',
      },
      {
        name: 'Inverter Amplifier GBW',
        latex: '\\text{GBW} = \\frac{g_{mn} + g_{mp}}{2\\pi (C_L + C_{gd,n} + C_{gd,p})}',
        eqNum: '3.3b',
        units: 'Hz',
        note: 'Twice the GBW per microamp of a standard single-transistor common-source stage.',
      },
    ],
    handCalcMethodology: [
      'Determine required total transconductance g_m,total = g_mn + g_mp = 2π · GBW · C_L.',
      'Allocate g_mn = g_mp = 0.5 · g_m,total so both transistors contribute equally around V_M = V_DD / 2.',
      'Note that at V_in = V_DD / 2 = 0.9V (in 180nm), V_GS,N = V_SG,P = 0.9V, which fixes V_ov ≈ 0.42V unless supply voltage V_DD is scaled or threshold-tracking bias is used.',
      'Select L to satisfy the DC gain requirement A_v0 = (g_mn + g_mp)(r_on || r_op), then size W_N and W_P ≈ 3.2 W_N so I_DN = I_DP at V_in = 0.9V.',
    ],
    sizingJustification: [
      {
        parameter: 'Width Ratio W_P / W_N ≈ 3.0 to 3.5 in 180nm CMOS',
        recommendedRange: '2.8 to 3.5',
        physicalReasoning:
          'Hole mobility μ_p in silicon is ~3× lower than electron mobility μ_n. Sizing W_P ≈ 3.2 W_N equalizes pull-up and pull-down strengths so V_M = V_DD/2 and g_mp ≈ g_mn.',
      },
    ],
    workedExample: {
      problemStatement:
        'Design a self-biased 180nm CMOS inverter amplifier (V_DD = 1.8 V) to achieve GBW = 100 MHz driving C_L = 1.0 pF with V_M = 0.90 V and DC gain >= 30 dB.',
      specs: [
        { label: 'Supply Voltage V_DD', value: '1.8 V (Biased at V_M = 0.90 V)' },
        { label: 'Target GBW & Load', value: '100 MHz into C_L = 1.0 pF' },
        { label: 'Target DC Gain |A_v0|', value: '>= 30 dB (31.6 V/V)' },
      ],
      steps: [
        {
          stepTitle: 'Step 1: Compute Total Required Transconductance (g_mn + g_mp)',
          reasoning: 'From GBW = (g_mn + g_mp) / (2π C_L):',
          formulaLatex: 'g_{mn} + g_{mp} = 2\\pi \\cdot \\text{GBW} \\cdot C_L',
          calculation: 'g_m,tot = 2π × 100 MHz × 1.0 pF = 628.3 μS => g_mn = g_mp = 314.2 μS',
          resultWithUnits: 'g_mn = 314.2 μS, g_mp = 314.2 μS',
        },
        {
          stepTitle: 'Step 2: Compute Quiescent Current I_Q at V_GS = 0.9 V',
          reasoning: 'At V_in = 0.9 V, V_ov,N = 0.9 - 0.45 = 0.45 V (gm/Id ≈ 4.8 V⁻¹). Thus I_Q = g_mn / (gm/Id):',
          formulaLatex: 'I_Q = \\frac{g_{mn}}{(g_m/I_D)_N}',
          calculation: 'I_Q = 314.2 μS / 4.8 V⁻¹ = 65.5 μA',
          resultWithUnits: 'I_Q = 65.5 μA',
        },
        {
          stepTitle: 'Step 3: Size W_N, W_P, and L for V_M = 0.9 V and Gain >= 30 dB',
          reasoning: 'Choose L = 0.54 μm (3× L_min) to boost r_o so (g_mn+g_mp)(r_on||r_op) = 36 V/V (31.1 dB).',
          formulaLatex: 'W_N = 1.3\\;\\mu\\text{m}, \\qquad W_P = 3.3 \\times W_N = 4.3\\;\\mu\\text{m}',
          calculation: 'With L = 0.54 μm, W_N = 1.3 μm and W_P = 4.3 μm centers V_M = 0.90 V.',
          resultWithUnits: 'L = 0.54 μm, W_N = 1.3 μm, W_P = 4.3 μm',
        },
      ],
    },
    simulationSteps: [
      {
        analysisType: 'DC VTC & Slope Gain Sweep (.dc)',
        spiceDirective: '.dc VIN 0 1.8 0.002',
        whatToCheck:
          'Plot V(vout) and its derivative d(V(vout)) vs V(vin). Verify V(vout) crosses V(vin) at 0.90 V and peak |d(V(vout))| >= 31.6 V/V.',
      },
      {
        analysisType: 'Self-Biased Small-Signal AC Sweep (.ac)',
        spiceDirective: 'RF vout vin 100Meg\nCIN in_ac vin 1u\n.ac dec 100 100 1G',
        whatToCheck:
          'Verify low-frequency gain above the high-pass corner f_HP = 1/(2π R_F C_in) and measure unity-gain frequency.',
      },
    ],
    verificationTable: [
      {
        metric: 'Switching Threshold',
        symbol: 'V_M',
        targetSpec: '0.90 V',
        handCalcValue: '0.90 V',
        typicalSpiceValue: '0.894 V',
        discrepancyReason: 'Slight difference between NMOS and PMOS velocity saturation factors.',
      },
      {
        metric: 'Small-Signal Voltage Gain',
        symbol: '|A_v0|',
        targetSpec: '>= 30.0 dB',
        handCalcValue: '31.1 dB',
        typicalSpiceValue: '30.8 dB',
        discrepancyReason: 'PMOS DIBL slightly higher than NMOS at L = 0.54 μm.',
      },
      {
        metric: 'Unity-Gain Bandwidth',
        symbol: 'GBW',
        targetSpec: '100 MHz',
        handCalcValue: '100.0 MHz',
        typicalSpiceValue: '96.4 MHz',
        discrepancyReason: 'Miller multiplication of C_gd,n + C_gd,p across input and output.',
      },
    ],
    commonMistakes: [
      {
        mistake: 'Using W_P = W_N in a CMOS inverter and expecting symmetrical swing around VDD/2.',
        consequence:
          'Because hole mobility is ~3× lower than electron mobility, W_P = W_N skews V_M down to ~0.72 V, pushing M_N close to triode and shrinking NM_L.',
        fix: 'Size W_P ≈ (2.8 to 3.5) × W_N and verify V_out = V_in = V_DD/2 using a DC sweep.',
      },
      {
        mistake: 'Ignoring PVT supply and process variations in a simple self-biased inverter amplifier.',
        consequence:
          'Because V_GSN + V_SGP = V_DD Directly, quiescent current I_Q varies by up to 5× across SS/1.62V vs FF/1.98V corners!',
        fix: 'Supply the inverter through a current-starved tail/header current mirror (current-starved inverter) when tight power control across PVT is required.',
      },
    ],
    checklistItems: [
      'Confirmed V_M = V_DD/2 ± 20 mV at nominal TT corner via .dc sweep.',
      'Verified both M_N and M_P are in saturation at V_in = V_M.',
      'Checked worst-case crowbar / quiescent current at FF + 1.98V supply corner.',
      'Included Miller capacitance (1 + |A_v|)(C_gdn + C_gdp) when calculating input capacitance.',
    ],
    miniProject: {
      title: 'Mini-Project 3: Current-Reuse Inverter OTA vs. Single-Ended Common Source',
      objective:
        'Compare the GBW and DC gain of a CMOS inverter amplifier biased at I_Q = 50 μA against an NMOS common-source amplifier with an ideal 50 μA PMOS current-source load.',
      deliverables: [
        'Show in simulation that the inverter achieves ~1.9× higher GBW at the exact same 50 μA supply current.',
        'Measure PSRR (supply-to-output gain) of both topologies and explain why the simple inverter has poor PSRR.',
      ],
    },
    quiz: [
      {
        id: 'm3_q1',
        question:
          'Why does a CMOS inverter biased at V_in = V_out = V_M achieve nearly twice the transconductance per unit current of a standard common-source stage?',
        options: [
          'The same DC bias current flows through both PMOS and NMOS in series, while their AC gate drives are in parallel (g_m,eff = g_mn + g_mp)',
          'The PMOS acts as a negative resistance that cancels output conductance',
          'Both transistors operate in the triode region where transconductance is highest',
          'The Miller effect reduces load capacitance C_L by a factor of two',
        ],
        correctIndex: 0,
        explanation:
          'In the push-pull inverter, DC current I_Q is reused by both M_P and M_N, so small-signal output current is i_out = -(g_mn + g_mp) v_in, doubling the effective transconductance for a given supply current.',
      },
    ],
  },

  /* ==========================================================================
   * MODULE 4: 5-Transistor (5T) Operational Transconductance Amplifier (OTA)
   * ========================================================================== */
  {
    id: 4,
    roman: 'IV',
    shortTitle: '4. 5-Transistor (5T) OTA',
    title: '5T OTA: Differential Pair, Current-Mirror Load, Gain, GBW, CMRR, ICMR, Slew Rate & Offset',
    level: 'Intermediate',
    estimatedHours: 10,
    prerequisites: 'Modules 1 & 2 (gm/Id sizing)',
    withoutAiTrack: 'Complete hand-calc gm/Id sizing from specs (Av, GBW, SR, ICMR, CL) and verify in LTspice/ngspice.',
    withAiTrack: 'Run multi-objective Bayesian Optimization to trade off input-pair area (offset) against mirror pole phase margin.',
    abstract:
      'The 5-transistor operational transconductance amplifier (5T OTA) is the workhorse building block of analog IC design—serving both as a standalone single-stage amplifier and as the input stage of multi-stage op-amps, LDOs, and bandgap references. This module derives its differential small-signal gain Av = gm1(ro2 || ro4), unity-gain bandwidth GBW = gm1/(2π CL), mirror doublet pole-zero pair, Common-Mode Rejection Ratio (CMRR), Input Common-Mode Range (ICMR), slew rate SR = Itail/CL, and systematic/random offset, followed by a complete gm/Id sizing walkthrough.',
    indexTerms: [
      '5T OTA',
      'differential pair',
      'active current mirror load',
      'ICMR',
      'CMRR',
      'slew rate',
      'Pelgrom offset',
    ],
    schematicId: 'ota5t',
    figNumber: 'Fig. 4.1',
    figCaption:
      '5-Transistor (5T) NMOS-input OTA comprising differential pair (M1–M2), active PMOS current-mirror load (M3–M4), and tail current sink (M5) driving capacitive load C_L [1], [2].',
    inlineTool: 'ota5t_calc',
    conceptParagraphs: [
      'Why do virtually all precision analog circuits use a differential pair (M1, M2) biased by a tail current source (M5)? First, the virtual AC ground at the common-source tail node makes the circuit immune to common-mode supply and substrate noise. Second, pairing the differential pair with an active PMOS current-mirror load (M3, M4) converts the balanced differential currents (±g_m1 v_id / 2) into a single-ended output current (g_m1 v_id) without losing half the signal!',
      'In a 5T OTA, the high-impedance node is directly at the output V_out (R_out = r_o2 || r_o4). Therefore, the load capacitor C_L itself acts as the compensation capacitor! As C_L increases, the dominant pole f_p1 = 1/(2π R_out C_L) moves to lower frequency, actually improving Phase Margin.',
    ],
    theoryParagraphs: [
      {
        heading: '4.1 Differential Gain, GBW, and the Mirror Pole-Zero Doublet',
        body: 'When a small differential voltage v_id = v_inp - v_inn is applied, M1 pulls a current +g_m1 v_id/2 from diode-connected M3, which M4 mirrors into the output node while M2 sinks -g_m1 v_id/2. The two currents sum constructively to i_out = g_m1 v_id driving R_out = r_o2 || r_o4. The left branch experiences a non-dominant mirror pole f_p2 at node V_mir with impedance 1/g_m3 and capacitance C_mir ≈ 2 C_gs3 [1], [3]:',
        equationLatex:
          'A_{v0} = g_{m1}(r_{o2} \\parallel r_{o4}), \\qquad \\text{GBW} = \\frac{g_{m1}}{2\\pi C_L}, \\qquad f_{p2} = \\frac{g_{m3}}{2\\pi (2 C_{gs3} + C_{db1} + C_{db3})}',
        equationNum: '4.1',
      },
      {
        heading: '4.2 ICMR, Output Voltage Swing, and Slew Rate',
        body: 'Every transistor M1–M5 must remain in saturation across the specified Input Common-Mode Range (ICMR). If V_CM drops too low, M5 is crushed into triode; if V_CM rises too high, M1 and M2 hit the PMOS diode drop of M3 and enter triode. Under a large voltage step, all of I_tail steers to one side, limiting the maximum rate of voltage change to the Slew Rate (SR) [1]:',
        equationLatex:
          'V_{CM,\\min} = V_{DS,\\text{sat5}} + V_{GS1}, \\qquad V_{CM,\\max} = V_{DD} - |V_{SG3}| + V_{thn1}, \\qquad SR = \\frac{I_{\\text{tail}}}{C_L}',
        equationNum: '4.2',
      },
      {
        heading: '4.3 Systematic and Random Input-Referred Offset Voltage',
        body: 'Even with zero random mismatch, a 5T OTA exhibits systematic offset if V_out != V_mir because channel-length modulation causes I_D4 != I_D3. Random offset is governed by Pelgrom’s mismatch law of the input pair (M1, M2) and amplified by (g_m3/g_m1) from the PMOS mirror load (M3, M4) [3]:',
        equationLatex:
          '\\sigma^2(V_{os,\\text{in}}) = \\sigma^2(\\Delta V_{th1,2}) + \\left(\\frac{g_{m3}}{g_{m1}}\\right)^2 \\sigma^2(\\Delta V_{th3,4}) = \\frac{A_{VTn}^2}{W_1 L_1} + \\left(\\frac{g_{m3}}{g_{m1}}\\right)^2 \\frac{A_{VTp}^2}{W_3 L_3}',
        equationNum: '4.3',
      },
    ],
    keyEquations: [
      {
        name: 'Small-Signal DC Gain',
        latex: 'A_{v0} = g_{m1}(r_{o2} \\parallel r_{o4}) = \\frac{(g_m/I_D)_1}{\\lambda_n + \\lambda_p}',
        eqNum: '4.1a',
        units: 'V/V',
        note: 'Typically 32–42 dB in 180nm CMOS; independent of absolute tail current if gm/Id is fixed.',
      },
      {
        name: 'Gain-Bandwidth Product (GBW)',
        latex: '\\text{GBW} = \\frac{g_{m1}}{2\\pi C_L}',
        eqNum: '4.1b',
        units: 'Hz',
        note: 'Controlled purely by input pair transconductance g_m1 and load capacitance C_L.',
      },
      {
        name: 'Large-Signal Slew Rate',
        latex: 'SR = \\frac{I_{\\text{tail}}}{C_L} = \\frac{2 I_{D1}}{C_L}',
        eqNum: '4.2a',
        units: 'V/μs',
        note: 'Relates to GBW via SR / GBW = 2π · V*_1 = 4π / (gm/Id)_1.',
      },
      {
        name: 'Input-Referred Random Offset Variance',
        latex: '\\sigma^2(V_{os}) = \\frac{A_{VTn}^2}{W_1 L_1} + \\left[\\frac{(g_m/I_D)_3}{(g_m/I_D)_1}\\right]^2 \\frac{A_{VTp}^2}{W_3 L_3}',
        eqNum: '4.3a',
        units: 'V²',
        note: 'Choosing (gm/Id)_3 << (gm/Id)_1 suppresses the mirror load’s noise and offset contribution!',
      },
    ],
    handCalcMethodology: [
      'Step 1 (Tail Current from Slew Rate): Compute minimum tail current I_tail,min = SR · C_L.',
      'Step 2 (Transconductance from GBW): Compute required g_m1 = 2π · GBW · C_L.',
      'Step 3 (Input Pair gm/Id Selection): Choose (gm/Id)_1,2 = 15–20 V⁻¹ (V*_1 ≈ 100–130 mV). Check that I_D1 = g_m1 / (gm/Id)_1 >= I_tail,min / 2; if not, increase I_D1 or adjust (gm/Id)_1.',
      'Step 4 (Mirror Load & Tail gm/Id Selection): Choose (gm/Id)_3,4 = 8–10 V⁻¹ (V*_3 ≈ 200–250 mV) to suppress mirror offset/noise and push mirror pole f_p2 >> 3 · GBW. Choose (gm/Id)_5 = 10–12 V⁻¹.',
      'Step 5 (Channel Length & Width Lookup): Pick L1–L5 (e.g., 0.36–0.54 μm) to satisfy A_v0 >= Spec, then compute W_i = I_Di / (I_D/W)_i from the lookup table.',
    ],
    sizingJustification: [
      {
        parameter: 'Ratio (gm/Id)_3 / (gm/Id)_1 <= 0.5 (e.g., 8 V⁻¹ vs 16 V⁻¹)',
        recommendedRange: '(gm/Id)_1 = 16–20 V⁻¹, (gm/Id)_3 = 8–10 V⁻¹',
        physicalReasoning:
          'In Eq. (4.3a) and input-referred thermal noise, the PMOS load noise and offset are multiplied by (g_m3 / g_m1)^2 = [(gm/Id)_3 / (gm/Id)_1]^2. Making (gm/Id)_3 half of (gm/Id)_1 reduces PMOS mirror power noise and offset variance by 4× (75%)!',
      },
    ],
    workedExample: {
      problemStatement:
        'Design a 180nm 5T OTA (V_DD = 1.8 V) to meet: GBW >= 40 MHz, C_L = 2.0 pF, Slew Rate >= 20 V/μs, DC Gain >= 34 dB (50 V/V), ICMR = 0.65 V to 1.45 V, and Phase Margin >= 70°.',
      specs: [
        { label: 'GBW & Load C_L', value: '40 MHz driving C_L = 2.0 pF' },
        { label: 'Slew Rate SR', value: '>= 20 V/μs' },
        { label: 'DC Voltage Gain A_v0', value: '>= 34 dB (50 V/V)' },
        { label: 'ICMR & Phase Margin', value: '0.65 V – 1.45 V, PM >= 70°' },
      ],
      steps: [
        {
          stepTitle: 'Step 1: Determine g_m1 and Branch Current I_D1 from GBW and SR',
          reasoning: 'Calculate g_m1 from GBW and compare current with Slew Rate requirement:',
          formulaLatex: 'g_{m1} = 2\\pi \\cdot \\text{GBW} \\cdot C_L, \\qquad I_{\\text{tail,SR}} = SR \\cdot C_L',
          calculation: 'g_m1 = 2π × 40 MHz × 2.0 pF = 502.7 μS. Choose (gm/Id)_1 = 16 V⁻¹ => I_D1 = 502.7 / 16 = 31.42 μA (I_tail = 62.84 μA > 20 V/μs × 2 pF = 40 μA).',
          resultWithUnits: 'g_m1 = 502.7 μS, I_D1 = 31.4 μA, I_tail = 62.8 μA (SR = 31.4 V/μs)',
        },
        {
          stepTitle: 'Step 2: Select Channel Length L and Verify DC Gain A_v0',
          reasoning: 'At L = 0.36 μm in 180nm, (gm*ro)_1 = 49.4 and (gm*ro)_4 = 38.2 at (gm/Id)_3 = 10 V⁻¹:',
          formulaLatex: 'A_{v0} = g_{m1}(r_{o2} \\parallel r_{o4})',
          calculation: 'r_o2 = 49.4 / 502.7μS = 98.3 kΩ; r_o4 = (38.2 / 10) / 31.4μA = 121.6 kΩ => R_out = 54.4 kΩ => A_v0 = 0.5027 mS × 54.4 kΩ = 27.3 V/V (or increase L4 to 0.54 μm to get A_v0 = 52 V/V = 34.3 dB).',
          resultWithUnits: 'A_v0 = 34.3 dB (52 V/V)',
        },
        {
          stepTitle: 'Step 3: Compute Device Widths W1, W3, W5 from Current Density Lookup',
          reasoning: 'Using 180nm lookup values: (I_D/W)_1 = 3.74 μA/μm, (I_D/W)_3 = 3.12 μA/μm, (I_D/W)_5 = 11.2 μA/μm:',
          formulaLatex: 'W_1 = \\frac{31.4\\;\\mu\\text{A}}{3.74}, \\quad W_3 = \\frac{31.4\\;\\mu\\text{A}}{3.12}, \\quad W_5 = \\frac{62.8\\;\\mu\\text{A}}{11.2}',
          calculation: 'W1 = W2 = 8.40 μm; W3 = W4 = 10.06 μm; W5 = 5.61 μm',
          resultWithUnits: 'W1,2 = 8.4 μm, W3,4 = 10.1 μm, W5 = 5.6 μm',
        },
        {
          stepTitle: 'Step 4: Verify ICMR and Mirror Pole Phase Margin',
          reasoning: 'Check V_CM,min = V*_5 + V_GS1 = 0.20 + 0.58 = 0.78V (or use gm/Id_5=14 for 0.65V) and mirror pole f_p2:',
          formulaLatex: 'f_{p2} = \\frac{g_{m3}}{2\\pi (2 C_{gs3})} \\approx 420\\text{ MHz} \\implies PM = 90^\\circ - \\arctan\\left(\\frac{40}{420}\\right) = 84.6^\\circ',
          calculation: 'PM = 84.6° >= 70° spec.',
          resultWithUnits: 'PM = 84.6°',
        },
      ],
    },
    simulationSteps: [
      {
        analysisType: 'DC Operating Point & Systematic Offset (.op / .dc)',
        spiceDirective: '.op\n.dc VINP -5m 5m 50u',
        whatToCheck:
          'Verify all 5 transistors have Vds > Vdsat + 50mV, and check V(vout) at VINP = VINN = VCM equals V(vmir) within ±30 mV.',
      },
      {
        analysisType: 'Open-Loop AC Frequency Response (.ac)',
        spiceDirective: '.ac dec 100 10 1G',
        whatToCheck:
          'Measure DC gain in dB, unity-gain frequency (GBW), and Phase Margin at 0 dB.',
      },
      {
        analysisType: 'Large-Signal Unity-Gain Step Slew Rate (.tran)',
        spiceDirective: '.tran 0.5n 200n',
        whatToCheck:
          'Configure OTA as unity-gain buffer (Vinn tied to Vout), apply a 0.5V step on Vinp, and measure rising/falling slope dV/dt.',
      },
    ],
    verificationTable: [
      {
        metric: 'DC Open-Loop Gain',
        symbol: 'A_v0',
        targetSpec: '>= 34.0 dB',
        handCalcValue: '34.3 dB',
        typicalSpiceValue: '33.9 dB',
        discrepancyReason: 'Channel-length modulation λ varies slightly with V_DS asymmetry.',
      },
      {
        metric: 'Unity-Gain Bandwidth',
        symbol: 'GBW',
        targetSpec: '40.0 MHz',
        handCalcValue: '40.0 MHz',
        typicalSpiceValue: '39.1 MHz',
        discrepancyReason: 'Drain-bulk junction capacitances C_db2 + C_db4 add ~45 fF to C_L.',
      },
      {
        metric: 'Phase Margin',
        symbol: 'PM',
        targetSpec: '>= 70°',
        handCalcValue: '84.6°',
        typicalSpiceValue: '82.1°',
        discrepancyReason: 'Mirror pole doublet and C_gd2 feedforward capacitance.',
      },
      {
        metric: 'Slew Rate',
        symbol: 'SR',
        targetSpec: '>= 20 V/μs',
        handCalcValue: '31.4 V/μs',
        typicalSpiceValue: '29.8 V/μs',
        discrepancyReason: 'Finite tail node capacitance C_tail charges during large-signal step.',
      },
    ],
    commonMistakes: [
      {
        mistake: 'Testing a high-gain OTA open-loop in SPICE without matching DC common-mode bias or using a DC feedback loop.',
        consequence:
          'Even a 1 mV systematic offset multiplied by 50 V/V shifts DC V_out by 50 mV; in higher-gain stages, V_out rails to VDD or GND, pushing M2 or M4 into triode and showing 0 dB AC gain!',
        fix: 'Use the L_big = 1 GH, C_big = 1 GF DC-feedback testbench (shown in Module 8) or trim V_inp DC offset via .dc before running .ac.',
      },
      {
        mistake: 'Connecting the bulk of input pair M1, M2 to Source when using a standard single-well p-substrate CMOS process.',
        consequence:
          'In standard p-substrate CMOS, all NMOS transistors share the common grounded p-substrate. Tying NMOS bulk to V_tail shorts V_tail to substrate in layout (DRC/LVS error) unless a Triple-Well (Deep N-Well) layer is used.',
        fix: 'In standard twin-well CMOS, connect NMOS M1/M2 bulks to GND (0) and account for body effect on V_th1,2, or use a PMOS input pair wrapped in its own isolated N-Well.',
      },
    ],
    checklistItems: [
      'Verified I_tail satisfies BOTH GBW (via gm1) and Slew Rate (I_tail >= SR · C_L).',
      'Confirmed (gm/Id)_3,4 < 0.6 × (gm/Id)_1,2 to minimize PMOS mirror noise and offset.',
      'Checked that V_DS5 >= V_DS,sat5 + 50 mV at minimum input common-mode voltage V_CM,min.',
      'Verified Phase Margin across worst-case maximum C_L and minimum temperature (-40°C).',
    ],
    miniProject: {
      title: 'Mini-Project 4: Complete 5T OTA Design & Live Netlist Verification',
      objective:
        'Use the embedded 5T OTA Calculator above to design an OTA for GBW = 60 MHz, C_L = 1.5 pF, and SR = 35 V/μs. Download the generated .cir netlist and verify in LTspice/ngspice.',
      deliverables: [
        'Compare the calculator’s predicted A_v0, GBW, and PM against your SPICE .meas output.',
        'Measure CMRR by applying a 1V AC common-mode signal to both inputs simultaneously.',
      ],
    },
    quiz: [
      {
        id: 'm4_q1',
        question:
          'In a single-stage 5T OTA compensated directly by its load capacitor C_L, what happens to GBW and Phase Margin if the load capacitance C_L is DOUBLED?',
        options: [
          'GBW is cut in half, and Phase Margin IMPROVES (increases toward 90°) because the dominant output pole moves lower while the mirror pole f_p2 stays fixed',
          'GBW doubles and Phase Margin degrades',
          'Both GBW and Phase Margin decrease',
          'GBW remains constant while Slew Rate doubles',
        ],
        correctIndex: 0,
        explanation:
          'Because the dominant pole is at the output node (f_p1 = 1/(2π R_out C_L)), doubling C_L halves GBW = g_m1/(2π C_L) while leaving the internal mirror pole f_p2 = g_m3/(2π C_mir) unchanged. Since GBW moves further below f_p2, Phase Margin increases!',
      },
      {
        id: 'm4_q2',
        question:
          'How do you reduce the input-referred random offset voltage contribution of the PMOS current mirror load (M3, M4) in a 5T OTA?',
        options: [
          'Bias M3, M4 at a lower gm/Id (larger overdrive V*) than M1, M2 and increase channel length L3, L4',
          'Make M3, M4 minimum channel length L_min and bias them in weak inversion',
          'Increase tail current source M5 overdrive',
          'Reduce the width W1, W2 of the NMOS input pair',
        ],
        correctIndex: 0,
        explanation:
          'From Eq. (4.3a), the PMOS threshold mismatch is scaled by (g_m3 / g_m1)^2 = [(gm/Id)_3 / (gm/Id)_1]^2. Choosing a small (gm/Id)_3 and large area W_3 L_3 (specifically long L_3) drastically suppresses mirror offset.',
      },
    ],
  },

  /* ==========================================================================
   * MODULE 5: Two-Stage Miller-Compensated Op-Amp
   * ========================================================================== */
  {
    id: 5,
    roman: 'V',
    shortTitle: '5. Two-Stage Miller Op-Amp',
    title: 'Two-Stage Op-Amp: Miller Compensation, Pole Splitting, RHP Zero & Nulling Resistor Sizing',
    level: 'Intermediate',
    estimatedHours: 12,
    prerequisites: 'Module 4 (5T OTA)',
    withoutAiTrack: 'Derive Miller pole splitting and RHP zero cancellation by hand; size Stage 1, Stage 2, Cc, and Rz for PM >= 60°.',
    withAiTrack: 'Use Bode Plot Visualizer + Two-Stage Calculator to co-optimize Cc and Rz across capacitive load steps.',
    abstract:
      'A single-stage 5T OTA provides limited DC gain (30–40 dB), and cascoding to increase gain severely restricts output voltage swing in low-voltage processes. The two-stage CMOS op-amp solves this fundamental conflict by cascading a high-gain differential first stage with a wide-swing common-source second stage. However, cascading two high-impedance nodes creates two low-frequency poles that drive Phase Margin near 0° (oscillation). This module covers Miller frequency compensation (pole splitting), explains the physical origin of the Right-Half-Plane (RHP) feedforward zero, derives nulling resistor (Rz) design equations, and provides a complete gm/Id sizing flow.',
    indexTerms: [
      'Two-stage op-amp',
      'Miller compensation',
      'pole splitting',
      'Right-Half-Plane (RHP) zero',
      'nulling resistor (Rz)',
      'phase margin',
    ],
    schematicId: 'opamp2stage',
    figNumber: 'Fig. 5.1',
    figCaption:
      'Two-stage CMOS Miller-compensated operational amplifier featuring Stage 1 differential OTA (M1–M5), Stage 2 common-source high-swing output stage (M6–M7), and Miller compensation network (C_c, R_z) [1], [2].',
    inlineTool: 'opamp2stage_calc',
    conceptParagraphs: [
      'Why does an uncompensated two-stage op-amp oscillate in negative feedback? Because both the Stage 1 output node (V_1) and the Stage 2 output node (V_out) have high small-signal resistance (R_1 and R_2), forming two low-frequency poles f_p1 and f_p2 well below the unity-gain frequency. By the time loop gain drops to 0 dB, the two poles have already contributed -180° of phase shift, yielding ~0° Phase Margin!',
      'Connecting a Miller capacitor C_c across the inverting second stage (M6) achieves two remarkable things simultaneously ("Pole Splitting"): (1) By the Miller theorem, Stage 1 sees an effective capacitance of (1 + g_m6 R_2) C_c, pushing the dominant pole f_p1 down to a very low frequency; and (2) At high frequencies where C_c shorts the gate and drain of M6 together, M6 turns into a low-impedance diode-connected load (~1/g_m6), pushing the output pole f_p2 UP to g_m6 / (2π C_L)!',
    ],
    theoryParagraphs: [
      {
        heading: '5.1 Miller Pole-Splitting Equations',
        body: 'Let R_1, C_1 and R_2, C_L denote the total resistance and capacitance at nodes V_1 and V_out respectively. Introducing Miller capacitor C_c splits the two poles widely apart [1], [3]:',
        equationLatex:
          'f_{p1} \\approx \\frac{1}{2\\pi R_1 (g_{m6} R_2 C_c)}, \\qquad \\text{GBW} = A_{v0} f_{p1} = \\frac{g_{m1}}{2\\pi C_c}, \\qquad f_{p2} \\approx \\frac{g_{m6}}{2\\pi (C_L + C_1)}',
        equationNum: '5.1',
      },
      {
        heading: '5.2 The Right-Half-Plane (RHP) Feedforward Zero and Nulling Resistor Rz',
        body: 'Because C_c provides a direct passive path from node V_1 to V_out that bypasses the inverting transconductance of M6 at high frequencies, it creates a Right-Half-Plane (RHP) zero at f_z1 = +g_m6 / (2π C_c). An RHP zero boosts magnitude (+20 dB/dec, extending GBW) while LAGGING phase (-90°), destroying Phase Margin! Placing a nulling resistor R_z in series with C_c modifies the zero location to [2]:',
        equationLatex:
          'f_{z1} = \\frac{1}{2\\pi C_c \\left(\\frac{1}{g_{m6}} - R_z\\right)} \\implies \\begin{cases} R_z = \\frac{1}{g_{m6}} & \\implies f_{z1} \\to \\infty \\text{ (Zero eliminated)} \\\\ R_z = \\frac{1}{g_{m6}}\\left(1 + \\frac{C_L}{C_c}\\right) & \\implies f_{z1} = -f_{p2} \\text{ (LHP zero cancels } f_{p2}\\text{)} \\end{cases}',
        equationNum: '5.2',
      },
      {
        heading: '5.3 Phase Margin and Slew Rate Constraints in Both Stages',
        body: 'During a large step input, both C_c (charged by Stage 1 tail current I_tail) and C_L + C_c (charged/discharged by Stage 2 current I_D6) must slew without current starvation:',
        equationLatex:
          'PM = 90^\\circ - \\arctan\\left(\\frac{\\text{GBW}}{f_{p2}}\\right) - \\arctan\\left(\\frac{\\text{GBW}}{f_{z1}}\\right), \\qquad SR = \\min\\left(\\frac{I_{\\text{tail}}}{C_c},\\; \\frac{I_{D6} - I_{\\text{tail}}}{C_L + C_c}\\right)',
        equationNum: '5.3',
      },
    ],
    keyEquations: [
      {
        name: 'Overall DC Voltage Gain',
        latex: 'A_{v0} = A_{v1} \\cdot A_{v2} = [g_{m1}(r_{o2}\\parallel r_{o4})] \\cdot [g_{m6}(r_{o6}\\parallel r_{o7})]',
        eqNum: '5.1a',
        units: 'V/V',
        note: 'Typically 65–85 dB (1,800–18,000 V/V) in 180nm CMOS.',
      },
      {
        name: 'Miller-Compensated GBW',
        latex: '\\text{GBW} = \\frac{g_{m1}}{2\\pi C_c}',
        eqNum: '5.1b',
        units: 'Hz',
        note: 'Set by Stage 1 input transconductance g_m1 and Miller capacitor C_c.',
      },
      {
        name: 'Non-Dominant Output Pole',
        latex: 'f_{p2} \\approx \\frac{g_{m6}}{2\\pi C_L} \\ge (2.2 \\text{ to } 3.0) \\cdot \\text{GBW}',
        eqNum: '5.1c',
        units: 'Hz',
        note: 'Requires large Stage 2 transconductance g_m6 to achieve PM >= 60°.',
      },
      {
        name: 'Nulling Resistor for RHP Zero Elimination',
        latex: 'R_z = \\frac{1}{g_{m6}} \\quad \\text{(or triode MOSFET biased to track } 1/g_{m6}\\text{)}',
        eqNum: '5.2a',
        units: 'Ω',
        note: 'Prevents feedforward current through C_c at high frequencies.',
      },
    ],
    handCalcMethodology: [
      'Step 1 (Choose Miller Cap C_c): Set C_c ≈ (0.22 to 0.35) · C_L for 60°–65° Phase Margin and good kT/C noise.',
      'Step 2 (Size Stage 1 from GBW & SR): Compute g_m1 = 2π · GBW · C_c and ensure I_tail >= SR · C_c. Pick (gm/Id)_1 = 15–18 V⁻¹ and size M1–M5.',
      'Step 3 (Size Stage 2 from f_p2 Stability): Place f_p2 = 2.5 · GBW, giving g_m6 = 2.5 · g_m1 · (C_L / C_c) ≈ (7 to 10) · g_m1. Pick (gm/Id)_6 = 12–15 V⁻¹, compute I_D6 = g_m6 / (gm/Id)_6, and check I_D6 >= SR · (C_L + C_c).',
      'Step 4 (Eliminate Systematic Offset Error): Ensure current density in M6 matches M3/M4: (W/L)_6 / (W/L)_4 = I_D6 / I_D4 so V_SG6 = V_SG3 at quiescent equilibrium!',
      'Step 5 (Size Nulling Resistor R_z): Set R_z = 1 / g_m6 (or (1/g_m6)(1 + C_L/C_c) for LHP pole-zero cancellation).',
    ],
    sizingJustification: [
      {
        parameter: 'Systematic Offset Condition: (W/L)_6 / (W/L)_4 = I_D6 / I_D4',
        recommendedRange: 'Exact current density matching between M3, M4, and M6',
        physicalReasoning:
          'For zero systematic input offset, the drain of M4 (which drives the gate of M6) must sit at the same DC potential as the gate/drain of M3. That means V_SG6 must equal V_SG3 = V_SG4, requiring M6 and M4 to be biased at the exact same current density I_D/(W/L) (same gm/Id and same channel length L)!',
      },
    ],
    workedExample: {
      problemStatement:
        'Design a 180nm Two-Stage Miller Op-Amp (V_DD = 1.8 V) for GBW = 30 MHz driving C_L = 5.0 pF with Phase Margin >= 62°, Slew Rate >= 20 V/μs, and DC Gain >= 70 dB.',
      specs: [
        { label: 'Target GBW & Load C_L', value: '30 MHz into C_L = 5.0 pF' },
        { label: 'Phase Margin & Slew Rate', value: 'PM >= 62°, SR >= 20 V/μs' },
        { label: 'DC Gain A_v0', value: '>= 70 dB (3,162 V/V)' },
      ],
      steps: [
        {
          stepTitle: 'Step 1: Choose Miller Capacitor C_c and Compute Stage 1 g_m1',
          reasoning: 'Select C_c = 0.25 × C_L = 1.25 pF. Check Slew Rate current I_tail >= 20 V/μs × 1.25 pF = 25 μA:',
          formulaLatex: 'C_c = 1.25\\text{ pF}, \\qquad g_{m1} = 2\\pi (30\\text{ MHz})(1.25\\text{ pF}) = 235.6\\;\\mu\\text{S}',
          calculation: 'Choose (gm/Id)_1 = 16 V⁻¹ => I_D1 = 14.7 μA => I_tail = 29.5 μA (satisfies SR = 23.6 V/μs).',
          resultWithUnits: 'C_c = 1.25 pF, g_m1 = 235.6 μS, I_tail = 29.5 μA',
        },
        {
          stepTitle: 'Step 2: Compute Stage 2 g_m6 and Current I_D6 for PM >= 62°',
          reasoning: 'Place f_p2 = 2.4 × GBW = 72 MHz so g_m6 = 2π (72 MHz)(5.0 pF):',
          formulaLatex: 'g_{m6} = 2\\pi f_{p2} C_L = 2262\\;\\mu\\text{S} \\;(2.26\\text{ mS})',
          calculation: 'Choose (gm/Id)_6 = (gm/Id)_3,4 = 12 V⁻¹ for zero systematic offset => I_D6 = 2262 μS / 12 V⁻¹ = 188.5 μA.',
          resultWithUnits: 'g_m6 = 2.26 mS, I_D6 = 188.5 μA',
        },
        {
          stepTitle: 'Step 3: Size Nulling Resistor R_z to Eliminate RHP Zero',
          reasoning: 'Without R_z, f_z1 = +g_m6/(2π C_c) = +288 MHz (lags phase by 6°). Set R_z = 1/g_m6:',
          formulaLatex: 'R_z = \\frac{1}{g_{m6}} = \\frac{1}{2.262\\text{ mS}} = 442\\;\\Omega',
          calculation: 'With R_z = 442 Ω, f_z1 → ∞ and PM = 90° - arctan(30/72) = 67.4°.',
          resultWithUnits: 'R_z = 442 Ω, PM = 67.4°',
        },
      ],
    },
    simulationSteps: [
      {
        analysisType: 'AC Loop-Gain & Phase Margin Verification (.ac)',
        spiceDirective: '.ac dec 100 1 1G',
        whatToCheck:
          'Plot open-loop gain and phase with R_z = 0 vs R_z = 442 Ω to directly observe the RHP zero phase drop disappear.',
      },
      {
        analysisType: 'Closed-Loop Unity-Gain Pulse Overshoot Test (.tran)',
        spiceDirective: '.tran 0.2n 300n',
        whatToCheck:
          'Apply a 50 mV small-signal step in unity-gain feedback and verify overshoot < 12% (confirming PM > 60°), then apply a 1.0 V large-signal step to verify Slew Rate.',
      },
    ],
    verificationTable: [
      {
        metric: 'Total DC Gain',
        symbol: 'A_v0',
        targetSpec: '>= 70.0 dB',
        handCalcValue: '71.4 dB',
        typicalSpiceValue: '70.8 dB',
        discrepancyReason: 'Stage 1 × Stage 2 cascade matches within 0.6 dB.',
      },
      {
        metric: 'Gain-Bandwidth Product',
        symbol: 'GBW',
        targetSpec: '30.0 MHz',
        handCalcValue: '30.0 MHz',
        typicalSpiceValue: '29.4 MHz',
        discrepancyReason: 'Finite Stage 2 voltage gain A_v2 slightly reduces Miller multiplication factor (1 + 1/A_v2).',
      },
      {
        metric: 'Phase Margin (with Rz)',
        symbol: 'PM',
        targetSpec: '>= 62.0°',
        handCalcValue: '67.4°',
        typicalSpiceValue: '64.8°',
        discrepancyReason: 'Parasitic pole created by R_z and Stage 1 node capacitance C_1 at f_p3 = 1/(2π R_z C_1).',
      },
    ],
    commonMistakes: [
      {
        mistake: 'Choosing (gm/Id)_6 different from (gm/Id)_3,4 or using different channel lengths for M3/M4 and M6.',
        consequence:
          'Causes a DC voltage mismatch between V_SG6 and V_SG3, forcing the Stage 1 output V_1 away from its nominal bias and introducing a large systematic input offset voltage.',
        fix: 'Always enforce L3 = L4 = L6 and (W/L)_6 / (W/L)_4 = I_D6 / I_D4 so M3, M4, and M6 share the exact same gate-source overdrive.',
      },
      {
        mistake: 'Sizing C_c too small (< 0.15 C_L) to save area.',
        consequence:
          'Requires an excessively large g_m6 (and huge Stage 2 current I_D6) to push f_p2 above 2.2 · GBW, or causes severe ringing in transient step response.',
        fix: 'Use C_c ≈ 0.22 C_L to 0.35 C_L and include a nulling resistor R_z tracked to 1/g_m6.',
      },
    ],
    checklistItems: [
      'Enforced systematic offset rule: L3 = L4 = L6 and (W/L)_6 / (W/L)_4 = I_D6 / I_D4.',
      'Verified R_z eliminates the RHP zero across process corners (using a triode PMOS tracking M6).',
      'Confirmed both Stage 1 (I_tail / C_c) and Stage 2 ((I_D6 - I_tail) / (C_L + C_c)) meet the Slew Rate spec.',
      'Checked transient small-signal step response overshoot is < 15% with no sustained ringing.',
    ],
    miniProject: {
      title: 'Mini-Project 5: Observe the RHP Zero and Nulling Resistor Effect in Bode & Transient',
      objective:
        'Using the Two-Stage Op-Amp Calculator and Bode Plot Visualizer, toggle between R_z = 0 Ω, R_z = 1/g_m6, and R_z > 1/g_m6.',
      deliverables: [
        'Record the Phase Margin improvement when switching from R_z = 0 to LHP pole-zero cancellation.',
        'Download the netlist and run a .step param RZ_VAL list 1 442 1800 in LTspice.',
      ],
    },
    quiz: [
      {
        id: 'm5_q1',
        question:
          'Why does the Miller capacitor C_c in a two-stage op-amp create a Right-Half-Plane (RHP) zero when no nulling resistor is used?',
        options: [
          'At high frequencies, C_c conducts input current directly to the output without inversion, opposing the inverted gm6 current of M6',
          'Because C_c resonates with the bondwire inductance of the VDD supply',
          'Because the input differential pair enters the triode region at high frequencies',
          'Because the output capacitor C_L has parasitic series resistance',
        ],
        correctIndex: 0,
        explanation:
          'At s = +g_m6 / C_c in the Right Half Plane, the non-inverting feedforward current through C_c (s C_c v_1) equals and cancels the inverting transconductance current of M6 (-g_m6 v_1), producing a net zero output current and a -90° phase lag.',
      },
    ],
  },

  /* ==========================================================================
   * MODULE 6: Low-Dropout Linear Regulator (LDO)
   * ========================================================================== */
  {
    id: 6,
    roman: 'VI',
    shortTitle: '6. LDO Voltage Regulator',
    title: 'Low-Dropout Regulator (LDO): Pass Device Sizing, Dropout, PSRR, Line/Load Regulation & ESR Stability',
    level: 'Advanced',
    estimatedHours: 10,
    prerequisites: 'Modules 4 & 5 (OTA, Miller & Loop Stability)',
    withoutAiTrack: 'Size PMOS pass transistor for dropout V_DO and analyze loop poles across I_load = 100 μA to 50 mA.',
    withAiTrack: 'Automate worst-case loop stability and load-transient droop sweeps across (I_load, C_out, R_ESR) grids.',
    abstract:
      'Sensitive analog and RF blocks require clean, low-noise DC supply rails isolated from switching converter ripple. The Low-Dropout Regulator (LDO) is a negative-feedback power control loop comprising a voltage reference (V_REF), an error amplifier, a large pass transistor, and a resistive feedback divider. This module compares PMOS vs. NMOS pass devices, derives dropout voltage (V_DO), Line and Load Regulation, Power-Supply Rejection Ratio (PSRR) across frequency, and explains why the output pole shifts by orders of magnitude with load current—requiring careful ESR zero or internal Miller compensation.',
    indexTerms: [
      'Low-Dropout Regulator (LDO)',
      'PMOS pass device',
      'dropout voltage (VDO)',
      'PSRR',
      'line and load regulation',
      'ESR zero stability',
    ],
    schematicId: 'ldo',
    figNumber: 'Fig. 6.1',
    figCaption:
      'PMOS-pass Low-Dropout (LDO) linear voltage regulator showing Error Amplifier (A_EA), pass transistor (M_PASS), feedback network (R_fb1, R_fb2), and output capacitor C_out with equivalent series resistance R_ESR [1], [2].',
    inlineTool: 'bode_visualizer',
    conceptParagraphs: [
      'Why is an LDO with a PMOS pass transistor inherently prone to oscillation if compensated naively? Because an LDO has TWO low-frequency poles: (1) the output node pole f_p,out = 1 / (2π R_out C_out), and (2) the pass-gate pole f_p,gate = 1 / (2π R_EA C_gate), where C_gate is huge (often 5–30 pF) because M_PASS has a massive width W_pass (several millimeters!) to carry 50–200 mA with minimal dropout voltage.',
      'Even worse, the output resistance of the pass transistor r_o,pass = 1 / (λ I_load) is inversely proportional to load current I_load! When the load switches from 50 mA (heavy load) down to 50 μA (sleep/light load), r_o,pass increases by 1000×, causing the output pole f_p,out and pass transconductance g_mp to move across 2–3 decades of frequency.',
    ],
    theoryParagraphs: [
      {
        heading: '6.1 Output Voltage, Dropout Voltage (V_DO), and Pass Device Sizing',
        body: 'Negative feedback forces V_fb = V_OUT · R_fb2 / (R_fb1 + R_fb2) = V_REF. The minimum input-to-output differential voltage required to keep M_PASS in saturation at maximum load current I_load,max is the Dropout Voltage V_DO = V_DS,sat(M_PASS) [2]:',
        equationLatex:
          'V_{\\text{OUT}} = V_{\\text{REF}}\\left(1 + \\frac{R_{fb1}}{R_{fb2}}\\right), \\qquad V_{DO} = V_{DS,\\text{sat,pass}} = \\sqrt{\\frac{2 I_{\\text{load,max}}}{\\mu_p C_{ox} (W/L)_{\\text{pass}}}}',
        equationNum: '6.1',
      },
      {
        heading: '6.2 Loop Gain, Moving Output Pole, and Output-Cap ESR Zero',
        body: 'The open-loop transfer function T(s) has two poles (f_p,out and f_p,gate) and an Left-Half-Plane (LHP) zero f_z,esr introduced by the Equivalent Series Resistance (R_ESR) of the off-chip output capacitor C_out:',
        equationLatex:
          'T(s) = \\frac{\\beta A_{EA} g_{mp} R_{\\text{out}} \\left(1 + s R_{\\text{ESR}} C_{\\text{out}}\\right)}{\\left(1 + s R_{\\text{out}} C_{\\text{out}}\\right)\\left(1 + s R_{EA} C_{\\text{gate}}\\right)}, \\qquad f_{z,\\text{esr}} = \\frac{1}{2\\pi R_{\\text{ESR}} C_{\\text{out}}}',
        equationNum: '6.2',
      },
      {
        heading: '6.3 Line Regulation, Load Regulation, and Transient Droop',
        body: 'High DC loop gain T_0 = β A_EA g_mp R_out suppresses steady-state load and supply variations. Under a sudden load current step ΔI_load with rise time < 1/GBW, the loop cannot respond immediately and C_out supplies the charge, producing transient voltage droop ΔV_droop:',
        equationLatex:
          '\\frac{\\Delta V_{\\text{OUT}}}{\\Delta I_{\\text{load}}} = \\frac{R_{\\text{out}}}{1 + \\beta A_{EA} g_{mp} R_{\\text{out}}} \\approx \\frac{1}{\\beta A_{EA} g_{mp}}, \\qquad \\Delta V_{\\text{droop}} \\approx \\frac{\\Delta I_{\\text{load}}}{2\\pi \\cdot \\text{GBW} \\cdot C_{\\text{out}}} + \\Delta I_{\\text{load}} R_{\\text{ESR}}',
        equationNum: '6.3',
      },
    ],
    keyEquations: [
      {
        name: 'Pass Device Width from Dropout Spec',
        latex: '\\left(\\frac{W}{L}\\right)_{\\text{pass}} = \\frac{2 I_{\\text{load,max}}}{\\mu_p C_{ox} V_{DO}^2}',
        eqNum: '6.1a',
        units: 'μm/μm',
        note: 'Typically requires W_pass = 2,000–15,000 μm for I_load = 20–100 mA and V_DO = 150–200 mV.',
      },
      {
        name: 'LHP ESR Zero Frequency',
        latex: 'f_{z,\\text{esr}} = \\frac{1}{2\\pi R_{\\text{ESR}} C_{\\text{out}}}',
        eqNum: '6.2a',
        units: 'Hz',
        note: 'Must be placed near the second pole f_p,gate to restore +90° phase and guarantee PM >= 60°.',
      },
      {
        name: 'Closed-Loop Load Regulation',
        latex: 'R_{\\text{out,CL}} = \\frac{\\Delta V_{\\text{OUT}}}{\\Delta I_{\\text{load}}} \\approx \\frac{1}{\\beta A_{EA} g_{mp}}',
        eqNum: '6.3a',
        units: 'Ω (mV/mA)',
        note: 'Typically < 0.05 Ω (50 μV/mA) when loop gain exceeds 60 dB.',
      },
    ],
    handCalcMethodology: [
      'Step 1 (Feedback Divider): Choose R_fb1 + R_fb2 to draw a small bleed current I_div ≈ 5–20 μA (so the pass device never turns completely off at 0 mA external load!) and set V_OUT = V_REF(1 + R_fb1/R_fb2).',
      'Step 2 (Pass Transistor Sizing): Using minimum L = 0.18–0.25 μm (to minimize C_gate), compute W_pass so V_DS,sat <= V_DO at I_load,max in the worst-case Slow-PMOS (SS/FS, 125°C) corner.',
      'Step 3 (Error Amplifier Output Impedance): Calculate C_gate = W_pass L_pass C_ox. Size the Error Amplifier output resistance R_EA (or buffer stage) so f_p,gate = 1/(2π R_EA C_gate) lies at a known frequency.',
      'Step 4 (Compensation across Load Current): Select C_out and R_ESR so f_z,esr cancels the non-dominant pole and maintains PM >= 45° across both I_load,min and I_load,max.',
    ],
    sizingJustification: [
      {
        parameter: 'Minimum Bleed Current in Feedback Divider I_div = 10–25 μA',
        recommendedRange: 'R_fb1 + R_fb2 = 50 kΩ to 150 kΩ',
        physicalReasoning:
          'At zero external load current (I_load = 0), if there were no bleed current through R_fb1 + R_fb2, M_PASS current would drop to zero, driving r_o,pass → ∞ and g_mp → 0, which destabilizes the LDO loop and allows leakage current to pull V_OUT up to V_IN.',
      },
    ],
    workedExample: {
      problemStatement:
        'Size a 180nm LDO regulating V_IN = 1.8 V down to V_OUT = 1.5 V from V_REF = 1.20 V at I_load,max = 20 mA with maximum dropout V_DO = 200 mV, using C_out = 1.0 μF.',
      specs: [
        { label: 'Input / Output Voltage', value: 'V_IN = 1.8 V -> V_OUT = 1.50 V (V_REF = 1.20 V)' },
        { label: 'Max Load & Dropout', value: 'I_load,max = 20 mA, V_DO <= 200 mV' },
        { label: 'Output Capacitor', value: 'C_out = 1.0 μF' },
      ],
      steps: [
        {
          stepTitle: 'Step 1: Size Feedback Divider R_fb1, R_fb2 for I_div = 15 μA',
          reasoning: 'Set total resistance R_fb1 + R_fb2 = 1.5 V / 15 μA = 100 kΩ with V_fb = 1.2 V:',
          formulaLatex: 'R_{fb2} = \\frac{1.2\\text{ V}}{15\\;\\mu\\text{A}} = 80\\text{ k}\\Omega, \\qquad R_{fb1} = \\frac{0.3\\text{ V}}{15\\;\\mu\\text{A}} = 20\\text{ k}\\Omega',
          calculation: 'β = R_fb2 / (R_fb1 + R_fb2) = 0.80 (-1.94 dB).',
          resultWithUnits: 'R_fb1 = 20 kΩ, R_fb2 = 80 kΩ (β = 0.80)',
        },
        {
          stepTitle: 'Step 2: Size PMOS Pass Transistor M_PASS for V_DO = 200 mV',
          reasoning: 'Using μ_p C_ox = 75 μA/V² and L_pass = 0.20 μm at I_load = 20 mA:',
          formulaLatex: '\\left(\\frac{W}{L}\\right)_{\\text{pass}} = \\frac{2 (20\\text{ mA})}{75\\;\\mu\\text{A/V}^2 \\times (0.20\\text{ V})^2} = 13,333',
          calculation: 'W_pass = 13,333 × 0.20 μm = 2,667 μm (2.67 mm). Gate capacitance C_gate ≈ 2667 × 0.20 × 8.6 fF = 4.59 pF.',
          resultWithUnits: 'W_pass = 2,667 μm (L = 0.20 μm), C_gate = 4.6 pF',
        },
        {
          stepTitle: 'Step 3: Place ESR Zero to Cancel Gate Pole',
          reasoning: 'With Error Amp R_EA = 180 kΩ and C_gate = 4.6 pF, f_p,gate = 1/(2π × 180k × 4.6p) = 192 kHz. Set f_z,esr = 192 kHz:',
          formulaLatex: 'R_{\\text{ESR}} = \\frac{1}{2\\pi f_{z,\\text{esr}} C_{\\text{out}}} = \\frac{1}{2\\pi (192\\text{ kHz})(1.0\\;\\mu\\text{F})} = 0.83\\;\\Omega',
          calculation: 'Choosing R_ESR = 0.8 Ω cancels f_p,gate and yields PM > 65°.',
          resultWithUnits: 'R_ESR = 0.83 Ω',
        },
      ],
    },
    simulationSteps: [
      {
        analysisType: 'Parameterized Load-Current AC Loop Stability (.ac + .step)',
        spiceDirective: '.step dec param ILOAD 10u 20m 3\n.ac dec 100 1 100Meg',
        whatToCheck:
          'Verify Phase Margin >= 45° across all load currents from 10 μA (light load) to 20 mA (full load).',
      },
      {
        analysisType: 'PSRR Frequency Sweep (.ac on VIN)',
        spiceDirective: 'VIN vin 0 DC 1.8 AC 1\n.ac dec 100 10 100Meg',
        whatToCheck:
          'Plot 20*log10(mag(V(vout))) to measure supply ripple rejection at 1 kHz, 100 kHz, and 1 MHz.',
      },
      {
        analysisType: 'Load Transient Step Response (.tran)',
        spiceDirective: 'ILOAD vout 0 PULSE(100u 20m 5u 100n 100n 20u 50u)\n.tran 10n 60u',
        whatToCheck:
          'Measure peak undershoot ΔV_droop, overshoot, and settling time without sustained ringing.',
      },
    ],
    verificationTable: [
      {
        metric: 'Regulated Output Voltage',
        symbol: 'V_OUT',
        targetSpec: '1.500 V',
        handCalcValue: '1.500 V',
        typicalSpiceValue: '1.498 V',
        discrepancyReason: 'Finite loop gain (~62 dB) leaves ~1.5 mV static error.',
      },
      {
        metric: 'Dropout Voltage (at 20 mA)',
        symbol: 'V_DO',
        targetSpec: '<= 200 mV',
        handCalcValue: '200 mV',
        typicalSpiceValue: '194 mV',
        discrepancyReason: 'PMOS enters weak-triode gradual transition.',
      },
      {
        metric: 'PSRR (at 1 kHz)',
        symbol: 'PSRR',
        targetSpec: '<= -55 dB',
        handCalcValue: '-61.2 dB',
        typicalSpiceValue: '-59.8 dB',
        discrepancyReason: 'Supply coupling through Error Amp tail current mirror.',
      },
    ],
    commonMistakes: [
      {
        mistake: 'Simulating LDO stability ONLY at maximum load current (e.g., 20 mA) and skipping no-load / light-load (10 μA).',
        consequence:
          'At light load, output resistance r_o,pass increases 100×, pushing the output pole and gate pole together or shifting GBW relative to the ESR zero, causing light-load oscillation!',
        fix: 'Always run a logarithmic .step param ILOAD from 0 mA (divider bleed only) to I_load,max when verifying LDO Phase Margin.',
      },
      {
        mistake: 'Connecting the Error Amplifier (+) and (-) inputs backwards when driving a PMOS pass transistor.',
        consequence:
          'Because the PMOS pass transistor adds an extra -180° inversion from its gate to V_OUT, connecting V_fb to the (-) input of the Error Amplifier creates positive feedback and latches V_OUT to V_IN or GND!',
        fix: 'With an inverting PMOS pass stage, connect V_fb to the NON-INVERTING (+) input of the Error Amplifier (or invert inside the EA stage) so the overall loop feedback is negative.',
      },
    ],
    checklistItems: [
      'Verified overall feedback polarity is negative (PMOS pass device adds 180° inversion).',
      'Checked Phase Margin across the entire load current range (0 mA bleed up to I_load,max).',
      'Confirmed V_DO <= Spec in the worst-case Slow-PMOS +125°C corner.',
      'Simulated load transient step (I_min -> I_max -> I_min) with 100 ns edge rates.',
    ],
    miniProject: {
      title: 'Mini-Project 6: LDO ESR Stability Window Exploration',
      objective:
        'Using the Bode Plot Visualizer and LTspice LDO netlist, sweep R_ESR across 0.01 Ω (ideal ceramic cap), 0.8 Ω (optimal), and 10 Ω (high ESR electrolytic).',
      deliverables: [
        'Explain why R_ESR = 0.01 Ω causes severe transient ringing while R_ESR = 10 Ω causes large instant voltage spikes ΔI_load · R_ESR.',
      ],
    },
    quiz: [
      {
        id: 'm6_q1',
        question:
          'In a PMOS-pass LDO where the Error Amplifier has a single inverting gain stage, which terminal of the Error Amplifier must receive the feedback voltage V_fb?',
        options: [
          'The Non-Inverting (+) terminal of the Error Amplifier, because the common-source PMOS pass device already inverts the signal from its gate to V_OUT',
          'The Inverting (-) terminal of the Error Amplifier',
          'The supply terminal of the Error Amplifier',
          'Either terminal works equally well',
        ],
        correctIndex: 0,
        explanation:
          'If V_OUT rises, V_fb rises. To counteract this rise, the gate of the PMOS pass transistor must be pulled HIGHER (closer to V_IN) to reduce V_SG and decrease current. Therefore, the Error Amplifier must produce a positive output change when V_fb rises, meaning V_fb connects to the (+) terminal and V_REF connects to (-).',
      },
    ],
  },

  /* ==========================================================================
   * MODULE 7: Bandgap Voltage Reference (BGR)
   * ========================================================================== */
  {
    id: 7,
    roman: 'VII',
    shortTitle: '7. Bandgap Reference (BGR)',
    title: 'Bandgap Reference (BGR): CTAT & PTAT Physics, Kuijk/Brokaw Cells, Curvature, Startup & Trimming',
    level: 'Advanced',
    estimatedHours: 12,
    prerequisites: 'Modules 4 & 5',
    withoutAiTrack: 'Derive PTAT + CTAT zero-TC resistor ratio K = R2/R1 for N=8 BJTs and design a zero-current escape startup circuit.',
    withAiTrack: 'Use the interactive BGR Temperature Curve Plotter to trim R2/R1 and minimize Box-Method ppm/°C across -40°C to +125°C.',
    abstract:
      'Every ADC, DAC, LDO, and bias generator on an integrated circuit requires an absolute voltage reference that remains invariant across process, supply voltage, and temperature (-40°C to +125°C). Since every individual semiconductor parameter drifts strongly with temperature, a Bandgap Reference (BGR) achieves near-zero temperature sensitivity by summing a Complementary-to-Absolute-Temperature (CTAT) base-emitter voltage V_BE (≈ -1.80 mV/K) with a scaled Proportional-to-Absolute-Temperature (PTAT) thermal voltage ΔV_BE = V_T ln(N) (+0.086 mV/K · ln N). This module covers Kuijk and Brokaw topologies, curvature origin, startup circuits, and digital resistor trimming.',
    indexTerms: [
      'Bandgap Reference (BGR)',
      'CTAT',
      'PTAT',
      'Kuijk cell',
      'Brokaw cell',
      'startup circuit',
      'temperature coefficient (ppm/°C)',
    ],
    schematicId: 'bgr',
    figNumber: 'Fig. 7.1',
    figCaption:
      'CMOS Bandgap Voltage Reference (BGR) utilizing vertical substrate PNP BJTs (Q1:Q2 area ratio 1:N), an op-amp clamped PTAT core (R1), output scaling resistor (R2), and degenerate zero-current startup circuit [1], [2].',
    inlineTool: 'bgr_plotter',
    conceptParagraphs: [
      'How do we build BJTs in a standard digital CMOS process without extra masks? Every p+ source/drain diffusion inside an N-Well forms an vertical parasitic PNP bipolar transistor where the p+ diffusion is the Emitter, the N-Well is the Base, and the p-type silicon substrate is the Collector (permanently grounded)! These diode-connected substrate PNPs have reproducible exponential I-V characteristics ideal for bandgap references.',
      'By forcing equal currents into two substrate PNPs of emitter area ratio 1 : N (typically N = 8 for a 3×3 common-centroid square array with Q1 in the center surrounded by 8 unit cells of Q2), the difference in their base-emitter voltages is purely proportional to absolute temperature: ΔV_BE = V_BE1 - V_BE2 = (kT/q) ln(N).',
    ],
    theoryParagraphs: [
      {
        heading: '7.1 CTAT and PTAT Generation Equations',
        body: 'The base-emitter voltage V_BE of a forward-biased PN junction decreases nearly linearly with temperature at ∂V_BE/∂T ≈ -1.80 mV/K (CTAT) because the intrinsic carrier concentration n_i^2(T) rises exponentially with temperature. Meanwhile, the difference ΔV_BE between two BJTs operating at current density ratio N increases linearly with temperature (PTAT) [1]:',
        equationLatex:
          '\\Delta V_{BE} = V_{BE1} - V_{BE2} = \\frac{kT}{q}\\ln(N) = V_T \\ln(N) \\implies \\frac{\\partial (\\Delta V_{BE})}{\\partial T} = +0.08617\\text{ mV/K} \\cdot \\ln(N)',
        equationNum: '7.1',
      },
      {
        heading: '7.2 First-Order Zero-TC Cancellation at V_REF ≈ 1.205 V',
        body: 'In Fig. 7.1, the op-amp forces V_X = V_Y so resistor R_1 drops exactly ΔV_BE, generating a PTAT current I_PTAT = (V_T ln N) / R_1. Mirroring I_PTAT through resistor R_2 into Q_3 produces the classic ~1.205 V silicon bandgap reference:',
        equationLatex:
          'V_{\\text{REF}}(T) = V_{BE3}(T) + \\left(\\frac{R_2}{R_1}\\right) V_T \\ln(N), \\qquad \\frac{\\partial V_{\\text{REF}}}{\\partial T}\\Bigg|_{300\\text{K}} = 0 \\iff \\frac{R_2}{R_1} = \\frac{|\\partial V_{BE}/\\partial T|}{(\\partial V_T/\\partial T)\\ln N} \\approx \\frac{20.9}{\\ln N}',
        equationNum: '7.2',
      },
      {
        heading: '7.3 Op-Amp Offset Amplification, Curvature, and Box-Method TempCo',
        body: 'Any input-referred offset V_os of the error op-amp appears directly across R_1 alongside ΔV_BE, getting amplified by R_2/R_1 ≈ 10× at the output! Furthermore, because V_BE(T) contains a nonlinear T ln(T) term while V_PTAT is strictly linear in T, V_REF(T) exhibits a downward-curving parabola ("bow") of ~2–4 mV over -40°C to +125°C, evaluated via the Box Method [2], [3]:',
        equationLatex:
          'V_{\\text{REF}} = V_{BE} + \\frac{R_2}{R_1}(\\Delta V_{BE} \\pm V_{os}), \\qquad TC_{\\text{box}} = \\frac{V_{\\text{REF,max}} - V_{\\text{REF,min}}}{V_{\\text{REF}}(27^\\circ\\text{C}) \\cdot (T_{\\max} - T_{\\min})} \\times 10^6 \\;[\\text{ppm}/^\\circ\\text{C}]',
        equationNum: '7.3',
      },
    ],
    keyEquations: [
      {
        name: 'PTAT Voltage Difference',
        latex: '\\Delta V_{BE} = V_T \\ln(N) = 53.8\\text{ mV} \\quad (\\text{for } N=8 \\text{ at } 300\\text{ K})',
        eqNum: '7.1a',
        units: 'mV',
        note: 'Has a positive temperature slope of +0.179 mV/K for N = 8.',
      },
      {
        name: 'Zero-TC Resistor Ratio',
        latex: 'K = \\frac{R_2}{R_1} = \\frac{1.80\\text{ mV/K}}{0.08617\\text{ mV/K} \\cdot \\ln(N)} \\approx 10.05 \\quad (\\text{for } N=8)',
        eqNum: '7.2a',
        units: 'Ω/Ω',
        note: 'Depends ONLY on resistor ratio R2/R1 and area ratio N, not absolute resistance!',
      },
      {
        name: 'Box-Method Temperature Coefficient',
        latex: 'TC = \\frac{V_{\\max} - V_{\\min}}{V_{\\text{nom}} \\cdot \\Delta T} \\times 10^6',
        eqNum: '7.3a',
        units: 'ppm/°C',
        note: 'First-order BGR achieves 15–35 ppm/°C; curvature-compensated BGR achieves 3–8 ppm/°C.',
      },
    ],
    handCalcMethodology: [
      'Step 1 (Choose BJT Emitter Ratio N): Select N = 8 so Q1 (center) and Q2 (8 surrounding cells) form a compact 3×3 common-centroid square. Compute ΔV_BE(300K) = 25.85 mV × ln(8) = 53.75 mV.',
      'Step 2 (Choose Branch Current I_PTAT and R_1): Pick I_PTAT = 10–25 μA per branch. Compute R_1 = ΔV_BE / I_PTAT.',
      'Step 3 (Compute R_2 for Zero-TC at 27°C): For ∂V_BE/∂T = -1.80 mV/K, compute K = R_2/R_1 = 1.80 / (0.08617 × ln 8) = 10.05, so R_2 = 10.05 · R_1.',
      'Step 4 (Size Op-Amp & PMOS Mirror for Low Offset): Because V_os is multiplied by K = 10.05, size the op-amp input pair with large area (W·L >= 50 μm²) and long PMOS mirror lengths (L = 1–2 μm).',
      'Step 5 (Include Startup Circuit): Design a startup detection transistor that pulls the PMOS mirror gate down if I_PTAT = 0, and automatically shuts off once V_X rises above 0.5 V.',
    ],
    sizingJustification: [
      {
        parameter: 'BJT Area Ratio N = 8 (or N = 24 for ultra-low offset sensitivity)',
        recommendedRange: 'N = 8 (3×3 array) or N = 24 (5×5 array with 1:24)',
        physicalReasoning:
          'N = 8 fits a perfect 3×3 common-centroid layout (1 center unit for Q1 surrounded by 8 units for Q2). Increasing N to 24 increases ΔV_BE from 53.8 mV to 82.1 mV, reducing the op-amp offset multiplier K = R2/R1 from 10.05 down to 6.57.',
      },
    ],
    workedExample: {
      problemStatement:
        'Design a 180nm CMOS Bandgap Reference using N = 8 vertical PNP BJTs with branch current I_PTAT = 15 μA at 300 K (27°C). Determine R_1, R_2, V_REF(300K), and maximum allowable op-amp input offset V_os for ±15 mV output accuracy.',
      specs: [
        { label: 'BJT Area Ratio N', value: 'N = 8 (3×3 Common-Centroid PNP Array)' },
        { label: 'Room-Temp Branch Current', value: 'I_PTAT(300 K) = 15.0 μA (V_BE1 = 0.652 V)' },
        { label: 'Target Output Accuracy', value: 'V_REF = 1.200 V ± 15 mV (untrimmed)' },
      ],
      steps: [
        {
          stepTitle: 'Step 1: Calculate ΔV_BE and PTAT Resistor R_1',
          reasoning: 'At T = 300 K, V_T = 25.85 mV and ln(8) = 2.0794:',
          formulaLatex: '\\Delta V_{BE} = 25.85\\text{ mV} \\times \\ln(8) = 53.75\\text{ mV}, \\qquad R_1 = \\frac{\\Delta V_{BE}}{I_{\\text{PTAT}}}',
          calculation: 'R_1 = 53.75 mV / 15 μA = 3.583 kΩ',
          resultWithUnits: 'ΔV_BE = 53.75 mV, R_1 = 3.58 kΩ',
        },
        {
          stepTitle: 'Step 2: Calculate Zero-TC Scaling Resistor R_2 and Output V_REF',
          reasoning: 'With ∂V_BE/∂T = -1.80 mV/K and ∂(ΔV_BE)/∂T = +0.1792 mV/K, K = 1.80 / 0.1792 = 10.05:',
          formulaLatex: 'R_2 = 10.05 \\times R_1, \\qquad V_{\\text{REF}} = V_{BE3} + 10.05 \\cdot \\Delta V_{BE}',
          calculation: 'R_2 = 10.05 × 3.583 kΩ = 36.01 kΩ; V_REF = 0.652 V + 0.540 V = 1.192 V.',
          resultWithUnits: 'R_2 = 36.0 kΩ, V_REF(27°C) = 1.192 V',
        },
        {
          stepTitle: 'Step 3: Determine Maximum Allowable Op-Amp Input Offset V_os',
          reasoning: 'Since ΔV_REF,offset = (1 + R_2/R_1) V_os = 11.05 V_os <= 15 mV:',
          formulaLatex: '|V_{os,\\max}| \\le \\frac{15\\text{ mV}}{11.05} = 1.36\\text{ mV}',
          calculation: 'Size op-amp input pair with W·L >= 64 μm² (or use 4-bit resistor trim on R_2).',
          resultWithUnits: '|V_os| <= 1.36 mV',
        },
      ],
    },
    simulationSteps: [
      {
        analysisType: 'DC Temperature Sweep (.dc temp)',
        spiceDirective: '.dc temp -40 125 1',
        whatToCheck:
          'Plot V(vref) vs temperature. Verify the parabolic peak occurs near 25°C–35°C and compute Box-Method ppm/°C.',
      },
      {
        analysisType: 'Power-Up Transient Startup Verification (.tran)',
        spiceDirective: 'VDD vdd 0 PWL(0 0 10u 1.8)\n.tran 50n 50u uic',
        whatToCheck:
          'Verify that starting from 0V initial conditions (uic), the startup circuit kicks the BGR out of the 0 μA state and settles to 1.20 V.',
      },
    ],
    verificationTable: [
      {
        metric: 'Nominal Reference Voltage',
        symbol: 'V_REF(27°C)',
        targetSpec: '1.192 V',
        handCalcValue: '1.192 V',
        typicalSpiceValue: '1.195 V',
        discrepancyReason: 'Base resistance r_b and finite β_F of substrate PNP.',
      },
      {
        metric: 'Temperature Drift (-40 to 125°C)',
        symbol: 'ΔV_REF,pp',
        targetSpec: '<= 4.5 mV',
        handCalcValue: '3.4 mV',
        typicalSpiceValue: '3.8 mV',
        discrepancyReason: 'Second-order T*ln(T) curvature of V_BE and resistor TC.',
      },
      {
        metric: 'Box-Method TempCo',
        symbol: 'TC_box',
        targetSpec: '<= 25 ppm/°C',
        handCalcValue: '17.3 ppm/°C',
        typicalSpiceValue: '19.3 ppm/°C',
        discrepancyReason: 'Matches analytical curvature model closely.',
      },
    ],
    commonMistakes: [
      {
        mistake: 'Omitting a startup circuit because the BGR shows 1.20 V in a standard SPICE .op or .dc temp simulation.',
        consequence:
          'SPICE’s Newton-Raphson solver often converges to the desired 1.20 V operating point in .op, hiding the fact that I_PTAT = 0 μA is ALSO a stable DC solution! In real silicon, the chip wakes up dead at V_REF = 0 V.',
        fix: 'Always include a startup circuit AND test it with a slow power-supply ramp using .tran ... uic with initial node voltages forced to 0 V (.ic V(vx)=0 V(vy)=0).',
      },
      {
        mistake: 'Using different resistor types for R_1 and R_2 (e.g., poly resistor for R_1 and diffused n-well resistor for R_2).',
        consequence:
          'If R_1 and R_2 have different temperature coefficients (TC1 != TC2), their ratio R_2(T)/R_1(T) drifts with temperature, destroying the zero-TC cancellation!',
        fix: 'Always construct R_1 and R_2 from identical unit resistor segments of the exact same layer (e.g., high-sheet-rho P+ poly) arranged in an interdigitated array.',
      },
    ],
    checklistItems: [
      'Constructed R_1 and R_2 from integer multiples of the same unit resistor cell.',
      'Laid out Q_1 and Q_2 as a 3×3 common-centroid array (Q1 in center, 8× Q2 surrounding).',
      'Verified startup escape from zero-current state using .tran with .ic V(vx)=0 and slow VDD ramp.',
      'Checked stability of the internal BGR feedback loop (positive PTAT loop gain < negative CTAT loop gain).',
    ],
    miniProject: {
      title: 'Mini-Project 7: Trim a Bandgap Reference to < 20 ppm/°C',
      objective:
        'Using the interactive BGR Temperature Curve Plotter above, find the exact resistor ratio K = R_2/R_1 for N = 8 and N = 16 that flattens the parabola across -40°C to +125°C.',
      deliverables: [
        'Record the optimal K = R_2/R_1 and resulting Box-Method ppm/°C for both N = 8 and N = 16.',
      ],
    },
    quiz: [
      {
        id: 'm7_q1',
        question:
          'Why is the input-referred offset voltage V_os of the error op-amp inside a Kuijk Bandgap Reference such a critical error source?',
        options: [
          'Because V_os appears directly in series with ΔV_BE (~54 mV) and gets multiplied by (1 + R2/R1) ≈ 11× at the reference output',
          'Because V_os turns off the startup circuit',
          'Because V_os changes the emitter area ratio N of the BJTs',
          'Because V_os shorts the VDD supply rail to ground',
        ],
        correctIndex: 0,
        explanation:
          'Since ΔV_BE = V_T ln(8) is only ~53.8 mV at room temperature, a 2 mV op-amp input offset represents a 3.7% error in I_PTAT and translates to a ~22 mV shift in V_REF(27°C) plus a tilted temperature slope.',
      },
    ],
  },

  /* ==========================================================================
   * MODULE 8: Theoretical Verification & Hand-Calc vs. SPICE Debugging
   * ========================================================================== */
  {
    id: 8,
    roman: 'VIII',
    shortTitle: '8. Verification & Debugging',
    title: 'Theoretical Verification: Hand-Calculation vs. SPICE Templates & Root-Cause Mismatch Debugging',
    level: 'Advanced',
    estimatedHours: 8,
    prerequisites: 'Modules 1–7',
    withoutAiTrack: 'Build standardized DC-closed/AC-open testbenches and reconcile every >10% discrepancy between hand math and SPICE.',
    withAiTrack: 'Use automated Python .meas parsers to generate side-by-side Spec vs. Hand-Calc vs. SPICE verification matrices.',
    abstract:
      'A dangerous trap for novice analog designers is "blind SPICE tweaking"—randomly changing W and L until a waveform looks acceptable without understanding why SPICE disagreed with hand calculations. Expert designers treat SPICE as a verification tool, not a guessing engine. This module provides a universal Hand-Calculation vs. SPICE Verification Matrix for every core analog block and establishes a systematic root-cause debugging protocol to diagnose discrepancies in DC gain, GBW, Phase Margin, ICMR, Slew Rate, and Offset.',
    indexTerms: [
      'Design verification',
      'hand-calc vs simulation',
      'loop gain testbench',
      'Middlebrook / Tian stability',
      'debugging discrepancies',
    ],
    schematicId: 'verification_tb',
    figNumber: 'Fig. 8.1',
    figCaption:
      'Universal DC-closed / AC-open loop testbench (L_big = 1 GH, C_big = 1 GF) that biases high-gain amplifiers at their exact quiescent operating point while opening the feedback loop for AC stability analysis [1], [5].',
    inlineTool: 'ota5t_calc',
    conceptParagraphs: [
      'Why does SPICE sometimes report a DC gain of -4 dB when your hand calculation predicted +65 dB? In 95% of cases, the circuit is not broken—rather, a small systematic offset in an open-loop testbench drove the high-gain output node into the VDD or GND rail at DC, pushing the output transistor into deep Triode! By inserting a 1 Giga-Henry inductor (L_big = 1 GH) in the feedback path and a 1 Giga-Farad capacitor (C_big = 1 GF) at the AC source, the amplifier is locked in unity-gain feedback at DC (0 Hz) while remaining completely open-loop at all AC frequencies > 1 mHz.',
      'Whenever a hand-calculated metric differs from SPICE by more than 10%–15%, there is always a specific physical explanation in the .op operating point log. Mastering the diagnostic table below turns hours of frustration into a 2-minute check.',
    ],
    theoryParagraphs: [
      {
        heading: '8.1 The Golden Verification Rule: Reconcile .op Before Running .ac or .tran',
        body: 'Never run an AC or Transient simulation until every transistor in the .op operating point table satisfies three conditions: (1) I_D matches your target branch current within ±5%, (2) V_DS >= V_DS,sat + 50 mV (confirming saturation), and (3) g_m matches your gm/Id hand calculation within ±5%.',
        equationLatex:
          '\\text{Saturation Margin: } V_{\\text{margin},i} = |V_{DS,i}| - |V_{DS,\\text{sat},i}| \\ge 50\\text{ mV}',
        equationNum: '8.1',
      },
      {
        heading: '8.2 Root-Cause Diagnosis When Hand-Calc Diverges from SPICE',
        body: 'Discrepancies between hand math and BSIM4 simulation fall into four predictable categories: (1) Extrinsic junction and overlap capacitances (C_db, C_gd0) lowering GBW and f_p2; (2) DIBL and SCBE lowering r_o when V_DS is either too small (< 200 mV) or too large (> 1.4 V); (3) Body effect (g_mb) altering threshold voltage V_th when source is not tied to bulk; and (4) Finite tail resistance r_o5 degrading CMRR and PSRR.',
        equationLatex:
          '\\text{GBW}_{\\text{actual}} = \\frac{g_{m1}}{2\\pi \\left(C_L + C_{db2} + C_{db4} + (1 + A_{v,\\text{local}})C_{gd}\\right)}',
        equationNum: '8.2',
      },
    ],
    keyEquations: [
      {
        name: 'Relative Verification Error',
        latex: '\\epsilon_{\\%} = \\frac{|X_{\\text{SPICE}} - X_{\\text{Hand}}|}{|X_{\\text{Hand}}|} \\times 100\\%',
        eqNum: '8.1a',
        units: '%',
        note: 'Should be < 5% for I_D and g_m (using gm/Id), and < 15% for A_v0, GBW, and PM.',
      },
      {
        name: 'Effective Node Capacitance with Parasitics',
        latex: 'C_{\\text{node,eff}} = C_{\\text{load}} + \\sum C_{db,i} + \\sum C_{gs,j} + (1 - A_v)C_{gd}',
        eqNum: '8.2a',
        units: 'fF or pF',
        note: 'Accounts for drain-bulk junction and Miller-multiplied gate-drain overlap caps.',
      },
    ],
    handCalcMethodology: [
      'Step 1: Populate the "Target Spec" and "Hand-Calc" columns of the Verification Table before opening SPICE.',
      'Step 2: Run .op first and verify all DC currents, node voltages, and V_DS - V_DS,sat margins.',
      'Step 3: Run .ac, .dc, and .tran with automated .meas statements to populate the "SPICE Simulated" column.',
      'Step 4: For any metric with >10% error, inspect the .op small-signal parameters (gm, gds, cdb, cgd) of the governing transistor to pinpoint the exact physical cause.',
    ],
    sizingJustification: [
      {
        parameter: 'Universal DC-Feedback AC Testbench: L_big = 1 GH, C_big = 1 GF',
        recommendedRange: 'L_big = 1 GH to 1 TH, C_big = 1 GF to 1 TF',
        physicalReasoning:
          'Provides an LC cutoff frequency f_c = 1 / (2π √(10^9 × 10^9)) = 0.16 nHz, guaranteeing exact DC closed-loop biasing while leaving AC phase and magnitude undisturbed down to 0.01 Hz.',
      },
    ],
    workedExample: {
      problemStatement:
        'A designer sizes a Two-Stage Op-Amp for A_v0 = 72 dB, GBW = 30 MHz, and PM = 65°, but an initial open-loop SPICE simulation reports A_v0 = 18 dB, GBW = 4.2 MHz, and V_out(DC) = 1.78 V. Diagnose and fix the discrepancy.',
      specs: [
        { label: 'Hand-Calculated A_v0 / GBW', value: '72.0 dB / 30.0 MHz' },
        { label: 'Broken SPICE Result', value: '18.0 dB / 4.2 MHz (V_out = 1.78 V)' },
      ],
      steps: [
        {
          stepTitle: 'Step 1: Inspect DC Node Voltages in .op',
          reasoning: 'Notice V_out = 1.78 V on a 1.80 V supply! Therefore, Stage 2 PMOS M6 has V_SD6 = 1.80 - 1.78 = 0.02 V << V_SD,sat6 (0.17 V).',
          formulaLatex: 'V_{SD6} = 20\\text{ mV} < V_{SD,\\text{sat6}} = 170\\text{ mV} \\implies \\text{M6 is crushed in Deep Triode!}',
          calculation: 'Because M6 is in triode, r_o6 dropped from 45 kΩ down to 320 Ω, destroying Stage 2 gain.',
          resultWithUnits: 'Root Cause: Open-loop DC saturation due to 1.8 mV systematic offset',
        },
        {
          stepTitle: 'Step 2: Apply L_big / C_big Closed-Loop DC Bias + Match Current Density',
          reasoning: 'Add L_big = 1 GH from V_out to V_inn and size (W/L)_6 / (W/L)_4 = I_D6 / I_D4:',
          formulaLatex: 'V_{\\text{out,DC}} = V_{CM} = 0.90\\text{ V} \\implies V_{SD6} = 0.90\\text{ V} \\gg V_{SD,\\text{sat6}}',
          calculation: 'Re-running .ac now yields A_v0 = 71.2 dB, GBW = 29.5 MHz, and PM = 64.6°!',
          resultWithUnits: 'Verified: 71.2 dB (1.1% error vs hand calculation)',
        },
      ],
    },
    simulationSteps: [
      {
        analysisType: 'Automated .meas Spec Extraction Block',
        spiceDirective:
          '.meas AC dc_gain_db MAX mag(V(vout))\n.meas AC gbw_hz WHEN mag(V(vout))=1\n.meas AC pm_deg FIND (180+ph(V(vout))) WHEN mag(V(vout))=1',
        whatToCheck:
          'Copy the .meas results directly from the SPICE Error Log (Ctrl+L in LTspice) into the Hand-Calc vs. Simulation table.',
      },
    ],
    verificationTable: [
      {
        metric: 'DC Voltage Gain',
        symbol: 'A_v0',
        targetSpec: '>= 70.0 dB',
        handCalcValue: '72.0 dB',
        typicalSpiceValue: '71.2 dB',
        discrepancyReason: 'DIBL on Stage 1 and Stage 2 output resistances (< 1 dB delta).',
      },
      {
        metric: 'Unity-Gain Bandwidth',
        symbol: 'GBW',
        targetSpec: '30.0 MHz',
        handCalcValue: '30.0 MHz',
        typicalSpiceValue: '29.5 MHz',
        discrepancyReason: 'Gate-drain overlap capacitance C_gd2 loading Stage 1.',
      },
      {
        metric: 'Phase Margin',
        symbol: 'PM',
        targetSpec: '>= 60.0°',
        handCalcValue: '65.0°',
        typicalSpiceValue: '63.8°',
        discrepancyReason: 'Junction capacitance C_db6 + C_db7 adds ~80 fF to C_L.',
      },
      {
        metric: 'Quiescent Power',
        symbol: 'P_DC',
        targetSpec: '<= 450 μW',
        handCalcValue: '392.4 μW',
        typicalSpiceValue: '395.1 μW',
        discrepancyReason: 'Channel-length modulation slightly increases mirror branch current.',
      },
      {
        metric: 'Output Voltage Swing',
        symbol: 'V_swing',
        targetSpec: '>= 1.35 V_pp',
        handCalcValue: '1.46 V_pp',
        typicalSpiceValue: '1.42 V_pp',
        discrepancyReason: 'Gradual gm*ro compression as V_DS approaches V_DS,sat + 30 mV.',
      },
    ],
    commonMistakes: [
      {
        mistake: 'Measuring Phase Margin from a closed-loop unity-gain AC sweep V_out / V_in instead of the open-loop return ratio T(jω).',
        consequence:
          'In closed-loop unity-gain, |V_out/V_in| is 0 dB at DC and rolls off above GBW. Reading phase at -3 dB of the closed-loop curve does NOT give Phase Margin!',
        fix: 'Measure Phase Margin strictly on the open-loop transfer function A(jω)β (using L_big/C_big or Tian loop probe) at the frequency where |A(jω)β| = 0 dB (1 V/V), or infer PM from closed-loop peaking M_p.',
      },
    ],
    checklistItems: [
      'Completed every row of the Hand-Calculation vs. SPICE table (Gain, GBW, PM, Power, Swing, ICMR, SR, Offset).',
      'Confirmed zero transistors are in triode or cutoff in the .op operating point table.',
      'Verified discrepancy between gm/Id hand calculation and SPICE is < 5% for g_m and < 15% for GBW/PM.',
      'Documented the physical reason for every minor difference between hand math and BSIM4.',
    ],
    miniProject: {
      title: 'Mini-Project 8: Debug a Mismatched Amplifier Netlist',
      objective:
        'Take a two-stage op-amp netlist where Stage 2 width W6 was accidentally sized 2× too small and explain its impact on V_1(DC), systematic offset, and Phase Margin.',
      deliverables: [
        'Use the Hand-Calc vs. Simulation template to show how correcting W6 restores V_1(DC) = V_mir and boosts Phase Margin by 18°.',
      ],
    },
    quiz: [
      {
        id: 'm8_q1',
        question:
          'If your hand calculation predicts an op-amp DC gain of 70 dB, but your open-loop SPICE .ac simulation reports -3 dB, what is the VERY FIRST thing you should check?',
        options: [
          'Check the DC node voltages in .op to see if systematic offset pushed V_out near VDD or GND, driving the output stage into Triode',
          'Increase all transistor channel lengths by 5×',
          'Replace the BSIM4 model with an ideal voltage-controlled voltage source',
          'Increase the Miller compensation capacitor C_c by 10×',
        ],
        correctIndex: 0,
        explanation:
          'In an open-loop testbench with 70 dB (3,162 V/V) gain, a mere 0.5 mV input offset saturates the output against the supply rails at DC, crushing the output transistor’s V_DS into the triode region.',
      },
    ],
  },

  /* ==========================================================================
   * MODULE 9: Corners, Monte Carlo, Pelgrom's Law, Layout & Noise
   * ========================================================================== */
  {
    id: 9,
    roman: 'IX',
    shortTitle: '9. Corners, Layout & Noise',
    title: 'PVT Corners, Monte Carlo Mismatch, Pelgrom’s Law, Common-Centroid Layout & Thermal/Flicker Noise',
    level: 'Expert',
    estimatedHours: 14,
    prerequisites: 'Modules 1–8',
    withoutAiTrack: 'Calculate input-referred thermal/1/f noise and Pelgrom 3σ offset; verify across 27 PVT corners and design an ABBA common-centroid layout.',
    withAiTrack: 'Run Importance-Sampling / LHS Monte Carlo and automated PVT corner signoff scripts.',
    abstract:
      'A circuit that works only at the nominal Typical-Typical (TT, 27°C, V_DD) point will fail in silicon production. Manufacturing wafers experience global Process, Voltage, and Temperature (PVT) variations alongside local random atomic-level dopant fluctuations (Mismatch) and fundamental electronic noise. This final module covers the 5 process corners (TT, FF, SS, FS, SF), Pelgrom’s 1/√(WL) mismatch law, Monte Carlo statistical verification, layout matching techniques (interdigitation, 2D common-centroid ABBA arrays, dummy fingers, guard rings), and thermal (4kTγgm) plus flicker (1/f) noise analysis.',
    indexTerms: [
      'PVT corners (TT, FF, SS, FS, SF)',
      'Monte Carlo simulation',
      'Pelgrom’s law',
      'common-centroid layout',
      'thermal noise',
      'flicker (1/f) noise',
    ],
    schematicId: 'layout_centroid',
    figNumber: 'Fig. 9.1',
    figCaption:
      '(a) 2D common-centroid differential pair layout (A B B A / B A A B) with shared centroid (X_c, Y_c), dummy poly fingers (D), and substrate guard ring; (b) 5-corner NMOS/PMOS process space [1], [3].',
    inlineTool: 'ota5t_calc',
    conceptParagraphs: [
      'Why do we need BOTH PVT Corner simulations AND Monte Carlo simulations before tapeout? PVT corners (e.g., Slow-NMOS / Slow-PMOS at 125°C and 0.9× V_DD) model global wafer-to-wafer and environmental shifts where every NMOS on the die shifts together. However, in a PVT corner simulation, two identical transistors M1 and M2 placed side-by-side are still simulated as 100.000% identical—predicting zero random offset!',
      'Monte Carlo simulation injects independent Gaussian random variables into V_th and β = μ C_ox (W/L) of every individual transistor according to Pelgrom’s Law: σ(ΔV_th) = A_VT / √(W L). Only Monte Carlo reveals the true 3σ input-referred offset distribution, CMRR degradation, and current-mirror inaccuracy.',
    ],
    theoryParagraphs: [
      {
        heading: '9.1 Pelgrom’s Mismatch Law and Area-Accuracy Trade-off',
        body: 'Marcel Pelgrom demonstrated in 1989 that local random variations in oxide thickness, channel dopant atoms, and line-edge roughness integrate over the active gate area W · L. Consequently, the standard deviation of threshold voltage mismatch between two identically laid-out transistors is inversely proportional to the square root of gate area [3], [5]:',
        equationLatex:
          '\\sigma(\\Delta V_{th}) = \\frac{A_{VT}}{\\sqrt{W \\cdot L}}, \\qquad \\sigma\\left(\\frac{\\Delta \\beta}{\\beta}\\right) = \\frac{A_\\beta}{\\sqrt{W \\cdot L}}',
        equationNum: '9.1',
      },
      {
        heading: '9.2 Thermal Noise and 1/f (Flicker) Noise in MOSFETs',
        body: 'Every MOSFET exhibits two fundamental intrinsic noise sources: (1) Channel Thermal Noise caused by random thermal agitation of carriers, modeled as a drain current spectral density S_id,th = 4 k T γ g_m (or input-referred gate voltage S_vn,th = 4 k T γ / g_m); and (2) Flicker (1/f) Noise caused by carrier trapping/detrapping at the Si–SiO2 interface, which is inversely proportional to gate area W · L [1], [4]:',
        equationLatex:
          '\\overline{v_{n,\\text{in}}^2}(f) = \\underbrace{\\frac{4 k T \\gamma}{g_m}}_{\\text{Thermal Noise}} + \\underbrace{\\frac{K_f}{C_{ox} W L f}}_{\\text{Flicker (1/f) Noise}} \\quad \\left[\\frac{\\text{V}^2}{\\text{Hz}}\\right]',
        equationNum: '9.2',
      },
      {
        heading: '9.3 Input-Referred Noise of a 5T OTA',
        body: 'Referring the thermal and flicker noise of both the input pair (M1, M2) and the active PMOS mirror load (M3, M4) to the differential input yields:',
        equationLatex:
          '\\overline{v_{n,\\text{in,OTA}}^2}(f) = 2 \\cdot \\frac{4 k T \\gamma}{g_{m1}}\\left(1 + \\frac{g_{m3}}{g_{m1}}\\right) + \\frac{2}{C_{ox} f}\\left[\\frac{K_{fn}}{W_1 L_1} + \\left(\\frac{g_{m3}}{g_{m1}}\\right)^2 \\frac{K_{fp}}{W_3 L_3}\\right]',
        equationNum: '9.3',
      },
    ],
    keyEquations: [
      {
        name: 'Pelgrom Threshold Mismatch',
        latex: '\\sigma(\\Delta V_{th}) = \\frac{A_{VT}}{\\sqrt{W L}} \\quad (A_{VT} \\approx 5\\text{ mV}\\cdot\\mu\\text{m in 180nm})',
        eqNum: '9.1a',
        units: 'mV',
        note: 'To cut random offset in half, you must QUADRUPLE the transistor gate area W·L.',
      },
      {
        name: 'Input-Referred Thermal Noise Density',
        latex: 'v_{n,\\text{th}} = \\sqrt{\\frac{8 k T \\gamma}{g_{m1}}\\left(1 + \\frac{g_{m3}}{g_{m1}}\\right)}',
        eqNum: '9.3a',
        units: 'nV/√Hz',
        note: 'Minimized by maximizing g_m1 and keeping g_m3 << g_m1.',
      },
      {
        name: '1/f Noise Corner Frequency',
        latex: 'f_c = \\frac{K_f \\cdot g_m}{4 k T \\gamma C_{ox} W L}',
        eqNum: '9.3b',
        units: 'Hz',
        note: 'Frequency where flicker noise equals thermal noise; reduced by increasing gate area W·L.',
      },
    ],
    handCalcMethodology: [
      'Step 1 (Size Area W·L for 3σ Offset Spec): Given maximum 3σ offset V_os,3σ, compute required σ(V_os) = V_os,3σ / 3 and solve W_1 L_1 >= (A_VTn / σ(V_os))^2 * (1 + (g_m3/g_m1)^2 ...).',
      'Step 2 (Size g_m1 for Thermal Noise Density): Given target input noise density v_n,max (in nV/√Hz), solve g_m1 >= 8 k T γ (1 + g_m3/g_m1) / v_n,max^2.',
      'Step 3 (Verify Across 27 PVT Corners): Combine 5 process corners {TT, FF, SS, FS, SF} × 3 temperatures {-40°C, 27°C, 125°C} × 2 voltages {0.9 V_DD, 1.1 V_DD} and check worst-case speed (SS, 125°C, low V_DD) and worst-case phase margin (FF, -40°C, high V_DD).',
      'Step 4 (Apply 5 Golden Layout Rules): (1) Same orientation (current flows in same direction), (2) Interdigitated or 2D Common-Centroid (ABBA / BAAB), (3) Dummy poly/diffusion fingers on both ends to equalize STI/LOD stress, (4) Metal routing symmetry, and (5) Substrate/Well guard rings.',
    ],
    sizingJustification: [
      {
        parameter: 'Worst-Case Speed Corner vs. Worst-Case Stability Corner',
        recommendedRange: 'Check SS / 125°C / 0.9·VDD for GBW & SR; Check FF / -40°C / 1.1·VDD for Phase Margin',
        physicalReasoning:
          'At SS and +125°C, carrier mobility μ drops by ~35% and threshold voltage V_th increases, yielding the lowest g_m and lowest GBW. Conversely, at FF and -40°C, mobility and g_m1 surge, pushing GBW closer to non-dominant poles and yielding the minimum Phase Margin.',
      },
    ],
    workedExample: {
      problemStatement:
        'For the 180nm 5T OTA from Module 4 (g_m1 = 502.7 μS, g_m3 = 314 μS, A_VTn = 5.0 mV·μm, A_VTp = 5.5 mV·μm, γ = 1.0), calculate: (a) Input-referred thermal noise spectral density in nV/√Hz, and (b) Minimum gate dimensions W1×L1 and W3×L3 so that the 3σ random input offset is <= 4.5 mV.',
      specs: [
        { label: 'Transconductances', value: 'g_m1 = 502.7 μS, g_m3 = 314.0 μS (g_m3/g_m1 = 0.625)' },
        { label: 'Pelgrom Coefficients', value: 'A_VTn = 5.0 mV·μm, A_VTp = 5.5 mV·μm' },
        { label: 'Target 3σ Input Offset', value: '3σ(V_os) <= 4.5 mV (σ(V_os) <= 1.50 mV)' },
      ],
      steps: [
        {
          stepTitle: 'Step 1: Compute Input-Referred Thermal Noise Density v_n,th',
          reasoning: 'At T = 300 K, 4 k T = 1.657 × 10^-20 J:',
          formulaLatex: 'v_{n,\\text{th}} = \\sqrt{\\frac{8 k T \\gamma}{g_{m1}}\\left(1 + \\frac{g_{m3}}{g_{m1}}\\right)}',
          calculation: 'S_vn = (2 × 1.657e-20 × 1.0 / 502.7e-6) × (1 + 0.625) = 1.071e-16 V²/Hz => v_n,th = √(1.071e-16)',
          resultWithUnits: 'v_n,th = 10.35 nV/√Hz',
        },
        {
          stepTitle: 'Step 2: Allocate Offset Variance Budget and Solve for Gate Areas W·L',
          reasoning: 'Target variance σ²(V_os) = (1.50 mV)² = 2.25 mV². Allocate 1.50 mV² to M1,2 and 0.75 mV² to M3,4:',
          formulaLatex: 'W_1 L_1 \\ge \\frac{A_{VTn}^2}{1.50\\text{ mV}^2} = \\frac{25}{1.50} = 16.7\\;\\mu\\text{m}^2, \\qquad W_3 L_3 \\ge (0.625)^2 \\frac{5.5^2}{0.75} = 15.8\\;\\mu\\text{m}^2',
          calculation: 'Using L1 = 0.72 μm, W1 = 24 μm gives W1·L1 = 17.3 μm². Using L3 = 1.0 μm, W3 = 16 μm gives W3·L3 = 16.0 μm².',
          resultWithUnits: 'W1×L1 = 24μm × 0.72μm, W3×L3 = 16μm × 1.0μm (3σ V_os = 4.42 mV)',
        },
      ],
    },
    simulationSteps: [
      {
        analysisType: 'SPICE Input-Referred Noise Analysis (.noise)',
        spiceDirective: '.noise V(vout) VINP dec 100 1 100Meg',
        whatToCheck:
          'Plot inoise (input-referred noise density in nV/√Hz), identify the 1/f corner frequency f_c, and integrate rms noise over the signal bandwidth.',
      },
      {
        analysisType: 'Monte Carlo Mismatch Statistical Run (N = 200 runs)',
        spiceDirective: '.step param run 1 200 1\n.param dvth1 = gauss(5m / sqrt(W1*L1))',
        whatToCheck:
          'Plot the histogram of input offset voltage V_os across 200 runs and verify mean μ ≈ 0 mV and 3σ <= 4.5 mV.',
      },
    ],
    verificationTable: [
      {
        metric: 'Thermal Noise Floor (at 10 MHz)',
        symbol: 'v_n,th',
        targetSpec: '<= 12.0 nV/√Hz',
        handCalcValue: '10.35 nV/√Hz',
        typicalSpiceValue: '10.80 nV/√Hz',
        discrepancyReason: 'Short-channel excess thermal noise factor γ ≈ 1.08 in BSIM4.',
      },
      {
        metric: '1σ Input Offset Voltage',
        symbol: 'σ(V_os)',
        targetSpec: '<= 1.50 mV',
        handCalcValue: '1.47 mV',
        typicalSpiceValue: '1.51 mV (200-run MC)',
        discrepancyReason: 'Includes β (mobility/geometry) mismatch in addition to ΔV_th.',
      },
      {
        metric: 'Worst-Case GBW (SS, 125°C, 1.62V)',
        symbol: 'GBW_min',
        targetSpec: '>= 28.0 MHz',
        handCalcValue: '29.5 MHz',
        typicalSpiceValue: '28.9 MHz',
        discrepancyReason: 'High-temperature mobility degradation (T^-1.5).',
      },
    ],
    commonMistakes: [
      {
        mistake: 'Placing matched differential pair fingers without Dummy Fingers on the outer left and right edges.',
        consequence:
          'Outer fingers experience different Shallow Trench Isolation (STI) mechanical stress (Length-of-Diffusion / LOD effect) and poly etch bias compared to inner fingers, creating a 3–8 mV systematic V_th shift even in an ABBA array!',
        fix: 'Always place at least 1–2 grounded dummy poly/diffusion fingers on both ends of every matched transistor array.',
      },
      {
        mistake: 'Rotating one transistor of a matched pair by 90° during layout floorplanning.',
        consequence:
          'Silicon wafer crystal mobility and ion-implantation tilt angles are anisotropic; rotating one device by 90° causes massive systematic mismatch.',
        fix: 'Enforce strict identical orientation and identical current-flow direction across all fingers of matched devices.',
      },
    ],
    checklistItems: [
      'Verified circuit meets all specs across all 5 process corners (TT, FF, SS, FS, SF) × {-40°C, 27°C, 125°C} × {±10% VDD}.',
      'Ran >= 200 Monte Carlo mismatch iterations and verified 3σ offset and yield.',
      'Checked input-referred noise density (.noise) and integrated RMS noise over bandwidth.',
      'Applied Common-Centroid (ABBA/BAAB) layout with outer dummy devices and guard rings.',
    ],
    miniProject: {
      title: 'Mini-Project 9: Full PVT & Monte Carlo Tapeout Signoff',
      objective:
        'Take your 5T OTA or Two-Stage Op-Amp netlist, inject Gaussian threshold mismatch .param dvth = gauss(5m/sqrt(W*L)) on M1 and M3, and run a 100-step Monte Carlo simulation in LTspice.',
      deliverables: [
        'Verify Pelgrom’s Law by quadrupling W1·L1 and observing the offset spread shrink by 2×.',
      ],
    },
    quiz: [
      {
        id: 'm9_q1',
        question:
          'According to Pelgrom’s Law, if your Monte Carlo simulation shows a 3σ input-referred offset of 6 mV and your specification requires <= 3 mV (a 2× reduction), how must you scale the gate area (W × L) of the matched transistors?',
        options: [
          'Increase gate area W × L by 4× (since σ(ΔV_th) is inversely proportional to √(W × L))',
          'Increase gate area W × L by 2×',
          'Decrease gate area W × L by 2×',
          'Double the drain current without changing W or L',
        ],
        correctIndex: 0,
        explanation:
          'Because σ(ΔV_th) = A_VT / √(W·L), reducing the standard deviation σ by a factor of 2 requires increasing the product W·L by 2² = 4×.',
      },
      {
        id: 'm9_q2',
        question:
          'Which PVT corner combination typically produces the WORST (lowest) Phase Margin in a two-stage op-amp?',
        options: [
          'Fast-Fast (FF) process, Cold temperature (-40°C), and High supply voltage (1.1 × VDD)',
          'Slow-Slow (SS) process, Hot temperature (+125°C), and Low supply voltage (0.9 × VDD)',
          'Typical-Typical (TT) at 27°C',
          'Slow-Fast (SF) at +85°C',
        ],
        correctIndex: 0,
        explanation:
          'At FF and -40°C, carrier mobility μ is highest, boosting g_m1 and pushing unity-gain bandwidth GBW to its highest frequency—closer to parasitic and non-dominant poles—thereby reducing Phase Margin.',
      },
    ],
  },
];
