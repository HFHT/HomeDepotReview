import { create } from 'zustand';
import { SelectsValue } from './types/SelectsValue';

/**
 * Holds the list of available `projectOrSubdivision` and `phases` options
 * used to populate the Step 1 (`Details`) selects in the New Receipt flow.
 *
 * Populated once at app startup via `getProjects` (see `App.tsx`).
 */
interface SelectsState extends SelectsValue {
  setSelects: (v: SelectsValue) => void;
}

export const useSelectsStore = create<SelectsState>((set) => ({
  subdivisions: [],
  phases: [],
  setSelects: (v) => set({ subdivisions: v.subdivisions, phases: v.phases }),
}));