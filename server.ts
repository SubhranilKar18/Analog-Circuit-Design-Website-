import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, GenerateContentResponse, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

const ANALOG_TUTOR_SYSTEM_INSTRUCTION = `You are the "AnalogMaster AI Design Tutor", a senior Analog & Mixed-Signal IC Design Engineer and Professor.
Your goal is to help students and engineers master CMOS analog integrated circuit design, network analysis, and signal processing across the AnalogMaster curriculum:
1. MOSFET Foundations (operating regions, gm, gds, ro, Cgs, Cgd, intrinsic gain gm*ro, transit frequency fT)
2. Design Methodology (Square-Law vs. gm/Id methodology, inversion coefficient IC, gm/Id vs. Id/W lookup tables, Cgg/Id approach)
3. CMOS Inverter as Digital Gate & Analog Push-Pull Amplifier
4. 5-Transistor (5T) Differential OTA (DC gain, GBW, CMRR, ICMR, slew rate, Pelgrom offset, step-by-step gm/Id sizing)
5. Two-Stage Miller-Compensated Op-Amp (pole splitting, RHP zero, nulling resistor Rz = 1/gm6, phase margin)
6. Low-Dropout (LDO) Linear Regulators (PMOS/NMOS pass element, dropout, PSRR, load/line regulation, ESR zero stability)
7. Bandgap Voltage References (CTAT VBE, PTAT dVBE = VT*ln(N), Kuijk/Brokaw topologies, startup circuits, ppm/C box method)
8. Theoretical vs. SPICE Verification & Debugging Mismatches
9. PVT Corners, Monte Carlo Statistical Analysis, Pelgrom's Law, Common-Centroid Layout & Thermal/Flicker Noise
10. Network Analysis (KCL/KVL, Thevenin/Norton, Transient RC/RL/RLC, s-Domain Laplace, Two-Port Networks) & Signal Processing (LTI Systems, Fourier/Laplace/Z-Transforms, Transfer Functions)

Guidelines for your answers:
- Be rigorous, clear, and practical. Always include units (e.g., S/A, uA, um, MHz, dB, deg, pF).
- Explain the physical intuition behind design choices (why a specific gm/Id or channel length L is chosen).
- Use LaTeX math notation wrapped in $...$ for inline math (e.g., $g_m/I_D = 15\\text{ V}^{-1}$) and $$...$$ for block equations so the UI renders them with KaTeX.
- When asked for SPICE netlists or simulation commands (.op, .dc, .ac, .tran, .noise, .meas), provide clean, ready-to-run LTspice / ngspice snippets.
- Keep responses concise, structured, and easy to scan.`;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.post('/api/chat', async (req, res) => {
    try {
      const { messages, contextInfo, imageBase64, mimeType } = req.body as {
        messages?: Array<{ role: 'user' | 'model'; text: string }>;
        contextInfo?: string;
        imageBase64?: string;
        mimeType?: string;
      };

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: 'Messages array is required.' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({
          error:
            'GEMINI_API_KEY is not configured. Please check your API key in the Settings > Secrets panel.',
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const contents = messages.map((m, idx) => {
        const isLastUser = idx === messages.length - 1 && m.role === 'user';
        if (isLastUser && imageBase64 && mimeType) {
          return {
            role: m.role,
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: imageBase64,
                },
              },
              { text: m.text },
            ],
          };
        }
        return {
          role: m.role,
          parts: [{ text: m.text }],
        };
      });

      const systemInstruction = contextInfo
        ? `${ANALOG_TUTOR_SYSTEM_INSTRUCTION}\n\nCurrent Student Context: ${contextInfo}`
        : ANALOG_TUTOR_SYSTEM_INSTRUCTION;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
        },
      });

      const replyText = response.text ?? 'No response generated.';
      res.json({ reply: replyText });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Gemini API /api/chat error:', errorMessage);
      res.status(500).json({
        error: errorMessage || 'Failed to generate response from AI Tutor.',
      });
    }
  });

  app.post('/api/solve-problem', async (req, res) => {
    try {
      const { domain, imageBase64, mimeType, problemText } = req.body as {
        domain?: string;
        imageBase64?: string;
        mimeType?: string;
        problemText?: string;
      };

      if (!imageBase64 && (!problemText || !problemText.trim())) {
        res.status(400).json({
          error: 'Please upload/paste a circuit or problem image or enter a problem statement.',
        });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({
          error:
            'GEMINI_API_KEY is not configured. Please check your API key in the Settings > Secrets panel.',
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const domainLabel =
        domain === 'network_analysis'
          ? 'Electrical Network Analysis (KCL, KVL, Nodal/Mesh, Thevenin/Norton, Superposition, Transient RC/RL/RLC, s-Domain Laplace, Two-Port Networks)'
          : domain === 'signal_processing'
            ? 'Signals & Systems / Digital & Continuous Signal Processing (LTI Convolution, Laplace/Fourier/Z-Transforms, Transfer Functions H(s)/H(z), Bode/Stability, Sampling)'
            : 'Analog Electronic Circuit Analysis (MOSFET/BJT DC Biasing & Small-Signal Hybrid-pi Models, Current Mirrors, Differential Amplifiers, Op-Amp Feedback, Frequency Response)';

      const promptText = `You are an expert Professor and AI Problem-Solving Agent specializing in ${domainLabel}.
Carefully inspect the attached circuit diagram / mathematical problem image and/or problem text:
${problemText ? `Additional User Notes / Problem Statement: "${problemText}"` : ''}

Perform a complete, publication-grade engineering solution:
1. Accurately read all circuit nodes, component values, sources, transistor/op-amp connections, or signal expressions from the image.
2. State the governing theorems/laws (e.g., Nodal KCL, Thevenin equivalent, Small-Signal Hybrid-pi, Miller's Theorem, Laplace/Fourier/Z transform properties) in valid KaTeX LaTeX syntax (do NOT wrap latex fields in $ or $$, provide raw LaTeX for equation fields).
3. Show every step-by-step derivation and numerical substitution with units.
4. Provide a complete, copy-pasteable SPICE netlist (.cir) (for Network Analysis or Analog Circuits) OR a Python (NumPy/SciPy/SymPy) verification script (for Signal Processing) that simulates and verifies the exact final answer.`;

      const parts: Array<any> = [];
      if (imageBase64 && mimeType) {
        parts.push({
          inlineData: {
            mimeType,
            data: imageBase64,
          },
        });
      }
      parts.push({ text: promptText });

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detectedDomain: {
                type: Type.STRING,
                description:
                  'Specific sub-discipline identified (e.g., s-Domain Thevenin & RLC Transient Analysis, MOSFET Cascode Small-Signal Analysis, Continuous-Time Laplace Transfer Function).',
              },
              extractedProblemStatement: {
                type: Type.STRING,
                description:
                  'Clear textual reconstruction of the problem statement, circuit topology, and what needs to be found.',
              },
              extractedComponents: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    symbol: {
                      type: Type.STRING,
                      description: 'Component or signal parameter symbol (e.g., R1, M1, V_in(t), H(s)).',
                    },
                    valueAndConnection: {
                      type: Type.STRING,
                      description: 'Extracted value, units, and node connection or role in the problem.',
                    },
                  },
                },
              },
              governingEquations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    lawName: {
                      type: Type.STRING,
                      description: 'Name of theorem, law, or transform property.',
                    },
                    latex: {
                      type: Type.STRING,
                      description: 'Raw LaTeX equation string (without $ or $$ delimiters).',
                    },
                  },
                },
              },
              derivationSteps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    stepTitle: {
                      type: Type.STRING,
                      description: 'Concise title for this derivation step.',
                    },
                    explanation: {
                      type: Type.STRING,
                      description: 'Physical and mathematical reasoning for this step.',
                    },
                    equationLatex: {
                      type: Type.STRING,
                      description: 'Raw LaTeX equation showing symbolic formula and numerical substitution (no $ delimiters).',
                    },
                    stepResult: {
                      type: Type.STRING,
                      description: 'Intermediate numerical or symbolic result with units.',
                    },
                  },
                },
              },
              finalAnswerSummary: {
                type: Type.STRING,
                description: 'Plain-text summary of the final answer(s) with units.',
              },
              finalAnswerLatex: {
                type: Type.STRING,
                description: 'Raw LaTeX expression of the final boxed answer (without $ or $$).',
              },
              verificationCodeTitle: {
                type: Type.STRING,
                description: 'Title for the verification script (e.g., ngspice Verification Deck or Python SciPy Verification Script).',
              },
              verificationCodeFilename: {
                type: Type.STRING,
                description: 'Filename such as verify_solution.cir or verify_signal.py.',
              },
              verificationCode: {
                type: Type.STRING,
                description: 'Complete runnable SPICE netlist (.cir) or Python verification script.',
              },
              commonPitfalls: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2 to 3 common mistakes students make on this specific problem type.',
              },
            },
          },
        },
      });

      const rawJson = (response.text ?? '{}').trim();
      const solution = JSON.parse(rawJson);
      res.json({ solution });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Gemini API /api/solve-problem error:', errorMessage);
      res.status(500).json({
        error: errorMessage || 'Failed to analyze and solve the problem from image.',
      });
    }
  });

  app.post('/api/generate-quiz', async (req, res) => {
    try {
      const { moduleTitle, sourcePreference } = req.body as {
        moduleTitle?: string;
        sourcePreference?: string;
      };

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({
          error:
            'GEMINI_API_KEY is not configured. Please check your API key in the Settings > Secrets panel.',
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `Generate 3 rigorous multiple-choice analog IC design questions for the topic "${
        moduleTitle || 'MOSFET & Op-Amp Design'
      }".
Include a mix of numerical calculation and deep physical-intuition questions inspired by:
1. GATE (Graduate Aptitude Test in Engineering) EC/EE Previous Year Questions
2. Behzad Razavi, "Design of Analog CMOS Integrated Circuits"
3. Phillip E. Allen & Douglas R. Holberg, "CMOS Analog Circuit Design"
${
  sourcePreference && sourcePreference !== 'ALL'
    ? `Focus specifically on the style and chapter problems of: ${sourcePreference}.`
    : 'Provide one question in the style of GATE PYQ, one from Razavi, and one from Allen & Holberg.'
}
Ensure all 4 options are plausible, units are explicitly stated, correctIndex is 0, 1, 2, or 3, and the explanation shows the exact formula and numerical substitution.`;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sourceCategory: {
                  type: Type.STRING,
                  description: 'Must be one of: GATE PYQ, Razavi, or Allen & Holberg',
                },
                sourceCitation: {
                  type: Type.STRING,
                  description:
                    'Specific reference tag, e.g., GATE EC Style Numerical, Razavi Ch. 5 Problem, or Allen & Holberg Ch. 6 Problem',
                },
                difficulty: {
                  type: Type.STRING,
                  description: 'One of: 1-Mark Conceptual, 2-Mark Numerical, or Design Problem',
                },
                question: {
                  type: Type.STRING,
                  description: 'Complete question text with realistic CMOS parameters and units.',
                },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Array of exactly 4 answer choices with units.',
                },
                correctIndex: {
                  type: Type.INTEGER,
                  description: '0-based index (0, 1, 2, or 3) of the correct option.',
                },
                explanation: {
                  type: Type.STRING,
                  description: 'Step-by-step physical and mathematical derivation of the answer.',
                },
              },
            },
          },
        },
      });

      const rawJson = (response.text ?? '[]').trim();
      const parsed = JSON.parse(rawJson);
      res.json({ questions: parsed });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Gemini API /api/generate-quiz error:', errorMessage);
      res.status(500).json({
        error: errorMessage || 'Failed to generate dynamic quiz questions.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AnalogMaster server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
