import { Input } from "lena";

const field: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  width: 280,
};

const label: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  color: "var(--foreground)",
};

const stack: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

export function LabeledField() {
  return (
    <div style={field}>
      <label htmlFor="email" style={label}>
        Email
      </label>
      <Input id="email" type="email" placeholder="you@agency.com" />
    </div>
  );
}

export function States() {
  return (
    <div style={stack}>
      <Input placeholder="Search clients…" style={{ width: 280 }} />
      <Input defaultValue="Sofia Marković" style={{ width: 280 }} />
      <Input placeholder="Disabled" disabled style={{ width: 280 }} />
      <Input
        defaultValue="not-an-email"
        aria-invalid="true"
        style={{ width: 280 }}
      />
    </div>
  );
}

export function Types() {
  return (
    <div style={stack}>
      <Input type="email" placeholder="you@agency.com" style={{ width: 280 }} />
      <Input type="password" defaultValue="secret123" style={{ width: 280 }} />
      <Input type="number" placeholder="450000" style={{ width: 280 }} />
      <Input type="file" style={{ width: 280 }} />
    </div>
  );
}
