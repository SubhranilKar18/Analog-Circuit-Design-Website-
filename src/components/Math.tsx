import React from 'react';
import katex from 'katex';
import { AlertTriangle, BookOpen, CheckCircle2, FileCode2, Copy, Check, Download } from 'lucide-react';

interface MathProps {
  math: string;
  className?: string;
}

export const InlineMath: React.FC<MathProps> = ({ math, className = '' }) => {
  const html = React.useMemo(() => {
    try {
      return katex.renderToString(math, {
        throwOnError: false,
        displayMode: false,
      });
    } catch {
      return math;
    }
  }, [math]);

  return (
    <span
      className={`inline-block align-baseline ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

interface BlockEquationProps {
  math: string;
  number?: string | number;
  label?: string;
}

export const BlockEquation: React.FC<BlockEquationProps> = ({ math, number, label }) => {
  const html = React.useMemo(() => {
    try {
      return katex.renderToString(math, {
        throwOnError: false,
        displayMode: true,
      });
    } catch {
      return math;
    }
  }, [math]);

  return (
    <div className="my-4 py-3 px-4 bg-[#F8FAFC] border border-slate-200 flex items-center justify-between gap-4 overflow-x-auto">
      <div className="flex-1 text-center overflow-x-auto">
        <div dangerouslySetInnerHTML={{ __html: html }} />
        {label && (
          <div className="text-xs font-ieee-sans text-slate-500 mt-1">{label}</div>
        )}
      </div>
      {number !== undefined && (
        <span className="font-ieee-serif text-sm text-slate-700 shrink-0 select-all">
          ({number})
        </span>
      )}
    </div>
  );
};

interface SectionHeadingProps {
  id: string;
  roman: string;
  title: string;
  subtitle?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({ id, roman, title, subtitle }) => (
  <div id={id} className="scroll-mt-24 pt-8 pb-3 border-b border-slate-200 mb-5">
    <h2 className="text-xl md:text-2xl font-bold text-[#00629B] tracking-tight flex items-baseline gap-2.5">
      <span className="font-ieee-serif uppercase">{roman}.</span>
      <span>{title}</span>
    </h2>
    {subtitle && (
      <p className="text-sm font-ieee-sans text-slate-600 mt-1">{subtitle}</p>
    )}
  </div>
);

interface SubSectionHeadingProps {
  id?: string;
  index: string;
  title: string;
}

export const SubSectionHeading: React.FC<SubSectionHeadingProps> = ({ id, index, title }) => (
  <h3 id={id} className="scroll-mt-24 text-lg font-semibold italic text-[#00629B] mt-6 mb-2.5 flex items-baseline gap-2">
    <span className="not-italic font-semibold">{index}</span>
    <span>{title}</span>
  </h3>
);

interface AbstractBoxProps {
  abstract: string;
  indexTerms: string[];
  readingTime: string;
  difficulty: string;
}

export const AbstractBox: React.FC<AbstractBoxProps> = ({
  abstract,
  indexTerms,
  readingTime,
  difficulty,
}) => (
  <div className="bg-[#F8FAFC] border border-slate-300 p-5 mb-8">
    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-200 text-xs font-ieee-sans text-slate-700">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-[#00629B]">Analog Circuit Design Technical Curriculum Series</span>
        <span aria-hidden="true">·</span>
        <span>Difficulty: {difficulty}</span>
        <span aria-hidden="true">·</span>
        <span>Est. Study Time: {readingTime}</span>
      </div>
      <span className="font-ieee-mono text-slate-600">Baseline PDK: 180nm (1.8V) / 65nm (1.2V)</span>
    </div>
    <p className="text-sm md:text-[15px] leading-relaxed text-slate-900 text-justify">
      <strong className="font-bold italic text-slate-900">Abstract—</strong>
      {abstract}
    </p>
    <p className="text-xs md:text-sm leading-relaxed text-slate-800 mt-3">
      <strong className="font-bold italic text-slate-900">Index Terms—</strong>
      {indexTerms.join(', ')}.
    </p>
  </div>
);

interface KeyEquationItem {
  name: string;
  latex: string;
  eqNum: string;
  units: string;
  note: string;
}

export const KeyEquationsBox: React.FC<{ equations: KeyEquationItem[] }> = ({ equations }) => (
  <div className="my-6 border border-[#00629B]/30 bg-[#F8FAFC] p-5">
    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-4">
      <div className="flex items-center gap-2 text-[#00629B] font-ieee-sans font-semibold text-sm">
        <BookOpen className="w-4 h-4 shrink-0" />
        <span>Key Design Equations & Physical Units</span>
      </div>
      <span className="text-xs font-ieee-sans text-slate-600">SI / Microelectronics Units</span>
    </div>
    <div className="divide-y divide-slate-200">
      {equations.map((eq, idx) => (
        <div key={idx} className="py-3 first:pt-0 last:pb-0 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
          <div className="lg:col-span-4">
            <div className="font-semibold text-sm text-slate-900">{eq.name}</div>
            <div className="text-xs font-ieee-sans text-slate-700 mt-0.5">{eq.note}</div>
          </div>
          <div className="lg:col-span-6 overflow-x-auto bg-white border border-slate-200 px-3 py-1.5 text-center text-slate-900">
            <InlineMath math={eq.latex} />
          </div>
          <div className="lg:col-span-2 flex lg:flex-col items-center lg:items-end justify-between text-xs">
            <span className="font-ieee-mono text-[#00629B] font-semibold">[{eq.units}]</span>
            <span className="font-ieee-serif text-slate-600">({eq.eqNum})</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

interface MistakeItem {
  mistake: string;
  consequence: string;
  fix: string;
}

export const CommonMistakesBox: React.FC<{ mistakes: MistakeItem[] }> = ({ mistakes }) => (
  <div className="my-6 border border-amber-300 bg-amber-50/40 p-5">
    <div className="flex items-center gap-2 text-amber-900 font-ieee-sans font-semibold text-sm border-b border-amber-200 pb-2.5 mb-4">
      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
      <span>Common Tapeout & Simulation Mistakes (And How to Avoid Them)</span>
    </div>
    <div className="space-y-3.5">
      {mistakes.map((item, idx) => (
        <div key={idx} className="bg-white border border-amber-200/80 p-3.5 text-sm">
          <div className="font-semibold text-slate-900 flex items-start gap-2">
            <span className="font-ieee-mono text-xs text-red-700 font-semibold shrink-0 mt-0.5">
              PITFALL #{idx + 1}:
            </span>
            <span>{item.mistake}</span>
          </div>
          <div className="mt-1.5 text-slate-800 text-xs md:text-sm">
            <strong className="text-slate-900 font-ieee-sans">Symptom / Failure: </strong>
            {item.consequence}
          </div>
          <div className="mt-1 text-emerald-900 text-xs md:text-sm flex items-start gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>
              <strong className="font-ieee-sans">Engineering Fix: </strong>
              {item.fix}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

interface SpiceNetlistBoxProps {
  title: string;
  filename: string;
  netlist: string;
  description?: string;
}

export const SpiceNetlistBox: React.FC<SpiceNetlistBoxProps> = ({
  title,
  filename,
  netlist,
  description,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(netlist);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownload = () => {
    const blob = new Blob([netlist], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="my-5 border border-slate-300 bg-white">
      <div className="bg-slate-100 border-b border-slate-300 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileCode2 className="w-4 h-4 text-[#00629B] shrink-0" />
          <span className="font-ieee-sans font-semibold text-xs md:text-sm text-slate-900">{title}</span>
          <span className="text-xs font-ieee-mono text-slate-600">· {filename}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-ieee-sans font-medium bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Netlist' : 'Copy SPICE'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-ieee-sans font-medium bg-[#00629B] text-white hover:bg-[#004B76] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .cir</span>
          </button>
        </div>
      </div>
      {description && (
        <div className="px-4 py-2 bg-[#F8FAFC] border-b border-slate-200 text-xs font-ieee-sans text-slate-700">
          {description}
        </div>
      )}
      <pre className="p-4 text-xs font-ieee-mono leading-relaxed bg-[#F8FAFC] text-slate-900 overflow-x-auto max-h-96">
        <code>{netlist}</code>
      </pre>
    </div>
  );
};
