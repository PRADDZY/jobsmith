"use client";

import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CircleAlert,
  CircleDollarSign,
  ExternalLink,
  FileSearch,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PilotRun, RoleSignal } from "@/lib/contracts";

type Props = { sampleRoles: RoleSignal[] };
type Integrations = { gmicloud: boolean; crustdata: boolean; neatlogs: boolean };

const phaseCopy: Record<PilotRun["phase"], string> = {
  role_analysis: "Reading role responsibilities",
  workflow_design: "Designing the bounded task",
  practice: "Testing on practice examples",
  revision: "Revising from practice misses",
  holdout: "Checking unseen examples",
  report: "Preparing the decision",
};

const verdictCopy: Record<NonNullable<PilotRun["recommendation"]>, { label: string; title: string }> = {
  pilot_candidate: { label: "SUPERVISED PILOT CANDIDATE", title: "This workflow earned a small, supervised pilot." },
  no_go: { label: "DO NOT PILOT", title: "This workflow did not clear the safety bar." },
  preview_only: { label: "SAMPLE PREVIEW", title: "This run is a preview, not a pilot qualification." },
};

function familyName(value?: string) {
  return ({ billing: "Billing", access: "Account access", security: "Security", account: "Workspace membership" } as Record<string, string>)[value ?? ""] ?? "Supported support task";
}

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function runProgress(pilot: PilotRun) {
  const steps = ["Role duty", "Workflow", "Practice", "Unseen checks", "Decision"];
  const indices: Record<PilotRun["phase"], number> = {
    role_analysis: 0, workflow_design: 1, practice: 2, revision: 2, holdout: 3, report: 4,
  };
  const active = indices[pilot.phase];
  return { steps, active };
}

export function Dashboard({ sampleRoles }: Props) {
  const [roles, setRoles] = useState(sampleRoles);
  const [roleSource, setRoleSource] = useState<"crustdata" | "sample">("sample");
  const [sourceWarning, setSourceWarning] = useState<string | undefined>();
  const [rolesLoading, setRolesLoading] = useState(true);
  const [selectedRoleId, setSelectedRoleId] = useState(sampleRoles[0]?.id ?? "");
  const [pilots, setPilots] = useState<PilotRun[]>([]);
  const [activePilot, setActivePilot] = useState<PilotRun>();
  const [integrations, setIntegrations] = useState<Integrations>();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string>();
  const [volumePerWeek, setVolumePerWeek] = useState(120);
  const [minutesPerCase, setMinutesPerCase] = useState(6);
  const [timeSavedPercent, setTimeSavedPercent] = useState(20);
  const [hourlyCost, setHourlyCost] = useState(28);
  const launchRef = useRef(new Set<string>());

  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? roles[0];
  const pilotCandidates = pilots;
  const finalPractice = activePilot?.practiceRounds.at(-1);
  const passedHoldout = activePilot?.holdoutResults.filter((item) => item.score.passed).length ?? 0;
  const monthlyCapacity = Math.round(volumePerWeek * 4.3 * (activePilot?.holdoutResults.length ? passedHoldout / activePilot.holdoutResults.length : 0) * minutesPerCase * timeSavedPercent / 100 / 60);
  const monthlyValue = Math.round(monthlyCapacity * hourlyCost);

  const refreshRoles = useCallback(async () => {
    try {
      const [roleResponse, healthResponse, pilotResponse] = await Promise.all([
        fetch("/api/discovery", { method: "POST" }),
        fetch("/api/health"),
        fetch("/api/pilots"),
      ]);
      const roleData = await roleResponse.json() as { roles?: RoleSignal[]; source?: "crustdata" | "sample"; warning?: string; error?: string };
      if (!roleResponse.ok) throw new Error(roleData.error ?? "Could not load support roles.");
      const foundRoles = roleData.roles?.length ? roleData.roles : sampleRoles;
      setRoles(foundRoles);
      setRoleSource(roleData.source ?? "sample");
      setSourceWarning(roleData.warning);
      setSelectedRoleId(foundRoles[0]?.id ?? "");
      if (healthResponse.ok) {
        const health = await healthResponse.json() as { integrations?: Integrations };
        setIntegrations(health.integrations);
      }
      if (pilotResponse.ok) {
        const data = await pilotResponse.json() as { pilots?: PilotRun[] };
        const saved = data.pilots ?? [];
        setPilots(saved);
        if (saved.length) setActivePilot(saved[0]);
      }
    } catch (caught) {
      setRoles(sampleRoles);
      setRoleSource("sample");
      setSourceWarning("Live role search was unavailable. These bundled listings are samples, not live job posts.");
      setError(caught instanceof Error ? caught.message : "Could not load the workspace.");
    } finally {
      setRolesLoading(false);
    }
  }, [sampleRoles]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refreshRoles(); }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshRoles]);

  const pollPilot = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/pilots/${id}`, { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json() as { pilot?: PilotRun };
      if (!data.pilot) return;
      setActivePilot(data.pilot);
      setPilots((current) => [data.pilot!, ...current.filter((pilot) => pilot.id !== id)]);
    } catch { /* Keep the current snapshot visible during a transient poll failure. */ }
  }, []);

  const launchPilot = useCallback((id: string) => {
    if (launchRef.current.has(id)) return;
    launchRef.current.add(id);
    void fetch(`/api/pilots/${id}/resume`, { method: "POST" }).then(async (response) => {
      if (!response.ok) await pollPilot(id);
    }).catch(() => undefined).finally(() => launchRef.current.delete(id));
  }, [pollPilot]);

  const activePilotId = activePilot?.id;
  const activePilotStatus = activePilot?.status;
  useEffect(() => {
    if (!activePilotId || !activePilotStatus) return;
    if (activePilotStatus === "queued" || activePilotStatus === "running") launchPilot(activePilotId);
    if (activePilotStatus === "running") {
      const timer = window.setInterval(() => { void pollPilot(activePilotId); }, 1300);
      return () => window.clearInterval(timer);
    }
  }, [activePilotId, activePilotStatus, launchPilot, pollPilot]);

  const startPilot = async (executionMode: "gmicloud" | "sample" = integrations?.gmicloud ? "gmicloud" : "sample") => {
    if (!selectedRole) return;
    setCreating(true);
    setError(undefined);
    try {
      const response = await fetch("/api/pilots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole, sourceWarning, executionMode }),
      });
      const data = await response.json() as { pilot?: PilotRun; error?: string };
      if (!response.ok || !data.pilot) throw new Error(data.error ?? "Could not start the role probation run.");
      setActivePilot(data.pilot);
      setPilots((current) => [data.pilot!, ...current]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start the run.");
    } finally {
      setCreating(false);
    }
  };

  const resume = () => {
    if (!activePilot) return;
    setError(undefined);
    setActivePilot({ ...activePilot, status: "queued" });
  };

  return (
    <main className="pilot-app">
      <header className="pilot-topbar">
        <a className="pilot-brand" href="#top" aria-label="JobSmith home">
          <span className="pilot-brand-mark"><BriefcaseBusiness size={18} strokeWidth={1.8} /></span>
          <span>jobsmith<span className="pilot-brand-period">.</span></span>
        </a>
        <div className="pilot-topbar-right">
          <div className="pilot-integration-status" aria-label="Integration status">
            <span className={integrations?.crustdata ? "connected" : "sample"}><i />CrustData</span>
            <span className={integrations?.gmicloud ? "connected" : "sample"}><i />GMI Cloud</span>
            <span className={integrations?.neatlogs ? "connected" : "sample"}><i />Neatlogs</span>
          </div>
          <span className="pilot-topbar-note"><ShieldCheck size={14} /> Sandbox only</span>
        </div>
      </header>

      <div className="pilot-layout" id="top">
        <section className="pilot-intro">
          <div className="pilot-kicker"><Sparkles size={14} /> AI COWORKER PROBATION</div>
          <h1>Would you hire an AI for this support role?</h1>
          <p className="pilot-intro-copy">JobSmith reads a support job listing, finds one repeatable task, then tests a policy-bound AI coworker on synthetic cases before you consider a supervised pilot.</p>
          <div className="pilot-promise"><ShieldCheck size={17} /><span><strong>Nothing is sent or changed.</strong> No customer inbox, real customer records, or account actions are connected.</span></div>
        </section>

        <section className="pilot-step-section" aria-labelledby="role-heading">
          <div className="pilot-section-heading">
            <span className="pilot-step-number">01</span>
            <div>
              <h2 id="role-heading">Choose the role</h2>
              <p>Start with a real support opening. JobSmith will cite the exact line it uses.</p>
            </div>
          <button className="pilot-quiet-button" type="button" onClick={() => { setRolesLoading(true); setError(undefined); void refreshRoles(); }} disabled={rolesLoading}>
              <RefreshCw size={14} className={rolesLoading ? "pilot-spin" : ""} /> Refresh roles
            </button>
          </div>

          {sourceWarning && <div className="pilot-source-warning"><CircleAlert size={15} />{sourceWarning}</div>}
          <div className="pilot-role-grid" role="radiogroup" aria-label="Support role listings">
            {rolesLoading && roles.length === 0 ? <div className="pilot-loading"><LoaderCircle className="pilot-spin" /> Finding support roles…</div> : roles.map((role) => (
              <div
                key={role.id}
                className={`pilot-role-card ${selectedRole?.id === role.id ? "is-selected" : ""}`}
                role="radio"
                aria-checked={selectedRole?.id === role.id}
                tabIndex={selectedRole?.id === role.id ? 0 : -1}
                onClick={() => setSelectedRoleId(role.id)}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedRoleId(role.id);
                  }
                }}
              >
                <span className="pilot-role-card-head">
                  <span className="pilot-role-icon"><BriefcaseBusiness size={17} /></span>
                  <span className={`pilot-source-tag ${roleSource === "crustdata" && role.source === "crustdata" ? "live" : "sample"}`}>
                    {role.source === "crustdata" && roleSource === "crustdata" ? "LIVE LISTING" : "SAMPLE LISTING"}
                  </span>
                  {selectedRole?.id === role.id && <Check className="pilot-selected-check" size={16} />}
                </span>
                <span className="pilot-role-title">{role.title}</span>
                <span className="pilot-role-company">{role.company} <span>·</span> {role.location}</span>
                <span className="pilot-role-description">{role.description}</span>
                {role.url && <span className="pilot-role-link"><a href={role.url} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>Open source listing <ExternalLink size={12} /></a></span>}
              </div>
            ))}
          </div>
          <div className="pilot-action-row">
            <p><FileSearch size={15} /> 8 practice examples <span>·</span> 8 unseen checks <span>·</span> 4 synthetic policy families</p>
            <div className="pilot-action-buttons">
              <button className="pilot-primary-button" type="button" onClick={() => void startPilot()} disabled={!selectedRole || creating || rolesLoading}>
                {creating ? <LoaderCircle className="pilot-spin" size={16} /> : <Sparkles size={16} />}
                {integrations?.gmicloud ? "Put this role on probation" : "Run labeled sample preview"} <ArrowRight size={15} />
              </button>
              {integrations?.gmicloud && <button className="pilot-sample-button" type="button" onClick={() => void startPilot("sample")} disabled={!selectedRole || creating || rolesLoading}>Use a deterministic sample preview</button>}
            </div>
          </div>
        </section>

        {error && <div className="pilot-error"><CircleAlert size={16} />{error}</div>}

        {activePilot && <PilotReport
          pilot={activePilot}
          finalPractice={finalPractice}
          passedHoldout={passedHoldout}
          volumePerWeek={volumePerWeek}
          minutesPerCase={minutesPerCase}
          timeSavedPercent={timeSavedPercent}
          hourlyCost={hourlyCost}
          monthlyCapacity={monthlyCapacity}
          monthlyValue={monthlyValue}
          setVolumePerWeek={setVolumePerWeek}
          setMinutesPerCase={setMinutesPerCase}
          setTimeSavedPercent={setTimeSavedPercent}
          setHourlyCost={setHourlyCost}
          onResume={resume}
        />}

        {pilotCandidates.length > 1 && <section className="pilot-history">
          <div className="pilot-history-title"><span>RECENT PROBATION RUNS</span><small>Saved locally in this workspace</small></div>
          <div className="pilot-history-list">
            {pilotCandidates.filter((item) => item.id !== activePilot?.id).map((item) => (
              <button type="button" key={item.id} onClick={() => setActivePilot(item)}>
                <span><strong>{item.role.title}</strong><small>{item.role.company} · {dateLabel(item.createdAt)}</small></span>
                <span className={`pilot-history-state ${item.status}`}>{item.status === "completed" ? verdictCopy[item.recommendation ?? "preview_only"].label : item.status.replace("_", " ")}</span>
              </button>
            ))}
          </div>
        </section>}

        <section className="pilot-platforms">
          <div className="pilot-platforms-heading"><span>THE STACK, IN PLAIN ENGLISH</span><span>Each tool has one job</span></div>
          <div className="pilot-platform-grid">
            <Platform name="CrustData" role="Finds public support job listings." connected={integrations?.crustdata} />
            <Platform name="GMI Cloud" role="Qwen extracts duties and tests the coworker." connected={integrations?.gmicloud} />
            <Platform name="Neatlogs" role="Records the role-to-decision AI trace." connected={integrations?.neatlogs} />
            <Platform name="Entire / cfo.ai" role="Entire records build history; cfo.ai holds the separate operating plan." />
          </div>
        </section>

        <footer className="pilot-footer">JobSmith · synthetic policies and cases only <span>·</span> A candidate means supervised sandbox pilot, never autonomous production use.</footer>
      </div>
    </main>
  );
}

function Platform({ name, role, connected }: { name: string; role: string; connected?: boolean }) {
  return <div className="pilot-platform"><span className={connected ? "is-connected" : ""}><i />{name}</span><p>{role}</p></div>;
}

function PilotReport({
  pilot, finalPractice, passedHoldout, volumePerWeek, minutesPerCase, timeSavedPercent, hourlyCost, monthlyCapacity, monthlyValue,
  setVolumePerWeek, setMinutesPerCase, setTimeSavedPercent, setHourlyCost, onResume,
}: {
  pilot: PilotRun;
  finalPractice?: PilotRun["practiceRounds"][number];
  passedHoldout: number;
  volumePerWeek: number;
  minutesPerCase: number;
  timeSavedPercent: number;
  hourlyCost: number;
  monthlyCapacity: number;
  monthlyValue: number;
  setVolumePerWeek: (value: number) => void;
  setMinutesPerCase: (value: number) => void;
  setTimeSavedPercent: (value: number) => void;
  setHourlyCost: (value: number) => void;
  onResume: () => void;
}) {
  const [expandedCaseId, setExpandedCaseId] = useState<string>();
  const progress = runProgress(pilot);
  const done = pilot.status === "completed" || pilot.status === "blocked";
  const isFailed = pilot.status === "failed";
  const verdict = pilot.recommendation ? verdictCopy[pilot.recommendation] : undefined;
  const latestPractice = finalPractice?.results ?? [];

  return <section className="pilot-report-section" aria-live="polite">
    <div className="pilot-section-heading">
      <span className="pilot-step-number">02</span>
      <div><h2>Role probation</h2><p>{pilot.role.title} at {pilot.role.company} · started {dateLabel(pilot.createdAt)}</p></div>
      {pilot.status === "running" && <span className="pilot-running-badge"><LoaderCircle className="pilot-spin" size={14} /> IN PROGRESS</span>}
    </div>

    {!done && <div className="pilot-progress-card">
      <div className="pilot-progress-title"><span>{isFailed ? "The run paused" : phaseCopy[pilot.phase]}</span><small>{pilot.executionMode === "gmicloud" ? "GMI Cloud · Qwen3.8-Max" : "Deterministic sample preview"}</small></div>
      <div className="pilot-progress-track" aria-label="Probation progress">
        {progress.steps.map((step, index) => <div key={step} className={`pilot-progress-step ${index < progress.active ? "complete" : index === progress.active ? "current" : ""}`}>
          <span>{index < progress.active ? <Check size={13} /> : index + 1}</span><small>{step}</small>
        </div>)}
      </div>
      {pilot.workflow && <p className="pilot-live-workflow"><strong>Current task:</strong> {pilot.workflow.name} · workflow revision {pilot.workflow.version}</p>}
      {finalPractice && <p className="pilot-live-workflow">Practice check {latestPractice.filter((item) => item.score.passed).length}/{latestPractice.length} passed · {pilot.revisionCount} of 2 revisions used</p>}
      {pilot.blockedReason && <p className="pilot-report-error"><CircleAlert size={15} />{pilot.blockedReason}</p>}
      {isFailed && <button className="pilot-quiet-button" type="button" onClick={onResume}><RefreshCw size={14} /> Resume saved run</button>}
    </div>}

    {done && verdict && <>
      <div className={`pilot-verdict ${pilot.recommendation}`}>
        <span className="pilot-verdict-icon">{pilot.recommendation === "pilot_candidate" ? <ShieldCheck size={20} /> : <CircleAlert size={20} />}</span>
        <div><span className="pilot-verdict-label">{verdict.label}</span><h3>{verdict.title}</h3><p>{pilot.recommendationReason}</p></div>
      </div>

      {pilot.selectedDuty && <div className="pilot-duty-card">
        <div className="pilot-report-eyebrow">THE ROLE SIGNAL</div>
        <div className="pilot-duty-main"><span className="pilot-duty-icon"><BriefcaseBusiness size={18} /></span><div><h3>{pilot.selectedDuty.title}</h3><p>{familyName(pilot.selectedDuty.category)} · {pilot.selectedDuty.repeatability} repetition</p></div></div>
        <blockquote>“{pilot.selectedDuty.evidenceQuote}”</blockquote>
        <p className="pilot-duty-reason">{pilot.selectedDuty.reason}</p>
        <small>Exact evidence from {pilot.role.source === "crustdata" ? "the selected public listing" : "a bundled sample listing"} · {pilot.role.company}</small>
      </div>}

      {pilot.workflow && <div className="pilot-workflow-report">
        <div className="pilot-report-eyebrow">COWORKER BOUNDARIES <span>REVISION {pilot.workflow.version}</span></div>
        <div className="pilot-workflow-columns">
          <div><h3>{pilot.workflow.name}</h3><p>{pilot.workflow.purpose}</p><ol>{pilot.workflow.steps.map((step, index) => <li key={`${index}-${step}`}><span>{index + 1}</span>{step}</li>)}</ol></div>
          <aside><strong><ShieldCheck size={15} /> Always held for a person</strong><ul>{pilot.workflow.humanReviewTriggers.slice(0, 4).map((trigger) => <li key={trigger}>{trigger}</li>)}</ul><strong className="pilot-never-title">Never does</strong><ul>{pilot.workflow.excludedActions.slice(0, 4).map((action) => <li key={action}>{action}</li>)}</ul></aside>
        </div>
      </div>}

      <div className="pilot-evidence-grid">
        <section className="pilot-evidence-card">
          <div className="pilot-report-eyebrow">PRACTICE SET <span>{pilot.revisionCount} REVISION{pilot.revisionCount === 1 ? "" : "S"}</span></div>
          {pilot.practiceRounds.map((round) => <div className="pilot-round" key={round.version}>
            <div className="pilot-round-head"><strong>{round.version === 1 ? "Initial workflow" : `Revision ${round.version - 1}`}</strong><small>{round.results.filter((item) => item.score.passed).length}/{round.results.length} passed</small></div>
            <p>{round.summary}</p>
          </div>)}
          <p className="pilot-evidence-note">Practice examples can inform workflow revisions. They are excluded from the final qualification score.</p>
        </section>
        <section className="pilot-evidence-card pilot-holdout-card">
          <div className="pilot-report-eyebrow">UNSEEN SAFETY CHECKS <span>{passedHoldout}/{pilot.holdoutResults.length} PASS</span></div>
          <div className="pilot-holdout-stat"><strong>{passedHoldout}<small>/{pilot.holdoutResults.length}</small></strong><span>held-out synthetic cases passed</span></div>
          <div className="pilot-case-list">{pilot.holdoutResults.map((result) => <div className="pilot-case-item" key={result.caseId}>
            <button type="button" className="pilot-case-row" aria-expanded={expandedCaseId === result.caseId} onClick={() => setExpandedCaseId((current) => current === result.caseId ? undefined : result.caseId)}>
              <span className={`pilot-case-mark ${result.score.passed ? "pass" : "fail"}`}>{result.score.passed ? <Check size={13} /> : <CircleAlert size={13} />}</span>
              <span><strong>{result.caseId}</strong><small>{result.decision.recommendation === "draft" ? "Prepared unsent draft" : "Held for human review"} · {result.decision.citations.length ? result.decision.citations.join(", ") : "No policy citation"}</small></span>
              <span className={result.score.passed ? "pilot-pass-label" : "pilot-fail-label"}>{result.score.passed ? "PASS" : "MISS"}</span>
            </button>
            {expandedCaseId === result.caseId && <div className="pilot-case-detail">
              <span className="pilot-unsent-label">{result.decision.recommendation === "draft" ? "UNSENT DRAFT" : "HUMAN REVIEW RECOMMENDATION"}</span>
              <p>{result.decision.responseDraft}</p>
              <small>{result.decision.rationale}</small>
            </div>}
          </div>)}</div>
          <p className="pilot-evidence-note">Select a held-out case to inspect the actual model response and policy references. Replies remain unsent. The examples are synthetic.</p>
        </section>
      </div>

      <section className="pilot-economics">
        <div className="pilot-economics-copy"><div className="pilot-report-eyebrow">PILOT PLANNING ESTIMATE <span>ILLUSTRATIVE</span></div><h3>What might human-reviewed drafts help with?</h3><p>Estimated time assisted after a person reviews each draft. This is an assumption-based scenario, not a forecast or production result.</p><div className="pilot-estimate-output"><CircleDollarSign size={18} /><strong>{monthlyCapacity} hrs/mo</strong><span>≈ ${monthlyValue.toLocaleString()}/mo capacity scenario</span></div></div>
        <div className="pilot-assumption-fields">
          <label>Support cases per week<input type="number" min={0} max={100000} value={volumePerWeek} onChange={(event) => setVolumePerWeek(Math.max(0, Number(event.target.value)))} /></label>
          <label>Minutes per case<input type="number" min={0} max={240} value={minutesPerCase} onChange={(event) => setMinutesPerCase(Math.max(0, Number(event.target.value)))} /></label>
          <label>Estimated time assisted (%)<input type="number" min={0} max={100} value={timeSavedPercent} onChange={(event) => setTimeSavedPercent(Math.min(100, Math.max(0, Number(event.target.value))))} /></label>
          <label>Loaded hourly cost ($)<input type="number" min={0} max={1000} value={hourlyCost} onChange={(event) => setHourlyCost(Math.max(0, Number(event.target.value)))} /></label>
          <small>Assumes the held-out pass rate applies to weekly support volume. Validate with a human-reviewed pilot before using for planning.</small>
        </div>
      </section>
    </>}
  </section>;
}
