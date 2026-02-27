# Design System Enforcement (Phase 1)

This project currently enforces a small set of design-system guards for key screens.

## Commands

- `pnpm run lint:ds`: run design-system enforcement checks
- `pnpm run lint:all`: run ESLint + design-system enforcement checks

## Files Covered (Phase 1)

- `src/app/globals.css`
- `src/app/[locale]/my/page.tsx`
- `src/features/bookings/views/BookingHistoryView.tsx`
- `src/app/[locale]/bookings/[id]/page.tsx`

## What Is Enforced

- Required DS tokens and classes must exist (`ds-control`, `ds-text-body`, etc.)
- Reschedule UX regression guards remain in booking detail page
- `my` and booking history pages reject hard-coded `min-h-[..px]` and `text-sm`

## Why Phase 1

The customer-chart admin route is not present in this repository.  
After that code path is available, extend this enforcement to that module in Phase 2.
