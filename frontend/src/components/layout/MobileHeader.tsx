import { Menu, Soup } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MobileHeaderProps {
  onMenuToggle: () => void
}

export function MobileHeader({ onMenuToggle }: MobileHeaderProps) {
  return (
    <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-border/50 bg-sidebar px-3">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuToggle}
        className="h-9 w-9 shrink-0"
        aria-label="Mở menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Soup className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-bold text-foreground">
          PizzaCháoNgon
        </span>
      </div>
    </header>
  )
}
