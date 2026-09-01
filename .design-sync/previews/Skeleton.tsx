import { Skeleton } from "lena";

export function TextLines() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 320 }}>
      <Skeleton style={{ height: 16, width: "60%" }} />
      <Skeleton style={{ height: 12, width: "90%" }} />
      <Skeleton style={{ height: 12, width: "80%" }} />
    </div>
  );
}

export function CardLoading() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: 320,
        padding: 16,
        border: "1px solid var(--border)",
        borderRadius: 12,
      }}
    >
      <Skeleton style={{ height: 40, width: 40, borderRadius: 9999 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <Skeleton style={{ height: 14, width: "50%" }} />
        <Skeleton style={{ height: 12, width: "75%" }} />
      </div>
    </div>
  );
}
