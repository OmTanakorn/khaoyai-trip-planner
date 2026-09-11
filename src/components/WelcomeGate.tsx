import React, { useState } from 'react';
import { TripData, Member } from '../types/trip';
import { TripUpdate } from '../services/storage';
import { input, btnSolid } from './ui-kit';

interface WelcomeGateProps {
  trip: TripData;
  onUpdateTrip: (update: TripUpdate) => void;
  /** Claim this browser for a member — existing, or one just created here. */
  onChooseMe: (who: string | Member | null) => void;
  onSkip: () => void;
}

const AVATAR_COLORS = [
  '#2f4a3c', '#a88d4f', '#6e7a72', '#1b2e27', '#c7ac72', '#4a6b57',
  '#8c7340', '#3d5a4a', '#b09a6a', '#55665c', '#7d6b3f', '#42574b',
];

const normalise = (value: string) => value.trim().toLowerCase();

/**
 * The first thing anyone sees, once, on a browser that has not said who it
 * belongs to. Everything in the trip — votes, seats, who owes whom — is keyed
 * to a person, so asking up front beats a screen full of disabled buttons.
 */
export const WelcomeGate: React.FC<WelcomeGateProps> = ({
  trip,
  onUpdateTrip,
  onChooseMe,
  onSkip,
}) => {
  const [nickname, setNickname] = useState('');

  const typed = normalise(nickname);
  // Someone whose name a friend already added should land on that member
  // rather than a second copy of themselves.
  const existing = typed
    ? trip.members.find((m) => normalise(m.nickname) === typed)
    : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    if (existing) {
      onChooseMe(existing);
      return;
    }

    const newMember: Member = {
      id: `m-${Date.now()}`,
      name: nickname.trim(),
      nickname: nickname.trim(),
      avatarColor: AVATAR_COLORS[trip.members.length % AVATAR_COLORS.length],
      status: 'confirmed',
      role: trip.members.length === 0 ? 'organizer' : 'member',
    };

    onUpdateTrip((t) => ({ ...t, members: [...t.members, newMember] }));
    onChooseMe(newMember);
  };

  return (
    <div className="min-h-screen bg-mist flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <p className="text-fine text-stone">{trip.destination}</p>
        <h1 className="mt-3 font-display text-title text-ink">{trip.title}</h1>

        <form onSubmit={handleSubmit} className="mt-10 bg-paper px-6 sm:px-8 py-8">
          <h2 className="font-display text-lead text-ink">คุณคือใคร</h2>
          <p className="mt-2 text-fine text-stone">
            ใส่ชื่อเล่นไว้ครั้งเดียว เครื่องนี้จะจำให้ตลอด
            เวลาโหวตที่พัก โหวตเมนู หรือจองที่นั่งจะได้รู้ว่าเป็นคุณ
          </p>

          <label htmlFor="gate-nickname" className="sr-only">
            ชื่อเล่นของคุณ
          </label>
          <input
            id="gate-nickname"
            type="text"
            required
            autoFocus
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="โอม"
            className={`${input} mt-6`}
          />

          {existing && (
            <p className="mt-2 text-fine text-brass">
              มี {existing.nickname} อยู่ในทริปแล้ว กดต่อไปจะใช้ชื่อนี้เลย
            </p>
          )}

          <button type="submit" className={`mt-6 w-full ${btnSolid}`}>
            {existing ? `เข้าใช้งานเป็น ${existing.nickname}` : 'เริ่มใช้งาน'}
          </button>

          {trip.members.length > 0 && (
            <>
              <p className="mt-8 text-fine text-stone border-t border-mist-deep pt-6">
                หรือเลือกชื่อที่มีอยู่แล้ว
              </p>
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2.5">
                {trip.members.map((member) => (
                  <li key={member.id}>
                    <button
                      type="button"
                      onClick={() => onChooseMe(member)}
                      className="inline-flex items-center gap-2 text-body text-ink hover:text-brass transition-colors"
                    >
                      <span
                        className="w-1.5 h-1.5"
                        style={{ backgroundColor: member.avatarColor }}
                        aria-hidden="true"
                      />
                      {member.nickname}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </form>

        <button
          type="button"
          onClick={onSkip}
          className="mt-6 text-fine text-stone hover:text-ink transition-colors"
        >
          ขอดูก่อน ยังไม่ใส่ชื่อ
        </button>
      </div>
    </div>
  );
};
