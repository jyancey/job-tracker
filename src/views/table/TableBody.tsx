// Renders table body rows for the current page of paginated jobs.
import { useTableViewContext } from './TableViewContext'
import { TableRow } from './TableRow'

interface TableBodyProps {
  today: string
}

export function TableBody({ today }: TableBodyProps) {
  const { paginatedJobs } = useTableViewContext()

  return (
    <tbody>
      {paginatedJobs.map((job) => (
        <TableRow key={job.id} job={job} today={today} />
      ))}
    </tbody>
  )
}
