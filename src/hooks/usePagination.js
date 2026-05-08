import { useState, useMemo } from 'react';

export function usePagination(data, initialRowsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  const totalPages = Math.max(1, Math.ceil(data.length / rowsPerPage));

  // Ensure current page is within bounds when data changes
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (validCurrentPage - 1) * rowsPerPage;
    return data.slice(start, start + rowsPerPage);
  }, [data, validCurrentPage, rowsPerPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (rows) => {
    setRowsPerPage(rows);
    setCurrentPage(1); // Reset to first page
  };

  return {
    paginatedData,
    currentPage: validCurrentPage,
    totalPages,
    rowsPerPage,
    totalItems: data.length,
    onPageChange: handlePageChange,
    onRowsPerPageChange: handleRowsPerPageChange
  };
}
