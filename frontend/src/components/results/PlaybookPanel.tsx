"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { motion, useReducedMotion } from "motion/react";
import { COPY } from "../../lib/copy";

interface PlaybookPanelProps {
  markdown: string;
  executiveSummary?: string;
}

// Helper to strip emoji characters from headings
function stripEmojiFromNode(node: React.ReactNode): React.ReactNode {
  if (typeof node === "string") {
    return node
      .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }
  if (Array.isArray(node)) {
    return node.map(stripEmojiFromNode);
  }
  if (
    React.isValidElement(node) &&
    node.props &&
    (node.props as { children?: React.ReactNode }).children
  ) {
    const props = node.props as { children: React.ReactNode; [key: string]: unknown };
    return React.cloneElement(
      node as React.ReactElement<Record<string, unknown>>,
      props,
      stripEmojiFromNode(props.children)
    );
  }
  return node;
}

// Helper to strip leading duplicate checkmarks
function stripLeadingCheckmark(node: React.ReactNode): React.ReactNode {
  if (typeof node === "string") {
    return node.replace(/^(\[✓\]|\[x\]|\[ \]|✓)\s*/, "");
  }
  if (Array.isArray(node)) {
    if (node.length === 0) return node;
    const first = stripLeadingCheckmark(node[0]);
    return [first, ...node.slice(1)];
  }
  if (
    React.isValidElement(node) &&
    node.props &&
    (node.props as { children?: React.ReactNode }).children
  ) {
    const props = node.props as { children: React.ReactNode; [key: string]: unknown };
    return React.cloneElement(
      node as React.ReactElement<Record<string, unknown>>,
      props,
      stripLeadingCheckmark(props.children)
    );
  }
  return node;
}

export function PlaybookPanel({
  markdown,
  executiveSummary,
}: PlaybookPanelProps) {
  const [copied, setCopied] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy playbook:", err);
    }
  };

  return (
    <motion.section
      initial={{ opacity: shouldReduceMotion ? 1 : 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 border border-white/20 bg-white/5 p-6 sm:p-8 rounded-xl shadow-xl"
    >
      {/* Header & Copy CTA */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="font-display-condensed text-2xl text-white sm:text-3xl">
            {COPY.results.playbookHeading}
          </h2>
          <p className="text-xs text-[#dce4ff] sm:text-sm">
            {COPY.results.playbookIntro}
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex self-start items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white transition-[transform,background-color] duration-150 ease-out hover:bg-white/20 active:scale-[0.98] cursor-pointer sm:self-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffe500]"
        >
          {copied ? (
            <>
              <span className="text-[#ffe500]">✓</span>
              <span>{COPY.results.playbookCopied}</span>
            </>
          ) : (
            <>
              <span>📋</span>
              <span>{COPY.results.copyPlaybookButton}</span>
            </>
          )}
        </button>
      </div>

      {/* Optional Executive Summary Callout */}
      {executiveSummary && (
        <div className="border-l-4 border-[#ffe500] bg-white/[0.04] p-4 text-sm leading-relaxed text-[#dce4ff] rounded-r-lg">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#ffe500]">
            Executive Synthesis
          </span>
          <p>{executiveSummary}</p>
        </div>
      )}

      {/* Sanitized React-Markdown Playbook formatted as a checklist */}
      <div className="prose prose-invert max-w-none text-white leading-relaxed font-sans">
        <ReactMarkdown
          components={{
            // Disallow images
            img: () => null,
            // Restrict links to http/https and force noopener noreferrer
            a: ({ href, children }) => {
              const isSafe =
                href && (href.startsWith("http://") || href.startsWith("https://"));
              if (!isSafe) {
                return <span>{children}</span>;
              }
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#ffe500] hover:underline transition-colors"
                >
                  {children}
                </a>
              );
            },
            h1: ({ children }) => (
              <h1 className="font-display-condensed text-2xl text-white mt-6 mb-3 tracking-normal">
                {stripEmojiFromNode(children)}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="font-display-condensed text-xl text-white mt-5 mb-2.5 tracking-normal border-b border-white/15 pb-1">
                {stripEmojiFromNode(children)}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-base sm:text-lg font-bold text-white mt-4 mb-2">
                {stripEmojiFromNode(children)}
              </h3>
            ),
            p: ({ children }) => (
              <p className="text-sm sm:text-base text-[#dce4ff] leading-relaxed my-2.5">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="space-y-2.5 my-3 text-sm sm:text-base text-white">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside space-y-2.5 my-3 text-sm sm:text-base text-white">
                {children}
              </ol>
            ),
            // Checklist style for bullet items (single [✓] without duplication)
            li: ({ children }) => (
              <li className="flex items-start gap-2.5 leading-relaxed text-sm sm:text-base text-[#dce4ff]">
                <span className="text-[#ffe500] font-bold mt-0.5 shrink-0 select-none">
                  [✓]
                </span>
                <span>{stripLeadingCheckmark(children)}</span>
              </li>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-[#ffe500] pl-4 italic text-white/80 my-3">
                {children}
              </blockquote>
            ),
            code: ({ children }) => (
              <code className="bg-black/40 px-1.5 py-0.5 rounded-none text-xs font-mono text-[#ffe500]">
                {children}
              </code>
            ),
            pre: ({ children }) => (
              <pre className="bg-black/50 p-4 overflow-x-auto text-xs font-mono text-white my-3 border border-white/10">
                {children}
              </pre>
            ),
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    </motion.section>
  );
}
