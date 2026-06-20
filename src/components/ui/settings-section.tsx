import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";

type BadgeVariant = "default" | "hot" | "ok";

type SettingsSectionProps = React.HTMLAttributes<HTMLElement> & {
  badge?: React.ReactNode;
  badgeVariant?: BadgeVariant;
  title: React.ReactNode;
  description?: React.ReactNode;
  status?: React.ReactNode;
  calloutTitle?: React.ReactNode;
  callout?: React.ReactNode;
  actions?: React.ReactNode;
};

export function SettingsSection({
  badge,
  badgeVariant = "default",
  title,
  description,
  status,
  calloutTitle,
  callout,
  actions,
  children,
  ...props
}: SettingsSectionProps) {
  return (
    <Panel className="settings-panel" {...props}>
      <div className="settings-panel__header">
        <div>
          {badge ? <Badge variant={badgeVariant}>{badge}</Badge> : null}
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {status ? <span className="settings-status">{status}</span> : null}
      </div>

      {callout ? (
        <div className="settings-callout">
          {calloutTitle ? <strong>{calloutTitle}</strong> : null}
          <span>{callout}</span>
        </div>
      ) : null}

      {children}
      {actions ? <div className="settings-actions">{actions}</div> : null}
    </Panel>
  );
}
