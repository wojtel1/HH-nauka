export type FamilyProfile = {
  accent: string;
  background: string;
  id: string;
  initials: string;
  name: string;
  subtitle: string;
};

export type ProfileGateControls = {
  lock: () => void;
  switchProfile: () => void;
};
