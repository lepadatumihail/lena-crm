import { Badge } from "lena";

const row: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "center",
};

export function Variants() {
  return (
    <div style={row}>
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="destructive">Overdue</Badge>
    </div>
  );
}

export function StatusTones() {
  return (
    <div style={row}>
      <Badge variant="success">€12,400 closed</Badge>
      <Badge variant="warning">€48,000 in pipeline</Badge>
      <Badge variant="destructive">Follow-up overdue</Badge>
      <Badge variant="outline">Inactive</Badge>
    </div>
  );
}

export function PipelineStages() {
  return (
    <div style={row}>
      <Badge variant="secondary">New lead</Badge>
      <Badge variant="secondary">Viewing booked</Badge>
      <Badge variant="warning">Offer made</Badge>
      <Badge variant="success">Closed</Badge>
    </div>
  );
}
