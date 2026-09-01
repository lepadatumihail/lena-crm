import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  Badge,
} from "lena";

export function ClientsTable() {
  return (
    <div style={{ width: 560 }}>
      <Table>
        <TableCaption>Active clients this month</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead style={{ textAlign: "right" }}>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell style={{ fontWeight: 500 }}>Sofia Marković</TableCell>
            <TableCell>
              <Badge variant="warning">Offer made</Badge>
            </TableCell>
            <TableCell style={{ textAlign: "right" }}>€450,000</TableCell>
          </TableRow>
          <TableRow>
            <TableCell style={{ fontWeight: 500 }}>Luka Petrović</TableCell>
            <TableCell>
              <Badge variant="secondary">Viewing booked</Badge>
            </TableCell>
            <TableCell style={{ textAlign: "right" }}>€320,000</TableCell>
          </TableRow>
          <TableRow>
            <TableCell style={{ fontWeight: 500 }}>Ana Jovanović</TableCell>
            <TableCell>
              <Badge variant="success">Closed</Badge>
            </TableCell>
            <TableCell style={{ textAlign: "right" }}>€124,500</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
