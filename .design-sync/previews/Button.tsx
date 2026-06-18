import { Button } from "lena";

const row: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "center",
};

export function Variants() {
  return (
    <div style={row}>
      <Button>Save analysis</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="destructive">Delete</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Learn more</Button>
    </div>
  );
}

export function Sizes() {
  return (
    <div style={row}>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
    </div>
  );
}

export function States() {
  return (
    <div style={row}>
      <Button>Enabled</Button>
      <Button disabled>Disabled</Button>
    </div>
  );
}
