"use client";

import React, { useState } from "react";
import { User } from "../lib/types";
import { BRAND } from "../lib/brand";
import { apiLogin, apiRegister, SEED_CREDENTIALS } from "../lib/api";
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  AlertCircle,
  Loader2,
  KeyRound,
  GraduationCap,
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: "login" | "register";
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export function AuthModal({
  isOpen,
  initialMode = "login",
  onClose,
  onSuccess,
}: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(initialMode === "register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (isRegister) {
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters long.");
        }
        if (!/[A-Z]/.test(password)) {
          throw new Error("Password must contain at least one uppercase letter.");
        }
        if (!/[a-z]/.test(password)) {
          throw new Error("Password must contain at least one lowercase letter.");
        }
        if (!/[0-9]/.test(password)) {
          throw new Error("Password must contain at least one digit.");
        }

        const { user } = await apiRegister(email, password, fullName, phone || undefined);
        onSuccess(user);
        onClose();
      } else {
        const { user } = await apiLogin(email, password);
        onSuccess(user);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = async (key: "student" | "admin") => {
    setErrorMsg(null);
    const creds = SEED_CREDENTIALS[key];
    setEmail(creds.email);
    setPassword(creds.password);
    setIsRegister(false);

    setIsLoading(true);
    try {
      const { user } = await apiLogin(creds.email, creds.password);
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-xl p-6 sm:p-8 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          disabled={isLoading}
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-slate-900 mx-auto flex items-center justify-center text-white mb-3 shadow-xs">
            <GraduationCap className="w-5 h-5 text-slate-100" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {isRegister ? `Register on ${BRAND.name}` : `Sign In to ${BRAND.name}`}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isRegister
              ? "Create your student account to access study materials and test series."
              : "Access your saved test attempts, progress history, and notes."}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isLoading}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Mobile Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="student@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-700">
                Password <span className="text-red-500">*</span>
              </label>
              {isRegister && (
                <span className="text-[10px] text-slate-500">Min 8 chars, 1 uppercase, 1 digit</span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 mt-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <>
                <span>{isRegister ? "Create Student Account" : "Sign In"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Login / Register */}
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMsg(null);
            }}
            disabled={isLoading}
            className="text-xs text-blue-700 hover:text-blue-900 font-medium transition-colors"
          >
            {isRegister
              ? "Already have an account? Sign In"
              : "New student? Register a free account"}
          </button>
        </div>

        {/* Development & Testing Credentials */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-slate-500" />
              Testing Accounts (FastAPI Backend)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill("student")}
              disabled={isLoading}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors"
            >
              <div className="text-[11px] font-semibold text-slate-900">
                Student Account
              </div>
              <div className="text-[9px] text-slate-500 truncate">student@examplatform.dev</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill("admin")}
              disabled={isLoading}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors"
            >
              <div className="text-[11px] font-semibold text-slate-900">
                Admin Account
              </div>
              <div className="text-[9px] text-slate-500 truncate">admin@examplatform.dev</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
