"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { COPY } from "../lib/copy";
import { runSimulationStream } from "../lib/sse";
import {
  BatchPersonaStub,
  FinalReport,
  PersonaEvaluation,
  SimulationErrorState,
  SimulationPhase,
  SSEEvent,
} from "../types/simulation";

export interface SimulationState {
  phase: SimulationPhase;
  brief: string;
  totalBatches: number;
  totalPersonas: number;
  currentBatchIndex: number;
  completedBatches: number;
  personas: PersonaEvaluation[];
  activeBatchPersonas: BatchPersonaStub[];
  isThrottling: boolean;
  throttleSecondsRemaining: number;
  isAnalystSynthesizing: boolean;
  tickerMessages: string[];
  finalReport: FinalReport | null;
  error: SimulationErrorState | null;
}

export function useSimulation() {
  const [phase, setPhase] = useState<SimulationPhase>("idle");
  const [brief, setBrief] = useState<string>("");
  const [totalBatches, setTotalBatches] = useState<number>(5);
  const [totalPersonas, setTotalPersonas] = useState<number>(10);
  const [currentBatchIndex, setCurrentBatchIndex] = useState<number>(-1);
  const [completedBatches, setCompletedBatches] = useState<number>(0);
  const [personas, setPersonas] = useState<PersonaEvaluation[]>([]);
  const [activeBatchPersonas, setActiveBatchPersonas] = useState<BatchPersonaStub[]>([]);
  const [isThrottling, setIsThrottling] = useState<boolean>(false);
  const [throttleSecondsRemaining, setThrottleSecondsRemaining] = useState<number>(0);
  const [isAnalystSynthesizing, setIsAnalystSynthesizing] = useState<boolean>(false);
  const [tickerMessages, setTickerMessages] = useState<string[]>([]);
  const [finalReport, setFinalReport] = useState<FinalReport | null>(null);
  const [error, setError] = useState<SimulationErrorState | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const wasCancelledRecentlyRef = useRef<boolean>(false);
  const throttleIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const finalReportRef = useRef<FinalReport | null>(null);

  // Sync ref
  useEffect(() => {
    finalReportRef.current = finalReport;
  }, [finalReport]);

  const clearThrottleTimer = useCallback(() => {
    if (throttleIntervalRef.current) {
      clearInterval(throttleIntervalRef.current);
      throttleIntervalRef.current = null;
    }
  }, []);

  const addTickerMessage = useCallback((msg: string) => {
    setTickerMessages((prev) => [...prev.slice(-9), msg]);
  }, []);

  const startCountdown = useCallback(
    (seconds: number) => {
      clearThrottleTimer();
      setThrottleSecondsRemaining(seconds);
      setIsThrottling(true);

      const endTime = Date.now() + seconds * 1000;
      throttleIntervalRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        setThrottleSecondsRemaining(remaining);
        if (remaining <= 0) {
          clearThrottleTimer();
          setIsThrottling(false);
        }
      }, 500);
    },
    [clearThrottleTimer]
  );

  const handleSSEEvent = useCallback(
    (event: SSEEvent) => {
      switch (event.event) {
        case "start": {
          setPhase("streaming");
          setTotalPersonas(event.data.total_personas);
          setTotalBatches(event.data.total_batches);
          addTickerMessage(
            COPY.ticker.onStart(event.data.total_personas, event.data.total_batches)
          );
          break;
        }

        case "batch_start": {
          clearThrottleTimer();
          setIsThrottling(false);
          setCurrentBatchIndex(event.data.batch_index);
          setActiveBatchPersonas(event.data.personas);
          const names = event.data.personas.map((p) => p.name).join(", ");
          addTickerMessage(
            COPY.ticker.onBatchStart(
              event.data.batch_index + 1,
              event.data.total_batches,
              names
            )
          );
          break;
        }

        case "batch_complete": {
          setCompletedBatches((prev) => Math.max(prev, event.data.batch_index + 1));
          setPersonas((prev) => [...prev, ...event.data.personas_evaluated]);
          addTickerMessage(
            COPY.ticker.onBatchComplete(
              event.data.batch_index + 1,
              event.data.total_batches
            )
          );
          break;
        }

        case "throttling": {
          const nextBatch = event.data.batch_index + 2;
          addTickerMessage(
            COPY.ticker.onThrottle(
              event.data.seconds_remaining,
              nextBatch,
              totalBatches
            )
          );
          startCountdown(event.data.seconds_remaining);
          break;
        }

        case "analyst_start": {
          clearThrottleTimer();
          setIsThrottling(false);
          setIsAnalystSynthesizing(true);
          addTickerMessage(COPY.ticker.onAnalystStart);
          break;
        }

        case "final_report": {
          clearThrottleTimer();
          setIsThrottling(false);
          setIsAnalystSynthesizing(false);
          setFinalReport(event.data);
          finalReportRef.current = event.data;
          setPhase("results");
          break;
        }

        case "error": {
          clearThrottleTimer();
          setError({
            type: "unknown",
            title: COPY.errors.unknown.title,
            message: event.data.message || COPY.errors.unknown.message,
          });
          setPhase("error");
          break;
        }
      }
    },
    [addTickerMessage, clearThrottleTimer, startCountdown, totalBatches]
  );

  const runSimulation = useCallback(
    async (briefToRun?: string | unknown) => {
      const activeBrief = typeof briefToRun === "string" ? briefToRun : brief;
      if (!activeBrief || activeBrief.trim().length < 10) return;

      // Abort any prior in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Reset state for new run
      clearThrottleTimer();
      setPhase("submitting");
      setError(null);
      setFinalReport(null);
      finalReportRef.current = null;
      setPersonas([]);
      setActiveBatchPersonas([]);
      setCompletedBatches(0);
      setCurrentBatchIndex(-1);
      setIsThrottling(false);
      setIsAnalystSynthesizing(false);
      setTickerMessages([]);

      await runSimulationStream(
        activeBrief.trim(),
        {
          onEvent: (event) => {
            handleSSEEvent(event);
          },
          onError: (errState) => {
            clearThrottleTimer();
            setError(errState);
            setPhase("error");
          },
          onComplete: (receivedFinalReport) => {
            clearThrottleTimer();
            // RULE: Show results view ONLY if final_report was received.
            // If stream ends without it, show Connection lost error.
            if (receivedFinalReport || finalReportRef.current) {
              setPhase("results");
            } else {
              setError({
                type: "disconnect",
                title: COPY.errors.disconnect.title,
                message: COPY.errors.disconnect.message,
              });
              setPhase("error");
            }
          },
        },
        controller.signal,
        wasCancelledRecentlyRef.current
      );

      // Reset the cancel flag after an attempt is processed
      wasCancelledRecentlyRef.current = false;
    },
    [brief, clearThrottleTimer, handleSSEEvent]
  );

  const cancelSimulation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    clearThrottleTimer();
    wasCancelledRecentlyRef.current = true;
    setPhase("idle");
    setIsThrottling(false);
    setIsAnalystSynthesizing(false);
    setError(null);
  }, [clearThrottleTimer]);

  const resetSimulation = useCallback(() => {
    cancelSimulation();
    setFinalReport(null);
    finalReportRef.current = null;
    setPersonas([]);
    setActiveBatchPersonas([]);
    setCompletedBatches(0);
    setCurrentBatchIndex(-1);
    setPhase("idle");
    setError(null);
    setTickerMessages([]);
  }, [cancelSimulation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearThrottleTimer();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [clearThrottleTimer]);

  return {
    phase,
    brief,
    setBrief,
    totalBatches,
    totalPersonas,
    currentBatchIndex,
    completedBatches,
    personas,
    activeBatchPersonas,
    isThrottling,
    throttleSecondsRemaining,
    isAnalystSynthesizing,
    tickerMessages,
    finalReport,
    error,
    runSimulation,
    cancelSimulation,
    resetSimulation,
  };
}
