import { create } from 'zustand';

const MAX_HISTORY = 50;

interface ApparelHistoryState {
  undoStack: string[]; // JSON snapshots
  redoStack: string[];
}

interface ApparelHistoryActions {
  pushSnapshot: (json: string) => void;
  undo: () => string | null; // returns the state to restore, or null if nothing to undo
  redo: () => string | null;
  clearHistory: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useApparelHistoryStore = create<ApparelHistoryState & ApparelHistoryActions>(
  (set, get) => ({
    undoStack: [],
    redoStack: [],

    pushSnapshot: (json) =>
      set((state) => {
        const newStack = [...state.undoStack, json];
        // Cap at MAX_HISTORY entries (drop oldest)
        if (newStack.length > MAX_HISTORY) newStack.shift();
        return { undoStack: newStack, redoStack: [] }; // any new action clears redo
      }),

    undo: () => {
      const { undoStack, redoStack } = get();
      if (undoStack.length < 2) return null; // need at least 2: current + previous

      const current = undoStack[undoStack.length - 1] ?? '';
      const previous = undoStack[undoStack.length - 2] ?? '';
      const newUndo = undoStack.slice(0, -1);
      const newRedo = [...redoStack, current];
      if (newRedo.length > MAX_HISTORY) newRedo.shift();

      set({ undoStack: newUndo, redoStack: newRedo });
      return previous;
    },

    redo: () => {
      const { undoStack, redoStack } = get();
      if (redoStack.length === 0) return null;

      const next = redoStack[redoStack.length - 1] ?? '';
      const newRedo = redoStack.slice(0, -1);
      const newUndo = [...undoStack, next];
      if (newUndo.length > MAX_HISTORY) newUndo.shift();

      set({ undoStack: newUndo, redoStack: newRedo });
      return next;
    },

    clearHistory: () => set({ undoStack: [], redoStack: [] }),

    canUndo: () => get().undoStack.length >= 2,
    canRedo: () => get().redoStack.length > 0,
  }),
);
