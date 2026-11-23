export interface HistoryEntry {
  /** Short human readable description of the parsed user agent. */
  text: string;
  /** ISO timestamp when the entry was saved. */
  createdAt: string;
}

export interface ToolState {
  /** The user agent string being parsed. */
  userAgent: string;
  /** Saved parse history, newest first. */
  history: HistoryEntry[];
}

export const DEFAULT_STATE: ToolState = {
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  history: [],
};

export const MAX_HISTORY = 20;

export interface ParsedUserAgent {
  browser: string;
  browserVersion: string;
  engine: string;
  engineVersion: string;
  os: string;
  osVersion: string;
  device: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'bot' | 'unknown';
  isBot: boolean;
}

/** Ordered browser patterns; first match wins. */
const BROWSER_PATTERNS: { name: string; re: RegExp; versionGroup?: number }[] = [
  { name: 'Edge', re: /Edg(?:e|A|iOS)?\/([\d.]+)/ },
  { name: 'Opera', re: /(?:OPR|Opera)\/([\d.]+)/ },
  { name: 'Samsung Internet', re: /SamsungBrowser\/([\d.]+)/ },
  { name: 'Firefox', re: /(?:Firefox|FxiOS)\/([\d.]+)/ },
  { name: 'Chrome', re: /(?:Chrome|CriOS)\/([\d.]+)/ },
  { name: 'Safari', re: /Version\/([\d.]+).*Safari/ },
  { name: 'Internet Explorer', re: /MSIE ([\d.]+)|Trident\/.*rv:([\d.]+)/ },
  { name: 'curl', re: /curl\/([\d.]+)/ },
  { name: 'wget', re: /Wget\/([\d.]+)/ },
  { name: 'PostmanRuntime', re: /PostmanRuntime\/([\d.]+)/ },
];

const ENGINE_PATTERNS: { name: string; re: RegExp }[] = [
  { name: 'Blink', re: /Chrome\/[\d.]+|Chromium/ },
  { name: 'Blink', re: /Edg\/|OPR\// },
  { name: 'Gecko', re: /Firefox\/|rv:[\d.]+.*Gecko/ },
  { name: 'WebKit', re: /AppleWebKit\/([\d.]+)/ },
  { name: 'Trident', re: /Trident\/([\d.]+)/ },
  { name: 'Presto', re: /Presto\/([\d.]+)/ },
];

const OS_PATTERNS: { os: string; re: RegExp }[] = [
  { os: 'Windows', re: /Windows NT ([\d.]+)/ },
  { os: 'iOS', re: /(?:iPhone|iPad|iPod).*OS ([\d_]+)/ },
  { os: 'macOS', re: /Mac OS X ([\d_.]+)/ },
  { os: 'macOS', re: /Macintosh/ },
  { os: 'Android', re: /Android(?: ([\d.]+))?/ },
  { os: 'Linux', re: /(?:X11; )?Linux/ },
  { os: 'ChromeOS', re: /CrOS/ },
];

const BOT_PATTERNS: RegExp[] = [
  /bot|crawl|spider|slurp|bingpreview|duckduck|facebookexternalhit|linkedin|twitterbot|whatsapp|telegrambot|discordapp|slack|petalbot|ahrefs|semrush|mj12|dotbot|yandex|baidu|sogou|ia_archiver|archive\.org|amazonbot|gptbot|claudebot|anthropic|perplexity|bytespider|applebot|headlesschrome|puppeteer|playwright|phantomjs|selenium|lighthouse|pagespeed|gtmetrix|pingdom|uptimerobot|scrapy|python-requests|python-urllib|axios|node-fetch|okhttp|java\/|apache-httpclient|go-http-client|libwww|mechanize|phantom|wget|curl|monitor|validator|checker|fetcher|inspector|preview/i,
];

function normalizeWindowsVersion(v: string): string {
  const map: Record<string, string> = {
    '10.0': '10/11',
    '6.3': '8.1',
    '6.2': '8',
    '6.1': '7',
    '6.0': 'Vista',
    '5.2': 'XP 64-bit',
    '5.1': 'XP',
  };
  return map[v] ?? v;
}

/** Identify the browser name and version from a user agent string. */
export function detectBrowser(ua: string): { browser: string; version: string } {
  for (const pattern of BROWSER_PATTERNS) {
    const m = pattern.re.exec(ua);
    if (m) {
      return { browser: pattern.name, version: m[1] ?? '' };
    }
  }
  return { browser: 'Unknown', version: '' };
}

/** Identify the rendering engine and its version. */
export function detectEngine(ua: string): { engine: string; version: string } {
  const webkit = /AppleWebKit\/([\d.]+)/.exec(ua);
  for (const pattern of ENGINE_PATTERNS) {
    const m = pattern.re.exec(ua);
    if (m) {
      return { engine: pattern.name, version: m[1] ?? webkit?.[1] ?? '' };
    }
  }
  return { engine: 'Unknown', version: '' };
}

/** Identify the operating system and its version. */
export function detectOs(ua: string): { os: string; version: string } {
  for (const pattern of OS_PATTERNS) {
    const m = pattern.re.exec(ua);
    if (m) {
      let version = m[1] ?? '';
      if (pattern.os === 'Windows') version = normalizeWindowsVersion(version);
      if (pattern.os === 'iOS' || pattern.os === 'macOS') version = version.replace(/_/g, '.');
      return { os: pattern.os, version };
    }
  }
  return { os: 'Unknown', version: '' };
}

/** True when the user agent matches known bot, crawler or automation patterns. */
export function isBotUserAgent(ua: string): boolean {
  return BOT_PATTERNS.some((re) => re.test(ua));
}

/**
 * Classify the device from the user agent.
 * Bots are classified as 'bot'; Android (non-tablet) and iPhone/iPod are mobile,
 * iPad and Android tablets are tablet, other unknown agents fall back to desktop.
 */
export function detectDevice(ua: string): {
  device: string;
  deviceType: ParsedUserAgent['deviceType'];
} {
  if (isBotUserAgent(ua)) return { device: 'Bot / automated agent', deviceType: 'bot' };
  if (
    /iPad|Tablet|PlayBook|Silk|Kindle/i.test(ua) ||
    (/Android/i.test(ua) && !/Mobile/i.test(ua))
  ) {
    return { device: 'Tablet', deviceType: 'tablet' };
  }
  if (/Mobi|iPhone|iPod|Windows Phone|IEMobile|BlackBerry|Opera Mini/i.test(ua)) {
    return { device: 'Mobile', deviceType: 'mobile' };
  }
  if (/Windows|Macintosh|Mac OS|X11|Linux|CrOS/i.test(ua)) {
    return { device: 'Desktop', deviceType: 'desktop' };
  }
  return { device: 'Unknown', deviceType: 'unknown' };
}

/** Parse a complete user agent string into structured details. */
export function parseUserAgent(ua: string): ParsedUserAgent {
  const browser = detectBrowser(ua);
  const engine = detectEngine(ua);
  const os = detectOs(ua);
  const device = detectDevice(ua);
  return {
    browser: browser.browser,
    browserVersion: browser.version,
    engine: engine.engine,
    engineVersion: engine.version,
    os: os.os,
    osVersion: os.version,
    device: device.device,
    deviceType: device.deviceType,
    isBot: isBotUserAgent(ua),
  };
}

/** One-line human readable summary of a parsed user agent. */
export function summaryText(ua: string): string {
  const trimmed = ua.trim();
  if (!trimmed) return 'Enter a User-Agent string to parse it.';
  const p = parseUserAgent(trimmed);
  if (p.isBot) {
    return `Bot: ${p.browser}${p.browserVersion ? ` ${p.browserVersion}` : ''} — ${p.device}`;
  }
  return `${p.browser}${p.browserVersion ? ` ${p.browserVersion}` : ''} on ${p.os}${
    p.osVersion ? ` ${p.osVersion}` : ''
  } (${p.device})`;
}

/** Pretty-printed JSON summary for copy/export. */
export function parsedJson(ua: string): string {
  return JSON.stringify(parseUserAgent(ua), null, 2);
}

/** True when the string looks like a plausible user agent (non-empty, printable). */
export function plausibleUserAgent(ua: string): boolean {
  const trimmed = ua.trim();
  if (!trimmed || trimmed.length > 2048) return false;
  return !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(trimmed);
}

/** Parse tool state from an arbitrary payload, repairing invalid shapes. */
export function isState(value: unknown): value is ToolState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<ToolState>;
  return typeof v.userAgent === 'string' && Array.isArray(v.history ?? []);
}
