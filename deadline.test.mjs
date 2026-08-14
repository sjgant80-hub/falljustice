// deadline.test.mjs — PROOF-OF-PLAY for the date somebody loses a right on.
import { parseDate, toISO, addMonths, isWeekend, holidaySet, isWorkingDay,
         nextWorkingDay, dsarDeadline, isOverdue } from './deadline.mjs';

let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? '  ✓ ' : '  ✗ FAIL ') + m); };
const dow = (iso) => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(iso + 'T00:00:00Z').getUTCDay()];

console.log('\n=== §1 · ⚑ THE RULE THAT WAS ONLY EVER WRITTEN IN PROSE ===');
{
  // The real case. A request received 7 Feb 2026 falls due Saturday 7 Mar. The old tracker returned
  // the Saturday and called the controller overdue on the Sunday.
  const r = dsarDeadline('2026-02-07', { today: '2026-02-07' });
  ok(dow(r.statutoryDate) === 'Sat', 'one calendar month from 7 Feb 2026 lands on a Saturday');
  ok(r.dueDate === '2026-03-09' && dow(r.dueDate) === 'Mon',
     '⚑ so the deadline is the MONDAY — the tool promised this rule in every note it printed and never applied it');
  ok(r.movedForWorkingDay === true, 'and it says that it moved');
  ok(r.statutoryDate === '2026-03-07', 'while still reporting the statutory date it moved from');

  const sun = dsarDeadline('2026-02-08', { today: '2026-02-08' });
  ok(dow(sun.statutoryDate) === 'Sun' && sun.dueDate === '2026-03-09', 'a Sunday moves to the Monday too');

  const wd = dsarDeadline('2026-01-10', { today: '2026-01-10' });
  ok(wd.movedForWorkingDay === false && wd.dueDate === wd.statutoryDate,
     'and a deadline already on a working day is left exactly where it is');
}

console.log('\n=== §2 · the month-end rule, which WAS right ===');
{
  ok(toISO(addMonths('2026-01-31', 1)) === '2026-02-28',
     '31 January plus one month is 28 February — not 3 March. This half was already implemented and is kept');
  ok(toISO(addMonths('2024-01-31', 1)) === '2024-02-29', 'and 29 February in a leap year');
  ok(toISO(addMonths('2026-01-31', 3)) === '2026-04-30', 'three months from 31 January is 30 April');
  ok(toISO(addMonths('2026-03-15', 1)) === '2026-04-15', 'an ordinary date keeps its day');
  ok(toISO(addMonths('2026-12-31', 1)) === '2027-01-31', 'and it crosses a year');
  ok(addMonths('2026-01-31', 1.5) === null && addMonths('nonsense', 1) === null, 'a fractional month or a non-date gives nothing');
}

console.log('\n=== §3 · ⚑ A DATE THAT DOES NOT EXIST IS A TYPO ===');
{
  ok(parseDate('2026-04-31') === null,
     '⚑ 31 April is REFUSED, not rolled into 1 May — rolling a typo forward turns it into a deadline nobody can check against their own diary');
  ok(parseDate('2026-02-30') === null && parseDate('2025-02-29') === null, 'and so are 30 February and 29 February in a common year');
  ok(toISO(parseDate('2024-02-29')) === '2024-02-29', 'but a real leap day is fine');
  ok(parseDate('07/02/2026') === null && parseDate('2026-2-7') === null, 'the format is YYYY-MM-DD or it is not a date');
  ok(parseDate('2026-13-01') === null && parseDate('2026-00-10') === null, 'month thirteen and month zero are refused');
  ok(dsarDeadline('2026-04-31', {}).ok === false, 'and a request cannot be tracked from a date that never happened');
  ok(/real date/.test(dsarDeadline('nonsense', {}).error), 'with a reason a person can act on');
}

console.log('\n=== §4 · ⚑ IT WILL NOT GUESS ABOUT BANK HOLIDAYS ===');
{
  const none = dsarDeadline('2026-02-07', { today: '2026-02-07' });
  ok(none.bankHolidaysApplied === false,
     '⚑ with no list supplied it says so — a deadline tool that quietly assumes Monday is a working day is the same fault in a new place');
  ok(/NOT/.test(none.caveat), 'and the caveat is plain, not buried');

  const withList = dsarDeadline('2026-02-07', { today: '2026-02-07', holidays: ['2026-03-09'] });
  ok(withList.dueDate === '2026-03-10',
     '⚑ given a real bank holiday on the Monday, the deadline moves to the Tuesday');
  ok(withList.bankHolidaysApplied === true && !/NOT/.test(withList.caveat), 'and it stops caveating');

  ok(isWorkingDay('2026-03-09', ['2026-03-09']) === false, 'a supplied holiday is not a working day');
  ok(isWorkingDay('2026-03-09', []) === true, 'and with an empty list the Monday is one');
  ok(isWorkingDay('2026-03-07') === false, 'a Saturday never is');
  ok(holidaySet(['2026-03-09', 'rubbish', null, { date: '2026-12-25' }]).size === 2,
     'a list is read for the dates in it and nothing is invented from the rest');
}

console.log('\n=== §5 · ⚑ THE ANSWER THAT SENDS SOMEBODY TO THE REGULATOR ===');
{
  // The escalation ladder acts on "overdue". Being a day early with an accusation is worse than
  // being a day late with a chaser.
  const justPassed = dsarDeadline('2026-02-07', { today: '2026-03-10' });
  ok(justPassed.status === 'overdue', 'the raw status says the date has gone');
  const verdict = isOverdue(justPassed);
  ok(verdict.overdue === false && verdict.certain === false,
     '⚑ but with no bank-holiday list, "just passed" is NOT reported as overdue — the deadline itself may move later');
  ok(/check before escalating/.test(verdict.reason), 'and it says why, so nobody complains to the ICO on a guess');

  const certain = isOverdue(dsarDeadline('2026-02-07', { today: '2026-03-10', holidays: [] }));
  ok(certain.overdue === true && certain.certain === true,
     '⚑ given the holidays, the very same day IS reported overdue — the refusal is about not knowing, not about being timid');

  const longGone = isOverdue(dsarDeadline('2026-02-07', { today: '2026-05-01' }));
  ok(longGone.overdue === true, 'and once it is weeks past, no bank holiday could explain it away');

  const noToday = isOverdue(dsarDeadline('2026-02-07', {}));
  ok(noToday.overdue === false, 'with no date to compare against, nobody is late');
  ok(noToday.certain === false && /no date to compare/.test(noToday.reason),
     '⚑ and it is not CERTAIN either — "nobody is late" and "I was not told what day it is" are different answers, and only one of them is safe to act on');
  ok(isOverdue(null).overdue === false && isOverdue({ ok: false }).overdue === false, 'and a failed calculation accuses nobody');
  ok(isOverdue({ ok: false, daysRemaining: -99 }).overdue === false,
     'even one carrying a number, because a calculation that failed has no number worth reading');

  // ⚑ The two edges of the doubt window. Both are decisions about whether to accuse somebody.
  const onTheDay = isOverdue(dsarDeadline('2026-02-07', { today: '2026-03-09' }));
  ok(onTheDay.overdue === false && onTheDay.certain === true,
     '⚑ ON the deadline itself nobody is late, and that is CERTAIN — no bank holiday can make today into yesterday');
  const fourDaysPast = isOverdue(dsarDeadline('2026-02-07', { today: '2026-03-13' }));
  ok(fourDaysPast.overdue === false && fourDaysPast.certain === false,
     '⚑ four days past is still inside the doubt window — a run of bank holidays can be that long at Christmas and Easter');
  const fiveDaysPast = isOverdue(dsarDeadline('2026-02-07', { today: '2026-03-14' }));
  ok(fiveDaysPast.overdue === true, 'and five days past is beyond anything a holiday could explain');
}

console.log('\n=== §6 · the extension, and the countdown ===');
{
  const e = dsarDeadline('2026-02-07', { extended: true, today: '2026-02-07' });
  ok(e.statutoryDate === '2026-05-07' && e.extended === true, 'a complex request runs to three months');
  ok(dsarDeadline('2026-02-07', { extended: 'yes', today: '2026-02-07' }).extended === false,
     '⚑ only an explicit true extends it — a truthy string must never quietly give a controller two extra months');

  const d = dsarDeadline('2026-02-07', { today: '2026-03-06' });
  ok(d.daysRemaining === 3 && d.status === 'due-soon', 'three days out is due-soon');
  ok(dsarDeadline('2026-02-07', { today: '2026-03-05' }).status === 'on-track', 'four days out is on-track');
  ok(dsarDeadline('2026-02-07', { today: '2026-03-09' }).daysRemaining === 0, 'the day itself is zero days remaining');
  ok(dsarDeadline('2026-02-07', { today: '2026-03-09' }).status === 'due-soon', 'and still not overdue');
  ok(dsarDeadline('2026-02-07', {}).status === 'pending', 'with no today, there is no countdown to report');
}

console.log('\n=== §7 · weekends and the walk ===');
{
  ok(isWeekend('2026-03-07') === true && isWeekend('2026-03-08') === true, 'Saturday and Sunday');
  ok(isWeekend('2026-03-09') === false, 'Monday is not');
  ok(toISO(nextWorkingDay('2026-03-07')) === '2026-03-09', 'a Saturday walks to the Monday');
  ok(toISO(nextWorkingDay('2026-03-09')) === '2026-03-09', 'and a working day does not move at all');
  ok(toISO(nextWorkingDay('2026-12-25', ['2026-12-25', '2026-12-28'])) === '2026-12-29',
     '⚑ Christmas on a Friday with the Monday off walks through the weekend AND the holiday to the Tuesday');
  ok(nextWorkingDay('nonsense') === null, 'and nothing walks from nowhere');
}

console.log('\n=== §8 · pure under garbage ===');
{
  const junk = [null, undefined, '', 0, [], {}, NaN, 'x', '2026-99-99', new Date('nope'), -1];
  let threw = null;
  for (const j of junk) {
    try {
      parseDate(j); toISO(j); addMonths(j, j); isWeekend(j); holidaySet(j); isWorkingDay(j, j);
      nextWorkingDay(j, j); dsarDeadline(j, j); isOverdue(j);
    } catch (e) { threw = `${JSON.stringify(j)} → ${e.message}`; }
  }
  ok(threw === null, 'no input throws' + (threw ? ' — ' + threw : ''));
  ok(dsarDeadline('2026-02-07', 'nonsense').ok === true, 'an unusable options bag is ignored, not fatal');
  ok(dsarDeadline('2026-02-07', { holidays: 'nope' }).bankHolidaysApplied === false,
     '⚑ and a holiday list that is not a list counts as none supplied — never as an empty one, which would claim certainty it has not got');
}

console.log(`\n${fail === 0 ? '✓ ALL PASS' : '✗ FAILURES'} — ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
