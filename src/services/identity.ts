import { Member } from '../types/trip';

/**
 * Who is using this browser.
 *
 * Votes and assignments need to tell people apart, and the trip has no
 * accounts. Each device remembers which member of the trip it belongs to;
 * typing your name once is the whole of "signing in".
 *
 * The nickname is kept alongside the id on purpose: an import or a reset
 * mints new member ids, and matching the remembered nickname puts the device
 * back on the right person instead of asking again.
 */

const MY_MEMBER_KEY = 'khaoyai_my_member_id';

export interface DeviceIdentity {
  id: string;
  nickname: string;
}

export function getMyIdentity(): DeviceIdentity | null {
  try {
    const raw = localStorage.getItem(MY_MEMBER_KEY);
    if (!raw) return null;
    // Devices from before the nickname was stored hold a bare id.
    if (!raw.startsWith('{')) return { id: raw, nickname: '' };
    const parsed = JSON.parse(raw);
    return parsed?.id ? { id: parsed.id, nickname: parsed.nickname ?? '' } : null;
  } catch {
    return null;
  }
}

export function getMyMemberId(): string | null {
  return getMyIdentity()?.id ?? null;
}

export function rememberMyIdentity(identity: DeviceIdentity | null): void {
  try {
    if (identity) {
      localStorage.setItem(MY_MEMBER_KEY, JSON.stringify(identity));
    } else {
      localStorage.removeItem(MY_MEMBER_KEY);
    }
  } catch (e) {
    console.warn('Could not remember who is using this browser', e);
  }
}

const normalise = (value: string) => value.trim().toLowerCase();

/**
 * The member this device belongs to. The id is the real handle; the nickname
 * is the fallback for when the trip was re-imported and the ids moved.
 */
export function resolveMe(
  members: Member[],
  identity: DeviceIdentity | null
): Member | null {
  if (!identity) return null;
  const byId = members.find((m) => m.id === identity.id);
  if (byId) return byId;
  if (!identity.nickname) return null;
  return members.find((m) => normalise(m.nickname) === normalise(identity.nickname)) ?? null;
}
