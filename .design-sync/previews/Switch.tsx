import { Switch, Label } from "lena";

export function States() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Switch id="s-on" defaultChecked />
        <Label htmlFor="s-on">Notifications on</Label>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Switch id="s-off" />
        <Label htmlFor="s-off">Notifications off</Label>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Switch id="s-dis" disabled defaultChecked />
        <Label htmlFor="s-dis">Locked (disabled)</Label>
      </div>
    </div>
  );
}
