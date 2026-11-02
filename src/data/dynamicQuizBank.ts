import { QuizQuestion } from './modulesData';

export type QuestionSourceCategory = 'GATE PYQ' | 'Razavi' | 'Allen & Holberg';

export interface DynamicQuizItem extends QuizQuestion {
  sourceCategory: QuestionSourceCategory;
  sourceCitation: string;
  difficulty: '1-Mark Conceptual' | '2-Mark Numerical' | 'Design Problem';
}

/**
 * Curated multi-set pool of GATE EC/EE Previous Year Questions,
 * Behzad Razavi ("Design of Analog CMOS Integrated Circuits") problems,
 * and Allen & Holberg ("CMOS Analog Circuit Design") problems for Modules 1–9.
 */
export const STATIC_CLASSIC_POOL: Record<number, DynamicQuizItem[]> = {
  1: [
    {
      id: 'm1_gate_1',
      sourceCategory: 'GATE PYQ',
      sourceCitation: 'GATE EC 2022 · MOSFET Small-Signal Parameters',
      difficulty: '2-Mark Numerical',
      question:
        'An NMOS transistor operating in saturation has drain current ID = 200 μA, threshold voltage Vth = 0.4 V, and gate-source voltage VGS = 0.8 V. Neglecting channel-length modulation, if the drain current is quadrupled to 800 μA while keeping W/L constant, the new transconductance gm will be:',
      options: [
        '0.5 mA/V',
        '1.0 mA/V',
        '2.0 mA/V',
        '4.0 mA/V',
      ],
      correctIndex: 2,
      explanation:
        'At ID1 = 200 μA and Vov1 = VGS - Vth = 0.4 V, gm1 = 2*ID1 / Vov1 = 400 μA / 0.4 V = 1.0 mA/V. For constant W/L in square-law saturation, gm ∝ √ID. Quadrupling ID from 200 μA to 800 μA doubles gm to 2.0 mA/V.',
    },
    {
      id: 'm1_razavi_1',
      sourceCategory: 'Razavi',
      sourceCitation: 'B. Razavi, Ch. 2 (Basic MOS Device Physics), Sec. 2.4',
      difficulty: '1-Mark Conceptual',
      question:
        'According to Razavi (Ch. 2), how does the intrinsic voltage gain Av0 = gm * ro of a long-channel MOSFET vary if the channel length L is doubled while keeping both the overdrive voltage (VGS - Vth) and drain current ID constant?',
      options: [
        'Av0 remains unchanged',
        'Av0 increases by a factor of √2',
        'Av0 doubles (increases by 2×)',
        'Av0 decreases by a factor of 2',
      ],
      correctIndex: 2,
      explanation:
        'With both ID and Vov held constant, gm = 2*ID / Vov remains constant. Because the channel-length modulation parameter scales as λ ∝ 1/L, doubling L halves λ and doubles ro = 1/(λ*ID). Consequently, Av0 = gm*ro doubles.',
    },
    {
      id: 'm1_allen_1',
      sourceCategory: 'Allen & Holberg',
      sourceCitation: 'Allen & Holberg, Ch. 3 (CMOS Device Modeling), Sec. 3.3',
      difficulty: '2-Mark Numerical',
      question:
        'In Allen & Holberg’s small-signal model, an NMOS device has gm = 1.5 mS, Cgs = 180 fF, and Cgd = 20 fF. Its unity current-gain transit frequency fT is approximately:',
      options: [
        '0.60 GHz',
        '1.19 GHz',
        '2.39 GHz',
        '7.50 GHz',
      ],
      correctIndex: 1,
      explanation:
        'fT = gm / [2π * (Cgs + Cgd)] = 1.5e-3 / (2π * 200e-15) = 1.194 GHz.',
    },
    {
      id: 'm1_gate_2',
      sourceCategory: 'GATE PYQ',
      sourceCitation: 'GATE EC 2020 · Subthreshold / Weak Inversion Physics',
      difficulty: '1-Mark Conceptual',
      question:
        'In the subthreshold (weak inversion) regime of a MOSFET, the drain current ID depends on VGS exponentially as ID ∝ exp(VGS / (n * VT)). What is the ratio gm / ID in weak inversion?',
      options: [
        '2 / (VGS - Vth)',
        '1 / (n * VT), independent of ID',
        'Proportional to √ID',
        'Zero because the channel is inverted weakly',
      ],
      correctIndex: 1,
      explanation:
        'Differentiating ID = I0 * exp(VGS / (n*VT)) with respect to VGS yields gm = dID/dVGS = ID / (n*VT). Thus gm/ID = 1/(n*VT) ≈ 27–30 V⁻¹ at 300 K, which is the maximum transconductance efficiency achievable in a MOSFET.',
    },
  ],
  2: [
    {
      id: 'm2_razavi_1',
      sourceCategory: 'Razavi',
      sourceCitation: 'B. Razavi & Jespers/Murmann, Nano-Scale CMOS Design Trade-offs',
      difficulty: 'Design Problem',
      question:
        'When biasing a transistor at a higher gm/ID (moving from strong inversion gm/ID = 8 V⁻¹ toward weak inversion gm/ID = 22 V⁻¹) at a fixed required gm, which of the following trade-offs occurs?',
      options: [
        'Drain current ID increases and transit frequency fT increases',
        'Drain current ID decreases (saving power), but normalized current density ID/W drops and device width W (and Cgg) increases, reducing fT',
        'Both drain current ID and gate capacitance Cgg decrease simultaneously',
        'Output resistance ro drops to zero',
      ],
      correctIndex: 1,
      explanation:
        'At fixed gm, ID = gm / (gm/ID), so higher gm/ID directly reduces bias current ID. However, in weak/moderate inversion, current density JD = ID/W is much smaller, requiring a larger width W and larger gate capacitance Cgg, which lowers fT = gm/(2π*Cgg).',
    },
    {
      id: 'm2_allen_1',
      sourceCategory: 'Allen & Holberg',
      sourceCitation: 'Allen & Holberg, Ch. 3 & Ch. 5 (Inversion Coefficient & Sizing)',
      difficulty: '2-Mark Numerical',
      question:
        'A differential pair transistor requires gm = 600 μS. You choose moderate inversion with gm/ID = 15 V⁻¹. At L = 0.36 μm, the PDK lookup chart gives normalized current density JD = ID/W = 2.5 μA/μm. What are the required drain current ID and width W?',
      options: [
        'ID = 40 μA, W = 16 μm',
        'ID = 90 μA, W = 36 μm',
        'ID = 40 μA, W = 100 μm',
        'ID = 15 μA, W = 6 μm',
      ],
      correctIndex: 0,
      explanation:
        'Step 1: ID = gm / (gm/ID) = 600 μS / 15 V⁻¹ = 40 μA. Step 2: W = ID / JD = 40 μA / (2.5 μA/μm) = 16 μm.',
    },
    {
      id: 'm2_gate_1',
      sourceCategory: 'GATE PYQ',
      sourceCitation: 'GATE EC 2023 · Overdrive & Transconductance Efficiency',
      difficulty: '2-Mark Numerical',
      question:
        'For a square-law MOSFET in strong inversion saturation with VGS - Vth = 0.25 V, what is its transconductance efficiency gm/ID, and what is the effective V* = 2/(gm/ID)?',
      options: [
        'gm/ID = 4 V⁻¹, V* = 0.50 V',
        'gm/ID = 8 V⁻¹, V* = 0.25 V',
        'gm/ID = 16 V⁻¹, V* = 0.125 V',
        'gm/ID = 20 V⁻¹, V* = 0.10 V',
      ],
      correctIndex: 1,
      explanation:
        'In strong inversion, gm/ID = 2 / (VGS - Vth) = 2 / 0.25 V = 8 V⁻¹, and V* = 2 / (gm/ID) = 0.25 V.',
    },
  ],
  3: [
    {
      id: 'm3_gate_1',
      sourceCategory: 'GATE PYQ',
      sourceCitation: 'GATE EC 2021 · CMOS Inverter Switching Threshold VM',
      difficulty: '2-Mark Numerical',
      question:
        'A CMOS inverter is fabricated with VDD = 1.8 V, Vthn = 0.4 V, |Vthp| = 0.4 V, and μnCox = 4 * μpCox. To achieve a symmetric switching threshold VM = VDD / 2 = 0.9 V, the aspect ratio (W/L)p / (W/L)n must be:',
      options: [
        '0.25',
        '1.0',
        '2.0',
        '4.0',
      ],
      correctIndex: 3,
      explanation:
        'At Vin = Vout = VM = VDD/2, both NMOS and PMOS are in saturation. Equating currents: kn*(VM - Vthn)² = kp*(VDD - VM - |Vthp|)². Since Vthn = |Vthp| and VM = VDD/2, we require kn = kp ⇒ μnCox*(W/L)n = μpCox*(W/L)p ⇒ (W/L)p / (W/L)n = μn / μp = 4.',
    },
    {
      id: 'm3_razavi_1',
      sourceCategory: 'Razavi',
      sourceCitation: 'B. Razavi, Ch. 3 (Single-Stage Amplifiers — Complementary Push-Pull Stage)',
      difficulty: '2-Mark Numerical',
      question:
        'A CMOS inverter is self-biased at Vin = Vout = VDD/2 via a large feedback resistor to operate as a Class-AB analog amplifier. If gmn = 1.2 mS, gmp = 1.0 mS, ron = 40 kΩ, and rop = 40 kΩ, the small-signal voltage gain |Av| is:',
      options: [
        '22 V/V',
        '44 V/V',
        '88 V/V',
        '11 V/V',
      ],
      correctIndex: 1,
      explanation:
        'Both NMOS and PMOS receive the small-signal input at their gates and drive the output in parallel: |Av| = (gmn + gmp) * (ron || rop) = (1.2 + 1.0) mS * (40 kΩ || 40 kΩ) = 2.2 mS * 20 kΩ = 44 V/V.',
    },
    {
      id: 'm3_allen_1',
      sourceCategory: 'Allen & Holberg',
      sourceCitation: 'Allen & Holberg, Ch. 4 (CMOS Push-Pull Inverter Amplifier)',
      difficulty: '1-Mark Conceptual',
      question:
        'Why does a CMOS inverter biased at VM = VDD/2 exhibit twice the current efficiency (gm_total / ID) of a standard NMOS common-source amplifier with a constant-current PMOS load?',
      options: [
        'Because the PMOS operates in triode',
        'Because the same DC quiescent current ID flows through both NMOS and PMOS while both devices contribute ac transconductance (gmn + gmp) in parallel',
        'Because Cgd is zero in a CMOS inverter',
        'Because body effect increases gmn',
      ],
      correctIndex: 1,
      explanation:
        'Current reuse: the same branch current ID biases both NMOS and PMOS, so gm_eff = gmn + gmp ≈ 2*gm for a single branch current ID.',
    },
  ],
  4: [
    {
      id: 'm4_razavi_1',
      sourceCategory: 'Razavi',
      sourceCitation: 'B. Razavi, Ch. 5 (Current Mirrors & Active Loads), Sec. 5.3',
      difficulty: '2-Mark Numerical',
      question:
        'In a 5-transistor (5T) NMOS differential OTA with PMOS current-mirror active load (M3–M4), each input transistor has gm1,2 = 0.8 mS and ro1,2 = 100 kΩ, while each PMOS load has gm3,4 = 0.5 mS and ro3,4 = 100 kΩ. The low-frequency differential voltage gain Avd is approximately:',
      options: [
        '20 V/V (26 dB)',
        '40 V/V (32 dB)',
        '80 V/V (38 dB)',
        '65 V/V (36.3 dB)',
      ],
      correctIndex: 1,
      explanation:
        'As derived in Razavi Ch. 5, the active current-mirror load converts both half-circuit currents into a single-ended output with full transconductance gm1 driving (ro2 || ro4): Avd = gm1 * (ro2 || ro4) = 0.8 mS * (100 kΩ || 100 kΩ) = 0.8 mS * 50 kΩ = 40 V/V (32.04 dB).',
    },
    {
      id: 'm4_allen_1',
      sourceCategory: 'Allen & Holberg',
      sourceCitation: 'Allen & Holberg, Ch. 5 (CMOS Differential Amplifiers), Prob. 5.2',
      difficulty: '2-Mark Numerical',
      question:
        'A 5T OTA drives a load capacitance CL = 5 pF with a tail current Iss = 100 μA. What is its slew rate (SR), and if gm1 = 628 μS, what is its unity-gain bandwidth (GBW)?',
      options: [
        'SR = 10 V/μs, GBW = 10 MHz',
        'SR = 20 V/μs, GBW = 20 MHz',
        'SR = 40 V/μs, GBW = 20 MHz',
        'SR = 20 V/μs, GBW = 40 MHz',
      ],
      correctIndex: 1,
      explanation:
        'Slew Rate SR = Iss / CL = 100 μA / 5 pF = 20 V/μs. Unity-gain bandwidth GBW = gm1 / (2π * CL) = 628e-6 / (6.283 * 5e-12) = 20 MHz.',
    },
    {
      id: 'm4_gate_1',
      sourceCategory: 'GATE PYQ',
      sourceCitation: 'GATE EC 2020 · Differential Amplifier CMRR & ICMR',
      difficulty: '1-Mark Conceptual',
      question:
        'In a 5T NMOS differential pair with PMOS diode-connected active load M3, the maximum input common-mode voltage VIC,max (keeping M1 and M2 in saturation) is given by:',
      options: [
        'VDD - |VGS3| + Vthn',
        'VDD - Vthn',
        'VDD - |VDS,sat3| - VGS1',
        'VSS + VDS,sat5 + VGS1',
      ],
      correctIndex: 0,
      explanation:
        'The drain of M1 sits at VD1 = VDD - |VGS3|. For M1 to remain in saturation, VGD1 <= Vthn ⇒ VG1 <= VD1 + Vthn = VDD - |VGS3| + Vthn.',
    },
  ],
  5: [
    {
      id: 'm5_razavi_1',
      sourceCategory: 'Razavi',
      sourceCitation: 'B. Razavi, Ch. 10 (Stability and Frequency Compensation), Sec. 10.4',
      difficulty: '2-Mark Numerical',
      question:
        'A Two-Stage Miller-compensated op-amp has Miller capacitor Cc = 2.0 pF and second-stage transconductance gm6 = 4.0 mS. Where is the feed-forward Right-Half-Plane (RHP) zero fz located, and what series resistor Rz moves it to infinity?',
      options: [
        'fz = 159 MHz, Rz = 500 Ω',
        'fz = 318.3 MHz, Rz = 250 Ω',
        'fz = 318.3 MHz, Rz = 500 Ω',
        'fz = 636.6 MHz, Rz = 125 Ω',
      ],
      correctIndex: 1,
      explanation:
        'The RHP zero occurs at ωz = +gm6 / Cc ⇒ fz = 4.0e-3 / (2π * 2.0e-12) = 318.3 MHz. Inserting a series nulling resistor Rz shifts the zero to s_z = 1 / [Cc * (1/gm6 - Rz)]. Choosing Rz = 1 / gm6 = 1 / 4 mS = 250 Ω pushes the zero to infinity.',
    },
    {
      id: 'm5_allen_1',
      sourceCategory: 'Allen & Holberg',
      sourceCitation: 'Allen & Holberg, Ch. 6 (Design of CMOS Op-Amps), Design Equations',
      difficulty: '2-Mark Numerical',
      question:
        'According to Allen & Holberg’s Two-Stage Op-Amp design procedure, to ensure free-of-systematic-offset operation when Vout = VDD - |VGS6|, how must the aspect ratios of (W/L)3,4 (Stage 1 PMOS load), (W/L)6 (Stage 2 PMOS CS), and (W/L)5, (W/L)7 (NMOS current sources) be related?',
      options: [
        '(W/L)6 / (W/L)4 = 2 * (W/L)7 / (W/L)5',
        '(W/L)6 / (W/L)4 = 0.5 * (W/L)7 / (W/L)5',
        '(W/L)6 = (W/L)1',
        'No relationship is required if Cc > 1 pF',
      ],
      correctIndex: 0,
      explanation:
        'For zero systematic input offset, VSD4 must equal VSD3 = VSG3, which forces VSG6 = VSG3. Since ID4 = ID5 / 2 and ID6 = ID7, equating current densities J6 = J4 requires (W/L)6 / (W/L)4 = ID6 / ID4 = 2 * ID7 / ID5 = 2 * (W/L)7 / (W/L)5.',
    },
    {
      id: 'm5_gate_1',
      sourceCategory: 'GATE PYQ',
      sourceCitation: 'GATE EC 2019 · Pole Splitting & Phase Margin',
      difficulty: '2-Mark Numerical',
      question:
        'A two-stage op-amp has unity-gain frequency GBW = 20 MHz, a non-dominant output pole fp2 = 60 MHz, and its RHP zero is cancelled at infinity. Assuming the dominant pole fp1 << GBW, the phase margin (PM) is approximately:',
      options: [
        '45.0°',
        '56.3°',
        '71.6°',
        '82.4°',
      ],
      correctIndex: 2,
      explanation:
        'With fp1 contributing -90° at GBW and the zero cancelled, PM = 180° - 90° - arctan(GBW / fp2) = 90° - arctan(20 / 60) = 90° - 18.43° = 71.57°.',
    },
  ],
  6: [
    {
      id: 'm6_razavi_1',
      sourceCategory: 'Razavi',
      sourceCitation: 'B. Razavi, Low-Dropout Regulators & Pass Device Topology',
      difficulty: '1-Mark Conceptual',
      question:
        'Why do integrated low-dropout (LDO) regulators almost universally use a PMOS common-source pass transistor rather than an NMOS source-follower pass transistor when operating from a single supply rail without a charge pump?',
      options: [
        'Because PMOS has higher electron mobility than NMOS',
        'Because an NMOS source follower requires VG >= Vout + Vthn, forcing a minimum dropout voltage of at least Vthn + VDS,sat (~0.6 V), whereas a PMOS CS pass device only requires Vdropout >= |VDS,sat,pass| (~0.1–0.2 V)',
        'Because a PMOS CS pass element has a low-impedance source node at Vout',
        'Because PMOS pass devices never require frequency compensation',
      ],
      correctIndex: 1,
      explanation:
        'An NMOS follower’s gate cannot exceed VDD without a charge pump, limiting Vout_max <= VDD - VGS_pass. A PMOS pass transistor has its source at VIN and gate pulled down toward GND by the error amplifier, allowing dropout as small as |VDS,sat| ≈ 100–200 mV.',
    },
    {
      id: 'm6_allen_1',
      sourceCategory: 'Allen & Holberg',
      sourceCitation: 'Allen & Holberg, LDO Loop Stability & Output Capacitor ESR',
      difficulty: '2-Mark Numerical',
      question:
        'An LDO regulator uses an external output capacitor Cout = 2.2 μF with equivalent series resistance RESR = 0.5 Ω. At what frequency does the ESR create a left-half-plane (LHP) phase-lead zero fz,ESR?',
      options: [
        '14.5 kHz',
        '72.3 kHz',
        '144.7 kHz',
        '1.45 MHz',
      ],
      correctIndex: 2,
      explanation:
        'fz,ESR = 1 / (2π * RESR * Cout) = 1 / (2π * 0.5 Ω * 2.2e-6 F) = 144.69 kHz. This LHP zero helps cancel the phase lag of the error-amplifier/pass-gate non-dominant pole.',
    },
    {
      id: 'm6_gate_1',
      sourceCategory: 'GATE PYQ',
      sourceCitation: 'GATE EC · Linear Regulator Closed-Loop Output Resistance',
      difficulty: '2-Mark Numerical',
      question:
        'An LDO pass device has open-loop output resistance Ro,open = 25 Ω. If the feedback factor is β = 0.5 and the error-amplifier + pass-stage open-loop DC gain is Aol = 1000 V/V, the closed-loop DC load regulation output resistance Rout,CL is approximately:',
      options: [
        '25 Ω',
        '0.50 Ω',
        '0.05 Ω',
        '0.025 Ω',
      ],
      correctIndex: 2,
      explanation:
        'Negative shunt-series voltage feedback divides the output impedance by (1 + Aol * β) ≈ 501: Rout,CL = 25 Ω / 501 ≈ 0.05 Ω (50 mΩ).',
    },
  ],
  7: [
    {
      id: 'm7_razavi_1',
      sourceCategory: 'Razavi',
      sourceCitation: 'B. Razavi, Ch. 12 (Bandgap References), Sec. 12.2–12.3',
      difficulty: '2-Mark Numerical',
      question:
        'In a CMOS bandgap reference (Razavi Ch. 12), two substrate PNP BJTs with emitter area ratio N = 8 are biased at equal collector currents. Given VT = kT/q = 25.85 mV at T = 300 K and ∂VBE/∂T = -1.61 mV/K, what resistor ratio K = R2/R1 is required so that VREF = VBE1 + K * ΔVBE has zero temperature coefficient at 300 K?',
      options: [
        'K = 5.21',
        'K = 8.00',
        'K = 8.96',
        'K = 18.68',
      ],
      correctIndex: 2,
      explanation:
        'ΔVBE = VT * ln(8) = 25.85 mV * 2.0794 = 53.75 mV. Its temperature slope is ∂(ΔVBE)/∂T = (k/q) * ln(8) = 0.08617 mV/K * 2.0794 = +0.1792 mV/K. For zero TC, K * (+0.1792 mV/K) = 1.61 mV/K ⇒ K = 8.98 (≈ 8.96).',
    },
    {
      id: 'm7_allen_1',
      sourceCategory: 'Allen & Holberg',
      sourceCitation: 'Allen & Holberg, Ch. 4.6 (Bandgap Voltage Reference & Startup)',
      difficulty: '1-Mark Conceptual',
      question:
        'Why do self-biased PTAT and Bandgap Reference cores require a dedicated startup circuit with an automatic shutoff mechanism?',
      options: [
        'To boost the PSRR above 100 MHz',
        'Because the nonlinear I-V characteristic of the self-biased mirror loop has TWO stable equilibrium states: the desired operating point and the degenerate zero-current state (ID = 0)',
        'To cancel the RHP zero of the op-amp',
        'To trim the resistor sheet resistance',
      ],
      correctIndex: 1,
      explanation:
        'At ID = 0, all VGS and VBE voltages are zero, satisfying KVL/KCL identically. A startup circuit senses the zero-current state, injects a trickle current to kick the loop to the non-zero equilibrium, and then disconnects completely.',
    },
    {
      id: 'm7_gate_1',
      sourceCategory: 'GATE PYQ',
      sourceCitation: 'GATE EC · Bandgap Box-Method Temperature Coefficient',
      difficulty: '2-Mark Numerical',
      question:
        'A bandgap reference produces VREF(27°C) = 1.200 V. Across the industrial temperature range from -40°C to +125°C (ΔT = 165°C), the minimum and maximum reference voltages are 1.1982 V and 1.2015 V. The Box-Method Temperature Coefficient (TC) is:',
      options: [
        '8.3 ppm/°C',
        '16.7 ppm/°C',
        '27.5 ppm/°C',
        '33.3 ppm/°C',
      ],
      correctIndex: 1,
      explanation:
        'ΔVREF = 1.2015 - 1.1982 = 0.0033 V (3.3 mV). TC = [ΔVREF / (VREF,nom * ΔT)] * 10⁶ = [0.0033 / (1.200 * 165)] * 10⁶ = 16.67 ppm/°C.',
    },
  ],
  8: [
    {
      id: 'm8_razavi_1',
      sourceCategory: 'Razavi',
      sourceCitation: 'B. Razavi, Ch. 9 (Op-Amp Open-Loop vs. Closed-Loop Simulation)',
      difficulty: '1-Mark Conceptual',
      question:
        'When measuring the open-loop AC frequency response of a high-gain op-amp (Av0 > 70 dB) in SPICE, why can you NOT simply ground the inverting terminal and apply an AC voltage source directly to the non-inverting terminal without DC feedback?',
      options: [
        'Because SPICE does not support .ac analysis on differential pairs',
        'Because any tiny systematic offset Vos (even 0.5 mV) multiplied by Av0 > 3,000 V/V rails the output to VDD or GND in the .op solution, pushing the output transistors into triode before .ac linearization runs',
        'Because Miller capacitance disappears at DC',
        'Because AC sources short outVDD',
      ],
      correctIndex: 1,
      explanation:
        'SPICE linearizes the circuit around the .op DC operating point. Without DC feedback (e.g., an ultra-large L_FB = 1 GH inductor and C_FB = 1 GF ac-coupling capacitor), microvolts of offset saturate the output stage into triode, yielding a false near-zero AC gain.',
    },
    {
      id: 'm8_allen_1',
      sourceCategory: 'Allen & Holberg',
      sourceCitation: 'Allen & Holberg, Ch. 6 (Op-Amp Characterization & Miller Loading)',
      difficulty: '1-Mark Conceptual',
      question:
        'Suppose your hand calculation predicts GBW = 50 MHz for a 5T OTA driving CL = 1.0 pF, but BSIM4 SPICE simulation reports GBW = 41 MHz even though gm1 matches your hand calculation exactly. What is the primary physical cause of the 18% lower GBW?',
      options: [
        'Channel-length modulation λ is too small',
        'Intrinsic drain-bulk junction capacitances (Cdb2 + Cdb4) and gate-drain overlap capacitances (Cgd2 + Cgd4) add ~220 fF directly in parallel with CL at the output node',
        'Thermal noise reduces the AC bandwidth',
        'The tail current source M5 is in cutoff',
      ],
      correctIndex: 1,
      explanation:
        'Total output capacitance is CL,eff = CL + Cdb2 + Cdb4 + Cgd2 + Cgd4. For a 1 pF external load, 220 fF of self-loading increases CL,eff to 1.22 pF, lowering GBW by 1 / 1.22 ≈ 82%.',
    },
  ],
  9: [
    {
      id: 'm9_razavi_1',
      sourceCategory: 'Razavi',
      sourceCitation: 'B. Razavi, Ch. 14 & Pelgrom’s Law (Device Mismatch & Offset)',
      difficulty: '2-Mark Numerical',
      question:
        'A differential pair in 180nm CMOS (Pelgrom constant AVth = 5.0 mV·μm) uses W = 25 μm and L = 1.0 μm. What is the 1σ threshold mismatch σ(ΔVth), and by what factor must the gate area W*L be increased to cut σ(ΔVth) in half?',
      options: [
        'σ = 1.0 mV; increase area W*L by 2×',
        'σ = 1.0 mV; increase area W*L by 4×',
        'σ = 0.2 mV; increase area W*L by 4×',
        'σ = 2.5 mV; increase area W*L by 2×',
      ],
      correctIndex: 1,
      explanation:
        'By Pelgrom’s Law, σ(ΔVth) = AVth / √(W*L) = 5.0 mV·μm / √(25 μm²) = 1.0 mV. Because σ ∝ 1/√(W*L), halving the mismatch standard deviation requires quadrupling (4×) the gate area W*L.',
    },
    {
      id: 'm9_allen_1',
      sourceCategory: 'Allen & Holberg',
      sourceCitation: 'Allen & Holberg, Ch. 2 (CMOS Layout, Common-Centroid & Matching)',
      difficulty: '1-Mark Conceptual',
      question:
        'In analog IC layout, placing a differential pair M1–M2 in a 2D Common-Centroid cross-coupled array (e.g., A B B A / B A A B) surrounded by dummy poly fingers cancels which two physical manufacturing non-idealities?',
      options: [
        'Channel-length modulation and body effect',
        'First-order linear process/thermal gradients across the die (via common-centroid symmetry) and poly etching/STI edge-stress mismatches on the outer fingers (via dummy devices)',
        'Flicker (1/f) noise and white thermal noise',
        'Gate oxide tunneling current',
      ],
      correctIndex: 1,
      explanation:
        'Common-centroid placement ensures both devices share the exact same spatial center of gravity, cancelling linear X/Y gradients. Dummy fingers ensure edge fingers experience identical lithographic and STI stress environments as interior fingers.',
    },
    {
      id: 'm9_gate_1',
      sourceCategory: 'GATE PYQ',
      sourceCitation: 'GATE EC · Thermal & 1/f Flicker Noise in MOSFET Amplifiers',
      difficulty: '1-Mark Conceptual',
      question:
        'To minimize the input-referred 1/f (flicker) noise voltage spectral density Sv,1/f(f) = Kf / (Cox * W * L * f) of an op-amp input differential pair at low frequencies (10 Hz – 1 kHz), the designer should:',
      options: [
        'Use minimum-length (L = Lmin) NMOS transistors',
        'Increase the gate area (W * L) of the input differential pair and, when possible, use PMOS input devices (which typically exhibit lower 1/f noise trapping in buried/surface channels)',
        'Increase the tail current source resistance',
        'Reduce the Miller compensation capacitor Cc',
      ],
      correctIndex: 1,
      explanation:
        'Input-referred 1/f noise power is inversely proportional to gate area (W*L), while Active Load 1/f noise referred to the input scales as (gm3/gm1)² * Sv,3. Hence large W*L input devices and longer-L (smaller gm3) loads minimize 1/f noise.',
    },
  ],
};

/**
 * Generates time-varying parametric numerical questions modeled after GATE PYQ,
 * Razavi, and Allen & Holberg so that every time the user refreshes or the timer
 * rotates the question set, fresh numerical problems with exact worked solutions appear!
 */
export function buildDynamicQuizSet(
  moduleId: number,
  setSeed: number,
  sourceFilter: 'ALL' | QuestionSourceCategory
): DynamicQuizItem[] {
  const staticList = STATIC_CLASSIC_POOL[moduleId] || STATIC_CLASSIC_POOL[1];

  // Generate 3 parametric time-varying questions for this module based on setSeed
  const k = (setSeed % 7) + 1; // 1..7 deterministic variation per seed
  const parametricItems: DynamicQuizItem[] = [];

  if (moduleId === 1) {
    const idUa = 100 * k; // 100..700 uA
    const vov = 0.15 + 0.05 * (k % 4); // 0.20, 0.25, 0.30, 0.15 V
    const gmMs = (2 * (idUa / 1000)) / vov;
    const wrong1 = gmMs * 0.5;
    const wrong2 = gmMs * 2.0;
    const wrong3 = gmMs * 1.414;
    parametricItems.push({
      id: `m1_dyn_gate_${setSeed}`,
      sourceCategory: 'GATE PYQ',
      sourceCitation: `GATE EC Parametric PYQ (Set #${setSeed + 1})`,
      difficulty: '2-Mark Numerical',
      question: `[Dynamic Numerical] An NMOS transistor in saturation is biased at ID = ${idUa} μA with overdrive voltage Vov = VGS - Vth = ${vov.toFixed(2)} V. Neglecting channel-length modulation, calculate its small-signal transconductance gm:`,
      options: [
        `${wrong1.toFixed(2)} mS`,
        `${gmMs.toFixed(2)} mS`,
        `${wrong3.toFixed(2)} mS`,
        `${wrong2.toFixed(2)} mS`,
      ],
      correctIndex: 1,
      explanation: `Using the square-law saturation identity gm = 2 * ID / Vov = (2 * ${idUa} μA) / ${vov.toFixed(2)} V = ${gmMs.toFixed(2)} mS.`,
    });
  } else if (moduleId === 2) {
    const gmTargetUs = 300 + 150 * k;
    const gmId = 12 + (k % 5) * 2; // 12, 14, 16, 18, 20 V^-1
    const idReqUa = gmTargetUs / gmId;
    parametricItems.push({
      id: `m2_dyn_razavi_${setSeed}`,
      sourceCategory: 'Razavi',
      sourceCitation: `Razavi / Murmann gm/Id Sizing Problem (Set #${setSeed + 1})`,
      difficulty: '2-Mark Numerical',
      question: `[Dynamic Numerical] A common-source amplifier requires gm = ${gmTargetUs} μS and is sized at transconductance efficiency gm/ID = ${gmId} V⁻¹. What DC drain bias current ID is required?`,
      options: [
        `${(idReqUa * 0.5).toFixed(1)} μA`,
        `${idReqUa.toFixed(1)} μA`,
        `${(idReqUa * 1.5).toFixed(1)} μA`,
        `${(idReqUa * 2.0).toFixed(1)} μA`,
      ],
      correctIndex: 1,
      explanation: `By definition of transconductance efficiency, ID = gm / (gm/ID) = ${gmTargetUs} μS / ${gmId} V⁻¹ = ${idReqUa.toFixed(1)} μA.`,
    });
  } else if (moduleId === 3) {
    const gmn = (0.8 + 0.2 * k).toFixed(1);
    const gmp = (0.6 + 0.2 * k).toFixed(1);
    const roPar = 15 + 5 * (k % 4); // kOhm
    const av = (parseFloat(gmn) + parseFloat(gmp)) * roPar;
    parametricItems.push({
      id: `m3_dyn_allen_${setSeed}`,
      sourceCategory: 'Allen & Holberg',
      sourceCitation: `Allen & Holberg Ch. 4 Push-Pull Amplifier (Set #${setSeed + 1})`,
      difficulty: '2-Mark Numerical',
      question: `[Dynamic Numerical] A self-biased CMOS inverter amplifier has gmn = ${gmn} mS, gmp = ${gmp} mS, and parallel output resistance (ron || rop) = ${roPar} kΩ. What is the magnitude of its small-signal voltage gain |Av|?`,
      options: [
        `${(av * 0.5).toFixed(1)} V/V`,
        `${av.toFixed(1)} V/V`,
        `${(parseFloat(gmn) * roPar).toFixed(1)} V/V`,
        `${(av * 2.0).toFixed(1)} V/V`,
      ],
      correctIndex: 1,
      explanation: `In a push-pull CMOS inverter amplifier, both transconductances add in parallel: |Av| = (gmn + gmp) * (ron || rop) = (${gmn} + ${gmp}) mS * ${roPar} kΩ = ${av.toFixed(1)} V/V.`,
    });
  } else if (moduleId === 4) {
    const gbwMhz = 20 + 10 * k;
    const clPf = 1.5 + 0.5 * (k % 4);
    const gm1Us = 2 * Math.PI * gbwMhz * clPf;
    parametricItems.push({
      id: `m4_dyn_gate_${setSeed}`,
      sourceCategory: 'GATE PYQ',
      sourceCitation: `GATE EC Differential OTA Bandwidth Problem (Set #${setSeed + 1})`,
      difficulty: '2-Mark Numerical',
      question: `[Dynamic Numerical] A 5-transistor OTA must achieve a unity-gain bandwidth GBW = ${gbwMhz} MHz while driving a load capacitor CL = ${clPf.toFixed(1)} pF. The required input-pair transconductance gm1 is:`,
      options: [
        `${(gm1Us * 0.5).toFixed(1)} μS`,
        `${gm1Us.toFixed(1)} μS`,
        `${(gm1Us / (2 * Math.PI)).toFixed(1)} μS`,
        `${(gm1Us * 1.5).toFixed(1)} μS`,
      ],
      correctIndex: 1,
      explanation: `From GBW = gm1 / (2π * CL), we obtain gm1 = 2π * ${gbwMhz} MHz * ${clPf.toFixed(1)} pF = ${gm1Us.toFixed(1)} μS.`,
    });
  } else if (moduleId === 5) {
    const ccPf = 1.0 + 0.5 * k;
    const gm6Ms = 2.0 + 1.0 * (k % 5);
    const rzOhm = 1000 / gm6Ms;
    const fzMhz = (gm6Ms * 1e-3) / (2 * Math.PI * ccPf * 1e-12) / 1e6;
    parametricItems.push({
      id: `m5_dyn_razavi_${setSeed}`,
      sourceCategory: 'Razavi',
      sourceCitation: `B. Razavi Ch. 10 Miller Compensation Problem (Set #${setSeed + 1})`,
      difficulty: '2-Mark Numerical',
      question: `[Dynamic Numerical] A two-stage op-amp uses Miller capacitor Cc = ${ccPf.toFixed(1)} pF and second-stage transconductance gm6 = ${gm6Ms.toFixed(1)} mS. Find the uncompensated RHP zero frequency fz and the exact nulling resistor Rz needed to push fz to infinity:`,
      options: [
        `fz = ${(fzMhz * 0.5).toFixed(1)} MHz, Rz = ${(rzOhm * 2).toFixed(0)} Ω`,
        `fz = ${fzMhz.toFixed(1)} MHz, Rz = ${rzOhm.toFixed(0)} Ω`,
        `fz = ${fzMhz.toFixed(1)} MHz, Rz = ${(rzOhm * 0.5).toFixed(0)} Ω`,
        `fz = ${(fzMhz * 2).toFixed(1)} MHz, Rz = ${rzOhm.toFixed(0)} Ω`,
      ],
      correctIndex: 1,
      explanation: `fz = gm6 / (2π * Cc) = ${gm6Ms.toFixed(1)} mS / (2π * ${ccPf.toFixed(1)} pF) = ${fzMhz.toFixed(1)} MHz, and Rz = 1 / gm6 = 1000 / ${gm6Ms.toFixed(1)} = ${rzOhm.toFixed(0)} Ω.`,
    });
  } else if (moduleId === 6) {
    const vdoMv = 120 + 20 * k;
    const iloadMa = 25 + 15 * k;
    const rdsOn = vdoMv / iloadMa;
    parametricItems.push({
      id: `m6_dyn_allen_${setSeed}`,
      sourceCategory: 'Allen & Holberg',
      sourceCitation: `Allen & Holberg LDO Pass-Device Sizing (Set #${setSeed + 1})`,
      difficulty: '2-Mark Numerical',
      question: `[Dynamic Numerical] An LDO must supply a maximum load current Iload,max = ${iloadMa} mA with a dropout voltage no greater than Vdropout = ${vdoMv} mV. The maximum allowable pass-device on-resistance Rds,on is:`,
      options: [
        `${(rdsOn * 2).toFixed(2)} Ω`,
        `${rdsOn.toFixed(2)} Ω`,
        `${(rdsOn * 0.5).toFixed(2)} Ω`,
        `${(rdsOn * 4).toFixed(2)} Ω`,
      ],
      correctIndex: 1,
      explanation: `At the boundary of dropout, Rds,on <= Vdropout / Iload,max = ${vdoMv} mV / ${iloadMa} mA = ${rdsOn.toFixed(2)} Ω.`,
    });
  } else if (moduleId === 7) {
    const areaN = [4, 8, 10, 12, 16, 24, 32][k - 1] || 8;
    const dvbeMv = 25.85 * Math.log(areaN);
    parametricItems.push({
      id: `m7_dyn_razavi_${setSeed}`,
      sourceCategory: 'Razavi',
      sourceCitation: `B. Razavi Ch. 12 PTAT Generator Problem (Set #${setSeed + 1})`,
      difficulty: '2-Mark Numerical',
      question: `[Dynamic Numerical] In a bandgap PTAT core at T = 300 K (VT = 25.85 mV), two PNP BJTs with emitter area ratio N = ${areaN}:1 operate at equal collector currents. What is the PTAT voltage difference ΔVBE = VBE1 - VBE2?`,
      options: [
        `${(dvbeMv * 0.65).toFixed(2)} mV`,
        `${dvbeMv.toFixed(2)} mV`,
        `${(25.85 * areaN).toFixed(2)} mV`,
        `${(dvbeMv * 1.35).toFixed(2)} mV`,
      ],
      correctIndex: 1,
      explanation: `ΔVBE = VT * ln(N) = 25.85 mV * ln(${areaN}) = ${dvbeMv.toFixed(2)} mV.`,
    });
  } else if (moduleId === 8) {
    const avDb = 60 + 4 * k;
    const vosMv = 1.0 + 0.5 * (k % 3);
    const voutOpen = (vosMv / 1000) * Math.pow(10, avDb / 20);
    parametricItems.push({
      id: `m8_dyn_allen_${setSeed}`,
      sourceCategory: 'Allen & Holberg',
      sourceCitation: `Allen & Holberg Ch. 6 Open-Loop Testbench Problem (Set #${setSeed + 1})`,
      difficulty: '2-Mark Numerical',
      question: `[Dynamic Numerical] An op-amp has open-loop DC gain Av0 = ${avDb} dB and systematic input offset Vos = ${vosMv.toFixed(1)} mV. Without a DC feedback loop in SPICE .op analysis, what theoretical output voltage perturbation ΔVout = Av0 * Vos would be induced (saturating the 1.8V supply rail)?`,
      options: [
        `${(voutOpen * 0.1).toFixed(2)} V`,
        `${voutOpen.toFixed(2)} V (Rails the 1.8V supply!)`,
        `0.00 V`,
        `0.05 V`,
      ],
      correctIndex: 1,
      explanation: `Linear gain Av0 = 10^(${avDb}/20) = ${Math.pow(10, avDb / 20).toFixed(0)} V/V. Multiplying by Vos = ${vosMv.toFixed(1)} mV attempts to drive ΔVout = ${voutOpen.toFixed(2)} V, clipping the output stage against VDD or GND unless closed-loop DC biasing is used.`,
    });
  } else {
    const avth = 4.0 + 0.5 * k;
    const areaUm2 = 16;
    const sigmaMv = avth / Math.sqrt(areaUm2);
    parametricItems.push({
      id: `m9_dyn_gate_${setSeed}`,
      sourceCategory: 'GATE PYQ',
      sourceCitation: `GATE EC / Pelgrom Mismatch Problem (Set #${setSeed + 1})`,
      difficulty: '2-Mark Numerical',
      question: `[Dynamic Numerical] In a CMOS process with Pelgrom constant AVth = ${avth.toFixed(1)} mV·μm, a matched differential pair is sized with W = 16 μm and L = 1.0 μm (W*L = 16 μm²). What is its 1σ threshold voltage mismatch σ(ΔVth)?`,
      options: [
        `${(sigmaMv * 0.5).toFixed(3)} mV`,
        `${sigmaMv.toFixed(3)} mV`,
        `${(sigmaMv * 2.0).toFixed(3)} mV`,
        `${avth.toFixed(3)} mV`,
      ],
      correctIndex: 1,
      explanation: `By Pelgrom’s Law, σ(ΔVth) = AVth / √(W*L) = ${avth.toFixed(1)} / √16 = ${sigmaMv.toFixed(3)} mV.`,
    });
  }

  const combined = [...parametricItems, ...staticList];
  const filtered =
    sourceFilter === 'ALL'
      ? combined
      : combined.filter((q) => q.sourceCategory === sourceFilter);

  // Rotate order based on setSeed so question order & active set shift dynamically
  if (filtered.length <= 1) return filtered;
  const shift = setSeed % filtered.length;
  return [...filtered.slice(shift), ...filtered.slice(0, shift)];
}
