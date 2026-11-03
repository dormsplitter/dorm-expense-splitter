# DormSplit — Complete Source Code

This document is a table of contents for the full project source, spread across five Markdown files.

## Files

| File Path | What it does |
|---|---|
| `index.html` | HTML entry point; loads `/src/main.tsx` |
| `package.json` | NPM manifest — scripts, dependencies (React 18, Vite, Tailwind, lucide-react) |
| `vite.config.ts` | Vite config — React plugin, `@/` path alias to `src/` |
| `tailwind.config.js` | Tailwind config — content scan of `index.html` and `src/**/*` |
| `postcss.config.js` | PostCSS config — Tailwind + Autoprefixer plugins |
| `tsconfig.json` | Root TS config — references app and node configs |
| `tsconfig.app.json` | App TS config — `strict`, `@/*` path alias, `react-jsx` |
| `tsconfig.node.json` | Node TS config — for `vite.config.ts` only |
| `eslint.config.js` | ESLint flat config — JS recommended + TS + React Hooks |
| `src/main.tsx` | React bootstrap — `createRoot`, `StrictMode`, `ErrorBoundary` |
| `src/App.tsx` | Root component — loading screen, auth gate, view router |
| `src/vite-env.d.ts` | Vite client type reference |
| `src/index.css` | Global CSS — Tailwind directives, dark scrollbars, base background |
| `src/lib/types.ts` | TypeScript interfaces: `Roommate`, `Expense`, `Settlement`, `CartItem`, `Category` |
| `src/lib/api.ts` | Backend API client — fetch helpers, auth, roommates, expenses, settlements, cart |
| `src/lib/format.ts` | Formatting helpers — `formatNaira`, `formatDate`, `initials`, `avatarColor`, `ROOM_NUMBER` |
| `src/lib/settlement.ts` | Settlement math — `computeBalances`, `minimizeSettlements`, `totalSpending`, `youOweSummary` |
| `src/lib/useAppState.ts` | Central React hook — state, 10s polling, all CRUD actions exposed to views |
| `src/components/ErrorBoundary.tsx` | Class-based error boundary with reload button |
| `src/components/AuthScreen.tsx` | Login/register screen — slot grid, PIN pad, setup form |
| `src/components/Avatar.tsx` | Gradient avatar circle with initials |
| `src/components/Layout.tsx` | App shell — sticky header, sidebar nav (desktop), bottom nav (mobile) |
| `src/components/LockedBadge.tsx` | Small "records locked" badge |
| `src/components/PinPad.tsx` | Numeric PIN input pad with dots |
| `src/views/Dashboard.tsx` | Dashboard — summary cards, individual balances, activity log |
| `src/views/Roommates.tsx` | Roommate profiles grid + change-PIN modal |
| `src/views/ExpenseLog.tsx` | Expense entry form + recent expenses list |
| `src/views/CartView.tsx` | Collaborative shopping cart — add, check, convert to expense |
| `src/views/Receipts.tsx` | Printable digital receipts + settlement plan |

## Where the styling lives

1. **CSS files:** `src/index.css` contains the Tailwind directives (`@tailwind base/components/utilities`), the dark page background (`#020617`), font smoothing, and a styled dark scrollbar.
2. **Tailwind config:** `tailwind.config.js` scans `index.html` and `src/**/*.{js,ts,jsx,tsx}`. The theme is not extended — default Tailwind classes are used throughout.
3. **Inline Tailwind in TSX:** Every component and view file uses Tailwind utility classes directly in `className` attributes for layout, spacing, color, typography, borders, shadows, and responsive breakpoints. No separate component-level CSS files exist.
