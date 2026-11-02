import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Trash2,
  Minimize2,
  Maximize2,
  CornerDownLeft,
  ImagePlus,
} from 'lucide-react';
import { InlineMath, BlockEquation } from './Math';
import { ProcessNodeId } from '../utils/analogPhysics';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  imagePreview?: string;
}

interface AnalogAiTutorProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  activeViewLabel: string;
  currentModuleTitle: string;
  processNode: ProcessNodeId;
}

const RichTutorMessage: React.FC<{ text: string }> = ({ text }) => {
  const codeSegments = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2.5 text-xs md:text-sm leading-relaxed text-slate-900">
      {codeSegments.map((segment, idx) => {
        if (segment.startsWith('```') && segment.endsWith('```')) {
          const lines = segment.slice(3, -3).trim().split('\n');
          const firstLine = lines[0]?.trim() || '';
          const hasLang = /^[a-zA-Z0-9_-]+$/.test(firstLine);
          const codeBody = hasLang ? lines.slice(1).join('\n') : lines.join('\n');
          return (
            <pre
              key={idx}
              className="bg-white border border-slate-300 text-slate-900 font-ieee-mono text-[11px] p-2.5 overflow-x-auto my-2"
            >
              <code>{codeBody}</code>
            </pre>
          );
        }

        const blockMathSegments = segment.split(/(\$\$[\s\S]*?\$\$)/g);
        return (
          <React.Fragment key={idx}>
            {blockMathSegments.map((bm, bmIdx) => {
              if (bm.startsWith('$$') && bm.endsWith('$$')) {
                const latex = bm.slice(2, -2).trim();
                return <BlockEquation key={bmIdx} math={latex} />;
              }

              const lines = bm.split('\n');
              return (
                <div key={bmIdx} className="space-y-1.5">
                  {lines.map((line, lIdx) => {
                    const trimmed = line.trim();
                    if (!trimmed) return null;

                    const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
                    const cleanLine = isBullet ? trimmed.slice(2) : line;

                    return (
                      <div
                        key={lIdx}
                        className={isBullet ? 'pl-3 flex items-start gap-1.5' : ''}
                      >
                        {isBullet && (
                          <span className="text-[#00629B] font-bold shrink-0">•</span>
                        )}
                        <span>{renderInlineMathAndBold(cleanLine)}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
};

function renderInlineMathAndBold(line: string): React.ReactNode {
  const parts = line.split(/(\$[^$]+\$)/g);
  return parts.map((part, i) => {
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      return <InlineMath key={i} math={part.slice(1, -1)} />;
    }
    const boldParts = part.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return boldParts.map((bp, j) => {
      if (bp.startsWith('**') && bp.endsWith('**')) {
        return (
          <strong key={`${i}-${j}`} className="font-bold text-slate-900">
            {bp.slice(2, -2)}
          </strong>
        );
      }
      if (bp.startsWith('`') && bp.endsWith('`')) {
        return (
          <code
            key={`${i}-${j}`}
            className="font-ieee-mono text-[11px] bg-slate-100 border border-slate-300 text-[#00629B] px-1 py-0.5"
          >
            {bp.slice(1, -1)}
          </code>
        );
      }
      return <React.Fragment key={`${i}-${j}`}>{bp}</React.Fragment>;
    });
  });
}

export const AnalogAiTutor: React.FC<AnalogAiTutorProps> = ({
  isOpen,
  onToggleOpen,
  activeViewLabel,
  currentModuleTitle,
  processNode,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [attachedPreview, setAttachedPreview] = useState<string | null>(null);
  const [attachedBase64, setAttachedBase64] = useState<string | null>(null);
  const [attachedMime, setAttachedMime] = useState<string>('image/png');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Welcome! I am the **Analog Circuit Design AI Tutor**. You can ask questions or attach/paste a **Network Analysis, Analog Circuit, or Signal Processing image** for step-by-step derivation and SPICE verification.`,
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  const handleImageSelect = (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    setAttachedMime(file.type || 'image/png');
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAttachedPreview(dataUrl);
      const commaIdx = dataUrl.indexOf(',');
      if (commaIdx !== -1) {
        setAttachedBase64(dataUrl.slice(commaIdx + 1));
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          handleImageSelect(file);
          break;
        }
      }
    }
  };

  const quickPrompts = [
    `Why choose gm/Id = 15 V⁻¹ for a 5T OTA input pair?`,
    `Explain the RHP zero in a Miller Op-Amp and how Rz cancels it`,
    `How do I find Thevenin impedance Zth(s) of a network with dependent sources?`,
    `Write an LTspice .meas script for DC Gain, GBW, and Phase Margin`,
  ];

  const sendMessage = async (promptText?: string) => {
    const trimmed = (promptText ?? input).trim();
    if ((!trimmed && !attachedBase64) || isLoading) return;

    const finalPrompt =
      trimmed ||
      'Please analyze this circuit / signal processing problem image and provide a complete step-by-step derivation with equations and final answer.';

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: finalPrompt,
      imagePreview: attachedPreview || undefined,
    };

    const currentBase64 = attachedBase64;
    const currentMime = attachedMime;

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    if (!promptText) setInput('');
    setAttachedPreview(null);
    setAttachedBase64(null);
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            text: m.text,
          })),
          imageBase64: currentBase64 || undefined,
          mimeType: currentBase64 ? currentMime : undefined,
          contextInfo: `Active Page: ${activeViewLabel} | Current Module: ${currentModuleTitle} | Selected CMOS Process Node: ${
            processNode === '180nm' ? '180nm CMOS (VDD = 1.8V)' : '65nm CMOS (VDD = 1.2V)'
          }`,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      const modelMsg: ChatMessage = {
        id: `m-${Date.now()}`,
        role: 'model',
        text: data.reply || 'No response received.',
      };
      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to reach AI Design Tutor.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearHistory = () => {
    setErrorMsg(null);
    setAttachedPreview(null);
    setAttachedBase64(null);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'model',
        text: `Chat history cleared. Upload a circuit/signal problem image or ask any analog IC design question!`,
      },
    ]);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onToggleOpen}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#00629B] hover:bg-[#004B76] text-white font-ieee-sans text-xs sm:text-sm font-bold shadow-lg border border-slate-900/20 cursor-pointer transition-colors"
        aria-label="Open AI Design Tutor Chatbot"
      >
        <Sparkles className="w-4 h-4 shrink-0" />
        <span>Ask AI Design Tutor</span>
      </button>
    );
  }

  return (
    <aside
      onPaste={handlePaste}
      className={`fixed bottom-4 right-4 z-50 bg-white border-2 border-[#00629B] shadow-2xl flex flex-col transition-all ${
        isExpanded
          ? 'w-[calc(100vw-2rem)] sm:w-[680px] h-[82vh]'
          : 'w-[calc(100vw-2rem)] sm:w-[440px] h-[590px] max-h-[82vh]'
      }`}
    >
      {/* Header Bar */}
      <div className="bg-[#00629B] text-white px-4 py-3 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <MessageSquare className="w-4 h-4 shrink-0" />
          <div className="truncate">
            <div className="font-ieee-sans font-bold text-xs sm:text-sm leading-tight">
              Analog Circuit Design AI &amp; Vision Tutor
            </div>
            <div className="font-ieee-mono text-[10px] text-sky-100 truncate">
              Context: {currentModuleTitle} ({processNode})
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={clearHistory}
            title="Clear chat history"
            className="p-1.5 text-sky-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Restore panel size' : 'Expand panel size'}
            className="p-1.5 text-sky-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onToggleOpen}
            title="Close AI Tutor"
            className="p-1.5 text-sky-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Starter Prompts */}
      <div className="bg-[#F8FAFC] border-b border-slate-200 px-3 py-2 shrink-0">
        <div className="text-[10px] font-ieee-sans font-bold text-slate-600 uppercase tracking-wider mb-1.5">
          Suggested Engineering Questions:
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isLoading}
              onClick={() => sendMessage(qp)}
              className="px-2.5 py-1 bg-white border border-slate-300 hover:border-[#00629B] text-slate-800 hover:text-[#00629B] font-ieee-sans text-[11px] whitespace-nowrap shrink-0 cursor-pointer transition-colors disabled:opacity-50"
            >
              {qp}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Transcript Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="text-[10px] font-ieee-sans font-bold uppercase tracking-wider text-slate-500 mb-1">
              {msg.role === 'user' ? 'You (Designer)' : 'AI Design Tutor'}
            </div>
            <div
              className={`max-w-[92%] p-3.5 border ${
                msg.role === 'user'
                  ? 'bg-[#E0F2FE]/60 border-[#00629B]/40 text-slate-900'
                  : 'bg-[#F8FAFC] border-slate-300 text-slate-900'
              }`}
            >
              {msg.imagePreview && (
                <img
                  src={msg.imagePreview}
                  alt="Attached circuit problem"
                  className="max-h-40 w-auto border border-slate-300 bg-white p-1 mb-2"
                />
              )}
              {msg.role === 'user' ? (
                <p className="text-xs md:text-sm text-slate-900 whitespace-pre-wrap font-ieee-sans">
                  {msg.text}
                </p>
              ) : (
                <RichTutorMessage text={msg.text} />
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex flex-col items-start">
            <div className="text-[10px] font-ieee-sans font-bold uppercase tracking-wider text-slate-500 mb-1">
              AI Design Tutor
            </div>
            <div className="bg-[#F8FAFC] border border-slate-300 px-4 py-3 text-xs font-ieee-sans text-slate-800 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-[#00629B] rounded-full animate-ping" />
              <span>Analyzing schematic &amp; deriving small-signal / network equations...</span>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="border border-red-300 bg-red-50 p-3 text-xs font-ieee-sans text-red-900">
            <strong>Tutor Error: </strong>
            {errorMsg}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer with Image Upload */}
      <div className="border-t border-slate-300 bg-[#F8FAFC] p-3 shrink-0 space-y-2">
        {attachedPreview && (
          <div className="flex items-center justify-between bg-white border border-slate-300 p-2 text-xs">
            <div className="flex items-center gap-2">
              <img
                src={attachedPreview}
                alt="Preview"
                className="h-10 w-auto object-contain border border-slate-200"
              />
              <span className="font-ieee-sans font-semibold text-slate-800">
                Image attached for Vision Problem Solving
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setAttachedPreview(null);
                setAttachedBase64(null);
              }}
              className="text-red-700 hover:text-red-900 font-semibold px-2 cursor-pointer"
            >
              Remove
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleImageSelect(e.target.files?.[0])}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Upload Circuit / Signal Problem Image"
            className="p-2.5 bg-white border border-slate-300 hover:border-[#00629B] text-[#00629B] cursor-pointer transition-colors shrink-0"
          >
            <ImagePlus className="w-4 h-4" />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Ask a question or attach/paste (Ctrl+V) a circuit/signal image..."
            className="flex-1 bg-white border border-slate-300 focus:border-[#00629B] focus:outline-none px-3 py-2 text-xs md:text-sm font-ieee-sans text-slate-900 resize-none"
          />
          <button
            type="button"
            disabled={isLoading || (!input.trim() && !attachedBase64)}
            onClick={() => sendMessage()}
            className="px-3.5 py-2.5 bg-[#00629B] hover:bg-[#004B76] disabled:bg-slate-300 text-white font-ieee-sans text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </div>
        <div className="flex items-center justify-between text-[10px] font-ieee-sans text-slate-600">
          <span className="flex items-center gap-1">
            <CornerDownLeft className="w-3 h-3" /> Enter to send · Paste (Ctrl+V) or click icon to attach image
          </span>
          <span>KaTeX + SPICE enabled</span>
        </div>
      </div>
    </aside>
  );
};
