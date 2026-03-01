export interface BugKitUser {
  id: string;
  email?: string;
  name?: string;
}

export interface BugKitReporterProps {
  projectId: string;
  apiKey: string;
  user?: BugKitUser;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  theme?: "light" | "dark" | "auto";
  onReportSubmit?: (reportId: string) => void;
}

export interface BugKitInstance {
  open: () => void;
  close: () => void;
  destroy: () => void;
}
