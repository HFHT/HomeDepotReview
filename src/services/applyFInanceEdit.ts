
// /**
//  * @file Pure audit-trail reducer for finance edits on the receipt review screen.
//  * Invoked once per completed field edit (on blur), never per keystroke.
//  */
// import type { AuditChange } from './receiptTypes';

// /** Same-user coalescing window. Edits by the same user within this span of the
//  * most recent matching entry update that entry instead of creating a new one. */
// const MERGE_WINDOW_MS = 30 * 60 * 1000;

// /** Arguments describing a single completed finance edit. */
// export interface FinanceEditInput {
//   /** Field being edited (header key or line-item key). */
//   fieldKey: string;
//   /** Stable line-item key, or `undefined` for header fields. */
//   lineItemKey: string | undefined;
//   /** Current description of the edited line item, or `undefined` for headers. */
//   lineItemDescription: string | undefined;
//   /** AI baseline value for this field (from the pristine receipt snapshot). */
//   originalValue: string | null;
//   /** New value the user committed. */
//   changedValue: string | null;
//   /** Stable id of the finance user making the edit (matches `changedBy`). */
//   by: string;
//   /** ISO timestamp for this edit (injected for testability). */
//   now: string;
// }

// /** True when two entries refer to the same logical field. */
// function isSameField(entry: AuditChange, input: FinanceEditInput): boolean {
//   return entry.fieldKey === input.fieldKey && entry.lineItemKey === input.lineItemKey;
// }

// /** Epoch millis for an ISO string. */
// function ms(iso: string): number {
//   return new Date(iso).getTime();
// }

// /**
//  * Applies a completed finance edit to the audit trail and returns a new array.
//  *
//  * Rules:
//  * 1. No prior change to this field → create a new entry using the AI baseline
//  *    (`input.originalValue`) as `originalValue`.
//  * 2. Most recent prior change is by the current user AND within
//  *    {@link MERGE_WINDOW_MS} → update (coalesce into) that entry.
//  * 3. Most recent prior change is by another user, OR outside the window →
//  *    create a new entry using that entry's `changedValue` as `originalValue`.
//  *
//  * No-op / revert handling:
//  * - New-entry branches: if the resulting `originalValue === changedValue`,
//  *   nothing changed, so the trail is returned unmodified.
//  * - Merge branch: if `changedValue` equals the merged entry's `originalValue`,
//  *   the field is back to that entry's baseline, so the entry is removed.
//  *
//  * @param trail Current audit trail.
//  * @param input Description of the completed edit.
//  * @returns A new audit trail array.
//  */
// export function applyFinanceEdit(trail: AuditChange[], input: FinanceEditInput): AuditChange[] {
//   const matches = trail.filter((e) => isSameField(e, input));

//   // Case 1: first change to this field.
//   if (matches.length === 0) {
//     if (input.changedValue === input.originalValue) return trail; // no-op
//     return [...trail, makeEntry(input, input.originalValue)];
//   }

//   // Most recent prior change to this field.
//   const recent = matches.reduce((a, b) => (ms(b.changedAt) >= ms(a.changedAt) ? b : a));
//   const isMine = recent.changedBy === input.by;
//   const inWindow = ms(input.now) - ms(recent.changedAt) <= MERGE_WINDOW_MS;

//   // Case 2: coalesce into the current user's recent entry.
//   if (isMine && inWindow) {
//     // Reverted back to that entry's baseline → drop the entry.
//     if (input.changedValue === recent.originalValue) {
//       return trail.filter((e) => e !== recent);
//     }
//     return trail.map((e) =>
//       e === recent
//         ? {
//             ...e,
//             changedValue: input.changedValue,
//             changedAt: input.now,
//             lineItemDescription: input.lineItemDescription,
//           }
//         : e,
//     );
//   }

//   // Case 3: another user's edit, or outside the window → branch a new entry
//   // whose baseline is the most recent committed value.
//   if (input.changedValue === recent.changedValue) return trail; // no-op vs current state
//   return [...trail, makeEntry(input, recent.changedValue)];
// }

// /** Builds a new audit entry for the given baseline. */
// function makeEntry(input: FinanceEditInput, originalValue: string | null): AuditChange {
//   return {
//     fieldKey: input.fieldKey,
//     lineItemKey: input.lineItemKey,
//     lineItemDescription: input.lineItemDescription,
//     originalValue,
//     changedValue: input.changedValue,
//     layer: 'Finance',
//     changedAt: input.now,
//     changedBy: input.by,
//   };
// }