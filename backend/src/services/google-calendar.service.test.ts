import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Credentials } from 'google-auth-library';

// Minimal stand-in for the OAuth2 client: keeps the credentials and the
// 'tokens' listener, which events.list fires when the test asks for a refresh.
let refreshOnList: Credentials | null = null;

class FakeOAuth2 {
  credentials: Credentials = {};
  private tokensListener?: (tokens: Credentials) => void;
  setCredentials(tokens: Credentials) {
    this.credentials = tokens;
  }
  on(event: string, listener: (tokens: Credentials) => void) {
    if (event === 'tokens') this.tokensListener = listener;
    return this;
  }
  emitTokens(tokens: Credentials) {
    this.credentials = { ...this.credentials, ...tokens };
    this.tokensListener?.(tokens);
  }
}

vi.mock('googleapis', () => ({
  google: {
    auth: { OAuth2: FakeOAuth2 },
    calendar: ({ auth }: { auth: FakeOAuth2 }) => ({
      events: {
        list: async () => {
          if (refreshOnList) auth.emitTokens(refreshOnList);
          return { data: { items: [] } };
        },
      },
    }),
  },
}));

const { listEvents } = await import('./google-calendar.service.js');

const params = {
  timeMin: '2026-11-09T00:00:00Z',
  timeMax: '2026-11-16T00:00:00Z',
  calendarId: 'primary',
};

describe('listEvents token handling', () => {
  beforeEach(() => {
    refreshOnList = null;
  });

  it('merges refreshed tokens over the originals and keeps the refresh token', async () => {
    refreshOnList = { access_token: 'new-access', expiry_date: 2 };

    const { tokens } = await listEvents(
      { access_token: 'old-access', refresh_token: 'refresh', expiry_date: 1 },
      params,
    );

    expect(tokens).toEqual({ access_token: 'new-access', refresh_token: 'refresh', expiry_date: 2 });
  });

  it('returns the client credentials when no refresh happened', async () => {
    const original = { access_token: 'access', refresh_token: 'refresh' };

    const { tokens } = await listEvents(original, params);

    expect(tokens).toEqual(original);
  });
});
