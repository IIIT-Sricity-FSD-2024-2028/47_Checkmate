/**
 * ============================================================================
 * EVENT CONTINGENCY PLANNING COMPONENT (EventContingencyPlanning.jsx)
 * ============================================================================
 * Role: Reusable Component (Vendor Portal)
 * Location: src/components/vendor/EventContingencyPlanning.jsx
 *
 * Purpose:
 *   Replicates legacy Event Review Contingency Planning interactive workflow:
 *     - Displays event contingency plans (Problem, Trigger, Solution, Status)
 *     - Allows removing plans with delete button
 *     - Provides an inline creation row to add customized event contingency plans
 * ============================================================================
 */

import React, { useState } from "react";
import { Plus, X, Zap } from "lucide-react";

function EventContingencyPlanning({
  plans = [],
  onAddPlan,
  onDeletePlan,
}) {
  const [problem, setProblem] = useState("");
  const [trigger, setTrigger] = useState("");
  const [solution, setSolution] = useState("");

  const handleAdd = (e) => {
    e.preventDefault();
    if (!problem.trim() || !trigger.trim() || !solution.trim()) {
      alert("Please fill in Problem, Trigger, and Solution fields.");
      return;
    }

    if (onAddPlan) {
      onAddPlan({
        problem: problem.trim(),
        trigger: trigger.trim(),
        solution: solution.trim(),
      });
    }

    setProblem("");
    setTrigger("");
    setSolution("");
  };

  return (
    <div className="contingency-wrapper" aria-label="Event Contingency Plans">
      <div className="section-title contingency-heading">Contingency Planning</div>

      <div className="req-wrap contingency-container">
        {/* ── Contingency Plans Table ── */}
        <table className="cont-table">
          <thead>
            <tr>
              <th>Problem</th>
              <th>Trigger</th>
              <th>Solution</th>
              <th>Status</th>
              <th className="col-actions-sm" />
            </tr>
          </thead>
          <tbody>
            {plans.length > 0 ? (
              plans.map((p) => {
                const isTriggered = p.status === "triggered";
                return (
                  <tr key={p.id}>
                    <td>{p.problem}</td>
                    <td>{p.trigger}</td>
                    <td>{p.solution}</td>
                    <td>
                      {isTriggered ? (
                        <span className="cont-status-triggered">
                          <Zap size={11} /> triggered
                        </span>
                      ) : (
                        <span className="row-status ready">ready</span>
                      )}
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        className="cont-del-btn"
                        onClick={() => onDeletePlan && onDeletePlan(p.id)}
                        title="Delete this contingency plan"
                        aria-label="Delete plan"
                      >
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" className="vendor-table-message text-center">
                  No contingency plans registered for this event yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* ── Add New Plan Form Row ── */}
        <form onSubmit={handleAdd} className="cont-add-row">
          <div className="cont-input-group">
            <label htmlFor="cpProblem">Problem</label>
            <input
              id="cpProblem"
              type="text"
              placeholder="e.g. Venue Flooding"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
            />
          </div>

          <div className="cont-input-group">
            <label htmlFor="cpTrigger">Trigger</label>
            <input
              id="cpTrigger"
              type="text"
              placeholder="e.g. Heavy rain alert"
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
            />
          </div>

          <div className="cont-input-group">
            <label htmlFor="cpSolution">Solution</label>
            <input
              id="cpSolution"
              type="text"
              placeholder="e.g. Move to backup Hall B"
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
            />
          </div>

          <button type="submit" className="cont-add-btn">
            <Plus size={14} /> Add Plan
          </button>
        </form>
      </div>
    </div>
  );
}

export default React.memo(EventContingencyPlanning);
