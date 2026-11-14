import { chmodSync, mkdirSync } from 'node:fs';

/**
 * Creates the session directory if needed and restricts it to its owner (0700).
 *
 * The session files hold Google OAuth tokens. session-file-store has no option
 * for the mode of the files it writes, so they get the process umask (usually
 * 0644). A private directory keeps other local users out regardless of the
 * file mode. The chmod also tightens a directory that already exists.
 */
export function ensurePrivateDir(dir: string): void {
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  chmodSync(dir, 0o700);
}
