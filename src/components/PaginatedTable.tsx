import React, { useCallback, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

type Column<T> = {
  key: string;
  header: string;
  className?: string;
  render?: (item: T, index: number) => React.ReactNode;
};

type PaginatedTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  emptyMessage?: string;
  rowKey?: (item: T, index: number) => string;
  className?: string;
};

function TableBodyRow<T>({
  item,
  columns,
  index,
  virtualRow,
}: {
  item: T;
  columns: Column<T>[];
  index: number;
  virtualRow: { index: number; start: number; size: number };
}) {
  return (
    <tr
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: `${virtualRow.size}px`,
        transform: `translateY(${virtualRow.start}px)`,
      }}
      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
    >
      {columns.map((col) => (
        <td key={col.key} className={`px-2 py-1.5 text-xs ${col.className ?? ""}`}>
          {col.render
            ? col.render(item, index)
            : String((item as Record<string, unknown>)[col.key] ?? "")}
        </td>
      ))}
    </tr>
  );
}

const MemoizedRow = React.memo(TableBodyRow) as typeof TableBodyRow;

export default function PaginatedTable<T>({
  data,
  columns,
  pageSize = 50,
  emptyMessage = "No data found",
  rowKey,
  className = "",
}: PaginatedTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(data.length / pageSize);
  const pagedData = data.slice(page * pageSize, (page + 1) * pageSize);

  const virtualizer = useVirtualizer({
    count: pagedData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 10,
  });

  const handlePrev = useCallback(() => setPage((p) => Math.max(0, p - 1)), []);
  const handleNext = useCallback(() => setPage((p) => Math.min(totalPages - 1, p + 1)), [totalPages]);

  if (data.length === 0) {
    return (
      <div className="rounded-md border border-border p-4 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        ref={parentRef}
        className="overflow-auto rounded-md border border-border max-h-[60vh]"
      >
        <table className="w-full caption-bottom text-sm">
          <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
            <tr className="border-b border-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`h-9 px-2 text-left text-xs font-medium text-muted-foreground ${col.className ?? ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="relative" style={{ height: `${virtualizer.getTotalSize()}px` }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const item = pagedData[virtualRow.index]!;
              const key = rowKey
                ? rowKey(item, virtualRow.index)
                : String((item as Record<string, unknown>)["id"] ?? virtualRow.index);
              return (
                <MemoizedRow
                  key={key}
                  item={item}
                  columns={columns}
                  index={page * pageSize + virtualRow.index}
                  virtualRow={virtualRow}
                />
              );
            })}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-2 px-2 text-xs text-muted-foreground">
          <span>
            Page {page + 1} of {totalPages} ({data.length} rows)
          </span>
          <div className="flex gap-1">
            <button
              onClick={handlePrev}
              disabled={page === 0}
              className="rounded border border-border px-2 py-1 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              onClick={handleNext}
              disabled={page >= totalPages - 1}
              className="rounded border border-border px-2 py-1 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
