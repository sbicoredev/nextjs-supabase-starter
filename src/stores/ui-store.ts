import { create } from "zustand";

interface UIState {
  isCommandMenuOpen: boolean;
  setCommandMenuOpen: (open: boolean) => void;
}

/**
 * App-wide UI state with no single feature owner. Most UI state should
 * live in a feature's own `store/` instead — only promote something here
 * if multiple unrelated features genuinely need it.
 *
 * NOTE: `isCommandMenuOpen` is unwired scaffold, not a working example —
 * nothing currently reads or toggles it. It's here as the intended shape
 * for a command palette (see `docs/sprint-plan.md` → Sprint 1/4), which
 * needs the shadcn `command` primitive (`pnpm dlx shadcn@latest add
 * command -b base-ui`) added before this is useful. Either wire it up to a
 * real `<CommandMenu />` + a global `Cmd+K` keydown listener, or delete
 * this field, before treating this file as a pattern to copy.
 */
export const useUIStore = create<UIState>((set) => ({
  isCommandMenuOpen: false,
  setCommandMenuOpen: (isCommandMenuOpen) => set({ isCommandMenuOpen }),
}));
