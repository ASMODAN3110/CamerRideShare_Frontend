import type { HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes, TableHTMLAttributes } from 'react'

type TableProps = TableHTMLAttributes<HTMLTableElement>

export function Table({ className, ...props }: TableProps) {
  return (
    <table
      className={['w-full caption-bottom text-sm', className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

export function TableHeader({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={className} {...props} />
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={className} {...props} />
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={className} {...props} />
}

export function TableHead({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={className} {...props} />
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={className} {...props} />
}

