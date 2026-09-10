/**
 * Who is using this browser.
 *
 * Votes and assignments need to tell people apart, and the trip has no
 * accounts. Each device remembers which member of the trip it belongs to;
 * picking a name is the whole of "signing in".
 */

const MY_MEMBER_KEY = 'khaoyai_my_member_id';

export function getMyMemberId(): string | null {
  try {
    return localStorage.getItem(MY_MEMBER_KEY);
  } catch {
    return null;
  }
}

export function setMyMemberId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(MY_MEMBER_KEY, id);
    } else {
      localStorage.removeItem(MY_MEMBER_KEY);
    }
  } catch (e) {
    console.warn('Could not remember who is using this browser', e);
  }
}
