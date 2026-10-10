"use client";

import {
  Activity, ArrowRight, ArrowUpRight, BadgeCheck,
  BookOpen, BriefcaseBusiness, Check, CheckCircle2, ChevronDown, CircleHelp,
  Clock3, Command, Cpu, FileCheck2, FileText, Fingerprint, FlaskConical,
  Gauge, Inbox, Layers3, LockKeyhole, Menu, MessageSquareText, MoreHorizontal,
  Play, RefreshCw, Search, ShieldAlert, ShieldCheck, Sparkles, Target, X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { EvaluatedCase, KnowledgeArticle, RoleSignal, RunMode, RunSummary, SupportCase } from "@/lib/contracts";

type View = "overview" | "signals" | "lab" | "proof";
type Health = {
  status: string;
  agentMode: "openrouter" | "rules-preview";
  integrations: { openrouter: boolean; crustdata: boolean; neatlogs: boolean };
};

const navigation: { id: View; label: string; icon: typeof Gauge; tag?: string }[] = [
  { id: "overview", label: "Overview", icon: Gauge },
  { id: "signals", label: "Hiring signals", icon: BriefcaseBusiness, tag: "01" },
  { id: "lab", label: "Workflow lab", icon: FlaskConical, tag: "02" },
  { id: "proof", label: "Run evidence", icon: Activity },
];

function percent(value: number) {
  return `${Math.max(0, Math.min(100, value))}%`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function StatusDot({ active = false, amber = false }: { active?: boolean; amber?: boolean }) {
  return <span className={`status-dot${active ? " is-active" : ""}${amber ? " is-amber" : ""}`} aria-hidden="true" />;
}

function IconButton({ label, children, onClick }: { label: string; children: React.ReactNode; onClick?: () => void }) {
  return <button className="icon-button" type="button" aria-label={label} onClick={onClick}>{children}</button>;
}

export function Dashboard({
  cases,
  articles,
  sampleRoles,
}: {
  cases: SupportCase[];
  articles: KnowledgeArticle[];
  sampleRoles: RoleSignal[];
}) {
  const [view, setView] = useState<View>("overview");
  const [health, setHealth] = useState<Health | null>(null);
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [activeRun, setActiveRun] = useState<RunSummary | null>(null);
  const [roles, setRoles] = useState<RoleSignal[]>(sampleRoles);
  const [roleSource, setRoleSource] = useState<"sample" | "crustdata">("sample");
  const [busy, setBusy] = useState(false);
  const [discoveryBusy, setDiscoveryBusy] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<string>(cases[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [ticketVolume, setTicketVolume] = useState(1800);
  const [minutesPerTicket, setMinutesPerTicket] = useState(9);
  const [hourlyCost, setHourlyCost] = useState(26);
  const [reviewRate, setReviewRate] = useState(20);
  const [reviewTimeSaved, setReviewTimeSaved] = useState(40);

  useEffect(() => {
    void Promise.all([
      fetch("/api/health").then((response) => response.json()).then((data: Health) => setHealth(data)).catch(() => undefined),
      fetch("/api/runs").then((response) => response.json()).then((data: { runs: RunSummary[] }) => setRuns(data.runs ?? [])).catch(() => undefined),
    ]);
  }, []);

  const selectedCase = cases.find((testCase) => testCase.id === selectedTicket) ?? cases[0];
  const latestRun = activeRun ?? runs[0] ?? null;
  const estimatedMonthlyValue = useMemo(() => {
    const hoursRecovered = ticketVolume * (reviewRate / 100) * (minutesPerTicket / 60) * (reviewTimeSaved / 100);
    const laborValue = hoursRecovered * hourlyCost;
    const modelCost = ticketVolume * (reviewRate / 100) * 0.02;
    return { hours: Math.round(hoursRecovered), laborValue: Math.round(laborValue), modelCost: Math.round(modelCost), net: Math.round(laborValue - modelCost) };
  }, [ticketVolume, reviewRate, minutesPerTicket, reviewTimeSaved, hourlyCost]);

  const pollRun = useCallback(async (runId: string, execution: Promise<void>) => {
    for (;;) {
      const response = await fetch(`/api/runs/${runId}`);
      if (!response.ok) break;
      const data = await response.json() as { run: RunSummary };
      setActiveRun(data.run);
      if (data.run.status === "completed" || data.run.status === "failed") break;
      await new Promise((resolve) => window.setTimeout(resolve, 650));
    }
    await execution;
    const finalResponse = await fetch(`/api/runs/${runId}`);
    if (finalResponse.ok) {
      const data = await finalResponse.json() as { run: RunSummary };
      setActiveRun(data.run);
      setRuns((previous) => [data.run, ...previous.filter((run) => run.id !== data.run.id)]);
    }
  }, []);

  const startRun = useCallback(async (mode: RunMode) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setActiveRun(null);
    try {
      const response = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const data = await response.json() as { run?: RunSummary; error?: string };
      if (!response.ok || !data.run) throw new Error(data.error || "Could not start an evaluation.");
      setActiveRun(data.run);
      const execution = fetch(`/api/runs/${data.run.id}/resume`, { method: "POST" })
        .then(async (result) => {
          if (!result.ok) {
            const body = await result.json() as { error?: string };
            throw new Error(body.error || "Evaluation stopped before all cases completed.");
          }
        });
      try {
        await pollRun(data.run.id, execution);
      } catch (runError) {
        setError(runError instanceof Error ? runError.message : "Evaluation could not finish.");
        const snapshot = await fetch(`/api/runs/${data.run.id}`).then((result) => result.json()) as { run?: RunSummary };
        if (snapshot.run) setActiveRun(snapshot.run);
      }
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Could not start an evaluation.");
    } finally {
      setBusy(false);
    }
  }, [busy, pollRun]);

  const resumeRun = useCallback(async (run: RunSummary) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setActiveRun(run);
    const execution = fetch(`/api/runs/${run.id}/resume`, { method: "POST" })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json() as { error?: string };
          throw new Error(body.error || "The saved run could not resume.");
        }
      });
    try {
      await pollRun(run.id, execution);
    } catch (resumeError) {
      setError(resumeError instanceof Error ? resumeError.message : "The saved run could not resume.");
    } finally {
      setBusy(false);
    }
  }, [busy, pollRun]);

  const refreshSignals = useCallback(async () => {
    setDiscoveryBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/discovery", { method: "POST" });
      const data = await response.json() as { roles?: RoleSignal[]; source?: "sample" | "crustdata"; error?: string };
      if (!response.ok) throw new Error(data.error || "Market signal search failed.");
      setRoles(data.roles ?? []);
      setRoleSource(data.source ?? "sample");
    } catch (discoveryError) {
      setError(discoveryError instanceof Error ? discoveryError.message : "Market signal search failed.");
    } finally {
      setDiscoveryBusy(false);
    }
  }, []);

  const modeLabel = health?.agentMode === "openrouter" ? "OpenRouter · live" : "Rules preview · offline";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#home" onClick={(event) => { event.preventDefault(); setView("overview"); }}>
          <span className="brand-mark"><Command size={19} strokeWidth={2.2} /></span>
          <span className="brand-copy"><strong>jobsmith</strong><small>WORKFORCE INTELLIGENCE</small></span>
        </a>

        <div className="workspace-switcher">
          <div className="workspace-monogram">N</div>
          <div><strong>Northstar Studio</strong><small>Demo workspace</small></div>
          <ChevronDown size={15} />
        </div>

        <div className="side-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navigation.map(({ id, label, icon: Icon, tag }) => (
            <button key={id} type="button" onClick={() => { setView(id); setError(null); }} className={`nav-item${view === id ? " active" : ""}`} aria-current={view === id ? "page" : undefined}>
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span>{tag && <small>{tag}</small>}
            </button>
          ))}
        </nav>

        <div className="side-separator" />
        <div className="side-label">YOUR EVIDENCE</div>
        <div className="side-evidence">
          <div className="evidence-icon"><Layers3 size={16} /></div>
          <div><strong>12 case files</strong><small>8 practice · 4 held out</small></div>
        </div>
        <div className="side-evidence">
          <div className="evidence-icon"><BookOpen size={16} /></div>
          <div><strong>6 policy articles</strong><small>Synthetic knowledge base</small></div>
        </div>

        <div className="sidebar-bottom">
          <div className="integration-card">
            <div className="integration-head"><span className="integration-glyph"><Activity size={14} /></span><strong>Signal health</strong><MoreHorizontal size={16} /></div>
            <div className="integration-row"><StatusDot active={health?.integrations.neatlogs} /><span>neatlogs traces</span><small>{health?.integrations.neatlogs ? "ON" : "SETUP"}</small></div>
            <div className="integration-row"><StatusDot active={health?.integrations.openrouter} amber={!health?.integrations.openrouter} /><span>Model runtime</span><small>{health?.integrations.openrouter ? "LIVE" : "LOCAL"}</small></div>
          </div>
          <button className="profile-row" type="button" onClick={() => setView("proof")}>
            <span className="avatar">PD</span><span><strong>Pratik Daithankar</strong><small>Hackathon build</small></span><MoreHorizontal size={17} />
          </button>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="breadcrumb"><span>JobSmith</span><span className="crumb-slash">/</span><strong>{navigation.find((item) => item.id === view)?.label}</strong></div>
          <div className="topbar-actions">
            <div className="environment-pill"><StatusDot amber={!health?.integrations.openrouter} active={health?.integrations.openrouter} /><span>{health?.integrations.openrouter ? "LIVE MODEL" : "SYNTHETIC DATA"}</span></div>
            <IconButton label="Search" onClick={() => setView("signals")}><Search size={17} /></IconButton>
            <IconButton label="Help"><CircleHelp size={17} /></IconButton>
          </div>
        </header>

        <div className="page-content">
          {error && <div role="alert" className="error-banner"><ShieldAlert size={17} /><span>{error}</span><button type="button" onClick={() => setError(null)} aria-label="Dismiss error"><X size={15} /></button></div>}

          {view === "overview" && <Overview
            latestRun={latestRun}
            runs={runs}
            busy={busy}
            modeLabel={modeLabel}
            economics={estimatedMonthlyValue}
            ticketVolume={ticketVolume}
            minutesPerTicket={minutesPerTicket}
            hourlyCost={hourlyCost}
            reviewRate={reviewRate}
            reviewTimeSaved={reviewTimeSaved}
            onTicketVolume={setTicketVolume}
            onMinutesPerTicket={setMinutesPerTicket}
            onHourlyCost={setHourlyCost}
            onReviewRate={setReviewRate}
            onReviewTimeSaved={setReviewTimeSaved}
            onRun={() => void startRun("evaluation")}
            onOpenLab={() => setView("lab")}
            onOpenProof={() => setView("proof")}
          />}
          {view === "signals" && <Signals roles={roles} source={roleSource} busy={discoveryBusy} connected={Boolean(health?.integrations.crustdata)} onRefresh={() => void refreshSignals()} />}
          {view === "lab" && <WorkflowLab
            cases={cases}
            articles={articles}
            selectedCase={selectedCase}
            selectedTicket={selectedTicket}
            result={activeRun?.results.find((result) => result.caseId === selectedTicket)}
            run={activeRun}
            busy={busy}
            modeLabel={modeLabel}
            onSelect={setSelectedTicket}
            onRun={() => void startRun("practice")}
          />}
          {view === "proof" && <RunEvidence runs={runs} activeRun={activeRun} busy={busy} onRun={() => void startRun("evaluation")} onResume={(run) => void resumeRun(run)} onSelect={(run) => setActiveRun(run)} />}
        </div>

        <footer className="app-footer"><span>JOBSMITH / SUPPORT PILOT 01</span><span>All customer records are synthetic · No inbox connected</span><span>Build 0.1.0</span></footer>
      </main>
    </div>
  );
}

function Overview({
  latestRun, runs, busy, modeLabel, economics, ticketVolume, minutesPerTicket, hourlyCost, reviewRate, reviewTimeSaved,
  onTicketVolume, onMinutesPerTicket, onHourlyCost, onReviewRate, onReviewTimeSaved, onRun, onOpenLab, onOpenProof,
}: {
  latestRun: RunSummary | null;
  runs: RunSummary[];
  busy: boolean;
  modeLabel: string;
  economics: { hours: number; laborValue: number; modelCost: number; net: number };
  ticketVolume: number;
  minutesPerTicket: number;
  hourlyCost: number;
  reviewRate: number;
  reviewTimeSaved: number;
  onTicketVolume: (value: number) => void;
  onMinutesPerTicket: (value: number) => void;
  onHourlyCost: (value: number) => void;
  onReviewRate: (value: number) => void;
  onRun: () => void;
  onOpenLab: () => void;
  onOpenProof: () => void;
  onReviewTimeSaved: (value: number) => void;
}) {
  const completed = latestRun?.status === "completed";
  return <>
    <div className="page-heading-row">
      <div><div className="eyebrow"><span className="eyebrow-mark">01</span> THE SUPPORT WORKFORCE DESK</div><h1>Put the next hire<br className="desktop-break" /> through probation.</h1><p className="page-subtitle">Find the support work hiding in your hiring plan. Then make an AI coworker prove it can handle the work safely.</p></div>
      <div className="heading-actions"><span className="date-chip"><span className="date-square">10</span><span>OCT 2026</span><ChevronDown size={13} /></span><button className="secondary-button" type="button" onClick={onOpenProof}><FileCheck2 size={15} /> Evidence ledger</button></div>
    </div>

    <section className="hero-card" aria-labelledby="hero-title">
      <div className="hero-pattern" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /></div>
      <div className="hero-copy">
        <div className="hero-overline"><span className="hero-spark"><Sparkles size={13} /></span> PILOT READINESS <span className="hero-divider" /> <span>DEMO COMPANY</span></div>
        <h2 id="hero-title">Your next support teammate<br />has a <em>probation period.</em></h2>
        <p>Start with an open role. Test the repeatable work against a private case set. Keep every draft reviewable and every policy citation visible.</p>
        <div className="hero-actions">
          <button className="primary-button" type="button" disabled={busy} onClick={onRun}><Play size={15} fill="currentColor" />{busy ? "Running evaluation…" : completed ? "Run it again" : "Test 4 held-out cases"}<ArrowRight size={16} /></button>
          <span className="hero-mode"><StatusDot active={modeLabel.startsWith("OpenRouter")} amber={!modeLabel.startsWith("OpenRouter")} />{modeLabel}</span>
        </div>
        <div className="hero-footnote"><LockKeyhole size={12} /> Dry run only · Nothing is sent to customers</div>
      </div>
      <div className="hero-orbit" aria-hidden="true">
        <div className="orbit-ring orbit-ring-one" /><div className="orbit-ring orbit-ring-two" />
        <div className="orbit-core"><Command size={31} /></div>
        <div className="orbit-chip orbit-chip-top"><ShieldCheck size={15} /><span>BOUNDARIES</span></div>
        <div className="orbit-chip orbit-chip-left"><FileText size={15} /><span>EVIDENCE</span></div>
        <div className="orbit-chip orbit-chip-right"><Activity size={15} /><span>TRACE</span></div>
        <div className="orbit-caption">CONTROLLED PILOT <span>•</span> 01/04</div>
      </div>
      <div className="hero-index">JS / 001</div>
    </section>

    <section className="metric-grid" aria-label="Pilot scorecard">
      <MetricCard label="HELD-OUT SET" value={latestRun ? `${latestRun.casesCompleted}/${latestRun.casesTotal}` : "04"} description="Cases kept out of practice" icon={Layers3} color="blue" />
      <MetricCard label="DECISION MATCH" value={completed ? `${latestRun.decisionAccuracy}%` : "—"} description={completed ? `${latestRun.passed} full evidence passes` : "Awaiting first evaluation"} icon={Target} color="green" />
      <MetricCard label="EVIDENCE COVERAGE" value={completed ? `${latestRun.evidenceCoverage}%` : "—"} description={completed ? "Relevant policy cited" : "Source links checked per draft"} icon={BookOpen} color="amber" />
      <MetricCard label="SAFE ESCALATIONS" value={completed ? String(latestRun.safeEscalations) : "—"} description={completed ? "Sensitive cases held" : "Risky work stays human"} icon={ShieldCheck} color="violet" />
    </section>

    {busy && latestRun && <section className="run-progress" aria-live="polite"><div className="progress-icon"><RefreshCw size={16} className="spin" /></div><div className="progress-copy"><strong>Checking the held-out set</strong><span>Case {Math.min(latestRun.casesCompleted + 1, latestRun.casesTotal)} of {latestRun.casesTotal} · decisions and citations save as they finish</span></div><div className="progress-track"><span style={{ width: percent(latestRun.casesTotal ? latestRun.casesCompleted / latestRun.casesTotal * 100 : 0) }} /></div></section>}

    <div className="section-heading"><div><div className="eyebrow muted-eyebrow">YOUR FIRST WORKFLOW</div><h2>One narrow job. Clear proof.</h2></div><button type="button" className="text-button" onClick={onOpenLab}>Open workflow lab <ArrowRight size={14} /></button></div>
    <div className="overview-grid">
      <section className="workflow-card">
        <div className="card-topline"><span className="card-icon pale-blue"><MessageSquareText size={17} /></span><span className="micro-status"><StatusDot amber /> SUPPORT TRIAGE</span><button className="mini-menu" type="button" aria-label="Workflow options"><MoreHorizontal size={17} /></button></div>
        <h3>Policy-cited first response</h3>
        <p>Draft the next step from approved support policy. If evidence is thin or risk is high, stop and route it to a person.</p>
        <div className="workflow-stats"><div><strong>12</strong><span>synthetic tickets</span></div><div><strong>06</strong><span>policy articles</span></div><div><strong>00</strong><span>live inboxes</span></div></div>
        <div className="workflow-bottom"><span><span className="tiny-avatar">JS</span> Pilot workflow</span><button type="button" className="circle-arrow" onClick={onOpenLab} aria-label="Open workflow lab"><ArrowRight size={15} /></button></div>
      </section>

      <section className="signal-card">
        <div className="section-card-heading"><div><div className="eyebrow muted-eyebrow">HIRING SIGNAL</div><h3>Where the work starts</h3></div><span className="source-pill"><BriefcaseBusiness size={12} /> CRUSTDATA</span></div>
        <div className="signal-copy"><div className="signal-timeline"><span className="signal-node"><span /></span><i /></div><div><div className="signal-title">Open support role <span className="signal-tag">INPUT</span></div><p>Public role descriptions help identify repeatable duties worth testing before a hire is made.</p></div></div>
        <div className="signal-copy"><div className="signal-timeline"><span className="signal-node output"><span /></span></div><div><div className="signal-title">Support workbench <span className="signal-tag green-tag">TEST</span></div><p>Match those duties to synthetic cases and approved policy. Review every decision before a pilot.</p></div></div>
        <button type="button" className="signal-link" onClick={() => { onOpenLab(); }}>See the test workflow <ArrowRight size={14} /></button>
      </section>

      <section className="economics-card">
        <div className="section-card-heading"><div><div className="eyebrow muted-eyebrow">PILOT ECONOMICS</div><h3>Is the math worth a test?</h3></div><span className="illustrative-label">ILLUSTRATIVE</span></div>
        <div className="economics-result"><div><span>EST. MONTHLY VALUE</span><strong>${economics.net.toLocaleString()}</strong></div><div className="value-visual"><span style={{ height: "33%" }} /><span style={{ height: "50%" }} /><span style={{ height: "43%" }} /><span style={{ height: "70%" }} /><span style={{ height: "62%" }} /><span style={{ height: "88%" }} /><span style={{ height: "74%" }} /><span style={{ height: "100%" }} /></div></div>
        <div className="economics-assumptions">
          <label>Tickets / month <input type="number" min={0} max={100000} value={ticketVolume} onChange={(event) => onTicketVolume(Number(event.target.value))} /></label>
          <label>Minutes / ticket <input type="number" min={1} max={240} value={minutesPerTicket} onChange={(event) => onMinutesPerTicket(Number(event.target.value))} /></label>
          <label>Hourly labor cost <span className="currency-field"><span>$</span><input type="number" min={0} max={1000} value={hourlyCost} onChange={(event) => onHourlyCost(Number(event.target.value))} /></span></label>
          <label>Tickets in pilot <span>{reviewRate}%</span><input type="range" min={0} max={100} step={5} value={reviewRate} onChange={(event) => onReviewRate(Number(event.target.value))} /></label>
          <label>Time saved per review <span>{reviewTimeSaved}%</span><input type="range" min={0} max={100} step={5} value={reviewTimeSaved} onChange={(event) => onReviewTimeSaved(Number(event.target.value))} /></label>
        </div>
        <div className="economics-foot"><span><Check size={12} /> ${economics.modelCost.toLocaleString()} illustrative model cost included</span><button type="button" className="info-dot" aria-label="These are editable estimates">i</button></div>
        <p className="fine-print">Editable scenario only. Savings depend on review time and outcomes; this is not a forecast.</p>
      </section>
    </div>

    <section className="recent-runs">
      <div className="section-heading compact"><div><div className="eyebrow muted-eyebrow">RUN HISTORY</div><h2>Proof, as it happens.</h2></div><button type="button" className="text-button" onClick={onOpenProof}>View run evidence <ArrowRight size={14} /></button></div>
      {runs.length ? <div className="run-list">{runs.slice(0, 3).map((run) => <RunRow key={run.id} run={run} />)}</div> : <div className="empty-inline"><span className="empty-glyph"><Activity size={16} /></span><span><strong>No evaluation runs yet</strong><small>Start the held-out test to create your first evidence record.</small></span><button type="button" onClick={onRun}>Run first test <ArrowRight size={13} /></button></div>}
    </section>
  </>;
}

function MetricCard({ label, value, description, icon: Icon, color }: { label: string; value: string; description: string; icon: typeof Gauge; color: string }) {
  return <article className="metric-card"><div className={`metric-icon ${color}`}><Icon size={16} strokeWidth={1.9} /></div><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-description">{description}</div></article>;
}

function RunRow({ run }: { run: RunSummary }) {
  return <div className="run-row"><span className={`run-status-icon ${run.status}`}><CheckCircle2 size={15} /></span><div className="run-row-main"><strong>{run.mode === "evaluation" ? "Held-out evaluation" : "Practice set"}</strong><small>{run.casesCompleted}/{run.casesTotal} cases · {run.agentMode === "openrouter" ? "OpenRouter" : "Rules preview"}</small></div><span className="run-score">{run.status === "completed" ? `${run.passed}/${run.casesTotal} passed` : run.status}</span><span className="run-time">{formatTime(run.createdAt)}</span><ArrowUpRight className="run-open" size={15} /></div>;
}

function Signals({ roles, source, busy, connected, onRefresh }: { roles: RoleSignal[]; source: "sample" | "crustdata"; busy: boolean; connected: boolean; onRefresh: () => void }) {
  return <>
    <div className="page-heading-row subpage-heading"><div><div className="eyebrow"><span className="eyebrow-mark">01</span> PUBLIC ROLE DISCOVERY</div><h1>Find the work<br className="desktop-break" /> before the hire.</h1><p className="page-subtitle">Search public support listings for repeatable duties that could make a small, safe AI pilot worth testing.</p></div><div className="heading-actions"><button className="primary-button compact-button" type="button" disabled={busy} onClick={onRefresh}><RefreshCw size={15} className={busy ? "spin" : ""} />{busy ? "Searching listings…" : "Refresh role signals"}</button></div></div>
    <section className="source-banner"><div className="source-banner-icon"><BriefcaseBusiness size={19} /></div><div><strong>{source === "crustdata" ? "Indexed public listings" : "Sample role signals"}</strong><p>{source === "crustdata" ? "Retrieved from CrustData. Open each source to verify the original listing and posting date." : connected ? "CrustData is configured. Refresh to search current indexed listings." : "Illustrative examples only. Add a CrustData key to fetch live indexed listings."}</p></div><div className={`source-connection ${connected ? "connected" : ""}`}><StatusDot active={connected} amber={!connected} />{connected ? "CONNECTED" : "KEY NEEDED"}</div></section>
    <div className="signal-toolbar"><div><strong>{roles.length} {source === "crustdata" ? "matching roles" : "illustrative roles"}</strong><span> · Customer support · Latest indexed</span></div><button type="button" className="filter-button"><Menu size={14} /> Filters <ChevronDown size={13} /></button></div>
    <div className="role-list">{roles.map((role, index) => <article className="role-card" key={role.id}><div className="role-rank">{String(index + 1).padStart(2, "0")}</div><div className="role-company-mark">{role.company.slice(0, 1).toUpperCase()}</div><div className="role-main"><div className="role-title-row"><h2>{role.title}</h2><span className={`role-source-tag ${source === "crustdata" ? "live" : "sample"}`}>{source === "crustdata" ? "SOURCE VERIFIED" : "SAMPLE"}</span></div><div className="role-meta"><strong>{role.company}</strong><span>·</span><span>{role.location}</span><span>·</span><span>{role.postedAt === "Illustrative" ? role.postedAt : `Added ${role.postedAt}`}</span></div><p>{role.description}</p><div className="duty-tags"><span>customer replies</span><span>account access</span><span>billing questions</span></div></div><div className="role-action">{role.url ? <a href={role.url} target="_blank" rel="noreferrer" className="secondary-button">Open source <ArrowUpRight size={14} /></a> : <button className="secondary-button" type="button" disabled>Source unavailable</button>}<span>Map duties to test cases</span></div></article>)}</div>
    {source === "crustdata" && roles.length === 0 && <div className="role-empty"><strong>No matching listings returned</strong><span>Try refreshing later or broadening the role search. The workflow lab remains available with synthetic cases.</span></div>}
    <div className="notice-card"><ShieldCheck size={17} /><span>JobSmith uses role text to form a test hypothesis. It does not infer staffing plans or claim a listing is evidence of automation intent.</span></div>
  </>;
}

function WorkflowLab({ cases, articles, selectedCase, selectedTicket, result, run, busy, modeLabel, onSelect, onRun }: {
  cases: SupportCase[];
  articles: KnowledgeArticle[];
  selectedCase: SupportCase;
  selectedTicket: string;
  result?: EvaluatedCase;
  run: RunSummary | null;
  busy: boolean;
  modeLabel: string;
  onSelect: (id: string) => void;
  onRun: () => void;
}) {
  const practice = cases.filter((testCase) => testCase.practice);
  const selectedArticles = articles.filter((article) => article.category === selectedCase.category);
  const latestResult = result ?? run?.results.find((item) => item.caseId === selectedCase.id);
  return <>
    <div className="page-heading-row subpage-heading"><div><div className="eyebrow"><span className="eyebrow-mark">02</span> CONTROLLED WORKFLOW TEST</div><h1>Practice on cases.<br className="desktop-break" /> Prove it on new ones.</h1><p className="page-subtitle">A bounded first-response workflow with visible policy sources and a human escalation path.</p></div><div className="heading-actions"><button className="primary-button compact-button" type="button" disabled={busy} onClick={onRun}><Play size={14} fill="currentColor" />{busy ? "Running practice…" : "Run 8 practice cases"}</button></div></div>
    <div className="lab-shell">
      <aside className="ticket-rail"><div className="ticket-rail-heading"><div><span className="eyebrow muted-eyebrow">PRACTICE INBOX</span><strong>Case files <span>08</span></strong></div><IconButton label="Search cases"><Search size={15} /></IconButton></div><div className="ticket-filter"><Inbox size={14} /><span>All practice cases</span><span className="filter-count">8</span></div>
        <div className="ticket-list">{practice.map((testCase) => <button key={testCase.id} type="button" className={`ticket-item${selectedTicket === testCase.id ? " selected" : ""}`} onClick={() => onSelect(testCase.id)}><div className="ticket-item-top"><span className={`severity-dot ${testCase.severity}`} /><strong>{testCase.name}</strong><small>{testCase.received}</small></div><div className="ticket-item-subject">{testCase.subject}</div><div className="ticket-item-bottom"><span>{testCase.id}</span><span className="ticket-tag">{testCase.category}</span></div></button>)}</div>
        <div className="heldout-note"><LockKeyhole size={14} /><span><strong>4 held out</strong><small>Evaluation cases stay hidden from practice.</small></span></div>
      </aside>

      <div className="lab-main"><div className="lab-toolbar"><div className="lab-ticket-heading"><div className="ticket-channel"><MessageSquareText size={14} /> {selectedCase.channel}</div><span className="ticket-id">{selectedCase.id}</span><span className={`priority-pill ${selectedCase.severity}`}>{selectedCase.severity} priority</span></div><div className="lab-toolbar-actions"><span className="mode-chip"><StatusDot active={modeLabel.startsWith("OpenRouter")} amber={!modeLabel.startsWith("OpenRouter")} />{modeLabel}</span><IconButton label="More options"><MoreHorizontal size={17} /></IconButton></div></div>
        <div className="ticket-detail"><div className="ticket-person"><span className="customer-avatar">{selectedCase.name.split(" ").map((part) => part[0]).join("")}</span><div><strong>{selectedCase.name}</strong><span>{selectedCase.customer} · {selectedCase.received}</span></div><button type="button" className="ticket-detail-link">View customer <ArrowUpRight size={13} /></button></div><h2>{selectedCase.subject}</h2><blockquote>{selectedCase.message}</blockquote><div className="case-callout"><div className="callout-icon"><Fingerprint size={16} /></div><div><strong>Decision boundary</strong><span>Draft only when the policy supports a safe next step. Never send, change an account, or promise an outcome.</span></div></div>
          <div className="source-panel"><div className="source-panel-heading"><span><BookOpen size={15} /> Approved knowledge</span><span>{selectedArticles.length} relevant {selectedArticles.length === 1 ? "article" : "articles"}</span></div>{selectedArticles.map((article) => <article className="article-row" key={article.id}><div className="article-id">{article.id}</div><div><strong>{article.title}</strong><p>{article.body}</p></div><BadgeCheck size={16} className="article-check" /></article>)}</div>
          {latestResult ? <DecisionResult result={latestResult} /> : <div className="empty-decision"><span><Cpu size={17} /></span><div><strong>No decision recorded</strong><small>Run the practice set to inspect an unsent draft, citations, and the safety score.</small></div></div>}
        </div>
      </div>
    </div>
  </>;
}

function DecisionResult({ result }: { result: EvaluatedCase }) {
  const { decision, score } = result;
  return <section className={`decision-card${score.passed ? " passed" : " needs-review"}`}><div className="decision-header"><div><div className="eyebrow muted-eyebrow">UNSENT MODEL DECISION</div><h3>{decision.recommendation === "draft" ? "Draft for human review" : "Escalate to a person"}</h3></div><span className={`decision-verdict ${score.passed ? "pass" : "review"}`}>{score.passed ? <CheckCircle2 size={14} /> : <ShieldAlert size={14} />}{score.passed ? "PASS" : "REVIEW"}</span></div><p className="decision-rationale">{decision.rationale}</p><div className="response-draft">{decision.responseDraft}</div><div className="decision-meta"><span><BookOpen size={13} /> {decision.citations.length ? decision.citations.join(" · ") : "No policy citation"}</span><span><Target size={13} /> {decision.category}</span><span><Clock3 size={13} /> {score.latencyMs} ms</span><span><Cpu size={13} /> {decision.mode === "openrouter" ? "OpenRouter" : "Rules preview"}</span></div><div className="score-detail"><span className={score.decisionCorrect ? "good" : "bad"}><Check size={12} /> Decision {score.decisionCorrect ? "matched" : "needs review"}</span><span className={score.relevantEvidenceFound && score.citationsValid ? "good" : "bad"}><Check size={12} /> Source {score.relevantEvidenceFound && score.citationsValid ? "verified" : "not verified"}</span><span className={score.unsupportedClaims === 0 ? "good" : "bad"}><Check size={12} /> {score.unsupportedClaims} unsupported claims*</span></div><small className="score-method">*Structural check: every declared claim must cite an article supplied to the model. It is not a semantic truth guarantee.</small></section>;
}

function RunEvidence({ runs, activeRun, busy, onRun, onResume, onSelect }: { runs: RunSummary[]; activeRun: RunSummary | null; busy: boolean; onRun: () => void; onResume: (run: RunSummary) => void; onSelect: (run: RunSummary) => void }) {
  const selected = activeRun ?? runs[0] ?? null;
  const incomplete = selected !== null && selected.status !== "completed";
  return <>
    <div className="page-heading-row subpage-heading"><div><div className="eyebrow"><span className="eyebrow-mark">03</span> AUDITABLE RUN RECORDS</div><h1>Keep the receipts.</h1><p className="page-subtitle">Every case decision, source, result, and model trace gets a durable record for review.</p></div><div className="heading-actions"><button className="primary-button compact-button" type="button" disabled={busy} onClick={() => incomplete && selected ? onResume(selected) : onRun()}>{incomplete ? <RefreshCw size={14} className={busy ? "spin" : ""} /> : <Play size={14} fill="currentColor" />}{busy ? "Running…" : incomplete ? "Resume saved run" : "Run held-out set"}</button></div></div>
    <section className="proof-summary"><div className="proof-summary-copy"><div className="eyebrow muted-eyebrow">EVALUATION LEDGER</div><h2>{runs.length ? `${runs.length} saved ${runs.length === 1 ? "run" : "runs"}` : "Your evaluation starts here"}</h2><p>Runs use a 4-case synthetic held-out set. Scores are descriptive signals from this small sample, not a production accuracy claim.</p></div><div className="proof-total"><span>CASE RECORDS</span><strong>{runs.reduce((sum, run) => sum + run.casesCompleted, 0).toString().padStart(2, "0")}</strong></div><div className="proof-total"><span>TRACES AVAILABLE</span><strong>{runs.reduce((sum, run) => sum + run.results.length, 0).toString().padStart(2, "0")}</strong></div></section>
    <div className="ledger-grid"><section className="ledger-list"><div className="ledger-head"><strong>Evaluation runs</strong><span>{runs.length ? `${runs.length} saved` : "No runs yet"}</span></div>{runs.length ? runs.map((run) => <button type="button" key={run.id} className={`ledger-run${selected?.id === run.id ? " selected" : ""}`} onClick={() => onSelect(run)}><span className={`run-status-icon ${run.status}`}><CheckCircle2 size={15} /></span><span className="ledger-run-copy"><strong>{run.mode === "evaluation" ? "Held-out evaluation" : "Practice run"}</strong><small>{formatTime(run.createdAt)} · {run.casesCompleted}/{run.casesTotal} complete</small></span><span className="ledger-score">{run.status === "completed" ? `${run.passed}/${run.casesTotal}` : run.status}</span></button>) : <div className="ledger-empty"><Activity size={19} /><strong>No evidence yet</strong><span>Run the held-out cases to create your first traceable evaluation.</span></div>}</section>
      <section className="ledger-detail"><div className="ledger-head"><strong>Case-level evidence</strong><span>{selected?.agentMode === "openrouter" ? "OpenRouter" : selected ? "Rules preview" : "Waiting"}</span></div>{selected ? <><div className="selected-run-stats"><div><span>DECISION MATCH</span><strong>{selected.decisionAccuracy}%</strong></div><div><span>EVIDENCE LINKS</span><strong>{selected.evidenceCoverage}%</strong></div><div><span>AVG LATENCY</span><strong>{selected.averageLatencyMs}<small>ms</small></strong></div></div><div className="evidence-case-list">{selected.results.map((result) => <EvidenceCase key={result.caseId} result={result} />)}</div><div className="neatlogs-callout"><span className="neatlogs-mark"><Activity size={14} /></span><div><strong>Trace context</strong><span>Each run and case is grouped in neatlogs. Open the dashboard to inspect the model span, run metadata, and outcome.</span></div><span className="trace-state"><StatusDot active />{selected.results.length ? "RECORDED" : "PENDING"}</span></div></> : <div className="ledger-empty detail-empty"><FileCheck2 size={20} /><strong>Choose a saved run</strong><span>Case decisions and source checks will appear here.</span></div>}</section></div>
  </>;
}

function EvidenceCase({ result }: { result: EvaluatedCase }) {
  return <div className="evidence-case"><span className={`evidence-case-status ${result.score.passed ? "pass" : "review"}`}>{result.score.passed ? <Check size={12} /> : <ShieldAlert size={12} />}</span><div className="evidence-case-copy"><strong>{result.caseId} <span>·</span> {result.decision.recommendation === "draft" ? "Draft" : "Escalate"}</strong><small>{result.decision.citations.length ? result.decision.citations.join(", ") : "No source attached"} · {result.score.latencyMs}ms</small></div><span className="evidence-case-score">{result.score.passed ? "PASS" : "REVIEW"}</span></div>;
}
