"use client";

import React from "react";
import { BRAND } from "../lib/brand";
import { GraduationCap } from "lucide-react";

interface FooterProps {
  onNavigate: (tab: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-brand-block">
          <div className="footer-brand"><span className="footer-mark"><GraduationCap size={18} /></span><strong>{BRAND.name}</strong></div>
          <p>Structured preparation for competitive exams, from syllabus exploration to timed practice and released results.</p>
          <small>Independent preparation resource. No examination-board affiliation is claimed.</small>
        </div>
        <div className="footer-links-group">
          <h2>Explore</h2>
          <button onClick={() => onNavigate("home")}>Examinations</button>
          <button onClick={() => onNavigate("syllabus")}>Syllabus &amp; notes</button>
          <button onClick={() => onNavigate("tests")}>Mock tests</button>
          <button onClick={() => onNavigate("pricing")}>Pricing</button>
        </div>
        <div className="footer-links-group">
          <h2>Your account</h2>
          <button onClick={() => onNavigate("dashboard")}>Student dashboard</button>
          <button onClick={() => onNavigate("about")}>About ExamPrep</button>
        </div>
      </div>
      <div className="footer-bottom"><span>© {BRAND.name}</span><span>GATE DA is the initial examination focus.</span></div>
    </footer>
  );
}
