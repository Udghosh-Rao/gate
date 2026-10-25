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
  const [subjectError, setSubjectError] = useState<string | null>(null);
  const [resourceError, setResourceError] = useState<string | null>(null);
  const [topicError, setTopicError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [topicReload, setTopicReload] = useState(0);

  useEffect(() => {
    let ignore = false;
    void Promise.resolve().then(async () => {
      const [subjectResult, resourceResult] = await Promise.allSettled([
        fetchSubjects(exam.id), fetchPublishedResources(exam.id),
      ]);
      if (ignore) return;
      if (subjectResult.status === "fulfilled") {
        setSubjects(subjectResult.value);
        setSelectedSubjectId((current) => subjectResult.value.some((item) => item.id === current) ? current : (subjectResult.value[0]?.id || ""));
        setSubjectError(null);
      } else {
        setSubjectError(subjectResult.reason instanceof Error ? subjectResult.reason.message : "Unable to load syllabus subjects.");
      }
      if (resourceResult.status === "fulfilled") {
        setResources(resourceResult.value);
        setResourceError(null);
      } else {
        setResourceError(resourceResult.reason instanceof Error ? resourceResult.reason.message : "Unable to load study materials.");
      }
    });
    return () => { ignore = true; };
  }, [exam.id, reload]);

  const activeSubject = subjects.find((subject) => subject.id === selectedSubjectId) || null;

  useEffect(() => {
    if (!selectedSubjectId) return;
    let ignore = false;
    void Promise.resolve().then(async () => {
      try {
        const loaded = await fetchTopics(selectedSubjectId);
        if (!ignore) {
          setTopics(loaded);
          setTopicError(null);
        }
      } catch (error) {
        if (!ignore) setTopicError(error instanceof Error ? error.message : "Unable to load syllabus topics.");
      }
    });
    return () => { ignore = true; };
  }, [selectedSubjectId, topicReload]);
  const currentTopics = selectedSubjectId ? topics.filter((topic) => topic.is_active) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{exam.code} Curriculum &amp; Study Notes</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Syllabus &amp; study materials
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
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

          {subjectError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">{subjectError}<button onClick={() => setReload((value) => value + 1)} className="ml-2 font-semibold underline">Retry</button></div>}
          {!subjectError && subjects.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-xs leading-5 text-slate-600">No subjects have been published for this examination yet.</div>}
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
              {topicError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">{topicError}<button onClick={() => setTopicReload((value) => value + 1)} className="ml-2 font-semibold underline">Retry</button></div>}
              {!topicError && currentTopics.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-xs leading-5 text-slate-600">No topics are published under this subject yet.</div>}
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
              {resourceError && <div role="alert" className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">{resourceError}<button onClick={() => setReload((value) => value + 1)} className="ml-2 font-semibold underline">Retry</button></div>}
              {!resourceError && resources.length === 0 && <div className="sm:col-span-2 rounded-xl border border-dashed border-slate-300 bg-white p-5 text-xs leading-5 text-slate-600">No study materials have been published for this examination yet.</div>}
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
                      {res.resource_type.replaceAll("_", " ")}
                    </span>
                    <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${res.is_paid ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600"}`}>{res.is_paid ? "Subscription required" : "Free access"}</span>
                  </div>
                  <p className="mt-3 text-[10px] leading-5 text-slate-500">In-app note reading is not available yet.</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
