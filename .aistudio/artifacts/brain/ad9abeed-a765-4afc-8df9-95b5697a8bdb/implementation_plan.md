# AnalogMaster: Zero to Analog IC Designer

An interactive, publication-grade educational platform and engineering workbench structured in the visual tradition of an *IEEE Journal of Solid-State Circuits (JSSC)* monograph. It takes engineers and students from foundational MOSFET device physics to systematic $g_m/I_D$ sizing, transistor-level OTA/Op-Amp/LDO/Bandgap design, SPICE verification, and modern AI/agentic circuit optimization.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and product choices have been confirmed from your answers and incorporated as core specifications:

- **Confirmed Decision 1 — Dual CMOS Process Node Baseline (`180nm` + `65nm` Toggle)**: All worked hand calculations, lookup curves, and interactive sizing calculators default to a well-characterized **180nm CMOS process ($V_{DD} = 1.8\text{ V}$)** matching open-source SKY130/GF180MCU intuition, while providing an instant **Process Node Toggle (`180nm / 1.8V` vs. `65nm / 1.2V`)** across calculators and $g_m/I_D$ lookup plots so learners can immediately observe short-channel effects, reduced intrinsic gain ($g_m r_o$), and supply headroom compression.
- **Confirmed Decision 2 — Dual-Placement Interactive Calculators & Sandboxes**: Interactive tools ($g_m/I_D$ sizing workbench, 5T OTA & Two-Stage Op-Amp calculators, Bode plot visualizer, BGR PTAT/CTAT temperature curve plotter, and MOSFET operating-region explorer) are **embedded inline** within their relevant curriculum modules for immediate learning reinforcement *and* aggregated in a central **Interactive Lab** navigation view for rapid design iteration.
- **Confirmed Decision 3 — Dynamic Calculator-Synced SPICE Netlists**: Every circuit module and the LTspice Beginner Guide feature **live, parameter-synced SPICE netlists** that dynamically reflect the $W/L$, bias currents, compensation capacitors, and nulling resistors computed in the calculators, complete with one-click clipboard copy and `.cir` / `.asc` file download.

---

## 1. Overview & Core Concept

- **What It Does**: Provides a rigorous, end-to-end curriculum and interactive CAD calculation environment covering 9 core Analog IC modules, an interactive symbol legend & schematic viewer, a complete EDA & LTspice practical guide, and a modern AI/ML + Autonomous Circuit Agent engineering track.
- **Target Audience**: Electrical engineering students, graduate researchers, and practicing circuit engineers who understand basic circuit theory and want to master industry-grade $g_m/I_D$ design methodology, stability compensation, PVT/Monte Carlo verification, and AI-assisted sizing workflows.
- **Key Value**: Bridges the gap between textbook equations (Razavi, Sansen, Murmann) and real SPICE/silicon verification by pairing rigorous derivations and numbered equations with live $g_m/I_D$ lookup engines, interactive SVG schematics with signal-flow hover states, and ready-to-run LTspice/ngspice netlists.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Roadmap & Dual-Track Learning Path (Home)**: Users land on an IEEE-styled monograph frontispiece featuring a structured **Beginner $\to$ Intermediate $\to$ Advanced $\to$ Expert** syllabus with estimated study hours, prerequisites, overall in-memory completion metrics, and a side-by-side **"Design Without AI (Classical $g_m/I_D$)" vs. "Design With AI (Bayesian/RL/Agentic)"** track comparison for every module.
2. **Deep-Dive Module Study (Modules 1–9)**: Selecting a module opens a two-column academic reading layout with a **sticky left Table of Contents** (`I.`, `II.`, `II-A`) and a main paper canvas containing:
   - *Abstract Box* & *Index Terms* at the top of the module.
   - *Concept & Theory* with KaTeX-rendered numbered equations `(1)`, `(2)` and inline academic citations `[1]`, `[2]`.
   - *Interactive SVG Schematic & Cross-Section Figures* (`Fig. 1`, `Fig. 2`) with toggleable DC bias annotations, small-signal overlays, and interactive hover highlighting of current paths and AC signal flow.
   - *Key Equations Summary Box* & *Common Mistakes Callout Box* (framed with clean hairline borders and explicit warning/verification iconography).
   - *Step-by-Step Hand Calculation $\to$ $g_m/I_D$ Sizing $\to$ Worked Numerical Example* with real unit tracking.
   - *Inline Interactive Calculator & Live SPICE Netlist Generator* synced to the worked example.
   - *Simulation Steps, Hand-Calc vs. Simulation Comparison Table, Mini-Project, Verification Checklist, and Self-Test Quiz* with instant grading and detailed physical explanations.
3. **Interactive Lab & Symbol Legend**: Users switch to the central **Interactive Lab** to run any of the 5 interactive engineering simulators side-by-side, or inspect the **Component Symbol Legend** (NMOS, PMOS, BJT, Resistor, Capacitor, Current Source, $V_{DD}$, GND) with terminal definitions and SPICE syntax.
4. **EDA Tools & LTspice Masterclass**: Step-by-step installation, PDK setup (SKY130, GF180MCU, BSIM4), `.op/.dc/.ac/.tran/.noise/.step/.temp` command cards, `.meas` scripts for automated spec extraction, and convergence troubleshooting.
5. **AI/ML in Analog & Build an AI Agent**: Deep technical breakdown of Bayesian Optimization, Evolutionary/PSO, Reinforcement Learning (`AutoCkt`, `GCN-RL`), GNN surrogates, and LLM topology generators, followed by a complete blueprint and downloadable Python implementation of a tool-calling **ngspice + $g_m/I_D$ Autonomous Sizing Agent**.

### Visual Identity & Theme (IEEE Solid-State Circuits Monograph)
- **Aesthetic Direction**: Authoritative academic publication meets precision scientific instrumentation. Crisp paper surface, scholarly serif body typography, clean hairline borders, and high-contrast technical schematics.
- **Color Palette & 60-30-10 Allocation**:
  - **60% Dominant Canvas**: Pure archival white (`#FFFFFF`) and subtle warm paper surface (`#F8FAFC`) for figure and abstract wells.
  - **30% Structural Surfaces & Ink**: Deep charcoal-ink body prose (`#111827`), muted academic slate metadata/captions (`#4B5563`), and crisp `1px solid` hairline dividers (`#E2E8F0`).
  - **10% Semantic & Institutional Accents**:
    - *Primary Institutional Accent*: **IEEE Blue (`#00629B`)** for Roman-numeral section headings, interactive controls, primary equations, and active navigation states.
    - *Signal & Operating Region Semantics* (always paired with explicit text labels and symbols, never color alone): Weak Inversion / Subthreshold (`#0284C7` Azure), Moderate Inversion Sweet-Spot (`#059669` Emerald), Strong Inversion (`#D97706` Amber), Saturation Violation / Pitfall Warning (`#DC2626` Crimson).
- **Typography & Hierarchy (2+1 Font System)**:
  - *Headings & Body Prose*: `'Source Serif 4'`, `'Lora'`, or Georgia/Times serif stack (`font-serif`) delivering authentic IEEE transactions legibility, generous `1.7` line-height, and `68ch–75ch` optimal reading measure.
  - *UI Controls, Figure Labels & Section Kickers*: Clean technical sans-serif (`'Plus Jakarta Sans'`) for compact control decks and axis labels.
  - *Equations, Netlists & Tabular Data*: **KaTeX** for mathematical typesetting and `'IBM Plex Mono'` (`font-mono tabular-nums`) for SPICE netlists, Python agent code, and hand-calc vs. simulation verification tables.
- **Top Navigation Bar Contract**:
  - Follows the strict single-row, three-zone layout:
    - **Zone 1 (Brand)**: `AnalogMaster` wordmark.
    - **Zone 2 (Primary Navigation)**: 5 single-line navigation links (`Curriculum`, `Interactive Lab`, `EDA & LTspice`, `AI & Agents`, `Resources & Legend`).
    - **Zone 3 (Primary Action)**: Single primary action button showing live curriculum mastery (`Progress & Quizzes`) that opens the interactive progress & checklist drawer.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Analytical Physics-Informed $g_m/I_D$ Engine in Pure TypeScript**:
  - *Chosen Approach*: Implement a continuous, physically accurate EKV/BSIM-calibrated analytical model for both `180nm` ($V_{DD}=1.8\text{V}, V_{th0}\approx 0.45\text{V}$) and `65nm` ($V_{DD}=1.2\text{V}, V_{th0}\approx 0.35\text{V}$) processes across weak, moderate, and strong inversion ($IC \in [0.01, 100]$).
  - *Why*: Enables instantaneous, smooth curve plotting for $g_m/I_D$ vs. $I_D/(W/L)$, $f_T$, $g_m r_o$, and $C_{gg}/I_D$ across different channel lengths ($L = L_{\min}$ to $10 L_{\min}$) without requiring a backend server.
- **Decision 2 — In-Memory Session State (Zero `localStorage`)**:
  - *Chosen Approach*: Manage all quiz responses, verification checklist completions, active module/section navigation, calculator parameters, and process node selections in a centralized React Context store in memory.
  - *Why*: Strictly honors the environment constraint requiring in-memory state with no `localStorage` or backend database while maintaining seamless state persistence as the user navigates across all modules and tools.
- **Decision 3 — Interactive Vector Schematics with Signal-Flow Inspection**:
  - *Chosen Approach*: Build custom, publication-grade inline SVG schematics with standard 4-terminal MOSFET symbols, current sources, and labeled nodes (`Vinp`, `Vinn`, `Vout`, `Vbias`, `Cc`, `Rz`). Hovering or clicking signal path toggles highlights the DC bias branch, AC small-signal path, or Miller feedback loop alongside a live tooltip showing node voltages and small-signal impedances.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                   App Root & In-Memory Mastery Context                        │
│  • Active View & Module Router   • Process Node State (180nm 1.8V | 65nm 1.2V)│
│  • Quiz Score & Answer Store     • Verification Checklist Progress Store      │
└───────────────┬───────────────────────────────┬───────────────────────────────┘
                │                               │
    ┌───────────▼───────────┐       ┌───────────▼───────────────────────────────┐
    │   Top Navigation Bar  │       │        Main Viewport Workspace            │
    │  (3-Zone IEEE Header) │       └───────────┬───────────────────────────────┘
    └───────────────────────┘                   │
        ┌───────────────────────────────────────┼───────────────────────────────┐
        ▼                                       ▼                               ▼
┌───────────────────────┐           ┌───────────────────────┐       ┌───────────────────────┐
│  1. Home & Roadmap    │           │ 2. Curriculum Modules │       │  3. Interactive Lab   │
│  • 4-Tier Syllabus    │           │    (Modules 1 to 9)   │       │  • gm/Id Workbench    │
│  • Classical vs AI    │           │  • Sticky Left TOC    │       │  • 5T OTA & 2-Stage   │
│    Track Comparison   │           │  • Abstract & KaTeX   │       │    Op-Amp Calculators │
│  • Progress Overview  │           │  • Interactive SVGs   │       │  • Bode Plot Sandbox  │
└───────────────────────┘           │  • Key Eq & Mistakes  │       │  • BGR Temp Plotter   │
                                    │  • Inline Calculator  │       │  • Vgs/Vds Explorer   │
        ┌───────────────────────────┤  • Live SPICE Netlist │       └───────────────────────┘
        ▼                           │  • Checklist & Quiz   │                   ▼
┌───────────────────────┐           └───────────────────────┘       ┌───────────────────────┐
│ 4. EDA & LTspice Guide│                                           │ 5. AI/ML & Agent Hub  │
│  • Tool Comparison    │                                           │  • BO / RL / GNN / LLM│
│  • LTspice Walkthrough│                                           │  • Autonomous Agent   │
│  • PDK & Model Setup  │                                           │    Architecture SVG   │
│  • .meas & Netlists   │                                           │  • Python + ngspice   │
└───────────────────────┘                                           │    Agent Code & Eval  │
                                                                    └───────────────────────┘
```

### Data Model & State
- **Process Characterization Engine**: Pre-computed and analytically interpolated lookup functions for `180nm` and `65nm` NMOS/PMOS devices returning $g_m/I_D$, $I_D/(W/L)$ current density, intrinsic gain $g_m r_o$, transit frequency $f_T$, and $C_{gg}/W$ as a function of Inversion Coefficient ($IC$) and channel length $L$.
- **Curriculum Repository (Modules 1–9)**:
  1. *Module 1 — Foundations*: Operating regions, $g_m, g_{ds}, r_o, C_{gs}, C_{gd}$, small-signal model, $g_m r_o$, $f_T$.
  2. *Module 2 — Design Methodology ($g_m/I_D$ & $C/I_D$)*: Square-law breakdown vs. $g_m/I_D$, weak/moderate/strong inversion, $IC$, tradeoffs, generating lookup charts in Cadence/LTspice/Python, $f_T \cdot (g_m/I_D)$ figure of merit, and $C_{gg}/I_D$ bandwidth sizing.
  3. *Module 3 — CMOS Inverter*: VTC, noise margins ($NM_H, NM_L$), switching threshold $V_M$, propagation delay, dynamic/short-circuit/leakage power, and bias-point operation as a high-gain analog amplifier.
  4. *Module 4 — 5-Transistor (5T) OTA*: Differential pair + current mirror load topology, $A_v = g_{m1}(r_{o2} \parallel r_{o4})$, $\text{GBW} = g_{m1}/(2\pi C_L)$, CMRR, ICMR, output swing, slew rate $SR = I_{tail}/C_L$, systematic/random offset, and complete $g_m/I_D$ sizing flow.
  5. *Module 5 — Two-Stage Miller Op-Amp*: Dominant/non-dominant poles, Miller theorem pole splitting, RHP zero $z_1 = g_{m6}/C_c$, nulling resistor $R_z = 1/g_{m6}$ (or $R_z > 1/g_{m6}$ for LHP zero cancellation), phase margin, and systematic sizing.
  6. *Module 6 — Low-Dropout Regulator (LDO)*: PMOS vs. NMOS pass device, error amplifier loop, dropout voltage $V_{DO}$, PSRR across frequency, line/load regulation, output capacitor ESR zero stability, and load transient response.
  7. *Module 7 — Bandgap Reference (BGR)*: CTAT ($V_{BE}$, $\approx -1.8\text{ mV/K}$) and PTAT ($\Delta V_{BE} = V_T \ln N$, $+0.085\text{ mV/K}$), Kuijk and Brokaw topologies, curvature causes, startup circuit design, resistor ratio trimming, and temperature sweep verification.
  8. *Module 8 — Theoretical Verification & Debugging*: Standardized *Hand-Calculation vs. SPICE Simulation* master verification tables (Gain, GBW, PM, Power, Swing, ICMR, Offset) and systematic root-cause debugging flows when SPICE diverges from hand math.
  9. *Module 9 — Corners, Monte Carlo, Layout & Noise*: PVT corners (`TT, FF, SS, FS, SF` across $-40^\circ\text{C}$ to $125^\circ\text{C}$ and $\pm 10\% V_{DD}$), Pelgrom's mismatch law ($\sigma(\Delta V_{th}) = A_{VT}/\sqrt{WL}$), interdigitated and common-centroid layout patterns with dummy devices, and thermal ($4kT\gamma g_m$) + flicker ($K / (C_{ox} W L f)$) noise analysis.

### Interactive Component & State Mapping
- **$g_m/I_D$ & Circuit Calculators**: Sliders and numeric inputs for Target DC Gain ($\text{dB}$), $\text{GBW}$ ($\text{MHz}$), Load Capacitance $C_L$ ($\text{pF}$), Phase Margin ($^\circ$), Slew Rate ($\text{V}/\mu\text{s}$), and Channel Length $L$ ($\mu\text{m}$). Moving any slider immediately recalculates $g_m$, $I_D$, $I_D/W$, $W/L$, $C_c$, $R_z$, power dissipation, and regenerates the companion SPICE netlist.
- **Interactive Bode Plot Visualizer**: Users adjust $f_{p1}$, $f_{p2}$, $f_z$ (RHP or LHP), and DC gain $A_0$, or link directly to the Two-Stage Op-Amp calculator. Renders real-time Magnitude ($\text{dB}$) and Phase ($^\circ$) SVG curves, Unity-Gain Frequency ($f_u$) marker, and Phase Margin ($PM$) readout with stability status alerts.
- **BGR Temperature Curve Plotter**: Interactive controls for BJT area ratio $N$, resistor ratio $R_2/R_1$, and curvature correction. Plots $V_{CTAT}(T)$, $V_{PTAT}(T)$, and $V_{REF}(T)$ from $-40^\circ\text{C}$ to $+125^\circ\text{C}$ and computes the effective temperature coefficient in $\text{ppm}/^\circ\text{C}$.
- **Transistor Operating-Region ($V_{GS}/V_{DS}$) Explorer**: Interactive $I_D$ vs. $V_{DS}$ family of curves and $g_m/I_D$ vs. $V_{GS}$ plot where dragging the bias point $(V_{GS}, V_{DS})$ updates the MOSFET cross-section pinch-off channel diagram, small-signal parameters ($g_m, r_o, V_{ov}, V_{DS,\text{sat}}$), and operating region indicator.
- **Interactive SVG Schematics**: Mode buttons (`DC Bias Path`, `Small-Signal AC Path`, `Feedback & Compensation`, `Component Values`) highlight specific branches and display node equations when hovered.
- **Self-Test Quizzes & Verification Checklists**: Each module includes a multi-question technical quiz with radio selection, instant explanation reveal, and an interactive pre-tapeout verification checklist that updates the global mastery progress bar in the header.
