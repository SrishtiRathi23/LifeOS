export type ThemeName =
  | "parchment"
  | "midnight-sage"
  | "lavender-dream"
  | "ocean-mist"
  | "cherry-blossom"
  | "charcoal-linen";

export type ThemeOption = {
  id: ThemeName;
  label: string;
  preview: string;
};
