import { DEFAULT_CONFIG, ROUTES, validState } from './engine.js';

// A class link contains portable, non-secret setup, never team progress or names.
// Encoding is for transport only: it is not encryption or authentication.
export const SESSION_PREFIX = 'cybershield-class-v1';
export const LAST_CLASS_KEY = `${SESSION_PREFIX}:last`;
export const DEMO_KEY = `${SESSION_PREFIX}:demo`;
export const TEACHER_LAUNCH_KEY = `${SESSION_PREFIX}:teacher-link`;
const LAUNCH_KEYS = ['v', 'id', 'mode', 'code'];
const MAX_PAYLOAD_LENGTH = 512;
const INVALID_LINK = 'This class link is invalid or incomplete. Ask your teacher for a new link.';
let sequence = 0;

export function validateLaunch(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) return false;
  const prototype = Object.getPrototypeOf(p);
  if (prototype !== Object.prototype && prototype !== null) return false;
  const keys = Reflect.ownKeys(p);
  return keys.length === 4 && LAUNCH_KEYS.every(key => Object.hasOwn(p, key)) &&
    p.v === 1 && typeof p.id === 'string' && /^[a-z0-9-]{8,64}$/.test(p.id) &&
    (p.mode === 'digital' || p.mode === 'physical') &&
    typeof p.code === 'string' && /^[A-Z0-9-]{3,24}$/.test(p.code);
}

function requireLaunch(p) {
  if (!validateLaunch(p)) throw new Error(INVALID_LINK);
  return p;
}

function launchData(p) {
  requireLaunch(p);
  return { v: 1, id: p.id, mode: p.mode, code: p.code };
}

export function createLaunch(mode, code) {
  const normalized = typeof code === 'string' ? code.trim().toUpperCase() : '';
  if (!['digital', 'physical'].includes(mode)) throw new Error('Choose a digital or physical finale.');
  if (!/^[A-Z0-9-]{3,24}$/.test(normalized)) {
    throw new Error('Use a start code with 3–24 letters, numbers, or hyphens.');
  }
  // The fallback combines time, a per-page counter, and randomness. IDs are not passwords.
  const id = globalThis.crypto?.randomUUID?.() ||
    `class-${Date.now().toString(36)}-${(++sequence).toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  return launchData({ v: 1, id, mode, code: normalized });
}

function base64url(text) {
  return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function encodeLaunch(p) {
  return base64url(JSON.stringify(launchData(p)));
}

export function decodeLaunch(hash) {
  if (hash === undefined || hash === null || hash === '') return null;
  if (typeof hash !== 'string') throw new Error(INVALID_LINK);
  const raw = hash.replace(/^#/, '');
  const params = new URLSearchParams(raw);
  if (!params.has('class')) return null;
  const encoded = params.get('class');
  if (raw.length > 2048 || params.getAll('class').length !== 1 ||
      !encoded || encoded.length > MAX_PAYLOAD_LENGTH || !/^[A-Za-z0-9_-]+$/.test(encoded)) {
    throw new Error(INVALID_LINK);
  }
  try {
    const plain = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
    if (base64url(plain) !== encoded) throw new Error(INVALID_LINK);
    return launchData(JSON.parse(plain));
  } catch {
    throw new Error(INVALID_LINK);
  }
}

export function classLink(p, baseURL) {
  const payload = encodeLaunch(p);
  const base = baseURL === undefined ? globalThis.location?.href : String(baseURL);
  if (!base) throw new Error('A page address is needed to create the class link.');
  const browserBase = globalThis.document?.baseURI || globalThis.location?.href;
  try {
    // Resolve relative paths in browsers while preserving the actual project path.
    const url = browserBase ? new URL(base, browserBase) : new URL(base);
    if (!['http:', 'https:', 'file:'].includes(url.protocol)) throw new Error('Unsupported address');
    url.username = '';
    url.password = '';
    url.search = '';
    url.hash = `class=${payload}`;
    return url.href;
  } catch {
    // Relative paths are also useful in static exports and dependency-free Node tests.
    if (/^[a-z][a-z\d+.-]*:/i.test(base) || base.startsWith('//') || /[\r\n]/.test(base)) {
      throw new Error('Use the address of the class activity page.');
    }
    return `${base.split(/[?#]/, 1)[0]}#class=${payload}`;
  }
}

export function launchConfig(p) {
  requireLaunch(p);
  return { ...DEFAULT_CONFIG, rooms: [...DEFAULT_CONFIG.rooms], ready: true, startCode: p.code, finalMode: p.mode };
}

export function classStateKey(p) {
  requireLaunch(p);
  return `${SESSION_PREFIX}:state:${p.id}`;
}

function matchesClassState(p, state) {
  try {
    return !!state && state.classId === p.id && state.demo === false &&
      Object.hasOwn(ROUTES, state.route) && validState(state) &&
      state.config.startCode === p.code && state.config.finalMode === p.mode;
  } catch {
    return false;
  }
}

export function saveClassState(storage, p, state) {
  const key = classStateKey(p);
  if (state !== null && !matchesClassState(p, state)) {
    throw new Error('This progress does not belong to the current class.');
  }
  // An explicit null resets only this class, leaving all earlier classes and demo data intact.
  // Writing JSON null works with small storage adapters as well as localStorage.
  storage.setItem(key, JSON.stringify(state));
}

export function readClassState(storage, p) {
  const key = classStateKey(p);
  const raw = storage.getItem(key); // Storage access failures are surfaced to the UI.
  if (raw === null || raw === undefined) return null;
  try {
    const state = JSON.parse(raw);
    return matchesClassState(p, state) ? state : null;
  } catch {
    return null;
  }
}

export function rememberClass(storage, p) {
  storage.setItem(LAST_CLASS_KEY, JSON.stringify(launchData(p)));
}

export function readRememberedClass(storage) {
  const raw = storage.getItem(LAST_CLASS_KEY);
  if (raw === null || raw === undefined) return null;
  try {
    const p = JSON.parse(raw);
    return validateLaunch(p) ? launchData(p) : null;
  } catch {
    return null;
  }
}
