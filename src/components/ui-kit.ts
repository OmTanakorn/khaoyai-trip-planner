/* ---------------------------------------------------------------
   Control vocabulary shared by every tab: one accent, filled
   grounds instead of outlines, no shadows. Kept apart from the components so
   Fast Refresh can keep state while editing a tab.
   --------------------------------------------------------------- */

export const input =
  'w-full px-3 py-2.5 text-body rounded-ctl border border-transparent bg-surface/70 ' +
  'focus:outline-none focus:border-ink/40 focus:bg-paper placeholder:text-stone/60 transition-colors';

export const btnSolid =
  'px-5 py-2.5 text-body font-medium text-paper bg-ink hover:bg-ink-soft disabled:opacity-40 ' +
  'rounded-ctl transition-colors cursor-pointer disabled:cursor-not-allowed';

export const btnQuiet =
  'px-5 py-2.5 text-body text-ink bg-surface hover:bg-mist-deep/70 ' +
  'rounded-ctl transition-colors cursor-pointer';

export const btnBrass =
  'px-5 py-2.5 text-body font-medium text-ink bg-brass-lit hover:bg-brass hover:text-paper rounded-ctl transition-colors cursor-pointer';

/** Underlined text action — the light-weight alternative to a button. */
export const btnLink =
  'inline-flex items-center gap-1.5 text-fine text-ink border-b border-brass pb-0.5 ' +
  'hover:text-brass transition-colors cursor-pointer';

/**
 * The letter for an avatar. Thai writes some vowels before the consonant
 * they follow in speech, so "โอม" starts with อ, not โ.
 */
export const initialOf = (nickname: string): string =>
  nickname.trim().replace(/^[\u0E40-\u0E44]/, '').slice(0, 1).toUpperCase();

export const baht = (n: number) => `฿${n.toLocaleString('th-TH')}`;

/**
 * Votes are stored as member ids. Older votes stored a typed-in nickname, so
 * fall back to showing the raw value rather than dropping the person.
 */
export const voterLabel = (
  members: { id: string; nickname: string }[],
  token: string
): string => members.find((m) => m.id === token)?.nickname ?? token;
