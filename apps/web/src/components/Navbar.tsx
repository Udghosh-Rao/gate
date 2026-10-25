"use client";

import React, { useState, useEffect, useRef } from "react";
import { User, Exam } from "../lib/types";
import { BRAND } from "../lib/brand";
import { apiLogout } from "../lib/api";
import {
  BookOpen,
  Award,
  Layers,
  ShieldCheck,
  User as UserIcon,
  ChevronDown,
  PlayCircle,
  LayoutDashboard,
  Info,
  Menu,
  X,
  LogOut,
  LogIn,
  KeyRound,
  Check,
  GraduationCap,
  FileText,
} from "lucide-react";

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  exams: Exam[];
  selectedExam: Exam | null;
  setSelectedExam: React.Dispatch<React.SetStateAction<Exam | null>>;
  onLaunchMockTest: () => void;
  onOpenAuth: (mode?: "login" | "register") => void;
}

export function Navbar({
  currentTab,
  setCurrentTab,
  currentUser,
  setCurrentUser,
  exams,
  selectedExam,
  setSelectedExam,
  onLaunchMockTest,
  onOpenAuth,
}: NavbarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showExamMenu, setShowExamMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const examRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (examRef.current && !examRef.current.contains(e.target as Node)) {
        setShowExamMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await apiLogout();
    setCurrentUser(null);
    setShowUserMenu(false);
    if (currentTab === "admin" || currentTab === "dashboard") {
      setCurrentTab("home");
    }
  };


  const handleNavClick = (tab: string) => {
    setCurrentTab(tab);
    setShowMobileMenu(false);
  };

  const navItems = [
    { id: "home", label: "Overview", icon: null },
    { id: "syllabus", label: "Syllabus & Notes", icon: BookOpen },
    { id: "tests", label: "Mock Tests", icon: Layers },
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "about", label: "About & Vision", icon: Info },
  ];

  const isAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "CONTENT_MANAGER";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo & Exam Track */}
        <div className="flex items-center gap-4 lg:gap-6">
          <div
            onClick={() => handleNavClick("home")}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-4 h-4 text-slate-100" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-slate-900 leading-tight">
                {BRAND.name}
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-tight">
                Competitive Prep
              </span>
            </div>
          </div>

          {/* Active Examination Track Picker */}
          <div className="relative hidden sm:block" ref={examRef}>
            <button
              onClick={() => setShowExamMenu(!showExamMenu)}
              className="flex items-center gap-2 px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{selectedExam?.code || "Select exam"}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showExamMenu && (
              <div className="absolute left-0 mt-2 w-72 rounded-xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-fadeIn">
                <div className="text-[10px] font-bold text-slate-400 px-3 py-1.5 uppercase tracking-wider">
                  Select Examination Track
                </div>
                {exams.map((exam) => (
                  <button
                    key={exam.id}
                    onClick={() => {
                      setSelectedExam(exam);
                      setShowExamMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                      selectedExam?.id === exam.id
                        ? "bg-blue-50 text-blue-900 font-semibold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="text-slate-900 font-medium">{exam.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{exam.code}</div>
                    </div>
                    {selectedExam?.id === exam.id && (
                      <span className="text-blue-700 font-bold">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors text-xs font-medium ${
                  isActive
                    ? "bg-slate-100 text-slate-900 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5 text-slate-500" />}
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Admin link (Only visible if Admin / Content Manager) */}
          {isAdmin && (
            <button
              onClick={() => handleNavClick("admin")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors text-xs font-medium ${
                currentTab === "admin"
                  ? "bg-amber-50 text-amber-900 border border-amber-200 font-semibold"
                  : "text-amber-700 hover:text-amber-900 hover:bg-amber-50/60"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Panel</span>
            </button>
          )}
        </nav>

        {/* Right Actions: Test Launch & Auth */}
        <div className="flex items-center gap-2.5">
          {/* Quick CBT Launch */}
          <button
            onClick={onLaunchMockTest}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg btn-primary-gradient text-xs font-semibold shadow-xs cursor-pointer"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Launch CBT</span>
          </button>

          {/* Authenticated User Menu or Unauthenticated Sign In buttons */}
          {currentUser ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-white border border-slate-200 hover:border-slate-300 text-xs text-slate-700 transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-[11px] font-bold text-white uppercase">
                  {currentUser.full_name ? currentUser.full_name[0] : "U"}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <div className="text-[11px] font-semibold text-slate-900 max-w-[100px] truncate">
                    {currentUser.full_name}
                  </div>
                  <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
                    {currentUser.role.replace("_", " ")}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-xl p-2.5 z-50 animate-fadeIn">
                  {/* Account Header */}
                  <div className="px-3 py-2 border-b border-slate-100 mb-2">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {currentUser.full_name}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{currentUser.email}</div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {currentUser.role}
                      </span>
                      <span className="text-[9px] text-emerald-600 flex items-center gap-1 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Verified
                      </span>
                    </div>
                  </div>

                  {/* Links */}
                  <div className="space-y-1">
                    <button
                      onClick={() => handleNavClick("dashboard")}
                      className="w-full text-left px-3 py-2 rounded-md text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" />
                      <span>Candidate Dashboard</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => handleNavClick("admin")}
                        className="w-full text-left px-3 py-2 rounded-md text-xs text-amber-800 hover:bg-amber-50 flex items-center gap-2 transition-colors font-medium"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                        <span>Admin Content Manager</span>
                      </button>
                    )}
                  </div>

                  {/* Sign Out */}
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-1.5 rounded-md text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors font-medium cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth("login")}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-slate-500" />
                <span>Sign In</span>
              </button>
              <button
                onClick={() => onOpenAuth("register")}
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-xs transition-colors cursor-pointer"
              >
                <span>Register</span>
              </button>
            </div>
          )}

          {/* Mobile hamburger menu */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden p-2 rounded-md bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {showMobileMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {showMobileMenu && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2 animate-fadeIn shadow-lg">
          {/* Mobile Track Selector */}
          <div className="pb-3 border-b border-slate-100 mb-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Active Examination Track
            </div>
            <div className="flex flex-wrap gap-2">
              {exams.map((exam) => (
                <button
                  key={exam.id}
                  onClick={() => setSelectedExam(exam)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                    selectedExam?.id === exam.id
                      ? "bg-slate-900 text-white font-semibold"
                      : "bg-slate-50 border border-slate-200 text-slate-700"
                  }`}
                >
                  {exam.code}
                </button>
              ))}
            </div>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-slate-100 text-slate-900 font-semibold"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {Icon && <Icon className="w-4 h-4 text-slate-500" />}
                <span>{item.label}</span>
              </button>
            );
          })}

          {isAdmin && (
            <button
              onClick={() => handleNavClick("admin")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs font-medium transition-colors ${
                currentTab === "admin"
                  ? "bg-amber-100 text-amber-900 font-semibold"
                  : "text-amber-800 hover:bg-amber-50"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Content Manager</span>
            </button>
          )}

          {!currentUser && (
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  onOpenAuth("login");
                }}
                className="flex-1 py-2 text-center text-xs font-semibold rounded-md bg-slate-50 border border-slate-200 text-slate-800"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  onOpenAuth("register");
                }}
                className="flex-1 py-2 text-center text-xs font-semibold rounded-md bg-blue-900 text-white"
              >
                Register
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
