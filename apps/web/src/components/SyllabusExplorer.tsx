"use client";

import React, { useState, useEffect } from "react";
import { Exam, Subject, Resource, Topic } from "../lib/types";
import { fetchSubjects, fetchTopics, fetchPublishedResources } from "../lib/api";
import {
  BookOpen,
  FileText,
  CheckCircle2,
  ChevronRight,
  Layers,
  GraduationCap,
  Sparkles,
  Award,
  Check,
} from "lucide-react";

interface SyllabusExplorerProps {
  exam: Exam;
}

export function SyllabusExplorer({ exam }: SyllabusExplorerProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [resources, setResources] = useState<Resource[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  useEffect(() => {
    if (exam?.id) {
      fetchSubjects(exam.id).then((loaded) => {
        setSubjects(loaded);
        setSelectedSubjectId((current) => loaded.some((item) => item.id === current) ? current : (loaded[0]?.id || ""));
      });
      fetchPublishedResources(exam.id).then(setResources).catch(() => setResources([]));
    }
  }, [exam?.id]);

  const activeSubject = subjects.find((subject) => subject.id === selectedSubjectId) || null;

  useEffect(() => {
    fetchTopics(selectedSubjectId).then(setTopics).catch(() => setTopics([]));
  }, [selectedSubjectId]);
  const currentTopics = topics.filter((topic) => topic.is_active);

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
            Published syllabus and resources
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Browse the syllabus topics and study materials published for this examination.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Subjects Navigation (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 px-1 mb-2">
            <span>Disciplines ({subjects.length})</span>
            <span className="text-[11px] text-blue-600 font-semibold">Published subjects</span>
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

        {/* Right: Topics & Study Materials (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Subject Scope Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="badge-pill-pulse text-[11px] py-0.5 px-2.5">
                Active Discipline Scope
              </span>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                {currentTopics.length} Topics
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-2">{activeSubject?.name || "Select a subject"}</h2>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              {activeSubject?.description || "Choose a published subject to view its topics."}
            </p>
          </div>

          {/* Topics List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
              <span>Curriculum Chapters &amp; Problem Sets</span>
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
                    <span className="text-slate-800 font-medium">{topic.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Published Study Notes */}
          <div className="space-y-3 pt-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
              Published Study Materials
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
                    <span className="text-xs font-medium text-slate-500">Secure reader not configured</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
