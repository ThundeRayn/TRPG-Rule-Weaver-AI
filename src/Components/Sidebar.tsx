
import { useState } from "react"
import { Button } from "@/Components/ui/button"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

const Sidebar = () => {
    const [open, setOpen] = useState(true)
  return (
    <div
      className={cn(
        "bg-[var(--sidebar-color)] transition-all duration-300 ease-in-out h-full",
        open ? "w-64" : "w-16"
      )}
    >

        {/* Toggle Button */}
      <div className="flex items-center justify-between p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Navigation Items */}
      <nav className="mt-4 flex flex-col gap-2">
        <Button variant="ghost" className="justify-start">
          <span
            className={cn(
              "inline-block transition-all duration-300",
              open ? "opacity-100 w-auto ml-2" : "opacity-0 w-0 ml-0 overflow-hidden"
            )}
            style={{ transitionProperty: 'opacity, width, margin' }}
          >
            Dashboard
          </span>
        </Button>
        <Button variant="ghost" className="justify-start">
          <span
            className={cn(
              "inline-block transition-all duration-300",
              open ? "opacity-100 w-auto ml-2" : "opacity-0 w-0 ml-0 overflow-hidden"
            )}
            style={{ transitionProperty: 'opacity, width, margin' }}
          >
            Settings
          </span>
        </Button>
        <Button variant="ghost" className="justify-start">
          <span
            className={cn(
              "inline-block transition-all duration-300",
              open ? "opacity-100 w-auto ml-2" : "opacity-0 w-0 ml-0 overflow-hidden"
            )}
            style={{ transitionProperty: 'opacity, width, margin' }}
          >
            Profile
          </span>
        </Button>
      </nav>
    </div>
    )
}

export default Sidebar