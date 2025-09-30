
import { useState } from "react"
import { Button } from "@/Components/ui/button"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

const Sidebar = () => {
    const [open, setOpen] = useState(true)
  return (
    <div
      className={cn(
        "bg-gray-100 border-r transition-all duration-300 ease-in-out h-full",
        open ? "w-64" : "w-16"
      )}
    >
      <div className="flex items-center justify-between p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </div>
      <nav className="mt-4 flex flex-col gap-2">
        <Button variant="ghost" className="justify-start">Dashboard</Button>
        <Button variant="ghost" className="justify-start">Settings</Button>
        <Button variant="ghost" className="justify-start">Profile</Button>
      </nav>
    </div>
    )
}

export default Sidebar