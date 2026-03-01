# @bugkit/react

React wrapper for the BugKit bug reporting widget.

## Installation

```bash
npm install @bugkit/react
# or
pnpm add @bugkit/react
```

## Usage

```tsx
import { BugKitReporter } from "@bugkit/react";

export default function App() {
  return (
    <BugKitReporter
      projectId="your-project-id"
      apiKey="bk_live_..."
      user={{ id: user.id, email: user.email }}
      position="bottom-right"
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| projectId | string | required | Your BugKit project ID |
| apiKey | string | required | Your BugKit API key |
| user | BugKitUser | undefined | Current user info for report attribution |
| position | string | "bottom-right" | Widget button position |
| theme | string | "auto" | Color theme (light/dark/auto) |
| onReportSubmit | function | undefined | Called after report is submitted |
