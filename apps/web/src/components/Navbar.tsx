"use client";

import React, { useEffect, useRef, useState } from "react";
import { User, Exam } from "../lib/types";
import { BRAND } from "../lib/brand";
import { apiLogout } from "../lib/api";
import {
  BookOpen, ChevronDown, GraduationCap, LayoutDashboard, LogIn, LogOut,
  Menu, ShieldCheck, X, Layers3, WalletCards,
} from "lucide-react";

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  exams: Exam[];
  selectedExam: Exam | null;
  setSelectedExam: React.Dispatch<React.SetStateAction<Exam | null>>;
  onOpenAuth: (mode?: "login" | "register") => void;
}

export function Navbar({
  currentTab, setCurrentTab, currentUser, setCurrentUser, exams,
  selectedExam, setSelectedExam, onOpenAuth,
}: NavbarProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showExamMenu, setShowExamMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const examRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const isAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "CONTENT_MANAGER";
  const destinations = [
    { id: "home", label: "Examinations" },
    { id: "syllabus", label: "Syllabus & notes", icon: BookOpen },
    { id: "tests", label: "Mock tests", icon: Layers3 },
    { id: "pricing", label: "Pricing", icon: WalletCards },
  ];

  useEffect(() => {
    const closeMenus = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!examRef.current?.contains(target)) setShowExamMenu(false);
      if (!userRef.current?.contains(target)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", closeMenus);
    return () => document.removeEventListener("mousedown", closeMenus);
  }, []);

  const navigate = (destination: string) => {
    setCurrentTab(destination);
    setShowMobileMenu(false);
  };

  const logout = async () => {
    await apiLogout();
    setCurrentUser(null);
    setShowUserMenu(false);
    if (currentTab === "admin" || currentTab === "dashboard") navigate("home");
  };

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <button className="brand-lockup" onClick={() => navigate("home")} aria-label={`${BRAND.name} home`}>
          <span className="brand-mark"><GraduationCap size={20} strokeWidth={2.1} /></span>
          <span className="brand-copy"><strong>{BRAND.name}</strong><small>Competitive exam preparation</small></span>
        </button>

        <nav className="desktop-nav" aria-label="Main navigation">
          {destinations.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => navigate(id)} className={currentTab === id ? "nav-link active" : "nav-link"}>
              {Icon && <Icon size={15} aria-hidden="true" />}{label}
            </button>
          ))}
          {currentUser && <button onClick={() => navigate("dashboard")} className={currentTab === "dashboard" ? "nav-link active" : "nav-link"}><LayoutDashboard size={15} />Dashboard</button>}
          {isAdmin && <button onClick={() => navigate("admin")} className={currentTab === "admin" ? "nav-link active" : "nav-link"}><ShieldCheck size={15} />Admin</button>}
        </nav>

        <div className="header-actions">
          {exams.length > 0 && <div className="exam-picker" ref={examRef}>
            <button className="exam-picker-trigger" onClick={() => setShowExamMenu((open) => !open)} aria-expanded={showExamMenu}>
              <span className="exam-picker-dot" />{selectedExam?.code || "Choose exam"}<ChevronDown size={14} />
            </button>
            {showExamMenu && <div className="header-popover">
              <span className="popover-label">Examination</span>
              {exams.map((exam) => <button key={exam.id} className="exam-option" onClick={() => { setSelectedExam(exam); setShowExamMenu(false); }}>
                <span><strong>{exam.name}</strong><small>{exam.code}</small></span>{selectedExam?.id === exam.id && <span aria-label="Selected">✓</span>}
              </button>)}
            </div>}
          </div>}
          {currentUser ? <div className="user-menu" ref={userRef}>
            <button className="user-trigger" onClick={() => setShowUserMenu((open) => !open)} aria-expanded={showUserMenu}>
              <span className="user-avatar">{currentUser.full_name?.[0] || "U"}</span><span className="user-name">{currentUser.full_name}</span><ChevronDown size={14} />
            </button>
            {showUserMenu && <div className="header-popover user-popover">
              <span className="popover-label">{currentUser.email}</span>
              <button className="popover-action" onClick={() => navigate("dashboard")}><LayoutDashboard size={15} />Student dashboard</button>
              {isAdmin && <button className="popover-action" onClick={() => navigate("admin")}><ShieldCheck size={15} />Content management</button>}
              <button className="popover-action danger" onClick={() => void logout()}><LogOut size={15} />Sign out</button>
            </div>}
          </div> : <div className="auth-actions">
            <button className="sign-in-link" onClick={() => onOpenAuth("login")}><LogIn size={15} />Sign in</button>
            <button className="get-started-button" onClick={() => onOpenAuth("register")}>Get started</button>
          </div>}
          <button className="mobile-menu-button" onClick={() => setShowMobileMenu((open) => !open)} aria-label={showMobileMenu ? "Close navigation" : "Open navigation"} aria-expanded={showMobileMenu}>
            {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {showMobileMenu && <div className="mobile-navigation">
        <nav aria-label="Mobile navigation">{destinations.map(({ id, label }) => <button key={id} className={currentTab === id ? "mobile-nav-link active" : "mobile-nav-link"} onClick={() => navigate(id)}>{label}</button>)}
          {currentUser && <button className="mobile-nav-link" onClick={() => navigate("dashboard")}>Student dashboard</button>}
          {isAdmin && <button className="mobile-nav-link" onClick={() => navigate("admin")}>Content management</button>}
        </nav>
        {exams.length > 0 && <label className="mobile-exam-select">Selected examination
          <select value={selectedExam?.id || ""} onChange={(event) => setSelectedExam(exams.find((exam) => exam.id === event.target.value) || null)}>
            {exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.code} · {exam.name}</option>)}
          </select>
        </label>}
        {!currentUser && <div className="mobile-auth-actions"><button className="sign-in-link" onClick={() => { setShowMobileMenu(false); onOpenAuth("login"); }}>Sign in</button><button className="get-started-button" onClick={() => { setShowMobileMenu(false); onOpenAuth("register"); }}>Get started</button></div>}
      </div>}
    </header>
  );
}
