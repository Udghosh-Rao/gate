"use client";

import React from "react";
import { BRAND } from "../lib/brand";
import { Mail, MapPin, GraduationCap, ArrowRight, ShieldCheck, BookOpen, Layers } from "lucide-react";

interface FooterProps {
  onNavigate: (tab: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const currentYear = 2026;

  return (
    <footer className="border-t border-slate-200 bg-slate-50 text-slate-600">
      {/* Main Footer Directory */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand & Purpose */}
          <div className="lg:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-slate-900 flex items-center justify-center text-white">
                <GraduationCap className="w-4 h-4 text-slate-100" />
              </div>
              <span className="font-bold text-base tracking-tight text-slate-900">
                {BRAND.name}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
              A structured competitive examination preparation platform. Curated syllabi, verified study notes, chapter-wise question practice, and realistic computer-based mock examinations.
            </p>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{BRAND.address}</span>
            </div>
          </div>

          {/* Examinations Offered */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Examination Tracks
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate("syllabus")}
                  className="text-slate-600 hover:text-slate-900 text-left transition-colors"
                >
                  GATE Data Science & AI (GATE DA)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("syllabus")}
                  className="text-slate-600 hover:text-slate-900 text-left transition-colors"
                >
                  GATE Computer Science & IT (GATE CS)
                </button>
              </li>
              <li>
                <span className="text-slate-400">
                  IIT JAM Mathematical Statistics (Curriculum Planning)
                </span>
              </li>
            </ul>
          </div>

          {/* Preparation Components */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Learning Resources
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate("syllabus")}
                  className="text-slate-600 hover:text-slate-900 text-left transition-colors"
                >
                  Detailed Syllabus & Weightage
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("syllabus")}
                  className="text-slate-600 hover:text-slate-900 text-left transition-colors"
                >
                  Downloadable Study Notes (PDF)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("tests")}
                  className="text-slate-600 hover:text-slate-900 text-left transition-colors"
                >
                  Topic-wise Practice Tests
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("tests")}
                  className="text-slate-600 hover:text-slate-900 text-left transition-colors"
                >
                  Full-length Mock Examinations
                </button>
              </li>
            </ul>
          </div>

          {/* Student Support & Policies */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Student Support
            </h4>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Have questions regarding test evaluation, syllabus updates, or technical access? Contact our academic support desk.
            </p>
            <div className="space-y-2 text-xs">
              <a
                href={`mailto:${BRAND.supportEmail}`}
                className="flex items-center gap-2 text-blue-900 hover:text-blue-800 font-medium"
              >
                <Mail className="w-3.5 h-3.5 text-blue-700" />
                <span>{BRAND.supportEmail}</span>
              </a>
              <button
                onClick={() => onNavigate("about")}
                className="text-slate-600 hover:text-slate-900 text-left block transition-colors"
              >
                Product Philosophy & Team
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Legal bar */}
        <div className="pt-8 mt-8 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {currentYear} {BRAND.legalName}. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span>Academic Integrity</span>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
