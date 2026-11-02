export type ProcessNodeId = '180nm' | '65nm';

export interface ProcessNodeSpec {
  id: ProcessNodeId;
  name: string;
  vdd: number; // V
  lMin: number; // um
  vthN: number; // V
  vthP: number; // V
  uCoxN: number; // uA/V^2
  uCoxP: number; // uA/V^2
  cox: number; // fF/um^2
  lambda0: number; // 1/V at Lmin
  nSlope: number; // subthreshold slope factor n
  vtThermal: number; // V (25.85mV at 300K)
  avtPelgrom: number; // mV*um
}

export const PROCESS_NODES: Record<ProcessNodeId, ProcessNodeSpec> = {
  '180nm': {
    id: '180nm',
    name: '180nm CMOS (1.8V Standard / SKY130-class)',
    vdd: 1.8,
    lMin: 0.18,
    vthN: 0.45,
    vthP: 0.48,
    uCoxN: 270, // uA/V^2
    uCoxP: 75,  // uA/V^2
    cox: 8.6,   // fF/um^2
    lambda0: 0.08,
    nSlope: 1.32,
    vtThermal: 0.02585,
    avtPelgrom: 5.0,
  },
  '65nm': {
    id: '65nm',
    name: '65nm LP CMOS (1.2V Deep-Submicron)',
    vdd: 1.2,
    lMin: 0.065,
    vthN: 0.34,
    vthP: 0.36,
    uCoxN: 420, // uA/V^2
    uCoxP: 115, // uA/V^2
    cox: 17.2,  // fF/um^2
    lambda0: 0.18,
    nSlope: 1.38,
    vtThermal: 0.02585,
    avtPelgrom: 3.2,
  },
};

export interface GmIdPoint {
  gmId: number;       // V^-1 (S/A)
  ic: number;         // Inversion coefficient (dimensionless)
  idOverW: number;    // uA/um
  vov: number;        // Effective overdrive V* = 2/(gm/Id) (V)
  vgs: number;        // Gate-source voltage (V)
  ftGHz: number;      // Transit frequency fT (GHz)
  gmRo: number;       // Intrinsic gain gm*ro (V/V)
  cggOverW: number;   // Total gate cap per unit width (fF/um)
  cggOverId: number;  // Cgg/Id (fs/V or pF/mA)
  region: 'Weak Inversion' | 'Moderate Inversion' | 'Strong Inversion';
}

/**
 * Unified EKV-calibrated lookup function given target gm/Id (in V^-1), channel length L (in um),
 * device polarity ('nmos' | 'pmos'), and process node.
 */
export function evaluateGmIdPoint(
  targetGmId: number,
  lengthUm: number,
  deviceType: 'nmos' | 'pmos',
  nodeId: ProcessNodeId
): GmIdPoint {
  const proc = PROCESS_NODES[nodeId];
  const gmIdMax = 1 / (proc.nSlope * proc.vtThermal); // ~29.3 V^-1
  const clampedGmId = Math.min(Math.max(targetGmId, 3.5), gmIdMax * 0.96);

  // EKV relation: gm/Id = 1 / (n * UT * sqrt(0.5 + 0.25*IC + sqrt(IC)))
  // Solve for Inversion Coefficient IC from clampedGmId:
  const ratio = gmIdMax / clampedGmId; // >= 1
  // Approximate inverse EKV with smooth short-channel velocity saturation factor:
  const alphaVelSat = proc.lMin / Math.max(lengthUm, proc.lMin) * 0.14;
  const icRaw = Math.max(0.015, Math.pow(ratio * ratio - 1, 1.0) / (1 + alphaVelSat));

  // Specific current Ispec_sq = 2 * n * uCox * UT^2 (in uA)
  const uCox = deviceType === 'nmos' ? proc.uCoxN : proc.uCoxP;
  const iSpecSq = 2 * proc.nSlope * uCox * proc.vtThermal * proc.vtThermal; // ~0.45 - 0.8 uA

  // Drain current density Id/W = Ispec_sq * (1 / L) * IC
  const idOverW = (iSpecSq / lengthUm) * icRaw; // uA/um

  // Effective V* = 2 / (gm/Id)
  const vov = 2 / clampedGmId;

  // Gate-source voltage Vgs using continuous EKV interpolation
  const vth = deviceType === 'nmos' ? proc.vthN : proc.vthP;
  const vgs = vth + proc.nSlope * proc.vtThermal * Math.log(Math.exp(Math.sqrt(icRaw)) - 1 + 0.12 * icRaw);

  // Total gate capacitance per unit width Cgg/W (fF/um)
  // Includes intrinsic channel cap (~2/3 W L Cox in strong inv, lower in weak inv) + overlap Cgd0/Cgs0
  const invFactor = 0.38 + 0.32 * (icRaw / (1 + icRaw));
  const cOverlapPerUm = nodeId === '180nm' ? 0.35 : 0.28; // fF/um
  const cggOverW = invFactor * proc.cox * lengthUm + 2 * cOverlapPerUm; // fF/um

  // Transit frequency fT = gm / (2 * pi * Cgg)
  // gm/W = clampedGmId * idOverW (uA/V/um = uS/um)
  // Cgg/W is in fF/um => fT (GHz) = (gm/W [uS/um]) / (2 * pi * Cgg/W [fF/um]) * 1000
  const gmOverW = clampedGmId * idOverW; // uS/um
  const ftGHz = (gmOverW / (2 * Math.PI * cggOverW)) * 1.0;

  // Output resistance ro and intrinsic gain gm*ro:
  // Early voltage VA scales roughly with L^0.85 and degrades slightly at high IC (DIBL)
  const vaEff = (1 / proc.lambda0) * Math.pow(lengthUm / proc.lMin, 0.82) * (1 + 0.12 / (0.2 + icRaw));
  const gmRo = clampedGmId * vaEff;

  // Cgg / Id in pF / mA (which equals fs / V)
  const cggOverId = cggOverW / Math.max(idOverW, 1e-4);

  let region: GmIdPoint['region'] = 'Moderate Inversion';
  if (icRaw < 0.1) {
    region = 'Weak Inversion';
  } else if (icRaw > 10) {
    region = 'Strong Inversion';
  }

  return {
    gmId: Number(clampedGmId.toFixed(2)),
    ic: Number(icRaw.toFixed(3)),
    idOverW: Number(idOverW.toFixed(3)),
    vov: Number(vov.toFixed(3)),
    vgs: Number(vgs.toFixed(3)),
    ftGHz: Number(ftGHz.toFixed(2)),
    gmRo: Number(gmRo.toFixed(1)),
    cggOverW: Number(cggOverW.toFixed(2)),
    cggOverId: Number(cggOverId.toFixed(2)),
    region,
  };
}

/**
 * Generates curve family across gm/Id from 4 to 26 V^-1 for plotting
 */
export function generateGmIdCurve(
  lengthUm: number,
  deviceType: 'nmos' | 'pmos',
  nodeId: ProcessNodeId
): GmIdPoint[] {
  const points: GmIdPoint[] = [];
  for (let gmId = 4; gmId <= 26; gmId += 1) {
    points.push(evaluateGmIdPoint(gmId, lengthUm, deviceType, nodeId));
  }
  return points;
}

export interface Ota5TSpecInput {
  nodeId: ProcessNodeId;
  gbwMHz: number;       // MHz
  clPf: number;         // pF
  slewRateVus: number;  // V/us
  gmIdInput: number;    // V^-1 (M1, M2)
  gmIdLoad: number;     // V^-1 (M3, M4)
  gmIdTail: number;     // V^-1 (M5)
  lengthUm: number;     // um
}

export interface Ota5TSizingResult {
  gm1uS: number;
  idBranchUa: number;
  iTailUa: number;
  w1Um: number;
  w3Um: number;
  w5Um: number;
  av0Vv: number;
  av0Db: number;
  ro1kOhm: number;
  ro3kOhm: number;
  routkOhm: number;
  actualGbwMHz: number;
  actualSrVus: number;
  powerUw: number;
  icmrMinV: number;
  icmrMaxV: number;
  voutSwingV: number;
  fp1kHz: number;
  fp2MHz: number;
  phaseMarginDeg: number;
  spiceNetlist: string;
}

export function calculate5TOtaSizing(spec: Ota5TSpecInput): Ota5TSizingResult {
  const proc = PROCESS_NODES[spec.nodeId];
  const m1Point = evaluateGmIdPoint(spec.gmIdInput, spec.lengthUm, 'nmos', spec.nodeId);
  const m3Point = evaluateGmIdPoint(spec.gmIdLoad, spec.lengthUm, 'pmos', spec.nodeId);
  const m5Point = evaluateGmIdPoint(spec.gmIdTail, spec.lengthUm, 'nmos', spec.nodeId);

  // Required gm1 from GBW = gm1 / (2*pi*CL)
  // gm1 [uS] = 2 * pi * GBW [MHz] * CL [pF]
  const gm1RequiredFromGbw = 2 * Math.PI * spec.gbwMHz * spec.clPf; // uS
  const idFromGbw = gm1RequiredFromGbw / m1Point.gmId; // uA
  const iTailFromSr = spec.slewRateVus * spec.clPf; // uA (since I = C * dV/dt => uA = pF * V/us)

  // Choose tail current to satisfy BOTH GBW and Slew Rate:
  const iTailUa = Math.max(2 * idFromGbw, iTailFromSr);
  const idBranchUa = iTailUa / 2;
  const gm1uS = idBranchUa * m1Point.gmId;

  // Device widths W = Id / (Id/W)
  const w1Um = Math.max(0.5, idBranchUa / m1Point.idOverW);
  const w3Um = Math.max(0.5, idBranchUa / m3Point.idOverW);
  const w5Um = Math.max(0.5, iTailUa / m5Point.idOverW);

  // Small-signal output resistances:
  // gm1 * ro1 = m1Point.gmRo => ro1 = m1Point.gmRo / gm1
  const ro1kOhm = (m1Point.gmRo / gm1uS) * 1000; // kOhm
  const gm3uS = idBranchUa * m3Point.gmId;
  const ro3kOhm = (m3Point.gmRo / gm3uS) * 1000; // kOhm
  const routkOhm = (ro1kOhm * ro3kOhm) / (ro1kOhm + ro3kOhm);

  const av0Vv = (gm1uS / 1000) * routkOhm;
  const av0Db = 20 * Math.log10(Math.max(av0Vv, 1));

  const actualGbwMHz = gm1uS / (2 * Math.PI * spec.clPf);
  const actualSrVus = iTailUa / spec.clPf;
  const powerUw = proc.vdd * iTailUa;

  // ICMR and Output Swing:
  const icmrMinV = m5Point.vov + m1Point.vgs;
  const icmrMaxV = proc.vdd - m3Point.vgs + proc.vthN;
  const voutSwingV = proc.vdd - (m3Point.vov + m1Point.vov + m5Point.vov);

  // Dominant pole at output and mirror pole at gate of M3/M4:
  const fp1kHz = (1 / (2 * Math.PI * routkOhm * 1e3 * spec.clPf * 1e-12)) / 1e3;
  const cMirrorFf = 2 * m3Point.cggOverW * w3Um;
  const fp2MHz = (gm3uS * 1e-6) / (2 * Math.PI * Math.max(cMirrorFf, 5) * 1e-15) / 1e6;
  const phaseMarginDeg = 90 - (Math.atan(actualGbwMHz / fp2MHz) * 180) / Math.PI;

  const spiceNetlist = `* ============================================================================
* 5-Transistor (5T) OTA — Auto-Generated by AnalogMaster gm/Id Engine
* Process Baseline: ${proc.name} (VDD = ${proc.vdd}V, L = ${spec.lengthUm.toFixed(2)}um)
* Target Specs: GBW = ${actualGbwMHz.toFixed(1)} MHz, Av0 = ${av0Db.toFixed(1)} dB, CL = ${spec.clPf} pF
* ============================================================================

.param VDD_VAL = ${proc.vdd}
.param I_TAIL  = ${iTailUa.toFixed(2)}u
.param VCM     = ${(proc.vdd / 2).toFixed(2)}

* --- Supply and Input Sources ---
VDD vdd 0 DC {VDD_VAL}
VCM vcm 0 DC {VCM}
VINP vinp vcm DC 0 AC 0.5
VINN vinn vcm DC 0 AC -0.5

* --- Bias Current Reference Mirror ---
IBIAS vdd vbias DC {I_TAIL}
M5_REF vbias vbias 0 0 NMOS_MODEL W=${w5Um.toFixed(2)}u L=${spec.lengthUm.toFixed(2)}u

* --- 5T OTA Core Topology ---
* Differential Input Pair (M1, M2) — gm/Id = ${spec.gmIdInput} V^-1
M1 vmir vinp vtail 0 NMOS_MODEL W=${w1Um.toFixed(2)}u L=${spec.lengthUm.toFixed(2)}u
M2 vout vinn vtail 0 NMOS_MODEL W=${w1Um.toFixed(2)}u L=${spec.lengthUm.toFixed(2)}u

* Active PMOS Current Mirror Load (M3, M4) — gm/Id = ${spec.gmIdLoad} V^-1
M3 vmir vmir vdd vdd PMOS_MODEL W=${w3Um.toFixed(2)}u L=${spec.lengthUm.toFixed(2)}u
M4 vout vmir vdd vdd PMOS_MODEL W=${w3Um.toFixed(2)}u L=${spec.lengthUm.toFixed(2)}u

* Tail Current Source (M5) — gm/Id = ${spec.gmIdTail} V^-1
M5 vtail vbias 0 0 NMOS_MODEL W=${w5Um.toFixed(2)}u L=${spec.lengthUm.toFixed(2)}u

* --- Load Capacitance ---
CL vout 0 ${spec.clPf}p

* --- Compact BSIM3/Level-1 Calibrated Models ---
.model NMOS_MODEL NMOS (LEVEL=1 VTO=${proc.vthN} KP=${proc.uCoxN}u LAMBDA=${(proc.lambda0 * proc.lMin / spec.lengthUm).toFixed(4)} GAMMA=0.4 PHI=0.7)
.model PMOS_MODEL PMOS (LEVEL=1 VTO=-${proc.vthP} KP=${proc.uCoxP}u LAMBDA=${(proc.lambda0 * 1.15 * proc.lMin / spec.lengthUm).toFixed(4)} GAMMA=0.45 PHI=0.7)

* --- Simulation Directives & Automated Measurements ---
.op
.ac dec 100 10 1G
.meas AC dc_gain_db MAX mag(V(vout))
.meas AC gbw_hz WHEN mag(V(vout))=1
.meas AC phase_at_gbw FIND ph(V(vout)) WHEN mag(V(vout))=1
.end`;

  return {
    gm1uS: Number(gm1uS.toFixed(1)),
    idBranchUa: Number(idBranchUa.toFixed(2)),
    iTailUa: Number(iTailUa.toFixed(2)),
    w1Um: Number(w1Um.toFixed(2)),
    w3Um: Number(w3Um.toFixed(2)),
    w5Um: Number(w5Um.toFixed(2)),
    av0Vv: Number(av0Vv.toFixed(1)),
    av0Db: Number(av0Db.toFixed(1)),
    ro1kOhm: Number(ro1kOhm.toFixed(1)),
    ro3kOhm: Number(ro3kOhm.toFixed(1)),
    routkOhm: Number(routkOhm.toFixed(1)),
    actualGbwMHz: Number(actualGbwMHz.toFixed(2)),
    actualSrVus: Number(actualSrVus.toFixed(2)),
    powerUw: Number(powerUw.toFixed(1)),
    icmrMinV: Number(icmrMinV.toFixed(2)),
    icmrMaxV: Number(icmrMaxV.toFixed(2)),
    voutSwingV: Number( Math.max(0.2, voutSwingV).toFixed(2) ),
    fp1kHz: Number(fp1kHz.toFixed(1)),
    fp2MHz: Number(fp2MHz.toFixed(1)),
    phaseMarginDeg: Number(phaseMarginDeg.toFixed(1)),
    spiceNetlist,
  };
}

export interface TwoStageSpecInput {
  nodeId: ProcessNodeId;
  gbwMHz: number;
  clPf: number;
  targetPmDeg: number;
  gmIdStage1: number;
  gmIdStage2: number;
  lengthUm: number;
  nullingMode: 'none' | 'move_to_inf' | 'cancel_p2';
}

export interface TwoStageSizingResult {
  ccPf: number;
  gm1uS: number;
  gm6uS: number;
  iTail1Ua: number;
  id6Ua: number;
  w1Um: number;
  w3Um: number;
  w5Um: number;
  w6Um: number;
  w7Um: number;
  rzOhm: number;
  av1Db: number;
  av2Db: number;
  avTotalDb: number;
  fp1Hz: number;
  fp2MHz: number;
  fz1MHz: number;
  phaseMarginDeg: number;
  slewRateVus: number;
  powerUw: number;
  spiceNetlist: string;
}

export function calculateTwoStageSizing(spec: TwoStageSpecInput): TwoStageSizingResult {
  const proc = PROCESS_NODES[spec.nodeId];
  const m1 = evaluateGmIdPoint(spec.gmIdStage1, spec.lengthUm, 'nmos', spec.nodeId);
  const m3 = evaluateGmIdPoint(10, spec.lengthUm, 'pmos', spec.nodeId);
  const m5 = evaluateGmIdPoint(10, spec.lengthUm, 'nmos', spec.nodeId);
  const m6 = evaluateGmIdPoint(spec.gmIdStage2, spec.lengthUm, 'pmos', spec.nodeId);

  // Rule of thumb for Miller compensation: Cc >= 0.22 * CL for 60 deg PM, scale with targetPM
  const pmFactor = spec.targetPmDeg >= 65 ? 0.35 : spec.targetPmDeg >= 55 ? 0.25 : 0.18;
  const ccPf = Number((pmFactor * spec.clPf).toFixed(2));

  // gm1 = 2 * pi * GBW * Cc
  const gm1uS = 2 * Math.PI * spec.gbwMHz * ccPf;
  const id1Ua = gm1uS / m1.gmId;
  const iTail1Ua = 2 * id1Ua;

  // Non-dominant pole placement: fp2 = gm6 / (2 * pi * CL)
  // For target PM, set gm6 = k * gm1 * (CL / Cc), where k = tan(targetPM) ~ 2.2 to 3.0
  const poleRatio = Math.max(1.8, Math.tan((spec.targetPmDeg * Math.PI) / 180) * 1.35);
  const gm6uS = poleRatio * gm1uS * (spec.clPf / ccPf);
  const id6Ua = gm6uS / m6.gmId;

  // Device Widths
  const w1Um = Math.max(0.5, id1Ua / m1.idOverW);
  const w3Um = Math.max(0.5, id1Ua / m3.idOverW);
  const w5Um = Math.max(0.5, iTail1Ua / m5.idOverW);
  const w6Um = Math.max(1.0, id6Ua / m6.idOverW);
  const w7Um = Math.max(1.0, id6Ua / m5.idOverW);

  // Gains
  const av1Vv = (m1.gmRo * m3.gmRo) / (m1.gmRo + m3.gmRo);
  const av2Vv = (m6.gmRo * m5.gmRo) / (m6.gmRo + m5.gmRo);
  const av1Db = 20 * Math.log10(av1Vv);
  const av2Db = 20 * Math.log10(av2Vv);
  const avTotalVv = av1Vv * av2Vv;
  const avTotalDb = av1Db + av2Db;

  // Poles and Zeros
  const fp1Hz = (spec.gbwMHz * 1e6) / avTotalVv;
  const fp2MHz = gm6uS / (2 * Math.PI * spec.clPf);

  let rzOhm = 0;
  let fz1MHz = gm6uS / (2 * Math.PI * ccPf); // Positive (RHP) if Rz = 0
  let zeroPhaseContribution = -(Math.atan(spec.gbwMHz / fz1MHz) * 180) / Math.PI;

  if (spec.nullingMode === 'move_to_inf') {
    rzOhm = 1e6 / gm6uS; // Rz = 1/gm6 pushes zero to infinity
    fz1MHz = 9999;
    zeroPhaseContribution = 0;
  } else if (spec.nullingMode === 'cancel_p2') {
    rzOhm = (1e6 / gm6uS) * (1 + spec.clPf / ccPf);
    fz1MHz = -fp2MHz; // Negative (LHP) zero cancels fp2
    zeroPhaseContribution = +(Math.atan(spec.gbwMHz / fp2MHz) * 180) / Math.PI;
  }

  const phaseMarginDeg = Math.min(
    88,
    90 - (Math.atan(spec.gbwMHz / fp2MHz) * 180) / Math.PI + zeroPhaseContribution
  );

  const slewRateVus = Math.min(iTail1Ua / ccPf, id6Ua / (spec.clPf + ccPf));
  const powerUw = proc.vdd * (iTail1Ua + id6Ua);

  const spiceNetlist = `* ============================================================================
* Two-Stage Miller-Compensated CMOS Op-Amp — AnalogMaster gm/Id Engine
* Process: ${proc.name} | Av = ${avTotalDb.toFixed(1)} dB | GBW = ${spec.gbwMHz} MHz | PM = ${phaseMarginDeg.toFixed(1)} deg
* ============================================================================

.param VDD_VAL = ${proc.vdd}
.param VCM     = ${(proc.vdd / 2).toFixed(2)}

VDD vdd 0 DC {VDD_VAL}
VCM vcm 0 DC {VCM}
VINP vinp vcm DC 0 AC 0.5
VINN vinn vcm DC 0 AC -0.5

* --- Bias Network ---
IBIAS vdd vbias_n DC ${iTail1Ua.toFixed(2)}u
M8 vbias_n vbias_n 0 0 NMOS_MODEL W=${w5Um.toFixed(2)}u L=${spec.lengthUm.toFixed(2)}u

* --- Stage 1: Differential Input Pair with Active Load ---
M1 n_mir vinp n_tail 0 NMOS_MODEL W=${w1Um.toFixed(2)}u L=${spec.lengthUm.toFixed(2)}u
M2 n_stg1 vinn n_tail 0 NMOS_MODEL W=${w1Um.toFixed(2)}u L=${spec.lengthUm.toFixed(2)}u
M3 n_mir n_mir vdd vdd PMOS_MODEL W=${w3Um.toFixed(2)}u L=${spec.lengthUm.toFixed(2)}u
M4 n_stg1 n_mir vdd vdd PMOS_MODEL W=${w3Um.toFixed(2)}u L=${spec.lengthUm.toFixed(2)}u
M5 n_tail vbias_n 0 0 NMOS_MODEL W=${w5Um.toFixed(2)}u L=${spec.lengthUm.toFixed(2)}u

* --- Stage 2: Common-Source High-Swing Output Stage ---
M6 vout n_stg1 vdd vdd PMOS_MODEL W=${w6Um.toFixed(2)}u L=${spec.lengthUm.toFixed(2)}u
M7 vout vbias_n 0 0 NMOS_MODEL W=${w7Um.toFixed(2)}u L=${spec.lengthUm.toFixed(2)}u

* --- Miller Compensation Network (Cc + Nulling Resistor Rz) ---
RZ n_stg1 n_comp ${Math.max(1, rzOhm).toFixed(1)}
CC n_comp vout ${ccPf}p
CL vout 0 ${spec.clPf}p

.model NMOS_MODEL NMOS (LEVEL=1 VTO=${proc.vthN} KP=${proc.uCoxN}u LAMBDA=${(proc.lambda0 * proc.lMin / spec.lengthUm).toFixed(4)})
.model PMOS_MODEL PMOS (LEVEL=1 VTO=-${proc.vthP} KP=${proc.uCoxP}u LAMBDA=${(proc.lambda0 * 1.15 * proc.lMin / spec.lengthUm).toFixed(4)})

.op
.ac dec 100 1 1G
.meas AC gain_db MAX mag(V(vout))
.meas AC ugbw_hz WHEN mag(V(vout))=1
.meas AC pm_deg FIND (180+ph(V(vout))) WHEN mag(V(vout))=1
.end`;

  return {
    ccPf,
    gm1uS: Number(gm1uS.toFixed(1)),
    gm6uS: Number(gm6uS.toFixed(1)),
    iTail1Ua: Number(iTail1Ua.toFixed(1)),
    id6Ua: Number(id6Ua.toFixed(1)),
    w1Um: Number(w1Um.toFixed(2)),
    w3Um: Number(w3Um.toFixed(2)),
    w5Um: Number(w5Um.toFixed(2)),
    w6Um: Number(w6Um.toFixed(2)),
    w7Um: Number(w7Um.toFixed(2)),
    rzOhm: Number(rzOhm.toFixed(0)),
    av1Db: Number(av1Db.toFixed(1)),
    av2Db: Number(av2Db.toFixed(1)),
    avTotalDb: Number(avTotalDb.toFixed(1)),
    fp1Hz: Number(fp1Hz.toFixed(0)),
    fp2MHz: Number(fp2MHz.toFixed(2)),
    fz1MHz: Number(fz1MHz.toFixed(2)),
    phaseMarginDeg: Number(phaseMarginDeg.toFixed(1)),
    slewRateVus: Number(slewRateVus.toFixed(1)),
    powerUw: Number(powerUw.toFixed(1)),
    spiceNetlist,
  };
}
