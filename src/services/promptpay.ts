/*
 * PromptPay QR payloads, built to the EMVCo merchant-presented spec that
 * Thai banking apps read.
 *
 * Written out rather than pulled from a package: it is a short, fixed format,
 * and the money in it has to be right — worth being able to read the rules
 * here rather than trusting a dependency to keep them.
 */

/** Every field is length-prefixed: two-digit id, two-digit length, value. */
function field(id: string, value: string): string {
  return id + String(value.length).padStart(2, '0') + value;
}

/**
 * CRC-16/CCITT-FALSE over the payload, which the spec appends as the last
 * field so the reader can tell a mangled scan from a real one.
 */
function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export type PromptPayTarget =
  | { kind: 'phone'; value: string }
  | { kind: 'nationalId'; value: string }
  | { kind: 'eWallet'; value: string };

/**
 * Work out what kind of PromptPay id someone typed, so they can paste a phone
 * number the way they say it out loud and it still resolves.
 */
export function parsePromptPayId(raw: string): PromptPayTarget | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 13) return { kind: 'nationalId', value: digits };
  if (digits.length === 15) return { kind: 'eWallet', value: digits };
  if (digits.length === 10 && digits.startsWith('0')) {
    return { kind: 'phone', value: digits };
  }
  // Already carrying the country code, e.g. 66812345678.
  if (digits.length === 11 && digits.startsWith('66')) {
    return { kind: 'phone', value: '0' + digits.slice(2) };
  }
  return null;
}

/** Phone numbers travel as 0066 plus the number without its leading zero. */
function formatTarget(target: PromptPayTarget): string {
  switch (target.kind) {
    case 'phone':
      return field('01', '0066' + target.value.slice(1));
    case 'nationalId':
      return field('02', target.value);
    case 'eWallet':
      return field('03', target.value);
  }
}

/**
 * Build the QR text for paying someone a fixed amount.
 *
 * Leaving the amount out would let a tired person type the wrong number at
 * midnight, so it is always written in — the app already knows it exactly.
 */
export function buildPromptPayPayload(id: string, amount?: number): string | null {
  const target = parsePromptPayId(id);
  if (!target) return null;

  const payload = [
    field('00', '01'),
    // 11 = the code can be scanned again; 12 = single use. A settle-up QR is
    // for one payment.
    field('01', amount && amount > 0 ? '12' : '11'),
    field('29', field('00', 'A000000677010111') + formatTarget(target)),
    field('53', '764'), // THB
    amount && amount > 0 ? field('54', amount.toFixed(2)) : '',
    field('58', 'TH'),
  ].join('');

  const withCrcField = payload + '6304';
  return withCrcField + crc16(withCrcField);
}
