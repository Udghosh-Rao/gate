"use client";

import React from "react";
import { BRAND } from "../lib/brand";
import { GraduationCap } from "lucide-react";

interface FooterProps {
  onNavigate: (tab: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-700 text-white"><GraduationCap size={18} /></span>
            {BRAND.name}
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">A focused place to explore published exam content and practise with timed tests.</p>
          <p className="mt-3 text-xs leading-5 text-slate-500">Independent preparation resource. No official examination-board affiliation is claimed.</p>
        </div>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Explore</h2>
          <div className="mt-3 flex flex-col items-start gap-2 text-sm">
            <button onClick={() => onNavigate("home")} className="text-slate-700 hover:text-blue-700">Examinations</button>
            <button onClick={() => onNavigate("syllabus")} className="text-slate-700 hover:text-blue-700">Syllabus and resources</button>
            <button onClick={() => onNavigate("tests")} className="text-slate-700 hover:text-blue-700">Practice tests</button>
          </div>
        </div>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Your account</h2>
          <div className="mt-3 flex flex-col items-start gap-2 text-sm">
            <button onClick={() => onNavigate("dashboard")} className="text-slate-700 hover:text-blue-700">Student dashboard</button>
            <button onClick={() => onNavigate("about")} className="text-slate-700 hover:text-blue-700">About this platform</button>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-100 px-5 py-4 text-center text-xs text-slate-500">© {BRAND.name}</div>
    </footer>
  );
}
