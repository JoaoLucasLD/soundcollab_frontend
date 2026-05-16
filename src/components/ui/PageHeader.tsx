type PageHeaderProps = {
  title: string
  description: string
  action?: React.ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-normal text-white sm:text-4xl">{title}</h1>
        <p className="mt-2 text-base text-zinc-400">{description}</p>
      </div>
      {action}
    </header>
  )
}
