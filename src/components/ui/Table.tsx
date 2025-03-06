import React from 'react';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

const Table: React.FC<TableProps> = ({ children, className = '' }) => {
  return (
    <div className="w-full overflow-auto">
      <table className={`w-full border-collapse ${className}`}>
        {children}
      </table>
    </div>
  );
};

interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

const TableHeader: React.FC<TableHeaderProps> = ({ children, className = '' }) => {
  return <thead className={className}>{children}</thead>;
};

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

const TableBody: React.FC<TableBodyProps> = ({ children, className = '' }) => {
  return <tbody className={className}>{children}</tbody>;
};

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
}

const TableRow: React.FC<TableRowProps> = ({ children, className = '' }) => {
  return <tr className={`border-b border-gray-200 ${className}`}>{children}</tr>;
};

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
}

const TableCell: React.FC<TableCellProps> = ({ children, className = '' }) => {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
};

interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
}

const TableHead: React.FC<TableHeadProps> = ({ children, className = '' }) => {
  return (
    <th className={`px-4 py-3 text-left font-medium text-gray-500 ${className}`}>
      {children}
    </th>
  );
};

export { Table, TableHeader, TableBody, TableRow, TableCell, TableHead };