'use client';

import React from 'react';
import { PRESETS } from '../ui-shared';
import { parseUserAgent, parsedJson } from '../types';
import type { ToolState } from '../types';

interface CanvasProps {
  state: ToolState;
  onChange?: (state: ToolState) => void;
  onSaveHistory?: (text: string) => void;
  onUseMyAgent?: () => void;
}

const inputClass =
  'mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';

function CopyButton({ value, testid }: { value: string; testid?: string }) {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable; ignore
    }
  }, [value]);
  return (
    <button
      type="button"
      onClick={handleCopy}
      data-testid={testid}
      className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
      aria-label="Copy value"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-gray-200 px-3 py-1.5 text-xs dark:border-gray-800">
      <span className="font-medium text-gray-500 dark:text-gray-400">{label}</span>
      <span
        className="flex items-center gap-2 font-mono text-gray-900 dark:text-gray-100"
        data-testid={`detail-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`}
      >
        {value || '—'}
        {value ? <CopyButton value={value} /> : null}
      </span>
    </div>
  );
}

export const Canvas: React.FC<CanvasProps> = ({ state, onChange, onSaveHistory, onUseMyAgent }) => {
  const update = (patch: Partial<ToolState>) => onChange?.({ ...state, ...patch });
  const ua = state.userAgent;
  const hasInput = ua.trim().length > 0;
  const parsed = React.useMemo(() => (hasInput ? parseUserAgent(ua) : null), [ua, hasInput]);

  return (
    <div className="p-4 space-y-6 overflow-y-auto h-full" data-testid="user-agent-parser-canvas">
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
        User-Agent string
        <textarea
          value={ua}
          onChange={(e) => update({ userAgent: e.target.value })}
          data-testid="ua-input"
          rows={4}
          spellCheck={false}
          className={`${inputClass} resize-y`}
          placeholder="Paste a User-Agent string…"
        />
      </label>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Presets">
        {onUseMyAgent ? (
          <button
            type="button"
            data-testid="btn-use-my-agent"
            onClick={onUseMyAgent}
            className="rounded-md border border-sky-500 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-800 hover:bg-sky-100 dark:bg-sky-900/40 dark:text-sky-100"
          >
            Use my user agent
          </button>
        ) : null}
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            data-testid={`preset-${preset.label.toLowerCase().replace(/[^a-z]+/g, '-')}`}
            title={preset.ua}
            onClick={() => update({ userAgent: preset.ua })}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {parsed ? (
        <>
          {parsed.isBot ? (
            <div
              className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-100"
              role="status"
              data-testid="bot-notice"
            >
              🤖 This looks like a bot, crawler or automated client — browser details may be
              spoofed.
            </div>
          ) : null}

          <div
            className="rounded-lg border border-gray-200 bg-white p-4 text-center dark:border-gray-800 dark:bg-gray-900"
            data-testid="result-card"
            role="status"
          >
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400">
              Summary
            </span>
            <span className="block font-mono text-lg font-semibold" data-testid="result-main">
              {parsed.browser}
              {parsed.browserVersion ? ` ${parsed.browserVersion}` : ''}
            </span>
            <span
              className="mt-1 block text-xs text-gray-600 dark:text-gray-300"
              data-testid="result-summary"
            >
              {parsed.os}
              {parsed.osVersion ? ` ${parsed.osVersion}` : ''} · {parsed.device} · {parsed.engine}
              {parsed.engineVersion ? ` ${parsed.engineVersion}` : ''}
            </span>
            <button
              type="button"
              data-testid="btn-save-history"
              onClick={() =>
                onSaveHistory?.(
                  `${parsed.browser}${parsed.browserVersion ? ` ${parsed.browserVersion}` : ''} on ${parsed.os}`
                )
              }
              className="mt-3 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Save to history
            </button>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Details
            </h3>
            <div className="space-y-1.5">
              <DetailRow
                label="Browser"
                value={`${parsed.browser}${parsed.browserVersion ? ` ${parsed.browserVersion}` : ''}`}
              />
              <DetailRow
                label="Engine"
                value={`${parsed.engine}${parsed.engineVersion ? ` ${parsed.engineVersion}` : ''}`}
              />
              <DetailRow
                label="Operating system"
                value={`${parsed.os}${parsed.osVersion ? ` ${parsed.osVersion}` : ''}`}
              />
              <DetailRow label="Device" value={parsed.device} />
              <DetailRow label="Device type" value={parsed.deviceType} />
              <DetailRow label="Bot" value={parsed.isBot ? 'yes' : 'no'} />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
            <h3 className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              JSON
              <CopyButton value={parsedJson(ua)} testid="copy-json" />
            </h3>
            <pre
              className="overflow-x-auto rounded-md bg-white p-3 font-mono text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-200"
              data-testid="parsed-json"
            >
              {parsedJson(ua)}
            </pre>
          </div>
        </>
      ) : (
        <div
          className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
          data-testid="empty-state"
        >
          Paste or pick a User-Agent string above to parse it.
        </div>
      )}

      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          History
        </h3>
        {state.history.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400" data-testid="history-empty">
            No saved parses yet.
          </p>
        ) : (
          <ul className="space-y-1" data-testid="history-list">
            {state.history.map((entry, i) => (
              <li
                key={`${entry.createdAt}-${i}`}
                className="flex items-center justify-between gap-2 rounded-md border border-gray-200 px-3 py-1.5 text-xs dark:border-gray-800"
              >
                <span className="text-gray-700 dark:text-gray-300">{entry.text}</span>
                <CopyButton value={entry.text} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-center text-xs text-gray-500 dark:text-gray-400">
        Parsing runs locally in your browser; nothing is uploaded.
      </p>
    </div>
  );
};
