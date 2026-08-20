import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type RowData = Record<string, string | number | boolean | null>;

interface TableComponentProps<T extends RowData> {
  data: T[];
  caption?: string;
}

export default function TableComponent<T extends RowData>({
  data,
  caption = "A list of your recent invoices.",
}: TableComponentProps<T>) {
  if (!data || data.length == 0) {
    return <p className="text-sm text-muted-foreground">No data available.</p>;
  }

  const columns = Object.keys(data[0]);

  return (
    <Table>
      <TableCaption>{caption}</TableCaption>
      <TableHeader>
        <TableRow>
          {columns.map((el) => (
            <TableHead key={el}>{el}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, rowIndex: number) => (
          <TableRow key={rowIndex}>
            {columns.map((col) => (
              <TableCell key={col}>{String(row[col] ?? "")}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
