import React, { useState, useMemo, useEffect } from 'react';
import {
  Cpu,
  Plus,
  Trash2,
  Play,
  RefreshCw,
  Layers,
  Activity,
  BarChart3,
  Grid,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { InlineMath, BlockEquation, SpiceNetlistBox } from './Math';
import { runBuiltInSpiceSimulation, SpiceSimulationOutput } from '../utils/spiceSimulator';

/* ============================================================================
 * FEATURE 1: INTERACTIVE SCHEMATIC CAPTURE CANVAS (SCHEMATIC -> SPICE + SIM)
 * ============================================================================ */
export interface SchematicElement {
  id: string;
  type: 'NMOS' | 'PMOS' | 'R' | 'C' | 'IDC' | 'VDC';
  name: string;
  x: number;
  y: number;
  mirrorX?: boolean; // Flip horizontally so gates face right or left cleanly
  horizontal?: boolean; // Rotate 2-terminal passives (R, C) horizontally for Miller feedback paths
  node1: string; // Drain (NMOS/PMOS) or Pos
  node2: string; // Gate (NMOS/PMOS) or Neg
  node3?: string; // Source (NMOS/PMOS)
  node4?: string; // Bulk
  param1: string; // W or Value
  param2?: string; // L or AC
}

export interface NetRouteConfig {
  busY: number;
  busX?: number;
  routingStyle: 'horizontal_bus' | 'vertical_bus' | 'direct_l';
}

type PinRole = 'top' | 'gate' | 'bottom';

interface PinEndpoint {
  elId: string;
  elName: string;
  pinRole: PinRole;
  nodeProp: 'node1' | 'node2' | 'node3';
  netName: string;
  x: number;
  y: number;
}

const STARTER_SCHEMATICS: Record<
  string,
  {
    title: string;
    items: SchematicElement[];
    defaultRoutes: Record<string, NetRouteConfig>;
  }
> = {
  ota5t: {
    title: '5-Transistor Differential OTA',
    items: [
      { id: 'v1', type: 'VDC', name: 'VDD', x: 70, y: 80, node1: 'vdd', node2: '0', param1: '1.8' },
      { id: 'i1', type: 'IDC', name: 'IBIAS', x: 130, y: 155, node1: 'vdd', node2: 'vbias', param1: '50u' },
      // M3 (gate facing right) & M4 (gate facing left) form a clean PMOS current mirror
      { id: 'm3', type: 'PMOS', name: 'M3', x: 240, y: 80, mirrorX: true, node1: 'vmir', node2: 'vmir', node3: 'vdd', node4: 'vdd', param1: '28u', param2: '0.50u' },
      { id: 'm4', type: 'PMOS', name: 'M4', x: 420, y: 80, mirrorX: false, node1: 'vout', node2: 'vmir', node3: 'vdd', node4: 'vdd', param1: '28u', param2: '0.50u' },
      // M1 (gate vinp on left) & M2 (gate vinn on right) form the differential pair
      { id: 'm1', type: 'NMOS', name: 'M1', x: 240, y: 160, mirrorX: false, node1: 'vmir', node2: 'vinp', node3: 'vtail', node4: '0', param1: '18.5u', param2: '0.45u' },
      { id: 'm2', type: 'NMOS', name: 'M2', x: 420, y: 160, mirrorX: true, node1: 'vout', node2: 'vinn', node3: 'vtail', node4: '0', param1: '18.5u', param2: '0.45u' },
      // M5 tail current sink centered below M1 & M2
      { id: 'm5', type: 'NMOS', name: 'M5', x: 330, y: 245, mirrorX: false, node1: 'vtail', node2: 'vbias', node3: '0', node4: '0', param1: '16u', param2: '0.50u' },
      // Load capacitor on right output node
      { id: 'c1', type: 'C', name: 'CL', x: 560, y: 175, node1: 'vout', node2: '0', param1: '2.0p' },
    ],
    defaultRoutes: {
      vmir: { busY: 120, busX: 272, routingStyle: 'horizontal_bus' },
      vtail: { busY: 202, routingStyle: 'horizontal_bus' },
      vout: { busY: 120, routingStyle: 'horizontal_bus' },
      vbias: { busY: 245, routingStyle: 'horizontal_bus' },
    },
  },
  opamp2stage: {
    title: 'Two-Stage Miller Op-Amp (with Rz & Cc)',
    items: [
      { id: 'v1', type: 'VDC', name: 'VDD', x: 65, y: 80, node1: 'vdd', node2: '0', param1: '1.8' },
      { id: 'i1', type: 'IDC', name: 'IBIAS', x: 115, y: 155, node1: 'vdd', node2: 'vbias', param1: '44u' },
      { id: 'm3', type: 'PMOS', name: 'M3', x: 200, y: 80, mirrorX: true, node1: 'vmir', node2: 'vmir', node3: 'vdd', node4: 'vdd', param1: '24u', param2: '0.50u' },
      { id: 'm4', type: 'PMOS', name: 'M4', x: 330, y: 80, mirrorX: false, node1: 'v1', node2: 'vmir', node3: 'vdd', node4: 'vdd', param1: '24u', param2: '0.50u' },
      { id: 'm1', type: 'NMOS', name: 'M1', x: 200, y: 165, mirrorX: false, node1: 'vmir', node2: 'vinp', node3: 'vtail', node4: '0', param1: '18u', param2: '0.50u' },
      { id: 'm2', type: 'NMOS', name: 'M2', x: 330, y: 165, mirrorX: true, node1: 'v1', node2: 'vinn', node3: 'vtail', node4: '0', param1: '18u', param2: '0.50u' },
      { id: 'm5', type: 'NMOS', name: 'M5', x: 265, y: 245, mirrorX: false, node1: 'vtail', node2: 'vbias', node3: '0', node4: '0', param1: '15u', param2: '0.50u' },
      { id: 'm6', type: 'PMOS', name: 'M6', x: 535, y: 80, mirrorX: false, node1: 'vout', node2: 'v1', node3: 'vdd', node4: 'vdd', param1: '78u', param2: '0.36u' },
      { id: 'm7', type: 'NMOS', name: 'M7', x: 535, y: 245, mirrorX: false, node1: 'vout', node2: 'vbias', node3: '0', node4: '0', param1: '33u', param2: '0.50u' },
      { id: 'cc', type: 'C', name: 'CC', x: 400, y: 145, horizontal: true, node1: 'v1', node2: 'n_cc', param1: '1.4p' },
      { id: 'rz', type: 'R', name: 'RZ', x: 470, y: 145, horizontal: true, node1: 'n_cc', node2: 'vout', param1: '240' },
      { id: 'cl', type: 'C', name: 'CL', x: 615, y: 175, node1: 'vout', node2: '0', param1: '4.0p' },
    ],
    defaultRoutes: {
      vmir: { busY: 120, routingStyle: 'horizontal_bus' },
      vtail: { busY: 205, routingStyle: 'horizontal_bus' },
      v1: { busY: 120, routingStyle: 'horizontal_bus' },
      n_cc: { busY: 145, routingStyle: 'horizontal_bus' },
      vout: { busY: 145, routingStyle: 'horizontal_bus' },
      vbias: { busY: 280, routingStyle: 'horizontal_bus' },
    },
  },
  inverter_amp: {
    title: 'CMOS Push-Pull Inverter Amplifier',
    items: [
      { id: 'v1', type: 'VDC', name: 'VDD', x: 90, y: 85, node1: 'vdd', node2: '0', param1: '1.8' },
      { id: 'v2', type: 'VDC', name: 'VIN', x: 165, y: 155, node1: 'vin', node2: '0', param1: '0.9', param2: '1.0' },
      { id: 'mp', type: 'PMOS', name: 'MP', x: 320, y: 90, mirrorX: false, node1: 'vout', node2: 'vin', node3: 'vdd', node4: 'vdd', param1: '21.6u', param2: '0.36u' },
      { id: 'mn', type: 'NMOS', name: 'MN', x: 320, y: 210, mirrorX: false, node1: 'vout', node2: 'vin', node3: '0', node4: '0', param1: '6.0u', param2: '0.36u' },
      { id: 'c1', type: 'C', name: 'CL', x: 480, y: 180, node1: 'vout', node2: '0', param1: '1.2p' },
    ],
    defaultRoutes: {
      vin: { busY: 150, busX: 250, routingStyle: 'vertical_bus' },
      vout: { busY: 150, routingStyle: 'horizontal_bus' },
    },
  },
};

export interface SchematicCaptureCanvasProps {
  onSendNetlistToStudio?: (netlist: string) => void;
}

type SimViewTab = 'ac_bode' | 'op_table' | 'tran_wave' | 'dc_sweep' | 'netlist_code';

export const SchematicCaptureCanvas: React.FC<SchematicCaptureCanvasProps> = ({
  onSendNetlistToStudio,
}) => {
  const [elements, setElements] = useState<SchematicElement[]>(STARTER_SCHEMATICS.ota5t.items);
  const [netRoutes, setNetRoutes] = useState<Record<string, NetRouteConfig>>(
    STARTER_SCHEMATICS.ota5t.defaultRoutes
  );
  const [selectedId, setSelectedId] = useState<string>('m1');
  const [selectedNet, setSelectedNet] = useState<string | null>(null);
  const [inspectorMode, setInspectorMode] = useState<'symbol' | 'wire'>('symbol');

  // Dragging state for symbols or wire bus handles
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingWireNet, setDraggingWireNet] = useState<string | null>(null);

  // Interactive pin-to-pin wire drawing state
  const [wireToolActive, setWireToolActive] = useState<boolean>(false);
  const [pendingPin, setPendingPin] = useState<PinEndpoint | null>(null);
  const [pointerSvgPos, setPointerSvgPos] = useState<{ x: number; y: number }>({ x: 300, y: 150 });

  const [activeSimTab, setActiveSimTab] = useState<SimViewTab>('ac_bode');

  const selectedEl = elements.find((e) => e.id === selectedId) || elements[0];

  const loadTemplate = (key: keyof typeof STARTER_SCHEMATICS, defaultSelId: string) => {
    const tpl = STARTER_SCHEMATICS[key];
    setElements(tpl.items);
    setNetRoutes(tpl.defaultRoutes);
    setSelectedId(defaultSelId);
    setSelectedNet(null);
    setInspectorMode('symbol');
    setPendingPin(null);
  };

  const addComponent = (type: SchematicElement['type']) => {
    const idx = elements.filter((e) => e.type === type).length + 1;
    const prefix =
      type === 'NMOS' || type === 'PMOS'
        ? `M${elements.filter((e) => e.type === 'NMOS' || e.type === 'PMOS').length + 1}`
        : type === 'IDC'
          ? `I${idx}`
          : type === 'VDC'
            ? `V${idx}`
            : `${type}${idx}`;
    const newEl: SchematicElement = {
      id: `el_${Date.now()}`,
      type,
      name: prefix,
      x: 160 + ((elements.length * 65) % 420),
      y: 90 + ((elements.length * 45) % 150),
      mirrorX: false,
      node1: 'vout',
      node2: type === 'NMOS' || type === 'PMOS' ? 'vinp' : '0',
      node3: type === 'PMOS' ? 'vdd' : '0',
      node4: type === 'PMOS' ? 'vdd' : '0',
      param1:
        type === 'NMOS'
          ? '12u'
          : type === 'PMOS'
            ? '24u'
            : type === 'R'
              ? '10k'
              : type === 'C'
                ? '1.5p'
                : type === 'IDC'
                  ? '40u'
                  : '1.8',
      param2: type === 'NMOS' || type === 'PMOS' ? '0.36u' : undefined,
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedId(newEl.id);
    setInspectorMode('symbol');
  };

  const updateSelected = (patch: Partial<SchematicElement>) => {
    if (!selectedEl) return;
    setElements((prev) =>
      prev.map((el) => (el.id === selectedEl.id ? { ...el, ...patch } : el))
    );
  };

  const deleteSelected = () => {
    if (!selectedEl || elements.length <= 1) return;
    const remaining = elements.filter((e) => e.id !== selectedEl.id);
    setElements(remaining);
    setSelectedId(remaining[0].id);
  };

  // Compute exact pin endpoints for every element on the canvas
  const allPinEndpoints = useMemo<PinEndpoint[]>(() => {
    const list: PinEndpoint[] = [];
    elements.forEach((el) => {
      const gateDx = el.mirrorX ? 32 : -32;
      if (el.type === 'PMOS') {
        // PMOS: top = Source (node3), gate = Gate (node2), bottom = Drain (node1)
        list.push({
          elId: el.id,
          elName: el.name,
          pinRole: 'top',
          nodeProp: 'node3',
          netName: (el.node3 || 'vdd').toLowerCase(),
          x: el.x,
          y: el.y - 30,
        });
        list.push({
          elId: el.id,
          elName: el.name,
          pinRole: 'gate',
          nodeProp: 'node2',
          netName: el.node2.toLowerCase(),
          x: el.x + gateDx,
          y: el.y,
        });
        list.push({
          elId: el.id,
          elName: el.name,
          pinRole: 'bottom',
          nodeProp: 'node1',
          netName: el.node1.toLowerCase(),
          x: el.x,
          y: el.y + 30,
        });
      } else if (el.type === 'NMOS') {
        // NMOS: top = Drain (node1), gate = Gate (node2), bottom = Source (node3)
        list.push({
          elId: el.id,
          elName: el.name,
          pinRole: 'top',
          nodeProp: 'node1',
          netName: el.node1.toLowerCase(),
          x: el.x,
          y: el.y - 30,
        });
        list.push({
          elId: el.id,
          elName: el.name,
          pinRole: 'gate',
          nodeProp: 'node2',
          netName: el.node2.toLowerCase(),
          x: el.x + gateDx,
          y: el.y,
        });
        list.push({
          elId: el.id,
          elName: el.name,
          pinRole: 'bottom',
          nodeProp: 'node3',
          netName: (el.node3 || '0').toLowerCase(),
          x: el.x,
          y: el.y + 30,
        });
      } else {
        // 2-terminal passive or source: top/left = node1, bottom/right = node2
        list.push({
          elId: el.id,
          elName: el.name,
          pinRole: 'top',
          nodeProp: 'node1',
          netName: el.node1.toLowerCase(),
          x: el.horizontal ? el.x - 30 : el.x,
          y: el.horizontal ? el.y : el.y - 30,
        });
        list.push({
          elId: el.id,
          elName: el.name,
          pinRole: 'bottom',
          nodeProp: 'node2',
          netName: el.node2.toLowerCase(),
          x: el.horizontal ? el.x + 30 : el.x,
          y: el.horizontal ? el.y : el.y + 30,
        });
      }
    });
    return list;
  }, [elements]);

  // Connect two pins interactively when user clicks Pin A then Pin B
  const handlePinClick = (pin: PinEndpoint, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!pendingPin) {
      setPendingPin(pin);
      return;
    }
    if (pendingPin.elId === pin.elId && pendingPin.pinRole === pin.pinRole) {
      setPendingPin(null);
      return;
    }

    // Determine target net name (prefer existing non-0/non-vdd net name, or create a clean net name)
    let targetNet = pendingPin.netName;
    if (targetNet === '0' || targetNet === 'vdd') {
      targetNet =
        pin.netName !== '0' && pin.netName !== 'vdd'
          ? pin.netName
          : `net_${pendingPin.elName.toLowerCase()}`;
    }

    const midY = Math.round((pendingPin.y + pin.y) / 20) * 10;
    const midX = Math.round((pendingPin.x + pin.x) / 20) * 10;

    setElements((prev) =>
      prev.map((el) => {
        let next = el;
        if (el.id === pendingPin.elId) {
          next = { ...next, [pendingPin.nodeProp]: targetNet };
        }
        if (el.id === pin.elId) {
          next = { ...next, [pin.nodeProp]: targetNet };
        }
        return next;
      })
    );

    setNetRoutes((prev) => ({
      ...prev,
      [targetNet]: prev[targetNet] || {
        busY: midY,
        busX: midX,
        routingStyle: 'horizontal_bus',
      },
    }));

    setSelectedNet(targetNet);
    setInspectorMode('wire');
    setPendingPin(null);
  };

  // Group signal nets (excluding '0' and 'vdd') with >= 2 connected pins
  const activeSignalNets = useMemo(() => {
    const map: Record<string, PinEndpoint[]> = {};
    allPinEndpoints.forEach((p) => {
      if (!p.netName || p.netName === '0' || p.netName === 'gnd' || p.netName === 'vdd') {
        return;
      }
      if (!map[p.netName]) map[p.netName] = [];
      map[p.netName].push(p);
    });
    return Object.entries(map).filter(([, pins]) => pins.length >= 2);
  }, [allPinEndpoints]);

  // Build clean, controllable orthogonal wire segments + draggable handle position for a net
  const buildControllableNetGeometry = (netName: string, pins: PinEndpoint[]) => {
    const avgY = Math.round(pins.reduce((s, p) => s + p.y, 0) / pins.length / 5) * 5;
    const avgX = Math.round(pins.reduce((s, p) => s + p.x, 0) / pins.length / 5) * 5;
    const cfg: NetRouteConfig = netRoutes[netName] || {
      busY: avgY,
      busX: avgX,
      routingStyle: 'horizontal_bus',
    };

    const segments: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    const junctions: Array<{ x: number; y: number }> = [];

    if (cfg.routingStyle === 'vertical_bus') {
      const bx = cfg.busX ?? avgX;
      const ys = pins.map((p) => p.y);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      segments.push({ x1: bx, y1: minY, x2: bx, y2: maxY });
      pins.forEach((p) => {
        segments.push({ x1: p.x, y1: p.y, x2: bx, y2: p.y });
        junctions.push({ x: bx, y: p.y });
      });
      return {
        segments,
        junctions,
        handleX: bx,
        handleY: Math.round((minY + maxY) / 2),
        cfg,
      };
    }

    if (cfg.routingStyle === 'direct_l') {
      const p0 = pins[0];
      pins.slice(1).forEach((p) => {
        const bendY = cfg.busY;
        segments.push({ x1: p0.x, y1: p0.y, x2: p0.x, y2: bendY });
        segments.push({ x1: p0.x, y1: bendY, x2: p.x, y2: bendY });
        segments.push({ x1: p.x, y1: bendY, x2: p.x, y2: p.y });
        junctions.push({ x: p0.x, y: bendY });
      });
      return {
        segments,
        junctions,
        handleX: avgX,
        handleY: cfg.busY,
        cfg,
      };
    }

    // Default 'horizontal_bus' with smart colinear vertical merging & diode-loop routing:
    // Group pins by X coordinate so vertically aligned Drain-to-Drain connections (like M3->M1 or M4->M2)
    // connect cleanly along their shared X column, and tap into the horizontal bus at cfg.busY.
    const byX: Record<number, PinEndpoint[]> = {};
    pins.forEach((p) => {
      if (!byX[p.x]) byX[p.x] = [];
      byX[p.x].push(p);
    });

    const xCols = Object.keys(byX)
      .map(Number)
      .sort((a, b) => a - b);

    const busY = cfg.busY;

    if (xCols.length === 1) {
      // All pins share a single vertical line
      const x = xCols[0];
      const ys = pins.map((p) => p.y);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      segments.push({ x1: x, y1: minY, x2: x, y2: maxY });
      return {
        segments,
        junctions,
        handleX: x,
        handleY: Math.round((minY + maxY) / 2),
        cfg,
      };
    }

    // Horizontal trunk bus across all X columns at y = busY
    const minX = xCols[0];
    const maxX = xCols[xCols.length - 1];
    segments.push({ x1: minX, y1: busY, x2: maxX, y2: busY });

    xCols.forEach((x) => {
      const colPins = byX[x];
      const ys = colPins.map((p) => p.y);
      const allYs = [...ys, busY];
      const yTop = Math.min(...allYs);
      const yBot = Math.max(...allYs);
      if (yBot > yTop) {
        segments.push({ x1: x, y1: yTop, x2: x, y2: yBot });
      }
      if (colPins.length >= 2 || (x > minX && x < maxX)) {
        junctions.push({ x, y: busY });
      }
    });

    return {
      segments,
      junctions,
      handleX: Math.round((minX + maxX) / 2),
      handleY: busY,
      cfg,
    };
  };

  // Auto-compile drawn schematic into a valid SPICE netlist
  const compiledNetlist = useMemo(() => {
    const lines: string[] = [
      '* Auto-Compiled SPICE Netlist from Interactive Schematic Capture Canvas',
    ];
    let hasVin = false;
    elements.forEach((el) => {
      if (el.name.toUpperCase().includes('VIN')) hasVin = true;
      if (el.type === 'NMOS' || el.type === 'PMOS') {
        const mod = el.type === 'NMOS' ? 'NMOS_180' : 'PMOS_180';
        lines.push(
          `${el.name} ${el.node1} ${el.node2} ${el.node3 || '0'} ${el.node4 || '0'} ${mod} W=${el.param1} L=${el.param2 || '0.36u'}`
        );
      } else if (el.type === 'R' || el.type === 'C') {
        lines.push(`${el.name} ${el.node1} ${el.node2} ${el.param1}`);
      } else if (el.type === 'IDC') {
        lines.push(`${el.name} ${el.node1} ${el.node2} DC ${el.param1}`);
      } else if (el.type === 'VDC') {
        const acStr = el.param2 ? ` AC ${el.param2}` : '';
        lines.push(`${el.name} ${el.node1} ${el.node2} DC ${el.param1}${acStr}`);
      }
    });
    if (!hasVin) {
      lines.push('VCM vcm 0 DC 0.9');
      lines.push('VINP vinp vcm DC 0 AC 0.5');
      lines.push('VINN vinn vcm DC 0 AC -0.5');
    }
    lines.push('.model NMOS_180 NMOS (LEVEL=1 VTO=0.45 KP=270u LAMBDA=0.035)');
    lines.push('.model PMOS_180 PMOS (LEVEL=1 VTO=-0.48 KP=75u LAMBDA=0.040)');
    lines.push('.op');
    lines.push('.ac dec 100 10 10G');
    lines.push('.tran 1n 200n');
    lines.push('.end');
    return lines.join('\n');
  }, [elements]);

  // Live SPICE simulation output synced with schematic elements
  const simOutput = useMemo(
    () => runBuiltInSpiceSimulation(compiledNetlist),
    [compiledNetlist]
  );

  useEffect(() => {
    if (onSendNetlistToStudio) {
      onSendNetlistToStudio(compiledNetlist);
    }
  }, [compiledNetlist, onSendNetlistToStudio]);

  const handleSimulateSchematic = () => {
    if (onSendNetlistToStudio) {
      onSendNetlistToStudio(compiledNetlist);
    }
  };

  // Handle pointer dragging of schematic symbols OR wire bus control handles on the SVG canvas
  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const scaleX = 680 / Math.max(1, rect.width);
    const scaleY = 330 / Math.max(1, rect.height);
    const rawX = (e.clientX - rect.left) * scaleX;
    const rawY = (e.clientY - rect.top) * scaleY;

    setPointerSvgPos({ x: Math.round(rawX), y: Math.round(rawY) });

    if (draggingWireNet) {
      const snappedBusY = Math.max(30, Math.min(295, Math.round(rawY / 5) * 5));
      const snappedBusX = Math.max(40, Math.min(640, Math.round(rawX / 5) * 5));
      setNetRoutes((prev) => ({
        ...prev,
        [draggingWireNet]: {
          routingStyle: prev[draggingWireNet]?.routingStyle || 'horizontal_bus',
          busY: snappedBusY,
          busX: snappedBusX,
        },
      }));
      return;
    }

    if (draggingId) {
      const snappedX = Math.max(60, Math.min(620, Math.round(rawX / 10) * 10));
      const snappedY = Math.max(55, Math.min(270, Math.round(rawY / 10) * 10));
      setElements((prev) =>
        prev.map((el) => (el.id === draggingId ? { ...el, x: snappedX, y: snappedY } : el))
      );
    }
  };

  // Build SVG polylines for AC Bode Plot
  const { magPolyline, phasePolyline } = useMemo(() => {
    const mPts: string[] = [];
    const pPts: string[] = [];
    simOutput.acResponse.forEach((pt) => {
      const x = 55 + ((pt.logFreq - 1) / 9) * 355;
      const yMag = 140 - (Math.max(-40, Math.min(100, pt.magDb)) / 100) * 105;
      const yPh = 205 + (Math.max(-270, Math.min(0, pt.phaseDeg)) / -270) * 85;
      mPts.push(`${x.toFixed(1)},${yMag.toFixed(1)}`);
      pPts.push(`${x.toFixed(1)},${yPh.toFixed(1)}`);
    });
    return { magPolyline: mPts.join(' '), phasePolyline: pPts.join(' ') };
  }, [simOutput]);

  // Build SVG polyline for Transient or DC Sweep
  const buildWavePolyline = (
    points: Array<{ x: number; yPrimary: number; ySecondary?: number }>
  ) => {
    if (points.length === 0) return { prim: '', sec: '', xMin: 0, xMax: 1, yMin: 0, yMax: 1.8 };
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

    return { prim, sec, xMin, xMax, yMin, yMax };
  };

  const tranPlot = useMemo(
    () => buildWavePolyline(simOutput.tranResponse.points),
    [simOutput]
  );
  const dcPlot = useMemo(
    () => buildWavePolyline(simOutput.dcSweep.points),
    [simOutput]
  );

  // Renders authentic IEEE standard electronic circuit symbols (NMOS, PMOS, R, C, IDC, VDC)
  // with clickable terminal pins for interactive pin-to-pin wiring
  const renderCircuitSymbol = (el: SchematicElement, isSel: boolean) => {
    const strokeMain = isSel ? '#00629B' : '#1E293B';
    const topNode = el.type === 'PMOS' ? el.node3 : el.node1;
    const botNode = el.type === 'NMOS' ? el.node3 : el.type === 'PMOS' ? el.node1 : el.node2;
    const isTopVdd = topNode?.toLowerCase() === 'vdd';
    const isBotGnd = botNode === '0' || botNode?.toLowerCase() === 'gnd';

    const elPins = allPinEndpoints.filter((p) => p.elId === el.id);
    const labelSideX = el.mirrorX ? -16 : el.type === 'IDC' || el.type === 'VDC' ? 20 : 14;
    const labelAnchor = el.mirrorX ? 'end' : 'start';

    return (
      <g>
        {/* Subtle selection halo */}
        {isSel && (
          <rect
            x="-38"
            y="-34"
            width="76"
            height="68"
            rx="4"
            fill="#EFF6FF"
            stroke="#00629B"
            strokeWidth="1.4"
            strokeDasharray="3,2"
          />
        )}

        {/* Automatic Local VDD Supply T-Bar if top pin is tied to vdd */}
        {isTopVdd && !el.horizontal && (
          <g>
            <line x1="0" y1="-30" x2="0" y2="-40" stroke="#00629B" strokeWidth="2" />
            <line x1="-10" y1="-40" x2="10" y2="-40" stroke="#00629B" strokeWidth="2.8" />
            <text
              x="0"
              y="-44"
              textAnchor="middle"
              fill="#00629B"
              className="text-[8px] font-ieee-mono font-bold"
            >
              VDD
            </text>
          </g>
        )}

        {/* Automatic Local IEEE 3-Line Ground Symbol if bottom pin is tied to 0 */}
        {isBotGnd && !el.horizontal && (
          <g>
            <line x1="0" y1="30" x2="0" y2="39" stroke="#1E293B" strokeWidth="2" />
            <line x1="-11" y1="39" x2="11" y2="39" stroke="#1E293B" strokeWidth="2.2" />
            <line x1="-7" y1="43" x2="7" y2="43" stroke="#1E293B" strokeWidth="2" />
            <line x1="-3" y1="47" x2="3" y2="47" stroke="#1E293B" strokeWidth="1.8" />
          </g>
        )}

        {/* Symbol body (mirrored horizontally when el.mirrorX is true, or rotated -90 deg when el.horizontal is true) */}
        <g transform={el.horizontal ? 'rotate(-90)' : el.mirrorX ? 'scale(-1, 1)' : undefined}>
          {/* 1. IEEE 4-Terminal NMOS Symbol */}
          {el.type === 'NMOS' && (
            <g>
              <line x1="-32" y1="0" x2="-14" y2="0" stroke={strokeMain} strokeWidth="2" />
              <line x1="-14" y1="-14" x2="-14" y2="14" stroke={strokeMain} strokeWidth="2.4" />
              <line x1="-8" y1="-17" x2="-8" y2="17" stroke="#00629B" strokeWidth="2.8" />
              <line x1="-8" y1="-13" x2="0" y2="-13" stroke={strokeMain} strokeWidth="2" />
              <line x1="0" y1="-13" x2="0" y2="-30" stroke={strokeMain} strokeWidth="2" />
              <line x1="-8" y1="13" x2="0" y2="13" stroke={strokeMain} strokeWidth="2" />
              <polygon points="0,13 -5,10 -5,16" fill="#00629B" />
              <line x1="0" y1="13" x2="0" y2="30" stroke={strokeMain} strokeWidth="2" />
              <line x1="-8" y1="0" x2="0" y2="0" stroke="#64748B" strokeWidth="1.5" />
              <line x1="0" y1="0" x2="0" y2="13" stroke="#64748B" strokeWidth="1.4" strokeDasharray="2,1" />
            </g>
          )}

          {/* 2. IEEE 4-Terminal PMOS Symbol (with Gate Bubble & Top Source Arrow) */}
          {el.type === 'PMOS' && (
            <g>
              <line x1="-32" y1="0" x2="-21" y2="0" stroke={strokeMain} strokeWidth="2" />
              <circle cx="-17.5" cy="0" r="3.2" fill="#FFFFFF" stroke={strokeMain} strokeWidth="1.8" />
              <line x1="-14" y1="-14" x2="-14" y2="14" stroke={strokeMain} strokeWidth="2.4" />
              <line x1="-8" y1="-17" x2="-8" y2="17" stroke="#D97706" strokeWidth="2.8" />
              <line x1="-8" y1="-13" x2="0" y2="-13" stroke={strokeMain} strokeWidth="2" />
              <polygon points="-8,-13 -3,-16 -3,-10" fill="#D97706" />
              <line x1="0" y1="-13" x2="0" y2="-30" stroke={strokeMain} strokeWidth="2" />
              <line x1="-8" y1="13" x2="0" y2="13" stroke={strokeMain} strokeWidth="2" />
              <line x1="0" y1="13" x2="0" y2="30" stroke={strokeMain} strokeWidth="2" />
              <line x1="-8" y1="0" x2="0" y2="0" stroke="#64748B" strokeWidth="1.5" />
              <line x1="0" y1="0" x2="0" y2="-13" stroke="#64748B" strokeWidth="1.4" strokeDasharray="2,1" />
            </g>
          )}

          {/* 3. IEEE Zig-Zag Resistor Symbol (R) */}
          {el.type === 'R' && (
            <polyline
              fill="none"
              stroke={strokeMain}
              strokeWidth="2.2"
              strokeLinejoin="round"
              points="0,-30 0,-18 -9,-14 9,-8 -9,-2 9,4 -9,10 9,15 0,18 0,30"
            />
          )}

          {/* 4. IEEE Parallel-Plate Capacitor Symbol (C) */}
          {el.type === 'C' && (
            <g>
              <line x1="0" y1="-30" x2="0" y2="-5" stroke={strokeMain} strokeWidth="2" />
              <line x1="-14" y1="-5" x2="14" y2="-5" stroke="#00629B" strokeWidth="2.8" />
              <line x1="-14" y1="5" x2="14" y2="5" stroke="#00629B" strokeWidth="2.8" />
              <line x1="0" y1="5" x2="0" y2="30" stroke={strokeMain} strokeWidth="2" />
            </g>
          )}

          {/* 5. IEEE Independent DC Current Source Symbol (IDC) */}
          {el.type === 'IDC' && (
            <g>
              <line x1="0" y1="-30" x2="0" y2="-16" stroke={strokeMain} strokeWidth="2" />
              <circle cx="0" cy="0" r="16" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2.2" />
              <line x1="0" y1="-10" x2="0" y2="7" stroke="#0284C7" strokeWidth="2.2" />
              <polygon points="0,12 -4.5,5 4.5,5" fill="#0284C7" />
              <line x1="0" y1="16" x2="0" y2="30" stroke={strokeMain} strokeWidth="2" />
            </g>
          )}

          {/* 6. IEEE Independent DC/AC Voltage Source Symbol (VDC) */}
          {el.type === 'VDC' && (
            <g>
              <line x1="0" y1="-30" x2="0" y2="-16" stroke={strokeMain} strokeWidth="2" />
              <circle cx="0" cy="0" r="16" fill="#FFFFFF" stroke="#00629B" strokeWidth="2.2" />
              <line x1="-4" y1="-6" x2="4" y2="-6" stroke="#00629B" strokeWidth="2" />
              <line x1="0" y1="-10" x2="0" y2="-2" stroke="#00629B" strokeWidth="2" />
              <line x1="-4" y1="7" x2="4" y2="7" stroke="#00629B" strokeWidth="2" />
              <line x1="0" y1="16" x2="0" y2="30" stroke={strokeMain} strokeWidth="2" />
            </g>
          )}
        </g>

        {/* Interactive Clickable Terminal Pins (Click Pin A -> Click Pin B to wire!) */}
        {elPins.map((pin) => {
          const relX = pin.x - el.x;
          const relY = pin.y - el.y;
          const isPending =
            pendingPin?.elId === pin.elId && pendingPin?.pinRole === pin.pinRole;
          return (
            <g
              key={pin.pinRole}
              transform={`translate(${relX}, ${relY})`}
              onClick={(e) => handlePinClick(pin, e)}
              className="cursor-crosshair"
            >
              {/* Invisible larger hit target for easy clicking */}
              <circle cx="0" cy="0" r="8" fill="transparent" />
              <circle
                cx="0"
                cy="0"
                r={isPending ? 5.5 : 3.5}
                fill={isPending ? '#10B981' : pin.pinRole === 'gate' ? '#D97706' : '#00629B'}
                stroke="#FFFFFF"
                strokeWidth="1.2"
              />
            </g>
          );
        })}

        {/* Gate Net Label if Gate is an external input (vinp, vinn, vin) */}
        {(el.type === 'NMOS' || el.type === 'PMOS') && (
          <text
            x={el.mirrorX ? 37 : -37}
            y="-4"
            textAnchor={el.mirrorX ? 'start' : 'end'}
            fill="#059669"
            className="text-[8.5px] font-ieee-mono font-bold"
          >
            {el.node2}
          </text>
        )}

        {/* Component Name & Value Callout (always un-mirrored) */}
        <text
          x={el.horizontal ? 0 : labelSideX}
          y={el.horizontal ? -18 : -4}
          textAnchor={el.horizontal ? 'middle' : labelAnchor}
          fill="#0F172A"
          className="text-[10px] font-ieee-mono font-bold"
        >
          {el.horizontal ? `${el.name} (${el.param1})` : el.name}
        </text>
        {!el.horizontal && (
          <text
            x={labelSideX}
            y="9"
            textAnchor={labelAnchor}
            fill="#00629B"
            className="text-[9px] font-ieee-mono font-bold"
          >
            {el.type === 'NMOS' || el.type === 'PMOS'
              ? `${el.param1}/${el.param2}`
              : el.param1}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="my-7 border-2 border-[#00629B] bg-white text-slate-900 font-lab-ui">
      <div className="bg-[#00629B] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Grid className="w-5 h-5 shrink-0" />
          <div>
            <h3 className="font-bold text-sm sm:text-base leading-tight text-white">
              1. Interactive Schematic Capture &amp; Controllable Wire Router (IEEE Circuit Symbols)
            </h3>
            <p className="text-[11px] text-sky-100 mt-0.5">
              Drag symbols, drag wire bus handles (◆) to route wires without overlap, or click any two terminal pins to connect them
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setWireToolActive((prev) => !prev);
              setPendingPin(null);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border transition-colors cursor-pointer ${
              wireToolActive || pendingPin
                ? 'bg-amber-400 text-slate-950 border-amber-300'
                : 'bg-[#004B76] text-white border-sky-400/50 hover:bg-sky-800'
            }`}
          >
            <span>
              {pendingPin
                ? `Wiring from ${pendingPin.elName}.${pendingPin.pinRole} → Click Target Pin`
                : wireToolActive
                  ? '● Pin-to-Pin Wire Mode: ON'
                  : 'Pin-to-Pin Wire Tool'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleSimulateSchematic}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow cursor-pointer transition-colors"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Compile &amp; Simulate</span>
          </button>
        </div>
      </div>

      {/* Component Palette Toolbar */}
      <div className="bg-[#F8FAFC] border-b border-slate-300 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-bold text-slate-800 mr-1">Add IEEE Symbol:</span>
          {(
            [
              { type: 'NMOS', label: '+ NMOS (4-Term)' },
              { type: 'PMOS', label: '+ PMOS (4-Term)' },
              { type: 'R', label: '+ Resistor (R)' },
              { type: 'C', label: '+ Capacitor (C)' },
              { type: 'IDC', label: '+ Current Source (I)' },
              { type: 'VDC', label: '+ Voltage Source (V)' },
            ] as const
          ).map((btn) => (
            <button
              key={btn.type}
              type="button"
              onClick={() => addComponent(btn.type)}
              className="px-2.5 py-1 bg-white border border-slate-300 hover:border-[#00629B] text-[#00629B] font-bold cursor-pointer transition-colors"
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-600 font-semibold">Circuit Topology Presets:</span>
          <button
            type="button"
            onClick={() => loadTemplate('ota5t', 'm1')}
            className="px-2.5 py-1 bg-white border border-slate-300 hover:border-[#00629B] text-slate-800 font-semibold cursor-pointer"
          >
            5T Differential OTA
          </button>
          <button
            type="button"
            onClick={() => loadTemplate('opamp2stage', 'm6')}
            className="px-2.5 py-1 bg-white border border-slate-300 hover:border-[#00629B] text-slate-800 font-semibold cursor-pointer"
          >
            2-Stage Miller Op-Amp
          </button>
          <button
            type="button"
            onClick={() => loadTemplate('inverter_amp', 'mp')}
            className="px-2.5 py-1 bg-white border border-slate-300 hover:border-[#00629B] text-slate-800 font-semibold cursor-pointer"
          >
            CMOS Inverter Amp
          </button>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive SVG Schematic Grid Canvas with Controllable Wires & IEEE Symbols */}
        <div className="lg:col-span-8 border border-slate-300 bg-[#F8FAFC] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-2">
            <span className="font-bold text-slate-900">
              Drag any symbol, drag wire handles (◆ net) to adjust wire paths, or click any two terminal pins to connect them
            </span>
            <span className="font-ieee-mono text-slate-700">
              Symbols: {elements.length} · Nets: {activeSignalNets.length}
            </span>
          </div>

          <svg
            viewBox="0 0 680 330"
            onPointerMove={handleSvgPointerMove}
            onPointerUp={() => {
              setDraggingId(null);
              setDraggingWireNet(null);
            }}
            onPointerLeave={() => {
              setDraggingId(null);
              setDraggingWireNet(null);
            }}
            onClick={() => {
              if (pendingPin) setPendingPin(null);
            }}
            className="w-full h-auto bg-white border border-slate-300 select-none touch-none"
          >
            <defs>
              <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="#CBD5E1" />
              </pattern>
            </defs>
            <rect x="0" y="0" width="680" height="330" fill="url(#cadGrid)" />

            {/* Top VDD Reference Banner & Bottom Ground Reference Banner */}
            <line x1="25" y1="18" x2="655" y2="18" stroke="#00629B" strokeWidth="2" strokeDasharray="5,3" />
            <text x="34" y="13" fill="#00629B" className="text-[9.5px] font-ieee-mono font-bold">
              VDD Supply Plane (1.8V) — Top pins tied to &quot;vdd&quot; auto-render VDD T-bar
            </text>
            <line x1="25" y1="312" x2="655" y2="312" stroke="#334155" strokeWidth="2" strokeDasharray="5,3" />
            <text x="34" y="324" fill="#334155" className="text-[9.5px] font-ieee-mono font-bold">
              Ground Reference Plane (Node 0) — Bottom pins tied to &quot;0&quot; auto-render IEEE 3-Bar GND
            </text>

            {/* Controllable Orthogonal Signal Net Wires + Draggable Bus Handles */}
            {activeSignalNets.map(([netName, pins], idx) => {
              const geom = buildControllableNetGeometry(netName, pins);
              const isNetSelected = selectedNet === netName && inspectorMode === 'wire';
              const wireColor = isNetSelected
                ? '#00629B'
                : netName.includes('out')
                  ? '#059669'
                  : netName.includes('mir') || netName.includes('cc')
                    ? '#D97706'
                    : idx % 2 === 0
                      ? '#0284C7'
                      : '#0F766E';

              return (
                <g
                  key={netName}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNet(netName);
                    setInspectorMode('wire');
                  }}
                  className="cursor-pointer"
                >
                  {geom.segments.map((seg, sIdx) => (
                    <line
                      key={sIdx}
                      x1={seg.x1}
                      y1={seg.y1}
                      x2={seg.x2}
                      y2={seg.y2}
                      stroke={wireColor}
                      strokeWidth={isNetSelected ? 2.8 : 2.0}
                    />
                  ))}

                  {/* Solder Junction Dots */}
                  {geom.junctions.map((jPt, jIdx) => (
                    <circle
                      key={jIdx}
                      cx={jPt.x}
                      cy={jPt.y}
                      r="3.2"
                      fill={wireColor}
                    />
                  ))}

                  {/* Draggable Wire Bus Handle (Diamond + Net Badge) */}
                  <g
                    transform={`translate(${geom.handleX}, ${geom.handleY})`}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setSelectedNet(netName);
                      setInspectorMode('wire');
                      setDraggingWireNet(netName);
                    }}
                    className="cursor-ns-resize"
                  >
                    <polygon
                      points="0,-6 6,0 0,6 -6,0"
                      fill={isNetSelected ? '#00629B' : '#FFFFFF'}
                      stroke={wireColor}
                      strokeWidth="1.8"
                    />
                    <rect
                      x="8"
                      y="-8"
                      width={Math.max(28, netName.length * 6.2 + 8)}
                      height="14"
                      rx="2"
                      fill={isNetSelected ? '#EFF6FF' : '#FFFFFF'}
                      stroke={wireColor}
                      strokeWidth="1.1"
                    />
                    <text
                      x="11"
                      y="2"
                      fill={wireColor}
                      className="text-[8.5px] font-ieee-mono font-bold"
                    >
                      ◆ {netName}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Live Rubber-Band Orthogonal Wire Preview when Connecting Pin A -> Cursor */}
            {pendingPin && (
              <g>
                <polyline
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.2"
                  strokeDasharray="4,3"
                  points={`${pendingPin.x},${pendingPin.y} ${pendingPin.x},${pointerSvgPos.y} ${pointerSvgPos.x},${pointerSvgPos.y}`}
                />
                <circle cx={pendingPin.x} cy={pendingPin.y} r="5" fill="#10B981" />
                <circle cx={pointerSvgPos.x} cy={pointerSvgPos.y} r="4" fill="#10B981" />
              </g>
            )}

            {/* Rendered IEEE Electronic Circuit Symbols */}
            {elements.map((el) => {
              const isSel = el.id === selectedEl?.id && inspectorMode === 'symbol';
              return (
                <g
                  key={el.id}
                  transform={`translate(${el.x}, ${el.y})`}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setSelectedId(el.id);
                    setInspectorMode('symbol');
                    setDraggingId(el.id);
                  }}
                  className="cursor-grab active:cursor-grabbing"
                >
                  {renderCircuitSymbol(el, isSel)}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Right: Dual-Mode Inspector (Symbol Inspector OR Controllable Wire & Net Router) */}
        <div className="lg:col-span-4 border border-slate-300 bg-[#F8FAFC] p-4 space-y-3 text-xs">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-slate-200 p-1">
            <button
              type="button"
              onClick={() => setInspectorMode('symbol')}
              className={`py-1.5 font-bold cursor-pointer transition-colors ${
                inspectorMode === 'symbol'
                  ? 'bg-[#00629B] text-white'
                  : 'bg-white text-slate-800 hover:bg-slate-100'
              }`}
            >
              Symbol Inspector
            </button>
            <button
              type="button"
              onClick={() => {
                setInspectorMode('wire');
                if (!selectedNet && activeSignalNets[0]) {
                  setSelectedNet(activeSignalNets[0][0]);
                }
              }}
              className={`py-1.5 font-bold cursor-pointer transition-colors ${
                inspectorMode === 'wire'
                  ? 'bg-[#00629B] text-white'
                  : 'bg-white text-slate-800 hover:bg-slate-100'
              }`}
            >
              Wire &amp; Net Router ({activeSignalNets.length})
            </button>
          </div>

          {inspectorMode === 'symbol' && selectedEl && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                <span className="font-bold text-sm text-[#00629B]">
                  {selectedEl.name} ({selectedEl.type})
                </span>
                <div className="flex items-center gap-2">
                  {(selectedEl.type === 'NMOS' || selectedEl.type === 'PMOS') && (
                    <button
                      type="button"
                      onClick={() => updateSelected({ mirrorX: !selectedEl.mirrorX })}
                      className="px-2 py-0.5 bg-white border border-slate-300 hover:border-[#00629B] text-[#00629B] font-bold cursor-pointer"
                    >
                      Flip Gate L↔R
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={deleteSelected}
                    className="inline-flex items-center gap-1 text-red-700 hover:text-red-900 font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Instance Name</label>
                  <input
                    type="text"
                    value={selectedEl.name}
                    onChange={(e) => updateSelected({ name: e.target.value })}
                    className="w-full bg-white border border-slate-300 px-2.5 py-1.5 font-ieee-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    {selectedEl.type === 'NMOS' || selectedEl.type === 'PMOS'
                      ? 'Width W (e.g. 18u)'
                      : 'Value (e.g. 2p, 50u)'}
                  </label>
                  <input
                    type="text"
                    value={selectedEl.param1}
                    onChange={(e) => updateSelected({ param1: e.target.value })}
                    className="w-full bg-white border border-slate-300 px-2.5 py-1.5 font-ieee-mono text-slate-900"
                  />
                </div>
              </div>

              {(selectedEl.type === 'NMOS' || selectedEl.type === 'PMOS') && (
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Channel Length L (e.g. 0.45u)
                  </label>
                  <input
                    type="text"
                    value={selectedEl.param2 || '0.36u'}
                    onChange={(e) => updateSelected({ param2: e.target.value })}
                    className="w-full bg-white border border-slate-300 px-2.5 py-1.5 font-ieee-mono text-slate-900"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    {selectedEl.type === 'NMOS' || selectedEl.type === 'PMOS'
                      ? 'Drain Net'
                      : 'Positive Net'}
                  </label>
                  <input
                    type="text"
                    value={selectedEl.node1}
                    onChange={(e) => updateSelected({ node1: e.target.value })}
                    className="w-full bg-white border border-slate-300 px-2.5 py-1.5 font-ieee-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    {selectedEl.type === 'NMOS' || selectedEl.type === 'PMOS'
                      ? 'Gate Net'
                      : 'Negative Net'}
                  </label>
                  <input
                    type="text"
                    value={selectedEl.node2}
                    onChange={(e) => updateSelected({ node2: e.target.value })}
                    className="w-full bg-white border border-slate-300 px-2.5 py-1.5 font-ieee-mono text-slate-900"
                  />
                </div>
              </div>

              {(selectedEl.type === 'NMOS' || selectedEl.type === 'PMOS') && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Source Net</label>
                    <input
                      type="text"
                      value={selectedEl.node3 || '0'}
                      onChange={(e) => updateSelected({ node3: e.target.value })}
                      className="w-full bg-white border border-slate-300 px-2.5 py-1.5 font-ieee-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">Bulk Net</label>
                    <input
                      type="text"
                      value={selectedEl.node4 || '0'}
                      onChange={(e) => updateSelected({ node4: e.target.value })}
                      className="w-full bg-white border border-slate-300 px-2.5 py-1.5 font-ieee-mono text-slate-900"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Canvas X: {selectedEl.x}</label>
                  <input
                    type="range"
                    min={60}
                    max={620}
                    step={10}
                    value={selectedEl.x}
                    onChange={(e) => updateSelected({ x: parseInt(e.target.value, 10) })}
                    className="w-full accent-[#00629B]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Canvas Y: {selectedEl.y}</label>
                  <input
                    type="range"
                    min={55}
                    max={270}
                    step={10}
                    value={selectedEl.y}
                    onChange={(e) => updateSelected({ y: parseInt(e.target.value, 10) })}
                    className="w-full accent-[#00629B]"
                  />
                </div>
              </div>
            </div>
          )}

          {inspectorMode === 'wire' && (
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  Select Signal Net to Route / Control:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {activeSignalNets.map(([nName]) => (
                    <button
                      key={nName}
                      type="button"
                      onClick={() => setSelectedNet(nName)}
                      className={`px-2.5 py-1 font-ieee-mono font-bold border cursor-pointer ${
                        selectedNet === nName
                          ? 'bg-[#00629B] text-white border-[#00629B]'
                          : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      ◆ {nName}
                    </button>
                  ))}
                </div>
              </div>

              {selectedNet && (
                <div className="border-t border-slate-300 pt-2.5 space-y-2.5">
                  <div className="font-bold text-[#00629B]">
                    Controlling Wire Net: &quot;{selectedNet}&quot;
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Wire Routing Topology:
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {(
                        [
                          { id: 'horizontal_bus', label: 'H-Bus Trunk' },
                          { id: 'vertical_bus', label: 'V-Bus Trunk' },
                          { id: 'direct_l', label: 'L-Elbow' },
                        ] as const
                      ).map((rt) => {
                        const curStyle =
                          netRoutes[selectedNet]?.routingStyle || 'horizontal_bus';
                        return (
                          <button
                            key={rt.id}
                            type="button"
                            onClick={() =>
                              setNetRoutes((prev) => ({
                                ...prev,
                                [selectedNet]: {
                                  busY: prev[selectedNet]?.busY ?? 150,
                                  busX: prev[selectedNet]?.busX ?? 300,
                                  routingStyle: rt.id,
                                },
                              }))
                            }
                            className={`py-1 px-1.5 border font-semibold cursor-pointer text-[11px] ${
                              curStyle === rt.id
                                ? 'bg-[#00629B] text-white border-[#00629B]'
                                : 'bg-white text-slate-800 border-slate-300'
                            }`}
                          >
                            {rt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold text-slate-800 mb-1">
                      <span>Wire Bus Y Position (Drag ◆ on canvas)</span>
                      <span className="font-ieee-mono font-bold text-[#00629B]">
                        Y = {netRoutes[selectedNet]?.busY ?? 150}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={30}
                      max={295}
                      step={5}
                      value={netRoutes[selectedNet]?.busY ?? 150}
                      onChange={(e) => {
                        const yVal = Number(e.target.value);
                        setNetRoutes((prev) => ({
                          ...prev,
                          [selectedNet]: {
                            routingStyle: prev[selectedNet]?.routingStyle || 'horizontal_bus',
                            busX: prev[selectedNet]?.busX ?? 300,
                            busY: yVal,
                          },
                        }));
                      }}
                      className="w-full accent-[#00629B]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold text-slate-800 mb-1">
                      <span>Wire Bus X Position (for V-Bus)</span>
                      <span className="font-ieee-mono font-bold text-[#00629B]">
                        X = {netRoutes[selectedNet]?.busX ?? 300}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={40}
                      max={640}
                      step={5}
                      value={netRoutes[selectedNet]?.busX ?? 300}
                      onChange={(e) => {
                        const xVal = Number(e.target.value);
                        setNetRoutes((prev) => ({
                          ...prev,
                          [selectedNet]: {
                            routingStyle: prev[selectedNet]?.routingStyle || 'vertical_bus',
                            busY: prev[selectedNet]?.busY ?? 150,
                            busX: xVal,
                          },
                        }));
                      }}
                      className="w-full accent-[#00629B]"
                    />
                  </div>

                  <div className="bg-white border border-slate-300 p-2.5">
                    <div className="font-bold text-slate-800 mb-1.5">
                      Connected Pins on &quot;{selectedNet}&quot;:
                    </div>
                    <div className="space-y-1">
                      {(
                        activeSignalNets.find(([n]) => n === selectedNet)?.[1] || []
                      ).map((pin, pIdx) => (
                        <div
                          key={pIdx}
                          className="flex items-center justify-between font-ieee-mono text-[11px] bg-slate-50 px-2 py-1 border border-slate-200"
                        >
                          <span>
                            {pin.elName}.{pin.pinRole} ({pin.x}, {pin.y})
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              // Disconnect pin to an isolated net
                              setElements((prev) =>
                                prev.map((el) =>
                                  el.id === pin.elId
                                    ? {
                                        ...el,
                                        [pin.nodeProp]: `nc_${pin.elName.toLowerCase()}_${pin.pinRole}`,
                                      }
                                    : el
                                )
                              );
                            }}
                            className="text-red-700 hover:underline font-sans font-bold cursor-pointer"
                          >
                            Disconnect
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Live SPICE Simulation Readout (.meas Cards + .ac / .op / .tran / .dc Waveform Tabs) */}
      <div className="px-5 pb-5 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
          {simOutput.measResults.map((m, i) => (
            <div key={i} className="bg-[#F8FAFC] border border-slate-300 p-2.5">
              <div className="text-[10px] font-bold uppercase text-slate-600">{m.name}</div>
              <div className="font-ieee-mono font-bold text-sm text-[#00629B] mt-0.5">
                {m.valueStr}
              </div>
            </div>
          ))}
        </div>

        {/* Simulation Waveform & Netlist Tabs */}
        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 border border-slate-300 text-xs">
          {(
            [
              { id: 'ac_bode', label: '.ac Bode Plot (Mag & Phase)' },
              { id: 'op_table', label: '.op Transistor Operating Points' },
              { id: 'tran_wave', label: '.tran Step & Slew Response' },
              { id: 'dc_sweep', label: '.dc Transfer Curve' },
              { id: 'netlist_code', label: 'Compiled SPICE Netlist (.cir)' },
            ] as { id: SimViewTab; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveSimTab(t.id)}
              className={`px-3 py-1.5 font-semibold transition-colors cursor-pointer ${
                activeSimTab === t.id
                  ? 'bg-[#00629B] text-white'
                  : 'bg-white text-slate-800 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeSimTab === 'ac_bode' && (
          <div className="border border-slate-300 bg-[#F8FAFC] p-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-slate-900">
                AC Small-Signal Frequency Response — Magnitude (dB) &amp; Phase (°)
              </span>
              <span className="font-ieee-mono font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-2 py-0.5">
                PM = {simOutput.measResults[2]?.valueStr}
              </span>
            </div>
            <svg viewBox="0 0 430 315" className="w-full max-w-3xl mx-auto h-auto bg-white border border-slate-300">
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
              <line x1="55" y1="25" x2="55" y2="165" stroke="#334155" strokeWidth="1.5" />
              <line x1="55" y1="165" x2="410" y2="165" stroke="#334155" strokeWidth="1.5" />
              <line x1="55" y1="190" x2="55" y2="290" stroke="#334155" strokeWidth="1.5" />
              <line x1="55" y1="290" x2="410" y2="290" stroke="#334155" strokeWidth="1.5" />
              <polyline fill="none" stroke="#00629B" strokeWidth="2.5" points={magPolyline} />
              <polyline fill="none" stroke="#D97706" strokeWidth="2.2" points={phasePolyline} />
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

        {activeSimTab === 'op_table' && (
          <div className="border border-slate-300 bg-white overflow-x-auto">
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
                {simOutput.transistorOps.map((t, i) => (
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

        {activeSimTab === 'tran_wave' && (
          <div className="border border-slate-300 bg-[#F8FAFC] p-4">
            <svg viewBox="0 0 430 245" className="w-full max-w-3xl mx-auto h-auto bg-white border border-slate-300">
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
                {simOutput.tranResponse.xLabel} (0 → {tranPlot.xMax.toFixed(0)} ns)
              </text>
            </svg>
          </div>
        )}

        {activeSimTab === 'dc_sweep' && (
          <div className="border border-slate-300 bg-[#F8FAFC] p-4">
            <svg viewBox="0 0 430 245" className="w-full max-w-3xl mx-auto h-auto bg-white border border-slate-300">
              <line x1="60" y1="25" x2="60" y2="210" stroke="#334155" strokeWidth="1.5" />
              <line x1="60" y1="210" x2="410" y2="210" stroke="#334155" strokeWidth="1.5" />
              <polyline fill="none" stroke="#00629B" strokeWidth="2.6" points={dcPlot.prim} />
              <text x="52" y="35" textAnchor="end" fill="#0F172A" className="text-[9px] font-ieee-mono">
                {dcPlot.yMax.toFixed(3)}V
              </text>
              <text x="52" y="210" textAnchor="end" fill="#0F172A" className="text-[9px] font-ieee-mono">
                {dcPlot.yMin.toFixed(3)}V
              </text>
              <text x="235" y="232" textAnchor="middle" fill="#0F172A" className="text-[10px] font-bold">
                {simOutput.dcSweep.xLabel} ({dcPlot.xMin} → {dcPlot.xMax})
              </text>
            </svg>
          </div>
        )}

        {activeSimTab === 'netlist_code' && (
          <SpiceNetlistBox
            title="Auto-Compiled SPICE Netlist from Schematic Canvas"
            filename="captured_schematic.cir"
            netlist={compiledNetlist}
          />
        )}
      </div>
    </div>
  );
};

/* ============================================================================
 * FEATURE 2: INTERACTIVE 27-CORNER PVT & 200-RUN MONTE CARLO YIELD VISUALIZER
 * ============================================================================ */
export const PvtAndMonteCarloVisualizer: React.FC = () => {
  const [w1Um, setW1Um] = useState<number>(20);
  const [l1Um, setL1Um] = useState<number>(0.5);
  const [avthMvUm, setAvthMvUm] = useState<number>(5.0);
  const [abetaPctUm, setAbetaPctUm] = useState<number>(1.0);
  const [gmId1, setGmId1] = useState<number>(15);
  const [mcSeed, setMcSeed] = useState<number>(1);

  const areaUm2 = w1Um * l1Um;
  const sigmaVthMv = avthMvUm / Math.sqrt(Math.max(0.1, areaUm2));
  const sigmaBetaPct = abetaPctUm / Math.sqrt(Math.max(0.1, areaUm2));
  // Total input-referred offset 1-sigma including current-mirror load mismatch contribution (~1.35x)
  const sigmaVosMv = Math.sqrt(
    Math.pow(sigmaVthMv, 2) + Math.pow((sigmaBetaPct / 100) * (1000 / gmId1), 2)
  ) * 1.35;

  // Deterministic Box-Muller 200-run Monte Carlo histogram generator
  const { bins, samplesStats, pvtRows } = useMemo(() => {
    const samples: number[] = [];
    for (let i = 1; i <= 200; i++) {
      // Pseudo-random uniform u1, u2 in (0,1)
      const u1 = Math.max(1e-4, ((Math.sin(i * 12.9898 + mcSeed * 78.233) * 43758.5453) % 1 + 1) % 1);
      const u2 = Math.max(1e-4, ((Math.cos(i * 39.346 + mcSeed * 19.17) * 23421.631) % 1 + 1) % 1);
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      samples.push(z * sigmaVosMv);
    }

    const numBins = 15;
    const maxRange = Math.max(3.5 * sigmaVosMv, 2.0);
    const binCounts = new Array(numBins).fill(0);
    samples.forEach((val) => {
      const norm = (val + maxRange) / (2 * maxRange);
      const bIdx = Math.min(numBins - 1, Math.max(0, Math.floor(norm * numBins)));
      binCounts[bIdx]++;
    });

    const maxBinCount = Math.max(1, ...binCounts);
    const histBins = binCounts.map((count, idx) => {
      const centerMv = -maxRange + ((idx + 0.5) / numBins) * (2 * maxRange);
      return { centerMv, count, heightPct: (count / maxBinCount) * 100 };
    });

    const passCount = samples.filter((s) => Math.abs(s) <= 5.0).length; // Spec: |Vos| <= 5mV

    // Representative key corners from the 27-corner PVT matrix
    const corners = [
      { name: 'TT · 1.80V · 27°C (Nominal)', avDb: 74.2, gbwMhz: 52.4, pmDeg: 67.5, vdsMarginMv: 145 },
      { name: 'SS · 1.62V · 125°C (Slow / High-T)', avDb: 76.8, gbwMhz: 41.2, pmDeg: 70.1, vdsMarginMv: 92 },
      { name: 'FF · 1.98V · -40°C (Fast / Cold)', avDb: 70.4, gbwMhz: 66.8, pmDeg: 61.8, vdsMarginMv: 170 },
      { name: 'FS · 1.62V · -40°C (Skewed N-Fast)', avDb: 72.1, gbwMhz: 54.0, pmDeg: 64.2, vdsMarginMv: 84 },
      { name: 'SF · 1.98V · 125°C (Skewed P-Fast)', avDb: 73.0, gbwMhz: 46.5, pmDeg: 65.9, vdsMarginMv: 110 },
    ];

    return {
      bins: histBins,
      samplesStats: {
        meanMv: (samples.reduce((a, b) => a + b, 0) / samples.length).toFixed(2),
        threeSigmaMv: (3 * sigmaVosMv).toFixed(2),
        yieldPct: ((passCount / 200) * 100).toFixed(1),
      },
      pvtRows: corners,
    };
  }, [sigmaVosMv, mcSeed]);

  return (
    <div className="my-7 border-2 border-[#00629B] bg-white text-slate-900 font-lab-ui">
      <div className="bg-[#00629B] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="w-5 h-5 shrink-0" />
          <div>
            <h3 className="font-bold text-sm sm:text-base leading-tight text-white">
              2. Interactive 27-Corner PVT &amp; 200-Run Monte Carlo Mismatch Yield Visualizer
            </h3>
            <p className="text-[11px] text-sky-100 mt-0.5">
              Simulate Pelgrom’s Law (<InlineMath math="\sigma(\Delta V_{th}) = A_{Vth}/\sqrt{WL}" />) statistical offset histograms and worst-case PVT corners
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMcSeed((s) => s + 1)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-[#00629B] text-xs font-bold cursor-pointer hover:bg-sky-50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Re-Run 200 Monte Carlo Samples</span>
        </button>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Pelgrom Sizing & Mismatch Controls */}
        <div className="lg:col-span-5 border border-slate-300 bg-[#F8FAFC] p-4 space-y-3.5 text-xs">
          <div className="font-bold text-sm text-slate-900 border-b border-slate-300 pb-2">
            Differential Pair Geometry &amp; Pelgrom Constants
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="font-semibold">Input Pair Width W₁:</span>
              <span className="font-ieee-mono font-bold text-[#00629B]">{w1Um} μm</span>
            </div>
            <input
              type="range"
              min={2}
              max={80}
              step={2}
              value={w1Um}
              onChange={(e) => setW1Um(parseFloat(e.target.value))}
              className="w-full accent-[#00629B]"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="font-semibold">Input Pair Length L₁:</span>
              <span className="font-ieee-mono font-bold text-[#00629B]">{l1Um.toFixed(2)} μm</span>
            </div>
            <input
              type="range"
              min={0.18}
              max={2.0}
              step={0.06}
              value={l1Um}
              onChange={(e) => setL1Um(parseFloat(e.target.value))}
              className="w-full accent-[#00629B]"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="font-semibold">Pelgrom Constant A_Vth:</span>
              <span className="font-ieee-mono font-bold text-[#00629B]">{avthMvUm.toFixed(1)} mV·μm</span>
            </div>
            <input
              type="range"
              min={2.0}
              max={10.0}
              step={0.5}
              value={avthMvUm}
              onChange={(e) => setAvthMvUm(parseFloat(e.target.value))}
              className="w-full accent-[#00629B]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-200 font-ieee-mono">
            <div className="bg-white border border-slate-300 p-2.5">
              <div className="text-[10px] font-sans text-slate-600">Gate Area W₁·L₁</div>
              <div className="text-sm font-bold text-slate-900">{areaUm2.toFixed(2)} μm²</div>
            </div>
            <div className="bg-white border border-slate-300 p-2.5">
              <div className="text-[10px] font-sans text-slate-600">1σ Offset σ(V_OS)</div>
              <div className="text-sm font-bold text-[#00629B]">{sigmaVosMv.toFixed(2)} mV</div>
            </div>
            <div className="bg-white border border-slate-300 p-2.5">
              <div className="text-[10px] font-sans text-slate-600">3σ Worst Offset</div>
              <div className="text-sm font-bold text-amber-900">±{samplesStats.threeSigmaMv} mV</div>
            </div>
            <div className="bg-white border border-slate-300 p-2.5">
              <div className="text-[10px] font-sans text-slate-600">Yield (|V_OS| ≤ 5mV)</div>
              <div className="text-sm font-bold text-emerald-800">{samplesStats.yieldPct}%</div>
            </div>
          </div>
        </div>

        {/* Right: 200-Sample Monte Carlo Gaussian Histogram SVG */}
        <div className="lg:col-span-7 border border-slate-300 bg-[#F8FAFC] p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900">
              200-Run Monte Carlo Input-Referred Offset Voltage (<InlineMath math="V_{OS}" />) Distribution
            </span>
            <span className="font-ieee-mono text-xs font-bold text-[#00629B]">
              Run #{mcSeed} · N = 200 Dies
            </span>
          </div>

          <svg viewBox="0 0 440 210" className="w-full h-auto bg-white border border-slate-300">
            <line x1="45" y1="20" x2="45" y2="175" stroke="#334155" strokeWidth="1.5" />
            <line x1="45" y1="175" x2="415" y2="175" stroke="#334155" strokeWidth="1.5" />

            {bins.map((b, i) => {
              const bw = 350 / bins.length;
              const x = 52 + i * bw;
              const h = (b.heightPct / 100) * 135;
              const y = 175 - h;
              const withinSpec = Math.abs(b.centerMv) <= 5.0;
              return (
                <g key={i}>
                  <rect
                    x={x + 1}
                    y={y}
                    width={bw - 3}
                    height={Math.max(1, h)}
                    fill={withinSpec ? '#00629B' : '#DC2626'}
                    opacity="0.88"
                  />
                  {i % 3 === 0 && (
                    <text
                      x={x + bw / 2}
                      y="190"
                      textAnchor="middle"
                      fill="#0F172A"
                      className="text-[9px] font-ieee-mono"
                    >
                      {b.centerMv.toFixed(1)}
                    </text>
                  )}
                </g>
              );
            })}
            <text x="230" y="205" textAnchor="middle" fill="#0F172A" className="text-[10px] font-bold">
              Input-Referred Offset Voltage V_OS (mV) [Blue = Pass ≤ ±5mV, Red = Tail Outlier]
            </text>
          </svg>

          {/* 27-Corner Extreme PVT Summary Table */}
          <div className="overflow-x-auto border border-slate-300 bg-white">
            <table className="w-full text-left border-collapse text-xs text-slate-900 font-ieee-mono">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 font-sans">
                  <th className="py-2 px-2.5">PVT Corner</th>
                  <th className="py-2 px-2.5">DC Gain</th>
                  <th className="py-2 px-2.5">GBW</th>
                  <th className="py-2 px-2.5">PM</th>
                  <th className="py-2 px-2.5">V_ds - V_dsat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pvtRows.map((r, idx) => (
                  <tr key={idx}>
                    <td className="py-1.5 px-2.5 font-sans font-semibold text-slate-900">{r.name}</td>
                    <td className="py-1.5 px-2.5">{r.avDb} dB</td>
                    <td className="py-1.5 px-2.5 text-[#00629B] font-bold">{r.gbwMhz} MHz</td>
                    <td className="py-1.5 px-2.5">{r.pmDeg}°</td>
                    <td className="py-1.5 px-2.5 text-emerald-900 font-bold">+{r.vdsMarginMv} mV</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * FEATURE 3: INTERACTIVE COMMON-CENTROID & INTERDIGITATED CMOS LAYOUT GENERATOR
 * ============================================================================ */
export const CommonCentroidLayoutGenerator: React.FC = () => {
  const [pattern, setPattern] = useState<'ABBA' | 'ABAB' | 'QUAD_2D'>('ABBA');
  const [totalWUm, setTotalWUm] = useState<number>(32);
  const [lengthUm, setLengthUm] = useState<number>(0.5);
  const [includeDummies, setIncludeDummies] = useState<boolean>(true);
  const [includeGuardRing, setIncludeGuardRing] = useState<boolean>(true);

  const fingersPerDevice = 4;
  const fingerWidthUm = totalWUm / fingersPerDevice;

  const sequence1D =
    pattern === 'ABBA'
      ? ['A', 'B', 'B', 'A', 'A', 'B', 'B', 'A']
      : ['A', 'B', 'A', 'B', 'A', 'B', 'A', 'B'];

  const fullFingers = includeDummies ? ['D', ...sequence1D, 'D'] : sequence1D;

  // Compute post-layout parasitic junction capacitance & diffusion sharing savings
  const cjAreaFfPerUm2 = 0.95; // fF/um^2
  const cjswFfPerUm = 0.28; // fF/um sidewall
  const drainLengthUm = 0.48; // shared S/D contact strip width
  const unsharedJunctionArea = fingersPerDevice * fingerWidthUm * drainLengthUm;
  const sharedJunctionArea = unsharedJunctionArea * 0.56; // 44% S/D junction reduction via finger sharing
  const cdbTotalFf = sharedJunctionArea * cjAreaFfPerUm2 + 2 * fingerWidthUm * cjswFfPerUm;
  const rgateOhm = (12.0 * (fingerWidthUm / lengthUm)) / (3 * fingersPerDevice * fingersPerDevice);

  return (
    <div className="my-7 border-2 border-[#00629B] bg-white text-slate-900 font-lab-ui">
      <div className="bg-[#00629B] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Layers className="w-5 h-5 shrink-0" />
          <div>
            <h3 className="font-bold text-sm sm:text-base leading-tight text-white">
              3. Interactive Common-Centroid &amp; Interdigitated CMOS Stick-Layout Generator
            </h3>
            <p className="text-[11px] text-sky-100 mt-0.5">
              Visualize matched differential-pair finger placement, dummy poly gates, guard rings, and extracted post-layout parasitics
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Layout Controls & Extracted Parasitics */}
        <div className="lg:col-span-5 border border-slate-300 bg-[#F8FAFC] p-4 space-y-3.5 text-xs">
          <div className="font-bold text-sm text-slate-900 border-b border-slate-300 pb-2">
            Matched Differential Pair (M₁ = A, M₂ = B) Layout Configuration
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-800">Symmetry Topology:</label>
            <div className="grid grid-cols-1 gap-1.5">
              {(
                [
                  { id: 'ABBA', label: '1D Common-Centroid (A B B A · A B B A) — Cancels Linear X-Gradient' },
                  { id: 'ABAB', label: '1D Interdigitated (A B A B · A B A B) — Minimum Routing Overhead' },
                  { id: 'QUAD_2D', label: '2D Cross-Coupled Common-Centroid Quad — Cancels X & Y Gradients' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPattern(opt.id)}
                  className={`text-left px-3 py-2 border font-semibold cursor-pointer ${
                    pattern === opt.id
                      ? 'bg-[#00629B] border-[#00629B] text-white'
                      : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="font-semibold">Total Width W per Device (4 Fingers):</span>
              <span className="font-ieee-mono font-bold text-[#00629B]">
                {totalWUm} μm ({fingerWidthUm.toFixed(1)} μm/finger)
              </span>
            </div>
            <input
              type="range"
              min={8}
              max={80}
              step={4}
              value={totalWUm}
              onChange={(e) => setTotalWUm(parseFloat(e.target.value))}
              className="w-full accent-[#00629B]"
            />
          </div>

          <div className="flex items-center gap-4 pt-1">
            <label className="inline-flex items-center gap-1.5 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={includeDummies}
                onChange={(e) => setIncludeDummies(e.target.checked)}
                className="accent-[#00629B]"
              />
              <span>Add Dummy Poly Ends (STI Stress Match)</span>
            </label>
            <label className="inline-flex items-center gap-1.5 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={includeGuardRing}
                onChange={(e) => setIncludeGuardRing(e.target.checked)}
                className="accent-[#00629B]"
              />
              <span>P+ Guard Ring</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-200 font-ieee-mono">
            <div className="bg-white border border-slate-300 p-2.5">
              <div className="text-[10px] font-sans text-slate-600">Extracted Drain Cap C_db</div>
              <div className="text-sm font-bold text-[#00629B]">{cdbTotalFf.toFixed(1)} fF</div>
            </div>
            <div className="bg-white border border-slate-300 p-2.5">
              <div className="text-[10px] font-sans text-slate-600">Multi-Finger Gate R_g</div>
              <div className="text-sm font-bold text-emerald-800">{rgateOhm.toFixed(1)} Ω</div>
            </div>
          </div>
        </div>

        {/* Right: Multi-Layer Physical Mask / Stick Diagram SVG */}
        <div className="lg:col-span-7 border border-slate-300 bg-[#F8FAFC] p-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between text-xs gap-2">
            <span className="font-bold text-slate-900">
              Physical Mask Stick Diagram — Center of Gravity (M₁) = Center of Gravity (M₂)
            </span>
            <div className="flex items-center gap-3 text-[11px] font-semibold">
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 bg-emerald-200 border border-emerald-600 inline-block" /> Active OD
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 bg-sky-600 inline-block" /> M₁ (A) Poly
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 bg-amber-600 inline-block" /> M₂ (B) Poly
              </span>
            </div>
          </div>

          <svg viewBox="0 0 500 240" className="w-full h-auto bg-white border border-slate-300">
            {/* Optional Outer P+ Substrate Guard Ring */}
            {includeGuardRing && (
              <g>
                <rect
                  x="15"
                  y="15"
                  width="470"
                  height="210"
                  fill="none"
                  stroke="#94A3B8"
                  strokeWidth="8"
                  strokeDasharray="6,3"
                />
                <text x="250" y="28" textAnchor="middle" fill="#475569" className="text-[9px] font-ieee-mono font-bold">
                  P+ Substrate Guard Ring (Tied to VSS / GND for Substrate Noise Isolation)
                </text>
              </g>
            )}

            {/* Continuous Shared Active Diffusion (OD) */}
            <rect
              x="45"
              y="62"
              width="410"
              height="116"
              fill="#D1FAE5"
              stroke="#059669"
              strokeWidth="2"
            />

            {/* Poly Fingers */}
            {fullFingers.map((tag, idx) => {
              const spacing = 370 / fullFingers.length;
              const x = 65 + idx * spacing;
              const isDummy = tag === 'D';
              const isA = tag === 'A';
              const fillCol = isDummy ? '#64748B' : isA ? '#00629B' : '#D97706';

              return (
                <g key={idx}>
                  <rect
                    x={x}
                    y="44"
                    width="18"
                    height="152"
                    fill={fillCol}
                    stroke="#0F172A"
                    strokeWidth="1.2"
                  />
                  <text
                    x={x + 9}
                    y="124"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    className="text-[10px] font-ieee-mono font-bold"
                  >
                    {tag}
                  </text>
                  {/* Shared Source/Drain Contact Via between fingers */}
                  <circle cx={x - 9} cy="120" r="3.2" fill="#1E293B" />
                </g>
              );
            })}

            {/* Common Centroid Axis Marker */}
            <line x1="250" y1="35" x2="250" y2="205" stroke="#DC2626" strokeWidth="1.5" strokeDasharray="4,3" />
            <text x="250" y="216" textAnchor="middle" fill="#B91C1C" className="text-[10px] font-bold">
              Common Centroid Axis (X_CM,A = X_CM,B)
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * FEATURE 5: NOISE SPECTRAL DENSITY (1/f FLICKER + THERMAL) & RMS CALCULATOR
 * ============================================================================ */
export const NoiseSpectralAnalyzer: React.FC = () => {
  const [gm1Us, setGm1Us] = useState<number>(600);
  const [gm3Us, setGm3Us] = useState<number>(300);
  const [w1Um, setW1Um] = useState<number>(24);
  const [l1Um, setL1Um] = useState<number>(0.5);
  const [inputType, setInputType] = useState<'NMOS' | 'PMOS'>('NMOS');
  const [bwMhz, setBwMhz] = useState<number>(40);

  // Physical constants at T = 300 K
  const fourKT = 1.656e-20; // 4 * k * T [J]
  const gamma = 0.85;
  const cox = 8.4e-3; // F/m^2

  // Thermal input-referred noise power spectral density [V^2 / Hz]
  const gm1S = gm1Us * 1e-6;
  const gm3S = gm3Us * 1e-6;
  const mirrorNoiseFactor = gm3S / Math.max(1e-6, gm1S);
  const svThermalV2Hz = ((8 * 1.38e-23 * 300 * gamma) / gm1S) * (1 + mirrorNoiseFactor);
  const vnThermalNvRtHz = Math.sqrt(svThermalV2Hz) * 1e9; // nV / sqrt(Hz)

  // 1/f Flicker noise at f = 1 Hz [V^2]
  const kf = inputType === 'PMOS' ? 2.5e-29 : 1.2e-28;
  const areaM2 = w1Um * l1Um * 1e-12;
  const svFlickerAt1Hz = (2 * kf) / (cox * areaM2) * (1 + Math.pow(mirrorNoiseFactor, 2) * 0.4);
  const cornerFreqHz = svFlickerAt1Hz / Math.max(1e-24, svThermalV2Hz);

  // Integrated total input-referred RMS noise from f_L = 10 Hz to f_H = (pi/2) * BW
  const fLow = 10;
  const fHigh = (Math.PI / 2) * bwMhz * 1e6;
  const vNoiseTotalSq =
    svThermalV2Hz * (fHigh - fLow) + svFlickerAt1Hz * Math.log(fHigh / fLow);
  const vnRmsUv = Math.sqrt(Math.max(0, vNoiseTotalSq)) * 1e6; // uV_rms

  const inputPairSharePct = Math.round((1 / (1 + mirrorNoiseFactor)) * 100);
  const loadMirrorSharePct = 100 - inputPairSharePct;

  // Build SVG Spectral Curve (1 Hz to 1 GHz)
  const noisePolyline = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 90; i++) {
      const logF = (i / 90) * 9; // 10^0 to 10^9 Hz
      const f = Math.pow(10, logF);
      const sv = svThermalV2Hz + svFlickerAt1Hz / f;
      const nvRtHz = Math.sqrt(sv) * 1e9;
      const logNv = Math.log10(Math.max(1, Math.min(10000, nvRtHz))); // 10^0 to 10^4 nV/rtHz
      const x = 55 + (logF / 9) * 355;
      const y = 195 - (logNv / 4) * 155;
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return pts.join(' ');
  }, [svThermalV2Hz, svFlickerAt1Hz]);

  const cornerLogF = Math.min(9, Math.max(0, Math.log10(Math.max(1, cornerFreqHz))));
  const cornerX = 55 + (cornerLogF / 9) * 355;

  return (
    <div className="my-7 border-2 border-[#00629B] bg-white text-slate-900 font-lab-ui">
      <div className="bg-[#00629B] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Activity className="w-5 h-5 shrink-0" />
          <div>
            <h3 className="font-bold text-sm sm:text-base leading-tight text-white">
              4. Input-Referred Noise Spectral Density (<InlineMath math="1/f" /> Flicker + Thermal) &amp; Integrated RMS Noise Calculator
            </h3>
            <p className="text-[11px] text-sky-100 mt-0.5">
              Analyze white thermal floor, <InlineMath math="1/f" /> corner frequency <InlineMath math="f_c" />, active-load noise penalty <InlineMath math="(g_{m3}/g_{m1})" />, and total integrated <InlineMath math="\mu\text{V}_{\text{rms}}" />
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Controls */}
        <div className="lg:col-span-5 border border-slate-300 bg-[#F8FAFC] p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-300 pb-2">
            <span className="font-bold text-sm text-slate-900">Amplifier Noise Parameters</span>
            <div className="flex gap-1">
              {(['NMOS', 'PMOS'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setInputType(t)}
                  className={`px-2 py-0.5 font-bold border cursor-pointer ${
                    inputType === t
                      ? 'bg-[#00629B] border-[#00629B] text-white'
                      : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  {t} Input
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="font-semibold">Input Pair Transconductance g_m1:</span>
              <span className="font-ieee-mono font-bold text-[#00629B]">{gm1Us} μS</span>
            </div>
            <input
              type="range"
              min={100}
              max={2000}
              step={50}
              value={gm1Us}
              onChange={(e) => setGm1Us(parseFloat(e.target.value))}
              className="w-full accent-[#00629B]"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="font-semibold">Active Load Transconductance g_m3:</span>
              <span className="font-ieee-mono font-bold text-[#00629B]">{gm3Us} μS</span>
            </div>
            <input
              type="range"
              min={50}
              max={1500}
              step={50}
              value={gm3Us}
              onChange={(e) => setGm3Us(parseFloat(e.target.value))}
              className="w-full accent-[#00629B]"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="font-semibold">Input Gate Area W₁ × L₁:</span>
              <span className="font-ieee-mono font-bold text-[#00629B]">
                {w1Um}μm × {l1Um}μm = {(w1Um * l1Um).toFixed(1)} μm²
              </span>
            </div>
            <input
              type="range"
              min={4}
              max={100}
              step={4}
              value={w1Um}
              onChange={(e) => setW1Um(parseFloat(e.target.value))}
              className="w-full accent-[#00629B]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-200 font-ieee-mono">
            <div className="bg-white border border-slate-300 p-2.5">
              <div className="text-[10px] font-sans text-slate-600">Thermal Noise Floor</div>
              <div className="text-sm font-bold text-[#00629B]">
                {vnThermalNvRtHz.toFixed(1)} nV/√Hz
              </div>
            </div>
            <div className="bg-white border border-slate-300 p-2.5">
              <div className="text-[10px] font-sans text-slate-600">1/f Corner Freq f_c</div>
              <div className="text-sm font-bold text-amber-900">
                {(cornerFreqHz / 1e3).toFixed(1)} kHz
              </div>
            </div>
            <div className="bg-white border border-slate-300 p-2.5">
              <div className="text-[10px] font-sans text-slate-600">Total Integrated RMS</div>
              <div className="text-sm font-bold text-emerald-900">{vnRmsUv.toFixed(1)} μV_rms</div>
            </div>
            <div className="bg-white border border-slate-300 p-2.5">
              <div className="text-[10px] font-sans text-slate-600">M₁,₂ vs. M₃,₄ Share</div>
              <div className="text-sm font-bold text-slate-900">
                {inputPairSharePct}% / {loadMirrorSharePct}%
              </div>
            </div>
          </div>
        </div>

        {/* Right: Log-Log Spectral Density Plot */}
        <div className="lg:col-span-7 border border-slate-300 bg-[#F8FAFC] p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900">
              Input-Referred Voltage Noise Spectral Density <InlineMath math="v_{n,\text{in}}(f)" /> [nV/√Hz]
            </span>
            <span className="font-ieee-mono text-xs font-bold text-[#00629B]">
              1 Hz → 1 GHz (Log-Log)
            </span>
          </div>

          <svg viewBox="0 0 435 230" className="w-full h-auto bg-white border border-slate-300">
            <line x1="55" y1="25" x2="55" y2="195" stroke="#334155" strokeWidth="1.5" />
            <line x1="55" y1="195" x2="410" y2="195" stroke="#334155" strokeWidth="1.5" />

            {/* 1/f Corner Frequency Vertical Marker */}
            <line
              x1={cornerX}
              y1="25"
              x2={cornerX}
              y2="195"
              stroke="#D97706"
              strokeWidth="1.5"
              strokeDasharray="4,3"
            />
            <text
              x={Math.min(365, Math.max(85, cornerX))}
              y="38"
              textAnchor="middle"
              fill="#B45309"
              className="text-[10px] font-ieee-mono font-bold"
            >
              1/f Corner f_c = {(cornerFreqHz / 1e3).toFixed(1)} kHz
            </text>

            <polyline fill="none" stroke="#00629B" strokeWidth="2.8" points={noisePolyline} />

            <text x="48" y="42" textAnchor="end" fill="#0F172A" className="text-[9px] font-ieee-mono">
              10⁴
            </text>
            <text x="48" y="118" textAnchor="end" fill="#0F172A" className="text-[9px] font-ieee-mono">
              10²
            </text>
            <text x="48" y="195" textAnchor="end" fill="#0F172A" className="text-[9px] font-ieee-mono">
              10⁰
            </text>
            <text x="232" y="216" textAnchor="middle" fill="#0F172A" className="text-[10px] font-bold">
              Frequency log₁₀(f) [1 Hz → 1 GHz] · Thermal Floor = {vnThermalNvRtHz.toFixed(1)} nV/√Hz
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
};
