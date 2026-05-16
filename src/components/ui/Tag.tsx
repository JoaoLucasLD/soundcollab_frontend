type TagProps = {
  children: string
}

export function Tag({ children }: TagProps) {
  return (
    <span className="inline-flex rounded-md bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-100">
      {children}
    </span>
  )
}
