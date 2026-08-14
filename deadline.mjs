// deadline.mjs — the date somebody loses a right on.
//
// ⚑ THE TOOL STATED A RULE IT DID NOT APPLY. Every DSAR deadline came with this sentence attached:
//
//     "...if the due date is not a working day, the next working day applies (ICO guidance)."
//
// Search the whole codebase for "working day" and that sentence is the only hit. Nothing computed it.
// A request received on 7 February 2026 came back due Saturday 7 March, and on Sunday the 8th the
// tracker reported the controller OVERDUE — two days early, with an escalation ladder that tells the
// person to complain to the Information Commissioner. Being wrong about a deadline in a tool people
// use to enforce their rights is the worst thing this file could do.
//
// The month-end rule, to be fair, WAS implemented: 31 January plus one month clamps to 28 or 29
// February. That half of the sentence was true. This adds the half that was not.
//
// ⚑ AND IT REFUSES TO GUESS ABOUT BANK HOLIDAYS. Weekends are a fixed, knowable rule and are applied
// always. Bank holidays are not: they differ between England and Wales, Scotland and Northern Ireland,
// they move, and they are announced. Rather than ship a list that silently goes stale — or worse,
// invent one — the caller supplies them, and when nobody has, every answer says so out loud. A
// deadline tool that quietly assumes Monday is a working day is the same fault in a new place.
//
// Pure: no clock, no network. The caller passes `today`.

const DAY = 86400000;

/** A date at UTC midnight, or null. Dates only — a time of day has no place in a legal deadline. */
export function parseDate(value) {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? atMidnight(value) : null;
  if (typeof value !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  // ⚑ Reject 31 April rather than rolling it into 1 May. A date that does not exist is a typo, and
  // rolling it forward turns a typo into a deadline nobody can check against their own diary.
  //
  // This one check does all of it. A range test on the month and day sat above it until the gate
  // showed nothing could tell it from its own mutations: every out-of-range value — month 13, month
  // 0, day 0, day 32 — rolls the constructed date into a different month or year and is caught here.
  // A guard that cannot fail is not protecting anything.
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return dt;
}

function atMidnight(d) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); }

export function toISO(d) {
  return d instanceof Date && Number.isFinite(d.getTime()) ? d.toISOString().slice(0, 10) : null;
}

/**
 * One calendar month later, clamped to the end of a short month.
 *
 * 31 January plus one month is 28 February (or 29 in a leap year) — not 3 March. This part was already
 * right and is kept exactly as it was.
 */
export function addMonths(date, n) {
  const d = parseDate(date);
  const months = Number(n);
  if (!d || !Number.isInteger(months)) return null;
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d.getUTCDate(), lastDay));
  return target;
}

export function isWeekend(date) {
  const d = parseDate(date);
  if (!d) return null;
  const day = d.getUTCDay();
  return day === 0 || day === 6;
}

/** The supplied bank holidays, as a set of ISO dates. Anything unusable is ignored, not guessed at. */
export function holidaySet(holidays) {
  const out = new Set();
  for (const h of (Array.isArray(holidays) ? holidays : [])) {
    const d = parseDate(typeof h === 'string' ? h : (h && h.date));
    if (d) out.add(toISO(d));
  }
  return out;
}

export function isWorkingDay(date, holidays) {
  const d = parseDate(date);
  if (!d) return null;
  if (isWeekend(d)) return false;
  return !holidaySet(holidays).has(toISO(d));
}

/**
 * ⚑ THE RULE THAT WAS ONLY EVER WRITTEN IN PROSE. If the date is not a working day, move forward to
 * the next one that is.
 */
export function nextWorkingDay(date, holidays) {
  let d = parseDate(date);
  if (!d) return null;
  const set = holidaySet(holidays);
  for (let guard = 0; guard < 30; guard++) {
    if (!isWeekend(d) && !set.has(toISO(d))) return d;
    d = new Date(d.getTime() + DAY);
  }
  return null;   // thirty consecutive non-working days is not a calendar, it is bad input
}

/**
 * The statutory deadline for a subject access request: one calendar month from receipt, extendable to
 * three for a complex request, moved to the next working day if it lands on one that is not.
 *
 * Returns what it did and what it could not know, so nothing downstream has to assume.
 */
export function dsarDeadline(received, opts) {
  const o = (opts && typeof opts === 'object') ? opts : {};
  const start = parseDate(received);
  if (!start) return { ok: false, error: 'the date received must be a real date, written YYYY-MM-DD' };

  const holidays = Array.isArray(o.holidays) ? o.holidays : null;
  const rawDue = addMonths(start, o.extended === true ? 3 : 1);
  const due = nextWorkingDay(rawDue, holidays);
  if (!due) return { ok: false, error: 'no working day could be found after that date' };

  const rawISO = toISO(rawDue), dueISO = toISO(due);
  const today = o.today == null ? null : parseDate(o.today);
  let daysRemaining = null, status = 'pending';
  if (today) {
    daysRemaining = Math.round((due.getTime() - today.getTime()) / DAY);
    status = daysRemaining < 0 ? 'overdue' : daysRemaining <= 3 ? 'due-soon' : 'on-track';
  }

  return {
    ok: true,
    received: toISO(start),
    dueDate: dueISO,
    statutoryDate: rawISO,
    movedForWorkingDay: dueISO !== rawISO,
    extended: o.extended === true,
    daysRemaining, status,
    // ⚑ Say what was not known. Without a holiday list this date can still be a day or two early.
    bankHolidaysApplied: holidays !== null,
    caveat: holidays === null
      ? 'Weekends are accounted for. Bank holidays are NOT — no list was supplied, so this date may still fall on one and move later.'
      : 'Weekends and the supplied bank holidays are accounted for.',
  };
}

/**
 * ⚑ IS SOMEBODY REALLY LATE?
 *
 * Kept separate from the arithmetic because this is the answer that sends a person to the regulator.
 * It refuses to say yes when the deadline itself is uncertain: without a bank-holiday list the due
 * date may move later, so a verdict of "overdue" within a few days of it is downgraded to "check".
 * Being a day early with an accusation is worse than being a day late with a chaser.
 */
export function isOverdue(deadline) {
  const d = (deadline && typeof deadline === 'object') ? deadline : {};
  if (d.ok !== true || d.daysRemaining === null || d.daysRemaining === undefined) {
    return { overdue: false, certain: false, reason: 'no date to compare against' };
  }
  if (d.daysRemaining >= 0) return { overdue: false, certain: true, reason: 'the deadline has not passed' };
  if (d.bankHolidaysApplied !== true && d.daysRemaining >= -4) {
    return {
      overdue: false, certain: false,
      reason: 'the deadline has just passed, but bank holidays were not accounted for and may move it — check before escalating',
    };
  }
  return { overdue: true, certain: d.bankHolidaysApplied === true, reason: 'the deadline has passed' };
}

export default {
  parseDate, toISO, addMonths, isWeekend, holidaySet, isWorkingDay,
  nextWorkingDay, dsarDeadline, isOverdue,
};
