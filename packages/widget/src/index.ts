/**
 * BugKit Reporter Widget
 *
 * TODO: Implement the embeddable bug reporting widget.
 * This will be a lightweight (~5KB) JS snippet that users
 * embed in their SaaS apps to capture bug reports with
 * screenshots, console logs, and user context.
 */

export interface BugKitConfig {
  apiKey: string;
  projectId: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  theme?: "light" | "dark" | "auto";
}

export function init(_config: BugKitConfig): void {
  // TODO: Initialize widget
  console.log("[BugKit] Widget initialization — coming soon");
}
