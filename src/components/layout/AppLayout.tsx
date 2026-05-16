import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[#141414] text-zinc-50">
      <Sidebar />
      <main className="min-h-screen lg:pl-64">
        <div className="mx-auto w-full max-w-[1440px] px-5 py-6 sm:px-8 lg:px-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
