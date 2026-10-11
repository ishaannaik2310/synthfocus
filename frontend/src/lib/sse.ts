/**
 * Server-Sent Events (SSE) streaming client using fetch and ReadableStream.
 * Supports POST requests, cancellation via AbortController, chunk buffering,
 * multi-line data accumulation, and heartbeat filtering.
 */

import { SSEEvent, SimulationErrorState } from "../types/simulation";
import { COPY } from "./copy";

export interface StreamCallbacks {
  onEvent: (event: SSEEvent) => void;
  onError: (error: SimulationErrorState) => void;
  onComplete: (receivedFinalReport: boolean) => void;
}

export async function runSimulationStream(
  productBrief: string,
  callbacks: StreamCallbacks,
  signal: AbortSignal,
  wasCancelledRecently = false
): Promise<void> {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
  const endpoint = `${apiUrl.replace(/\/$/, "")}/api/simulate-focus-group`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ product_brief: productBrief }),
      signal,
    });
  } catch (err: unknown) {
    if (signal.aborted) {
      return;
    }
    callbacks.onError({
      type: "network",
      title: COPY.errors.network.title,
      message: COPY.errors.network.message,
    });
    return;
  }

  // Handle HTTP error statuses (like 429 or 422)
  if (!response.ok) {
    let errorDetail = "";
    let errorCode = "";
    try {
      const errJson = await response.json();
      errorCode = errJson.code || "";
      errorDetail = errJson.detail || "";
    } catch {
      // Body not JSON
    }

    if (response.status === 429) {
      // Discriminate 429 subtypes: check 'code' first, then keyword fallback
      if (errorCode === "busy" || errorDetail.includes("currently busy")) {
        if (wasCancelledRecently) {
          callbacks.onError({
            type: "busy",
            title: COPY.errors.busyAfterCancel.title,
            message: COPY.errors.busyAfterCancel.message,
            isAfterCancel: true,
          });
        } else {
          callbacks.onError({
            type: "busy",
            title: COPY.errors.busy.title,
            message: COPY.errors.busy.message,
          });
        }
      } else if (
        errorCode === "daily_cap" ||
        errorDetail.includes("daily") ||
        errorDetail.includes("quota")
      ) {
        callbacks.onError({
          type: "daily_cap",
          title: COPY.errors.dailyCap.title,
          message: COPY.errors.dailyCap.message,
        });
      } else if (
        errorCode === "rate_limit" ||
        errorDetail.includes("rate limit") ||
        errorDetail.includes("Hourly")
      ) {
        callbacks.onError({
          type: "rate_limit",
          title: COPY.errors.rateLimit.title,
          message: COPY.errors.rateLimit.message,
        });
      } else {
        callbacks.onError({
          type: "busy",
          title: COPY.errors.busy.title,
          message: COPY.errors.busy.message,
        });
      }
      return;
    }

    callbacks.onError({
      type: "unknown",
      title: COPY.errors.unknown.title,
      message: errorDetail || `Server returned HTTP ${response.status}`,
    });
    return;
  }

  if (!response.body) {
    callbacks.onError({
      type: "network",
      title: COPY.errors.network.title,
      message: "Server returned empty response body.",
    });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let receivedFinalReport = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // SSE frames are separated by a double newline: \n\n or \r\n\r\n
      let boundaryIndex: number;
      while ((boundaryIndex = buffer.search(/\r?\n\r?\n/)) !== -1) {
        const rawChunk = buffer.slice(0, boundaryIndex);
        const match = buffer.match(/\r?\n\r?\n/);
        const delimiterLength = match ? match[0].length : 2;
        buffer = buffer.slice(boundaryIndex + delimiterLength);

        // Parse individual SSE chunk
        const lines = rawChunk.split(/\r?\n/);
        let eventType = "message";
        const dataLines: string[] = [];

        for (const line of lines) {
          if (!line || line.startsWith(":")) {
            // Heartbeat comment or empty line — ignore
            continue;
          }
          if (line.startsWith("event:")) {
            eventType = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            dataLines.push(line.slice(5).trimStart());
          }
        }

        if (dataLines.length > 0) {
          const rawData = dataLines.join("\n");
          try {
            const parsedData = JSON.parse(rawData);
            if (eventType === "final_report") {
              receivedFinalReport = true;
            }
            callbacks.onEvent({
              event: eventType,
              data: parsedData,
            } as SSEEvent);
          } catch (jsonErr) {
            console.error("Failed to parse SSE JSON payload:", rawData, jsonErr);
          }
        }
      }
    }

    // Flush any remaining partial buffer
    callbacks.onComplete(receivedFinalReport);
  } catch (streamErr: unknown) {
    if (signal.aborted) {
      return;
    }
    callbacks.onError({
      type: "disconnect",
      title: COPY.errors.disconnect.title,
      message: COPY.errors.disconnect.message,
    });
  }
}
