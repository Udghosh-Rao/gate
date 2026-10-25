"use client";

import React from "react";
import { BookOpen, ClipboardCheck, Timer, ChartNoAxesColumn } from "lucide-react";

interface AboutPageProps { onNavigate: (tab: string) => void; }

export function AboutPage({ onNavigate }: AboutPageProps) {
  const capabilities = [
    { icon: BookOpen, title: "Published study content", text: "Exams, subjects, topics, and resources are shown from the platform database when they are published." },
    { icon: ClipboardCheck, title: "Question practice", text: "The question bank supports multiple-choice, multiple-select, and numerical-answer questions." },
    { icon: Timer, title: "Timed attempts", text: "Published tests can be taken in a computer-based interface with answer controls and a server-recorded deadline." },
    { icon: ChartNoAxesColumn, title: "Attempt results", text: "Scores and answer explanations follow each test's configured release policy." },
  ];

  return (
    <main className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
      <section className="max-w-3xl">
        <p className="text-sm font-semibold text-blue-700">About the platform</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">A clear place to study, practise, and review.</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">This platform provides exam preparation tools for the examinations and content currently configured by its administrators. It is independent and does not claim affiliation with an examination board.</p>
      </section>
      <section className="mt-12 grid gap-4 sm:grid-cols-2">
        {capabilities.map(({ icon: Icon, title, text }) => (
          <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><Icon size={20} /></span>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
          </article>
        ))}
      </section>
      <section className="mt-10 rounded-2xl bg-slate-950 p-7 text-white sm:p-9">
        <h2 className="text-xl font-semibold">Start with what is available</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">The available exams and study materials can change as administrators publish or update content.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button onClick={() => onNavigate("home")} className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-blue-50">Browse exams</button>
          <button onClick={() => onNavigate("tests")} className="rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">View practice tests</button>
        </div>
      </section>
    </main>
  );
}
