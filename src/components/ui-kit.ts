/* ---------------------------------------------------------------
   Control vocabulary shared by every tab: one radius, one accent,
   hairlines instead of shadows. Kept apart from the components so
   Fast Refresh can keep state while editing a tab.
   --------------------------------------------------------------- */

export const input =
  'w-full p-2.5 text-body rounded-ctl border border-mist-deep bg-mist/40 ' +
  'focus:outline-none focus:border-brass placeholder:text-stone/60';

export const btnSolid =
  'px-5 py-2.5 text-body text-paper bg-ink hover:bg-moss disabled:opacity-40 ' +
  'rounded-ctl transition-colors';

export const btnQuiet =
  'px-5 py-2.5 text-body text-stone border border-mist-deep hover:text-ink ' +
  'rounded-ctl transition-colors';

export const btnBrass =
  'px-5 py-2.5 text-body text-ink bg-brass hover:bg-brass-lit rounded-ctl transition-colors';

/** Underlined text action — the light-weight alternative to a button. */
export const btnLink =
  'inline-flex items-center gap-1.5 text-fine text-ink border-b border-brass pb-0.5 ' +
  'hover:text-brass transition-colors';

export const baht = (n: number) => `฿${n.toLocaleString('th-TH')}`;

/**
 * Votes are stored as member ids. Older votes stored a typed-in nickname, so
 * fall back to showing the raw value rather than dropping the person.
 */
export const voterLabel = (
  members: { id: string; nickname: string }[],
  token: string
): string => members.find((m) => m.id === token)?.nickname ?? token;
