import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { chmodSync, mkdirSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ensurePrivateDir } from './session-dir.js';

const modeOf = (path: string) => statSync(path).mode & 0o777;

describe('ensurePrivateDir', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'timebooking-sessions-'));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('creates a missing directory readable only by its owner', () => {
    const dir = join(root, 'sessions');

    ensurePrivateDir(dir);

    expect(modeOf(dir)).toBe(0o700);
  });

  it('tightens an existing directory that others could read', () => {
    const dir = join(root, 'sessions');
    mkdirSync(dir);
    chmodSync(dir, 0o755);

    ensurePrivateDir(dir);

    expect(modeOf(dir)).toBe(0o700);
  });
});
