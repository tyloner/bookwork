import { create } from "zustand";

interface SidebarState {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: false,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));

interface FilterState {
  genre: string | null;
  author: string | null;
  language: string | null;
  dateRange: "today" | "week" | "month" | "all";
  spaceType: "all" | "CHAT" | "CALL" | "HYBRID";
  searchQuery: string;
  setGenre: (genre: string | null) => void;
  setAuthor: (author: string | null) => void;
  setLanguage: (language: string | null) => void;
  setDateRange: (range: "today" | "week" | "month" | "all") => void;
  setSpaceType: (type: "all" | "CHAT" | "CALL" | "HYBRID") => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  genre: null,
  author: null,
  language: null,
  dateRange: "all",
  spaceType: "all",
  searchQuery: "",
  setGenre: (genre) => set({ genre }),
  setAuthor: (author) => set({ author }),
  setLanguage: (language) => set({ language }),
  setDateRange: (dateRange) => set({ dateRange }),
  setSpaceType: (spaceType) => set({ spaceType }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  resetFilters: () =>
    set({
      genre: null,
      author: null,
      language: null,
      dateRange: "all",
      spaceType: "all",
      searchQuery: "",
    }),
}));

interface MatchState {
  currentIndex: number;
  direction: "left" | "right" | null;
  setCurrentIndex: (index: number) => void;
  setDirection: (direction: "left" | "right" | null) => void;
}

export const useMatchStore = create<MatchState>((set) => ({
  currentIndex: 0,
  direction: null,
  setCurrentIndex: (currentIndex) => set({ currentIndex }),
  setDirection: (direction) => set({ direction }),
}));
