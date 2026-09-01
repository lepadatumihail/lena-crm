import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
  Label,
  Input,
} from "lena";

export function QuickEdit() {
  return (
    <div style={{ paddingBottom: 220 }}>
      <Popover defaultOpen modal={false}>
        <PopoverTrigger asChild>
          <Button variant="outline">Edit budget</Button>
        </PopoverTrigger>
        <PopoverContent style={{ width: 260 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Budget</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Label htmlFor="budget">Max price (€)</Label>
              <Input id="budget" defaultValue="450000" />
            </div>
            <Button size="sm">Save</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
