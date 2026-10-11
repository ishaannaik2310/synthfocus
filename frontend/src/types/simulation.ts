/**
 * TypeScript types for SynthFocus simulation data, matching backend Pydantic schemas.
 */

export interface PersonaEvaluation {
  persona_id: string;
  persona_name: string;
  score_out_of_10: number; // 0-10 integer
  primary_objection: string;
  one_sentence_critique: string;
  buy_readiness: boolean;
  key_frustrations: string[];
  trigger_words: string[];
}

export interface SimulationMetrics {
  average_score: number;
  buy_ready_count: number;
  total_personas: number;
  min_score: number;
  max_score: number;
  score_spread: number;
}

export interface FinalReport {
  metrics: SimulationMetrics;
  executive_summary: string;
  playbook_markdown: string;
  persona_results: PersonaEvaluation[];
  disclaimer: string;
}

export interface StartEventData {
  status: "started";
  message: string;
  total_personas: number;
  total_batches: number;
  batch_size: number;
}

export interface BatchPersonaStub {
  id: string;
  name: string;
  avatar: string;
}

export interface BatchStartEventData {
  status: "batch_running";
  batch_index: number;
  total_batches: number;
  message: string;
  personas: BatchPersonaStub[];
}

export interface BatchCompleteEventData {
  status: "batch_done";
  batch_index: number;
  total_batches: number;
  personas_evaluated: PersonaEvaluation[];
  message: string;
}

export interface ThrottlingEventData {
  status: "sleeping";
  batch_index: number;
  seconds_remaining: number;
  message: string;
}

export interface AnalystStartEventData {
  status: "analyzing";
  message: string;
}

export interface ErrorEventData {
  status: "error";
  message: string;
}

export type SSEEvent =
  | { event: "start"; data: StartEventData }
  | { event: "batch_start"; data: BatchStartEventData }
  | { event: "batch_complete"; data: BatchCompleteEventData }
  | { event: "throttling"; data: ThrottlingEventData }
  | { event: "analyst_start"; data: AnalystStartEventData }
  | { event: "final_report"; data: FinalReport }
  | { event: "error"; data: ErrorEventData };

export type SimulationPhase =
  | "idle"
  | "submitting"
  | "streaming"
  | "results"
  | "error";

export type SimulationErrorType =
  | "busy"
  | "daily_cap"
  | "rate_limit"
  | "network"
  | "disconnect"
  | "unknown";

export interface SimulationErrorState {
  type: SimulationErrorType;
  title: string;
  message: string;
  isAfterCancel?: boolean;
}
