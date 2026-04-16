import { create } from "zustand";
import { api } from "@/utils/api";

export type VisionImage = {
  id: string;
  filename: string;
  title: string | null;
  affirmation: string | null;
  category: string;
  year: string;
  position: number;
};

export type VisionBoardSettings = {
  layout: string;
  background: string;
  frameStyle: string;
  moodFilter: string;
  decorativeTheme: string | null;
  aspectRatio: string;
  boardTitle: string;
  textOverlays: any[];
};

interface VisionState {
  images: VisionImage[];
  settings: VisionBoardSettings | null;
  isLoading: boolean;
  isManageMode: boolean;
  selectedImageId: string | null;
  isSettingsOpen: boolean;
  isPrintPreviewOpen: boolean;
  
  setManageMode: (v: boolean) => void;
  setSettingsOpen: (v: boolean) => void;
  setPrintPreviewOpen: (v: boolean) => void;
  setSelectedImageId: (id: string | null) => void;
  
  fetchImages: () => Promise<void>;
  fetchSettings: () => Promise<void>;
  addImage: (formData: FormData) => Promise<void>;
  updateImage: (id: string, data: Partial<VisionImage>) => Promise<void>;
  replaceImage: (id: string, file: File) => Promise<void>;
  deleteImage: (id: string) => Promise<void>;
  reorderImages: (updates: { id: string; position: number }[]) => Promise<void>;
  saveSettings: (settings: Partial<VisionBoardSettings>) => Promise<void>;
}

export const useVisionStore = create<VisionState>((set, get) => ({
  images: [],
  settings: null,
  isLoading: false,
  isManageMode: false,
  selectedImageId: null,
  isSettingsOpen: false,
  isPrintPreviewOpen: false,

  setManageMode: (v) => set({ isManageMode: v }),
  setSettingsOpen: (v) => set({ isSettingsOpen: v, isManageMode: false }),
  setPrintPreviewOpen: (v) => set({ isPrintPreviewOpen: v, isSettingsOpen: false }),
  setSelectedImageId: (id) => set({ selectedImageId: id }),

  fetchImages: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get<VisionImage[]>("/vision");
      set({ images: data });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSettings: async () => {
    const { data } = await api.get<VisionBoardSettings>("/vision/settings");
    set({ settings: data });
  },

  addImage: async (formData: FormData) => {
    await api.post("/vision", formData);
    await get().fetchImages();
  },

  updateImage: async (id, payload) => {
    // Optimistic update
    set((state) => ({
      images: state.images.map((img) => (img.id === id ? { ...img, ...payload } : img))
    }));
    await api.patch(`/vision/${id}`, payload);
  },

  replaceImage: async (id, file) => {
    const formData = new FormData();
    formData.append("image", file);
    await api.patch(`/vision/${id}/image`, formData);
    await get().fetchImages();
  },

  deleteImage: async (id) => {
    // Optimistic update
    set((state) => ({ images: state.images.filter((img) => img.id !== id) }));
    await api.delete(`/vision/${id}`);
  },

  reorderImages: async (updates) => {
    await api.patch("/vision/reorder", updates);
    await get().fetchImages();
  },

  saveSettings: async (payload) => {
    // Optimistic update
    set((state) => ({
      settings: state.settings ? { ...state.settings, ...payload } : (payload as VisionBoardSettings)
    }));
    await api.put("/vision/settings", payload);
  }
}));
