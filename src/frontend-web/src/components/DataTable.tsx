import React, { useState, useMemo } from 'react';
import { colors, font, spacing, radii, transitions, shadows, statusPillStyle } from '../styles/theme';

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  width?: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  pageSize?: number;
  loading?: boolean;
}

function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  rowKey,
  onRowClick,
  emptyMessage = '暂无数据',
  pageSize = 10,
  loading = false,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    const sorted = [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
    return sorted;
  }, [data, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedData = sortedData.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: spacing.xxxl, textAlign: 'center' as const, color: colors.textSecondary, fontSize: font.sizes.md }}>
        <div style={{ marginBottom: spacing.md, fontSize: '32px' }}>⟳</div>
        加载中...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{ padding: spacing.xxxl, textAlign: 'center' as const }}>
        <div style={{ fontSize: '48px', marginBottom: spacing.md, opacity: 0.3 }}>📋</div>
        <div style={{ color: colors.textSecondary, fontSize: font.sizes.md }}>{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ overflowX: 'auto' as const }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    padding: `${spacing.md} ${spacing.md}`,
                    textAlign: (col.align || 'left') as 'left' | 'center' | 'right',
                    fontSize: font.sizes.xs,
                    fontWeight: font.weights.semibold,
                    color: colors.textSecondary,
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.5px',
                    borderBottom: `2px solid ${colors.borderLight}`,
                    cursor: col.sortable ? 'pointer' : 'default',
                    width: col.width,
                    userSelect: 'none',
                  }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  {col.label}
                  {col.sortable && sortKey === col.key && (
                    <span style={{ marginLeft: '4px' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                style={{
                  borderBottom: `1px solid ${colors.borderLight}`,
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: transitions.fast,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.surface;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {columns.map((col) => {
                  const val = (row as Record<string, unknown>)[col.key];
                  const content = col.render ? col.render(row) : val as React.ReactNode;
                  const isStatus = col.key === 'status' || col.key === 'paymentStatus';
                  return (
                    <td
                      key={col.key}
                      style={{
                        padding: `${spacing.md} ${spacing.md}`,
                        fontSize: font.sizes.sm,
                        color: colors.text,
                        textAlign: (col.align || 'left') as 'left' | 'center' | 'right',
                      }}
                    >
                      {isStatus && typeof content === 'string' ? (
                        <span style={statusPillStyle(content)}>{content}</span>
                      ) : (
                        content
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: `${spacing.md} ${spacing.md}`,
            borderTop: `1px solid ${colors.borderLight}`,
          }}
        >
          <span style={{ fontSize: font.sizes.xs, color: colors.textSecondary }}>
            共 {sortedData.length} 条 · 第 {safePage}/{totalPages} 页
          </span>
          <div style={{ display: 'flex', gap: spacing.xs }}>
            <button
              disabled={safePage <= 1}
              onClick={() => setCurrentPage(safePage - 1)}
              style={{
                ...paginationBtnStyle,
                opacity: safePage <= 1 ? 0.4 : 1,
                cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
              }}
            >
              ← 上一页
            </button>
            <button
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage(safePage + 1)}
              style={{
                ...paginationBtnStyle,
                opacity: safePage >= totalPages ? 0.4 : 1,
                cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
              }}
            >
              下一页 →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const paginationBtnStyle: React.CSSProperties = {
  padding: '6px 14px',
  border: `1px solid ${colors.border}`,
  borderRadius: radii.small,
  backgroundColor: colors.white,
  color: colors.text,
  fontSize: font.sizes.xs,
  fontWeight: font.weights.medium,
  fontFamily: font.family,
  transition: transitions.fast,
};

export default DataTable;