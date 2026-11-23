import type { ExportFormat } from '@itsjust/core';

export const toolConfig = {
  id: 'user-agent-parser',
  name: 'User-Agent Parser',
  description:
    'Parses a User-Agent string into browser, engine, OS, and device details with bot detection and shareable links.',
  version: '1.0.0',
  exportFormats: ['png', 'jpeg', 'webp', 'pdf', 'json'] satisfies ExportFormat[],
  features: {
    export: true,
    autoSave: true,
    undoRedo: false,
    sidebar: true,
    statusBar: true,
    darkMode: true,
  },
  theme: {
    accent: '#0ea5e9',
    accentHover: '#0284c7',
    accentSubtle: 'rgba(14, 165, 233, 0.15)',
    brand: 'User-Agent Parser',
    icon: '🕵️',
  },
  shortcuts: [
    {
      title: 'User-Agent Parser',
      shortcuts: [
        {
          keys: 'P',
          label: 'Use my user agent',
          description: 'prefill the current browser user agent',
        },
        { keys: 'C', label: 'Copy JSON', description: 'copy the parsed JSON summary' },
        { keys: 'X', label: 'Clear input', description: 'clear the user agent input' },
      ],
    },
  ],
};

export default toolConfig;
