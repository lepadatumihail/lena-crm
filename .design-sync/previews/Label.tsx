import { Label, Input, Switch } from "lena";

export function WithInput() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: 280 }}>
      <Label htmlFor="client-name">Client name</Label>
      <Input id="client-name" placeholder="Sofia Marković" />
    </div>
  );
}

export function WithSwitch() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Switch id="notify" defaultChecked />
      <Label htmlFor="notify">Email me on new leads</Label>
    </div>
  );
}
