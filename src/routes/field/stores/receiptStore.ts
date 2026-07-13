import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ReceiptAnalysisResponse, ReceiptAnalysisImageResult, ImageProcessingStatus } from '../../../types/ReceiptAnalysis';
import { ReceiptSubmissionHistory } from '../../../types/ReceiptSubmission';
import { StoredImage } from '../../../types/ReceiptImage';
import { saveImageRecord, deleteImageRecord, getAllImageRecords } from '../../../lib/auth/services/imageStorage';

/** Fields persisted to `localStorage` (everything except in-memory image previews). */
interface ReceiptDraftPersisted {
  step: number;
  projectOrSubdivision: string;
  lotOrProjectNumbers: string;
  phases: string[];
  receipt: ReceiptAnalysisResponse | null;
  /** Immutable snapshot of the AI response, used for "Edited" badge + history diffing. */
  originalReceipt: ReceiptAnalysisResponse | null;
  overallStatus: ImageProcessingStatus | null;
  history: ReceiptSubmissionHistory[];
  /** Comma-joined ids of the image set used in the most recent analysis call. */
  lastAnalyzedImageIds: string | null;
}

interface ReceiptStoreState extends ReceiptDraftPersisted {
  /** In-memory only — rehydrated from IndexedDB via `loadImagesFromDB`. */
  images: StoredImage[];

  setStep: (step: number) => void;
  setDetails: (v: { projectOrSubdivision: string; lotOrProjectNumbers: string; phases: string[] }) => void;
  setReceipt: (r: ReceiptAnalysisResponse) => void;
  setOriginalReceipt: (r: ReceiptAnalysisResponse) => void;
  setOverallStatus: (s: ImageProcessingStatus | null) => void;
  addHistory: (entry: ReceiptSubmissionHistory) => void;
  setLastAnalyzedImageIds: (sig: string | null) => void;

  loadImagesFromDB: () => Promise<void>;
  addImageFiles: (files: File[]) => Promise<void>;
  removeImage: (id: string) => Promise<void>;
  replaceImage: (id: string, file: File) => Promise<void>;
  reorderImages: (orderedIds: string[]) => void;
  setImageAnalysisResults: (updates: { id: string; result: ReceiptAnalysisImageResult | null }[]) => void;

  /** Clears all draft state (form data, receipt, images) after a successful submission. */
  resetDraft: () => Promise<void>;
}

const defaultState: ReceiptDraftPersisted = {
  step: 0,
  projectOrSubdivision: '',
  lotOrProjectNumbers: '',
  phases: [],
  receipt: null,
  originalReceipt: null,
  overallStatus: null,
  history: [],
  lastAnalyzedImageIds: null,
};

export const useReceiptStore = create<ReceiptStoreState>()(
  persist(
    (set, get) => ({
      ...defaultState,
      images: [],

      setStep: (step) => set({ step }),
      setDetails: (v) => set(v),
      setReceipt: (receipt) => set({ receipt }),
      setOriginalReceipt: (originalReceipt) => set({ originalReceipt }),
      setOverallStatus: (overallStatus) => set({ overallStatus }),
      addHistory: (entry) => set((s) => ({ history: [...s.history, entry] })),
      setLastAnalyzedImageIds: (lastAnalyzedImageIds) => set({ lastAnalyzedImageIds }),

      loadImagesFromDB: async () => {
        const records = await getAllImageRecords();
        const images: StoredImage[] = records
          .sort((a, b) => a.order - b.order)
          .map((r) => ({
            id: r.id,
            fileName: r.fileName,
            mediaType: r.mediaType,
            order: r.order,
            previewUrl: URL.createObjectURL(r.blob),
            analysisResult: null,
          }));
        set({ images });
      },

      addImageFiles: async (files) => {
        const current = get().images;
        let nextOrder = current.length > 0 ? Math.max(...current.map((i) => i.order)) + 1 : 0;
        const newImages: StoredImage[] = [];

        for (const file of files) {
          const id = crypto.randomUUID();
          const order = nextOrder++;
          const mediaType = file.type || 'image/jpeg';
          await saveImageRecord({ id, blob: file, fileName: file.name, mediaType, order });
          newImages.push({
            id,
            fileName: file.name,
            mediaType,
            order,
            previewUrl: URL.createObjectURL(file),
            analysisResult: null,
          });
        }

        set({ images: [...current, ...newImages] });
      },

      removeImage: async (id) => {
        const current = get().images;
        const target = current.find((i) => i.id === id);
        if (target) URL.revokeObjectURL(target.previewUrl);

        await deleteImageRecord(id);

        // Re-sequence remaining images so drag order badges stay contiguous.
        const remaining = current
          .filter((i) => i.id !== id)
          .sort((a, b) => a.order - b.order)
          .map((img, idx) => ({ ...img, order: idx }));

        set({ images: remaining });
      },

      replaceImage: async (id, file) => {
        const current = get().images;
        const target = current.find((i) => i.id === id);
        if (!target) return;

        URL.revokeObjectURL(target.previewUrl);
        await deleteImageRecord(id);

        // A new id is generated intentionally: this changes the analyzed-image
        // signature so a previously "failed" overall status is correctly
        // unlocked once the user re-uploads.
        const newId = crypto.randomUUID();
        const mediaType = file.type || 'image/jpeg';
        await saveImageRecord({ id: newId, blob: file, fileName: file.name, mediaType, order: target.order });

        const updated = current.map((img) =>
          img.id === id
            ? {
              id: newId,
              fileName: file.name,
              mediaType,
              order: target.order,
              previewUrl: URL.createObjectURL(file),
              analysisResult: null,
            }
            : img
        );

        set({ images: updated });
      },

      reorderImages: (orderedIds) => {
        const current = get().images;
        const byId = new Map(current.map((i) => [i.id, i]));
        const reordered = orderedIds
          .map((id, idx) => {
            const img = byId.get(id);
            return img ? { ...img, order: idx } : null;
          })
          .filter((i): i is StoredImage => i !== null);
        set({ images: reordered });
      },

      setImageAnalysisResults: (updates) => {
        const current = get().images;
        const byId = new Map(updates.map((u) => [u.id, u.result]));
        const updated = current.map((img) =>
          byId.has(img.id) ? { ...img, analysisResult: byId.get(img.id) ?? null } : img
        );
        set({ images: updated });
      },

      resetDraft: async () => {
        const current = get().images;
        current.forEach((img) => URL.revokeObjectURL(img.previewUrl));
        await Promise.all(current.map((img) => deleteImageRecord(img.id)));
        set({ ...defaultState, images: [] });
      },
    }),
    {
      name: 'hfh-receipt-draft',
      storage: createJSONStorage(() => localStorage),
      // Images are intentionally excluded — their binary data lives in
      // IndexedDB and is rehydrated separately via `loadImagesFromDB`.
      partialize: (state) => ({
        step: state.step,
        projectOrSubdivision: state.projectOrSubdivision,
        lotOrProjectNumbers: state.lotOrProjectNumbers,
        phases: state.phases,
        receipt: state.receipt,
        originalReceipt: state.originalReceipt,
        overallStatus: state.overallStatus,
        history: state.history,
        lastAnalyzedImageIds: state.lastAnalyzedImageIds,
      }),
    }
  )
);