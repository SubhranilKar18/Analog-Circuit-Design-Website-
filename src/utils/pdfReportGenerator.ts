import { jsPDF } from 'jspdf';
import {
  ProcessNodeId,
  PROCESS_NODES,
  evaluateGmIdPoint,
  calculate5TOtaSizing,
  calculateTwoStageSizing,
  Ota5TSpecInput,
  TwoStageSpecInput,
} from './analogPhysics';
import { runBuiltInSpiceSimulation } from './spiceSimulator';

export interface LabReportInputState {
  processNode: ProcessNodeId;
  activeNetlist?: string;
  otaSpec?: Ota5TSpecInput;
  twoStageSpec?: TwoStageSpecInput;
  gmIdTarget?: number;
  gmIdLengthUm?: number;
}

const DEFAULT_REPORT_NETLIST = `* Auto-Compiled SPICE Netlist from Interactive Schematic Capture Canvas
VDD vdd 0 DC 1.8
IBIAS vdd vbias DC 50u
M3 vmir vmir vdd vdd PMOS_180 W=28u L=0.50u
M4 vout vmir vdd vdd PMOS_180 W=28u L=0.50u
M1 vmir vinp vtail 0 NMOS_180 W=18.5u L=0.45u
M2 vout vinn vtail 0 NMOS_180 W=18.5u L=0.45u
M5 vtail vbias 0 0 NMOS_180 W=16u L=0.50u
CL vout 0 2.0p
VCM vcm 0 DC 0.9
VINP vinp vcm DC 0 AC 0.5
VINN vinn vcm DC 0 AC -0.5
.model NMOS_180 NMOS (LEVEL=1 VTO=0.45 KP=270u LAMBDA=0.035)
.model PMOS_180 PMOS (LEVEL=1 VTO=-0.48 KP=75u LAMBDA=0.040)
.op
.ac dec 100 10 10G
.tran 1n 200n
.end`;

/**
 * Generates and downloads a formatted multi-page PDF Engineering Report
 * aggregating the Interactive Lab calculator inputs, SPICE netlist, and simulation results.
 */
export function downloadLabEngineeringPdfReport(state: LabReportInputState): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const proc = PROCESS_NODES[state.processNode];
  const netlistToRun =
    state.activeNetlist && state.activeNetlist.trim().length > 15
      ? state.activeNetlist
      : DEFAULT_REPORT_NETLIST;

  const simResult = runBuiltInSpiceSimulation(netlistToRun);

  const gmIdPoint = evaluateGmIdPoint(
    state.gmIdTarget ?? 15,
    state.gmIdLengthUm ?? (state.processNode === '180nm' ? 0.36 : 0.18),
    'nmos',
    state.processNode
  );

  const otaSpec: Ota5TSpecInput = state.otaSpec ?? {
    nodeId: state.processNode,
    gbwMHz: 45,
    clPf: 2.0,
    slewRateVus: 22,
    gmIdInput: 15,
    gmIdLoad: 10,
    gmIdTail: 10,
    lengthUm: state.processNode === '180nm' ? 0.45 : 0.2,
  };
  const otaSizing = calculate5TOtaSizing({ ...otaSpec, nodeId: state.processNode });

  const twoStageSpec: TwoStageSpecInput = state.twoStageSpec ?? {
    nodeId: state.processNode,
    gbwMHz: 60,
    clPf: 4.0,
    targetPmDeg: 65,
    gmIdStage1: 16,
    gmIdStage2: 12,
    lengthUm: state.processNode === '180nm' ? 0.45 : 0.2,
    nullingMode: 'cancel_p2',
  };
  const twoStageSizing = calculateTwoStageSizing({
    ...twoStageSpec,
    nodeId: state.processNode,
  });

  const pageWidth = 210;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;
  let cursorY = 16;

  const ensureSpace = (neededMm: number) => {
    if (cursorY + neededMm > 280) {
      doc.addPage();
      cursorY = 16;
    }
  };

  // Top Header Banner
  doc.setFillColor(0, 98, 155); // #00629B
  doc.rect(marginX, cursorY, contentWidth, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(
    'ANALOG CIRCUIT DESIGN — INTERACTIVE LAB ENGINEERING REPORT',
    marginX + 4,
    cursorY + 7.5
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    `Generated: ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC  |  Process Node: ${proc.name}`,
    marginX + 4,
    cursorY + 14
  );
  cursorY += 24;

  // Section 1: CMOS Technology Baseline
  doc.setTextColor(0, 98, 155);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('I. CMOS PROCESS TECHNOLOGY & PDK BASELINE', marginX, cursorY);
  cursorY += 2;
  doc.setDrawColor(0, 98, 155);
  doc.setLineWidth(0.4);
  doc.line(marginX, cursorY, marginX + contentWidth, cursorY);
  cursorY += 5;

  doc.setTextColor(15, 23, 42);
  doc.setFont('courier', 'normal');
  doc.setFontSize(8.5);
  const pdkLines = [
    `Process Node : ${proc.name} (VDD = ${proc.vdd} V, L_min = ${proc.lMin} um)`,
    `Thresholds   : V_THn = ${proc.vthN} V, |V_THp| = ${proc.vthP} V   |   Subthreshold Slope n = ${proc.nSlope}`,
    `Transcond.   : u_n*C_ox = ${proc.uCoxN} uA/V^2, u_p*C_ox = ${proc.uCoxP} uA/V^2, C_ox = ${proc.cox} fF/um^2`,
    `Mismatch     : Pelgrom A_VT = ${proc.avtPelgrom} mV*um   |   Thermal Voltage V_T = ${(proc.vtThermal * 1000).toFixed(2)} mV`,
  ];
  pdkLines.forEach((line) => {
    doc.text(line, marginX + 2, cursorY);
    cursorY += 4.5;
  });
  cursorY += 3;

  // Section 2: SPICE Simulation Results (.meas + .op Transistor Operating Points)
  ensureSpace(55);
  doc.setTextColor(0, 98, 155);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(
    'II. ACTIVE SCHEMATIC SPICE SIMULATION RESULTS (.MEAS & .OP TABLE)',
    marginX,
    cursorY
  );
  cursorY += 2;
  doc.line(marginX, cursorY, marginX + contentWidth, cursorY);
  cursorY += 5;

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Active Circuit Deck: ${simResult.circuitTitle}`, marginX + 2, cursorY);
  cursorY += 5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(8.5);
  simResult.measResults.forEach((m) => {
    doc.text(
      `${m.name.padEnd(16)} : ${m.valueStr.padEnd(24)} [${m.description}]`,
      marginX + 2,
      cursorY
    );
    cursorY += 4.3;
  });
  cursorY += 2;

  // Nodal voltages
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('DC Nodal Operating Voltages (.op):', marginX + 2, cursorY);
  cursorY += 4.2;
  doc.setFont('courier', 'normal');
  const nodalStr = simResult.nodeVoltages
    .map((n) => `V(${n.node}) = ${n.voltageV.toFixed(4)}V`)
    .join('   |   ');
  doc.text(nodalStr, marginX + 2, cursorY);
  cursorY += 6;

  // Transistor Operating-Point Table
  ensureSpace(40);
  doc.setFillColor(241, 245, 249);
  doc.rect(marginX, cursorY - 3.5, contentWidth, 6, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.text(
    'Device   Type    W/L (um)      Id (uA)   gm (uS)   gm/Id    ro (kOhm)  |Vds|/Vdsat     Region',
    marginX + 2,
    cursorY
  );
  cursorY += 5;

  doc.setFont('courier', 'normal');
  simResult.transistorOps.forEach((t) => {
    ensureSpace(6);
    const wl = `${t.wUm}/${t.lUm}`.padEnd(12);
    const vdsPair = `${Math.abs(t.vdsV).toFixed(2)}V/${t.vdsatV.toFixed(2)}V`.padEnd(14);
    const rowStr = `${t.name.padEnd(8)} ${t.type.padEnd(7)} ${wl} ${String(t.idUa).padEnd(9)} ${String(t.gmUs).padEnd(9)} ${String(t.gmId).padEnd(8)} ${String(t.roKohm).padEnd(10)} ${vdsPair} ${t.region}`;
    doc.text(rowStr, marginX + 2, cursorY);
    cursorY += 4.3;
  });
  cursorY += 4;

  // Section 3: Interactive Sizing Calculators Summary
  ensureSpace(65);
  doc.setTextColor(0, 98, 155);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(
    'III. SIZING CALCULATORS SUMMARY (GM/ID, 5T OTA & 2-STAGE MILLER OP-AMP)',
    marginX,
    cursorY
  );
  cursorY += 2;
  doc.line(marginX, cursorY, marginX + contentWidth, cursorY);
  cursorY += 5;

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('A. EKV gm/Id Transistor Lookup Point:', marginX + 2, cursorY);
  cursorY += 4.5;
  doc.setFont('courier', 'normal');
  doc.setFontSize(8.3);
  doc.text(
    `Target gm/Id = ${gmIdPoint.gmId} V^-1 (${gmIdPoint.region}) | IC = ${gmIdPoint.ic} | Id/W = ${gmIdPoint.idOverW} uA/um | V* = ${gmIdPoint.vov} V | f_T = ${gmIdPoint.ftGHz} GHz | gm*ro = ${gmIdPoint.gmRo}`,
    marginX + 2,
    cursorY
  );
  cursorY += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(
    `B. 5-Transistor Differential OTA Sizing (GBW = ${otaSpec.gbwMHz} MHz, C_L = ${otaSpec.clPf} pF, SR = ${otaSpec.slewRateVus} V/us):`,
    marginX + 2,
    cursorY
  );
  cursorY += 4.5;
  doc.setFont('courier', 'normal');
  doc.setFontSize(8.3);
  const otaLines = [
    `Dimensions : W1,2 = ${otaSizing.w1Um} um, W3,4 = ${otaSizing.w3Um} um, W5 = ${otaSizing.w5Um} um (L = ${otaSpec.lengthUm} um)`,
    `Bias & gm  : I_tail = ${otaSizing.iTailUa} uA, I_branch = ${otaSizing.idBranchUa} uA, gm1,2 = ${otaSizing.gm1uS} uS`,
    `Performance: Av0 = ${otaSizing.av0Db} dB (${otaSizing.av0Vv} V/V), GBW = ${otaSizing.actualGbwMHz} MHz, PM = ${otaSizing.phaseMarginDeg} deg`,
    `Large-Sig  : Slew Rate = ${otaSizing.actualSrVus} V/us, ICMR = [${otaSizing.icmrMinV}V .. ${otaSizing.icmrMaxV}V], Power = ${otaSizing.powerUw} uW`,
  ];
  otaLines.forEach((l) => {
    doc.text(l, marginX + 2, cursorY);
    cursorY += 4.3;
  });
  cursorY += 3;

  ensureSpace(32);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(
    `C. Two-Stage Miller-Compensated Op-Amp Sizing (GBW = ${twoStageSpec.gbwMHz} MHz, C_L = ${twoStageSpec.clPf} pF, Target PM = ${twoStageSpec.targetPmDeg} deg):`,
    marginX + 2,
    cursorY
  );
  cursorY += 4.5;
  doc.setFont('courier', 'normal');
  doc.setFontSize(8.3);
  const opampLines = [
    `Stage 1 & 2: W1,2 = ${twoStageSizing.w1Um} um, W3,4 = ${twoStageSizing.w3Um} um, W5 = ${twoStageSizing.w5Um} um, W6 = ${twoStageSizing.w6Um} um, W7 = ${twoStageSizing.w7Um} um`,
    `Compensat. : Miller Cc = ${twoStageSizing.ccPf} pF, Nulling Rz = ${twoStageSizing.rzOhm} Ohm (${twoStageSpec.nullingMode})`,
    `Performance: Total Gain = ${twoStageSizing.avTotalDb} dB (Stg1: ${twoStageSizing.av1Db} dB, Stg2: ${twoStageSizing.av2Db} dB), PM = ${twoStageSizing.phaseMarginDeg} deg`,
    `Poles/Power: fp1 = ${twoStageSizing.fp1Hz} Hz, fp2 = ${twoStageSizing.fp2MHz} MHz, SR = ${twoStageSizing.slewRateVus} V/us, Power = ${twoStageSizing.powerUw} uW`,
  ];
  opampLines.forEach((l) => {
    doc.text(l, marginX + 2, cursorY);
    cursorY += 4.3;
  });
  cursorY += 4;

  // Section 4: Complete SPICE Netlist (.cir)
  ensureSpace(35);
  doc.setTextColor(0, 98, 155);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('IV. COMPLETE SPICE NETLIST DECK (.CIR)', marginX, cursorY);
  cursorY += 2;
  doc.line(marginX, cursorY, marginX + contentWidth, cursorY);
  cursorY += 5;

  doc.setTextColor(15, 23, 42);
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);

  const netlistLines = netlistToRun.split('\n');
  netlistLines.forEach((line) => {
    ensureSpace(5);
    doc.text(line.slice(0, 96), marginX + 2, cursorY);
    cursorY += 4.0;
  });

  doc.save(`Analog_Circuit_Design_Report_${state.processNode}.pdf`);
}
