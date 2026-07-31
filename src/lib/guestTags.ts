export const PRESET_GUEST_TAGS = ["vip", "withKids", "family", "friends", "work"] as const;
export type PresetGuestTag = (typeof PRESET_GUEST_TAGS)[number];
