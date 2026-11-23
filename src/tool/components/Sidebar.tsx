'use client';

import React from 'react';
import { PRESETS } from '../ui-shared';
import type { ToolState } from '../types';

interface SidebarProps {
  state: ToolState;
  onChange: (next: ToolState) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ state, onChange }) => {
  return (
    <div
      className="p-4 space-y-6 text-sm overflow-y-auto h-full"
      data-testid="user-agent-parser-sidebar"
    >
      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">What is parsed</h3>
        <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
          <li>Browser name and version</li>
          <li>Rendering engine and version</li>
          <li>Operating system and version</li>
          <li>Device class: desktop, mobile or tablet</li>
          <li>Bot / crawler detection with a warning notice</li>
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Presets</h3>
        <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
          {PRESETS.map((preset) => (
            <li key={preset.label}>
              <button
                type="button"
                onClick={() => onChange({ ...state, userAgent: preset.ua })}
                className="text-sky-700 underline-offset-2 hover:underline dark:text-sky-300"
              >
                {preset.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Saved parses</h3>
        <p className="text-xs text-gray-600 dark:text-gray-300" data-testid="sidebar-history-count">
          {state.history.length} entr{state.history.length === 1 ? 'y' : 'ies'} in history
          {state.history.length > 0 ? ' (newest first)' : ''}
        </p>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Keyboard shortcuts</h3>
        <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
          <li>
            <kbd>P</kbd> — use my user agent
          </li>
          <li>
            <kbd>C</kbd> — copy JSON summary
          </li>
          <li>
            <kbd>X</kbd> — clear input
          </li>
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Share</h3>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          Use the toolbar share button to create a URL containing the current User-Agent; open it to
          restore this parse.
        </p>
      </div>
    </div>
  );
};
