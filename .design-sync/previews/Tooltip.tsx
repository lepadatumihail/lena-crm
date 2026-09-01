import { Tooltip, TooltipTrigger, TooltipContent, Button } from "lena";

export function WithButton() {
  return (
    <div style={{ paddingTop: 80, display: "flex", justifyContent: "center" }}>
      <Tooltip defaultOpen>
        <TooltipTrigger asChild>
          <Button variant="outline">Log call</Button>
        </TooltipTrigger>
        <TooltipContent>Record a call with this client</TooltipContent>
      </Tooltip>
    </div>
  );
}
