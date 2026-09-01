import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
} from "lena";

export function StagePicker() {
  return (
    <div style={{ width: 280, paddingBottom: 200 }}>
      <Select defaultOpen defaultValue="offer">
        <SelectTrigger style={{ width: 240 }}>
          <SelectValue placeholder="Select a stage" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Pipeline stage</SelectLabel>
            <SelectItem value="new">New lead</SelectItem>
            <SelectItem value="viewing">Viewing booked</SelectItem>
            <SelectItem value="offer">Offer made</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
