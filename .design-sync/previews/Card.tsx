import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
  Badge,
  Button,
} from "lena";

export function ClientSummary() {
  return (
    <Card style={{ width: 360 }}>
      <CardHeader>
        <CardTitle>Sofia Marković</CardTitle>
        <CardDescription>Seller · 3-bed apartment, Vračar</CardDescription>
        <CardAction>
          <Badge variant="warning">Offer made</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Badge variant="success">€48,000 in pipeline</Badge>
          <Badge variant="secondary">2 viewings</Badge>
        </div>
      </CardContent>
      <CardFooter style={{ gap: 8 }}>
        <Button size="sm">Open deal</Button>
        <Button size="sm" variant="outline">
          Log call
        </Button>
      </CardFooter>
    </Card>
  );
}

export function Stat() {
  return (
    <Card style={{ width: 240 }}>
      <CardHeader>
        <CardDescription>Closed this quarter</CardDescription>
        <CardTitle style={{ fontSize: 30 }}>€124,500</CardTitle>
      </CardHeader>
      <CardContent>
        <Badge variant="success">+18% vs last quarter</Badge>
      </CardContent>
    </Card>
  );
}
