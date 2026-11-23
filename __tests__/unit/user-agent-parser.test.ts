import { describe, it, expect } from 'vitest';
import {
  parseUserAgent,
  detectBrowser,
  detectEngine,
  detectOs,
  detectDevice,
  isBotUserAgent,
  summaryText,
  parsedJson,
  plausibleUserAgent,
} from '@/tool/types';
import { PRESETS } from '@/tool/ui-shared';
import { deserializeState, serializeState, withHistory, roundTrips } from '@/tool/tool-definition';
import { DEFAULT_STATE, MAX_HISTORY, type ToolState } from '@/tool/types';
import { userAgentParserTool } from '@/tool/tool-definition';

const CHROME_WIN =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const FIREFOX_LINUX = 'Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0';
const SAFARI_IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const EDGE_WIN =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0';
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';
const ANDROID_TABLET =
  'Mozilla/5.0 (Linux; Android 13; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const IPAD =
  'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const CURL = 'curl/8.7.1';
const HEADLESS =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/124.0.0.0 Safari/537.36';

const state = (patch: Partial<ToolState> = {}): ToolState => ({ ...DEFAULT_STATE, ...patch });

describe('detectBrowser', () => {
  it('parses browser name and version for the main browsers', () => {
    expect(detectBrowser(CHROME_WIN)).toEqual({ browser: 'Chrome', version: '126.0.0.0' });
    expect(detectBrowser(FIREFOX_LINUX)).toEqual({ browser: 'Firefox', version: '127.0' });
    expect(detectBrowser(SAFARI_IPHONE).browser).toBe('Safari');
    expect(detectBrowser(SAFARI_IPHONE).version).toBe('17.5');
    expect(detectBrowser(EDGE_WIN)).toEqual({ browser: 'Edge', version: '126.0.0.0' });
    expect(detectBrowser(CURL).browser).toBe('curl');
  });

  it('prefers Edge over Chrome when both appear', () => {
    expect(detectBrowser(EDGE_WIN).browser).toBe('Edge');
  });

  it('returns Unknown for garbage input', () => {
    expect(detectBrowser('not a user agent at all').browser).toBe('Unknown');
    expect(detectBrowser('').browser).toBe('Unknown');
  });
});

describe('detectEngine', () => {
  it('detects Blink, Gecko and WebKit engines', () => {
    expect(detectEngine(CHROME_WIN).engine).toBe('Blink');
    expect(detectEngine(FIREFOX_LINUX).engine).toBe('Gecko');
    expect(detectEngine(SAFARI_IPHONE).engine).toBe('WebKit');
    expect(detectEngine(SAFARI_IPHONE).version).toBe('605.1.15');
    expect(detectEngine('curl/8.7.1').engine).toBe('Unknown');
  });
});

describe('detectOs', () => {
  it('detects Windows with a friendly version name', () => {
    const win = detectOs(CHROME_WIN);
    expect(win.os).toBe('Windows');
    expect(win.version).toBe('10/11');
  });

  it('detects iOS, macOS and Android with versions', () => {
    expect(detectOs(SAFARI_IPHONE)).toEqual({ os: 'iOS', version: '17.5' });
    expect(detectOs(ANDROID_CHROME).os).toBe('Android');
    expect(detectOs(ANDROID_CHROME).version).toBe('14');
    expect(detectOs('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)').version).toBe('10.15.7');
    expect(detectOs(FIREFOX_LINUX).os).toBe('Linux');
  });

  it('returns Unknown for garbage input', () => {
    expect(detectOs('zzz').os).toBe('Unknown');
  });
});

describe('isBotUserAgent', () => {
  it('flags known bots and automation', () => {
    expect(isBotUserAgent(GOOGLEBOT)).toBe(true);
    expect(isBotUserAgent(CURL)).toBe(true);
    expect(isBotUserAgent(HEADLESS)).toBe(true);
  });

  it('does not flag normal browsers', () => {
    expect(isBotUserAgent(CHROME_WIN)).toBe(false);
    expect(isBotUserAgent(FIREFOX_LINUX)).toBe(false);
  });
});

describe('detectDevice', () => {
  it('classifies desktop, mobile and tablet', () => {
    expect(detectDevice(CHROME_WIN).deviceType).toBe('desktop');
    expect(detectDevice(SAFARI_IPHONE).deviceType).toBe('mobile');
    expect(detectDevice(ANDROID_CHROME).deviceType).toBe('mobile');
    expect(detectDevice(IPAD).deviceType).toBe('tablet');
    expect(detectDevice(ANDROID_TABLET).deviceType).toBe('tablet');
  });

  it('classifies bots first', () => {
    expect(detectDevice(GOOGLEBOT).deviceType).toBe('bot');
    expect(detectDevice(CURL).deviceType).toBe('bot');
  });
});

describe('parseUserAgent', () => {
  it('returns the full structured breakdown', () => {
    const parsed = parseUserAgent(CHROME_WIN);
    expect(parsed.browser).toBe('Chrome');
    expect(parsed.os).toBe('Windows');
    expect(parsed.engine).toBe('Blink');
    expect(parsed.deviceType).toBe('desktop');
    expect(parsed.isBot).toBe(false);
  });
});

describe('summaryText', () => {
  it('summarizes a desktop browser', () => {
    const text = summaryText(CHROME_WIN);
    expect(text).toContain('Chrome 126.0.0.0');
    expect(text).toContain('Windows');
  });

  it('summarizes bots with a bot prefix', () => {
    expect(summaryText(GOOGLEBOT)).toContain('Bot:');
    expect(summaryText(CURL)).toContain('Bot:');
  });

  it('degrades gracefully on empty input', () => {
    expect(summaryText('')).toBe('Enter a User-Agent string to parse it.');
  });
});

describe('parsedJson', () => {
  it('returns pretty-printed JSON with all fields', () => {
    const parsed: Record<string, unknown> = JSON.parse(parsedJson(CHROME_WIN));
    expect(parsed.browser).toBe('Chrome');
    expect(parsed.isBot).toBe(false);
    expect(Object.keys(parsed)).toContain('engine');
  });
});

describe('plausibleUserAgent', () => {
  it('accepts real user agents and rejects empty or control characters', () => {
    expect(plausibleUserAgent(CHROME_WIN)).toBe(true);
    expect(plausibleUserAgent('')).toBe(false);
    expect(plausibleUserAgent('   ')).toBe(false);
    expect(plausibleUserAgent('bad\u0007string')).toBe(false);
    expect(plausibleUserAgent('a'.repeat(2049))).toBe(false);
  });
});

describe('presets', () => {
  it('covers real-world examples without throwing', () => {
    expect(PRESETS.length).toBeGreaterThanOrEqual(5);
    for (const preset of PRESETS) {
      expect(() => parseUserAgent(preset.ua)).not.toThrow();
      expect(summaryText(preset.ua)).not.toBe('');
    }
  });
});

describe('serialize/deserialize round-trip', () => {
  const full: ToolState = {
    userAgent: CHROME_WIN,
    history: [{ text: 'Chrome on Windows', createdAt: '2026-11-21T10:00:00.000Z' }],
  };

  it('round-trips all fields through serializeState/deserializeState', () => {
    const restored = deserializeState(JSON.parse(serializeState(full)));
    expect(restored.success).toBe(true);
    if (restored.success) {
      expect(restored.data).toEqual(full);
    }
    expect(serializeState(full)).toContain('"userAgent"');
  });

  it('round-trips via the Tool object', () => {
    const serialized = userAgentParserTool.serialize(full);
    const restored = userAgentParserTool.deserialize(JSON.parse(serialized));
    expect(restored.success).toBe(true);
    if (restored.success) {
      expect(restored.data).toEqual(full);
    }
  });

  it('keeps URL share state round-trip safe', () => {
    expect(roundTrips(full)).toBe(true);
    expect(roundTrips(DEFAULT_STATE)).toBe(true);
  });

  it('rejects malformed payloads', () => {
    expect(deserializeState(null).success).toBe(false);
    expect(deserializeState('string').success).toBe(false);
    expect(deserializeState([1, 2]).success).toBe(false);
    expect(deserializeState(undefined).success).toBe(false);
  });

  it('falls back to defaults for missing fields', () => {
    const restored = deserializeState({});
    expect(restored.success).toBe(true);
    if (restored.success) {
      expect(restored.data.userAgent).toBe(DEFAULT_STATE.userAgent);
      expect(restored.data.history).toEqual([]);
    }
  });

  it('clamps oversized user agent strings to the default', () => {
    const restored = deserializeState({ userAgent: 'a'.repeat(4096) });
    expect(restored.success).toBe(true);
    if (restored.success) {
      expect(restored.data.userAgent.length).toBeLessThanOrEqual(2048);
    }
  });

  it('filters invalid history entries and caps length', () => {
    const entries = Array.from({ length: MAX_HISTORY + 5 }, (_, i) => ({
      text: `entry ${i}`,
      createdAt: new Date(2026, 0, 1, 0, 0, i).toISOString(),
    }));
    const restored = deserializeState({ history: [...entries, 'bad', { text: 'x' }] });
    expect(restored.success).toBe(true);
    if (restored.success) {
      expect(restored.data.history.length).toBe(MAX_HISTORY);
      expect(restored.data.history[0]?.text).toBe('entry 0');
    }
  });
});

describe('withHistory', () => {
  it('prepends newest entries first', () => {
    const now = new Date('2026-11-21T12:00:00Z');
    let s = state();
    s = withHistory(s, 'one', now);
    s = withHistory(s, 'two', now);
    expect(s.history[0]?.text).toBe('two');
    expect(s.history[1]?.text).toBe('one');
    expect(s.history[0]?.createdAt).toBe('2026-11-21T12:00:00.000Z');
  });

  it('caps the history at MAX_HISTORY', () => {
    const now = new Date('2026-11-21T12:00:00Z');
    let s = state();
    for (let i = 0; i < MAX_HISTORY + 10; i++) {
      s = withHistory(s, `entry ${i}`, now);
    }
    expect(s.history.length).toBe(MAX_HISTORY);
    expect(s.history[0]?.text).toBe(`entry ${MAX_HISTORY + 9}`);
  });
});
