import { Separator } from "lena";

export function Horizontal() {
  return (
    <div style={{ width: 320 }}>
      <div style={{ fontWeight: 600 }}>Sofia Marković</div>
      <div style={{ color: "var(--muted-foreground)", fontSize: 14 }}>
        Seller · Vračar
      </div>
      <Separator style={{ margin: "12px 0" }} />
      <div style={{ color: "var(--muted-foreground)", fontSize: 14 }}>
        Last contacted 3 days ago
      </div>
    </div>
  );
}

export function Vertical() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        height: 24,
        fontSize: 14,
      }}
    >
      <span>12 clients</span>
      <Separator orientation="vertical" />
      <span>4 deals</span>
      <Separator orientation="vertical" />
      <span>€124k closed</span>
    </div>
  );
}
