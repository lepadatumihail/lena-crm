import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  Button,
  Label,
  Input,
} from "lena";

export function ClientDetails() {
  return (
    <Sheet defaultOpen modal={false}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Sofia Marković</SheetTitle>
          <SheetDescription>Seller · 3-bed apartment, Vračar</SheetDescription>
        </SheetHeader>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: "0 16px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" defaultValue="+381 60 123 4567" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Label htmlFor="price">Asking price (€)</Label>
            <Input id="price" defaultValue="450000" />
          </div>
        </div>
        <SheetFooter>
          <Button>Save changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
