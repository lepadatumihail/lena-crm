import { Textarea, Label } from "lena";

export function NotesField() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: 360 }}>
      <Label htmlFor="notes">Call notes</Label>
      <Textarea
        id="notes"
        rows={4}
        defaultValue="Buyer keen on Vračar 3-bed. Budget €450k. Wants a viewing this weekend — follow up Friday."
      />
    </div>
  );
}

export function States() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: 360 }}>
      <Textarea placeholder="Add a note…" rows={3} />
      <Textarea placeholder="Disabled" rows={3} disabled />
    </div>
  );
}
