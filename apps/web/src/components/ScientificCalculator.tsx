"use client";

import React, { useState } from "react";
import { X, Delete } from "lucide-react";

interface ScientificCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScientificCalculator({ isOpen, onClose }: ScientificCalculatorProps) {
  const [display, setDisplay] = useState("0");
  const [memory, setMemory] = useState<number>(0);
  const [isRad, setIsRad] = useState(false);

  if (!isOpen) return null;

  const handleNum = (num: string) => {
    setDisplay((prev) => (prev === "0" ? num : prev + num));
  };

  const handleOp = (op: string) => {
    setDisplay((prev) => prev + " " + op + " ");
  };

  const handleClear = () => {
    setDisplay("0");
  };

  const handleBackspace = () => {
    setDisplay((prev) => {
      const trimmed = prev.trim();
      if (trimmed.length <= 1) return "0";
      return trimmed.slice(0, -1);
    });
  };

  const calculate = () => {
    try {
      // Safe evaluation of basic expression
      const cleanExpr = display
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/\^/g, "**")
        .replace(/π/g, `${Math.PI}`)
        .replace(/e/g, `${Math.E}`);

      // eslint-disable-next-line no-eval
      const result = Function(`"use strict"; return (${cleanExpr})`)();
      if (typeof result === "number" && !isNaN(result)) {
        setDisplay(String(Math.round(result * 100000000) / 100000000));
      } else {
        setDisplay("Error");
      }
    } catch {
      setDisplay("Error");
    }
  };

  const handleFunc = (fn: string) => {
    try {
      const current = parseFloat(display);
      let val = 0;
      switch (fn) {
        case "sin":
          val = isRad ? Math.sin(current) : Math.sin((current * Math.PI) / 180);
          break;
        case "cos":
          val = isRad ? Math.cos(current) : Math.cos((current * Math.PI) / 180);
          break;
        case "tan":
          val = isRad ? Math.tan(current) : Math.tan((current * Math.PI) / 180);
          break;
        case "sqrt":
          val = Math.sqrt(current);
          break;
        case "sqr":
          val = current * current;
          break;
        case "ln":
          val = Math.log(current);
          break;
        case "log":
          val = Math.log10(current);
          break;
        case "1/x":
          val = 1 / current;
          break;
        case "fact":
          val = factorial(Math.floor(current));
          break;
        case "neg":
          val = -current;
          break;
      }
      setDisplay(String(Math.round(val * 100000000) / 100000000));
    } catch {
      setDisplay("Error");
    }
  };

  const factorial = (n: number): number => {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              GATE CBT Scientific Calculator
            </span>
            <button
              onClick={() => setIsRad(!isRad)}
              className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-700 text-slate-200 hover:bg-slate-600"
            >
              {isRad ? "RAD" : "DEG"}
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Display */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 text-right">
          <div className="text-2xl font-mono font-bold text-white tracking-wider overflow-x-auto whitespace-nowrap scrollbar-none">
            {display}
          </div>
        </div>

        {/* Keypad */}
        <div className="p-3 grid grid-cols-5 gap-1.5 bg-slate-900 text-xs font-semibold">
          {/* Row 1 */}
          <button onClick={() => handleFunc("sin")} className="calc-fn-btn">sin</button>
          <button onClick={() => handleFunc("cos")} className="calc-fn-btn">cos</button>
          <button onClick={() => handleFunc("tan")} className="calc-fn-btn">tan</button>
          <button onClick={() => handleFunc("ln")} className="calc-fn-btn">ln</button>
          <button onClick={() => handleFunc("log")} className="calc-fn-btn">log</button>

          {/* Row 2 */}
          <button onClick={() => handleFunc("sqrt")} className="calc-fn-btn">√x</button>
          <button onClick={() => handleFunc("sqr")} className="calc-fn-btn">x²</button>
          <button onClick={() => handleOp("^")} className="calc-fn-btn">xʸ</button>
          <button onClick={() => handleFunc("1/x")} className="calc-fn-btn">1/x</button>
          <button onClick={() => handleFunc("fact")} className="calc-fn-btn">n!</button>

          {/* Row 3 */}
          <button onClick={() => handleNum("π")} className="calc-fn-btn">π</button>
          <button onClick={() => handleNum("e")} className="calc-fn-btn">e</button>
          <button onClick={() => handleNum("(")} className="calc-fn-btn">(</button>
          <button onClick={() => handleNum(")")} className="calc-fn-btn">)</button>
          <button onClick={handleClear} className="calc-act-btn bg-red-600/30 text-red-300 hover:bg-red-600/40">C</button>

          {/* Row 4 */}
          <button onClick={() => handleNum("7")} className="calc-num-btn">7</button>
          <button onClick={() => handleNum("8")} className="calc-num-btn">8</button>
          <button onClick={() => handleNum("9")} className="calc-num-btn">9</button>
          <button onClick={() => handleOp("/")} className="calc-op-btn">÷</button>
          <button onClick={handleBackspace} className="calc-act-btn">
            <Delete className="w-3.5 h-3.5 mx-auto" />
          </button>

          {/* Row 5 */}
          <button onClick={() => handleNum("4")} className="calc-num-btn">4</button>
          <button onClick={() => handleNum("5")} className="calc-num-btn">5</button>
          <button onClick={() => handleNum("6")} className="calc-num-btn">6</button>
          <button onClick={() => handleOp("*")} className="calc-op-btn">×</button>
          <button onClick={() => handleFunc("neg")} className="calc-fn-btn">±</button>

          {/* Row 6 */}
          <button onClick={() => handleNum("1")} className="calc-num-btn">1</button>
          <button onClick={() => handleNum("2")} className="calc-num-btn">2</button>
          <button onClick={() => handleNum("3")} className="calc-num-btn">3</button>
          <button onClick={() => handleOp("-")} className="calc-op-btn">−</button>
          <button onClick={calculate} className="row-span-2 calc-eq-btn">=</button>

          {/* Row 7 */}
          <button onClick={() => handleNum("0")} className="col-span-2 calc-num-btn">0</button>
          <button onClick={() => handleNum(".")} className="calc-num-btn">.</button>
          <button onClick={() => handleOp("+")} className="calc-op-btn">+</button>
        </div>
      </div>

      <style jsx>{`
        .calc-num-btn {
          padding: 10px 0;
          background: #1e293b;
          color: #f8fafc;
          border-radius: 8px;
          border: 1px solid #334155;
          transition: all 0.1s;
        }
        .calc-num-btn:hover {
          background: #334155;
        }
        .calc-op-btn {
          padding: 10px 0;
          background: #3b82f6;
          color: #ffffff;
          border-radius: 8px;
          transition: all 0.1s;
        }
        .calc-op-btn:hover {
          background: #2563eb;
        }
        .calc-fn-btn {
          padding: 9px 0;
          background: #0f172a;
          color: #94a3b8;
          border-radius: 8px;
          border: 1px solid #1e293b;
          transition: all 0.1s;
        }
        .calc-fn-btn:hover {
          background: #1e293b;
          color: #ffffff;
        }
        .calc-act-btn {
          padding: 10px 0;
          background: #334155;
          color: #f8fafc;
          border-radius: 8px;
          transition: all 0.1s;
        }
        .calc-eq-btn {
          padding: 10px 0;
          background: #10b981;
          color: #ffffff;
          border-radius: 8px;
          font-weight: 700;
          font-size: 16px;
          transition: all 0.1s;
        }
        .calc-eq-btn:hover {
          background: #059669;
        }
      `}</style>
    </div>
  );
}
