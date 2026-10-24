"use client";

import React, { useState, useEffect } from "react";
import { Exam, Subject, Resource } from "../lib/types";
import { FALLBACK_SUBJECTS, FALLBACK_RESOURCES, fetchSubjects, fetchPublishedResources } from "../lib/api";
import {
  BookOpen,
  FileText,
  Download,
  CheckCircle2,
  ChevronRight,
  Layers,
  ExternalLink,
  GraduationCap,
  Sparkles,
  Award,
  Check,
} from "lucide-react";

interface SyllabusExplorerProps {
  exam: Exam;
}

export function SyllabusExplorer({ exam }: SyllabusExplorerProps) {
  const [subjects, setSubjects] = useState<Subject[]>(FALLBACK_SUBJECTS);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(FALLBACK_SUBJECTS[0].id);
  const [resources, setResources] = useState<Resource[]>(FALLBACK_RESOURCES);
  const [activeNoteModal, setActiveNoteModal] = useState<Resource | null>(null);

  useEffect(() => {
    if (exam?.id) {
      fetchSubjects(exam.id).then((loaded) => {
        if (loaded && loaded.length > 0) {
          setSubjects(loaded);
          setSelectedSubjectId(loaded[0].id);
        }
      });
      fetchPublishedResources(exam.id).then((res) => {
        if (res && res.length > 0) {
          setResources(res);
        }
      });
    }
  }, [exam?.id]);

  const activeSubject =
    subjects.find((s) => s.id === selectedSubjectId) || subjects[0] || FALLBACK_SUBJECTS[0];

  const topicsMap: Record<string, string[]> = {
    "sub-1": [
      "Counting Principles, Permutations & Combinations",
      "Probability Axioms & Sample Spaces",
      "Conditional Probability & Bayes Theorem",
      "Discrete Random Variables (Bernoulli, Binomial, Poisson)",
      "Continuous Random Variables (Uniform, Exponential, Normal/Gaussian)",
      "Joint Distributions, Marginal Densities & Independence",
      "Expectation, Variance, Covariance & Correlation Coefficients",
      "Central Limit Theorem & Chebyshev's Inequality",
      "Hypothesis Testing, p-values, z-test, t-test & Confidence Intervals",
    ],
    "sub-2": [
      "Vector Spaces, Subspaces & Linear Span",
      "Linear Independence, Basis & Dimension",
      "Systems of Linear Equations (Row Echelon Form, Rank-Nullity Theorem)",
      "Matrices, Determinants, Trace & Inverses",
      "Eigenvalues, Eigenvectors & Characteristic Equations",
      "Diagonalization & Cayley-Hamilton Theorem",
      "Inner Product Spaces & Gram-Schmidt Orthogonalization",
      "Singular Value Decomposition (SVD) & Geometric Interpretation",
      "Principal Component Analysis (PCA) & Dimensionality Reduction",
    ],
    "sub-3": [
      "Supervised vs Unsupervised Learning Paradigms",
      "Linear Regression, Normal Equation & Ordinary Least Squares",
      "Regularization Techniques (L1 Lasso, L2 Ridge, ElasticNet)",
      "Logistic Regression & Maximum Likelihood Estimation (MLE)",
      "Support Vector Machines (Linear & Kernel SVM, Slack Variables)",
      "Decision Trees (Information Gain, Entropy, Gini Impurity)",
      "Ensemble Learning (Random Forests, Gradient Boosting, XGBoost)",
      "K-Means Clustering & Elbow Method",
      "Hierarchical Clustering & Dendrograms",
      "Multilayer Perceptrons, Activation Functions & Backpropagation",
    ],
    "sub-4": [
      "Uninformed Search Strategies (BFS, DFS, Uniform Cost Search)",
      "Informed Heuristic Search (Greedy Best-First, A* Search)",
      "Heuristic Admissibility & Consistency Criteria",
      "Adversarial Search & Minimax Algorithm",
      "Alpha-Beta Pruning Optimization",
      "Propositional Logic & First-Order Predicate Calculus",
      "Inference Rules, Resolution & Forward/Backward Chaining",
    ],
    "sub-5": [
      "Python Programming & Complexity Analysis (Big-O, Big-Omega, Big-Theta)",
      "Linear Data Structures: Arrays, Linked Lists, Stacks, Queues",
      "Binary Trees & Binary Search Trees (BST Operations)",
      "Sorting Algorithms (MergeSort, QuickSort, HeapSort)",
      "Graph Representations & Graph Traversal (BFS, DFS)",
      "Shortest Path Algorithms (Dijkstra, Bellman-Ford)",
      "Dynamic Programming Principles (Memoization, Tabulation)",
    ],
  };

  const currentTopics = topicsMap[selectedSubjectId] || [
    "Fundamental Definitions & Core Theorems",
    "Key Mathematical Formulations & Derivations",
    "Standard Worked Numerical Problem Types",
    "Previous Year Competitive Examination Question Drill",
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{exam.code} Curriculum &amp; Study Notes</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Official Academic Syllabus Explorer
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Systematic chapter breakdowns, key formulas, and verified downloadable revision sheets curated strictly according to the latest IISc/IIT examination guidelines.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Subjects Navigation (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 px-1 mb-2">
            <span>Disciplines ({subjects.length})</span>
            <span className="text-[11px] text-blue-600 font-semibold">Verified Scope</span>
          </div>

          <div className="space-y-2">
            {subjects.map((subj, idx) => {
              const isSelected = subj.id === selectedSubjectId;
              return (
                <div
                  key={subj.id}
                  onClick={() => setSelectedSubjectId(subj.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between shadow-xs ${
                    isSelected
                      ? "bg-white border-blue-600 ring-2 ring-blue-600/10 shadow-sm"
                      : "bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{subj.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{subj.code}</div>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      isSelected ? "text-blue-600 translate-x-0.5" : "text-slate-400"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Topics & Downloadable Materials (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Subject Scope Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="badge-pill-pulse text-[11px] py-0.5 px-2.5">
                Active Discipline Scope
              </span>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                {currentTopics.length} Core Modules
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-2">{activeSubject.name}</h2>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              {activeSubject.description}
            </p>
          </div>

          {/* Topics List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
              <span>Curriculum Chapters &amp; Problem Sets</span>
              <span className="text-[11px] text-emerald-600 font-semibold">100% Exam Fidelity</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {currentTopics.map((topic, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs hover:border-slate-300 transition-colors shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-800 font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-slate-800 font-medium">{topic}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                    Syllabus Verified
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Downloadable Study Notes & Revision Sheets */}
          <div className="space-y-3 pt-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
              Verified Study Notes &amp; Formula Sheets
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {resources.map((res) => (
                <div
                  key={res.id}
                  className="startup-card p-5 bg-white border border-slate-200 flex flex-col justify-between shadow-xs"
                >
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 mb-3">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 mb-1 leading-snug">
                      {res.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {res.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      PDF Document
                    </span>
                    <button
                      onClick={() => setActiveNoteModal(res)}
                      className="text-xs text-blue-600 font-bold hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Read Summary</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Note Reader Modal */}
      {activeNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 relative">
            <h3 className="text-base font-bold text-slate-900 mb-1">{activeNoteModal.title}</h3>
            <div className="text-xs text-slate-500 mb-4">{activeNoteModal.description}</div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs text-slate-700 leading-relaxed max-h-64 overflow-y-auto">
              <div className="font-semibold text-slate-900">Key Conceptual Derivations &amp; Formulas:</div>
              <ul className="list-disc pl-4 space-y-1.5 text-slate-600">
                <li>Formal mathematical definitions and core axioms adhering strictly to the official syllabus.</li>
                <li>Worked example problems illustrating frequent competitive examination traps and boundary cases.</li>
                <li>Formulas for quick numerical calculations matching the virtual scientific calculator precision.</li>
                <li>Step-by-step proofs for essential lemmas and dimensionality reduction techniques.</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveNoteModal(null)}
                className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
