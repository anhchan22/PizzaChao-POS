export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 px-6 backdrop-blur-xl">
      {/* Left: Page breadcrumb area */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          {/* Dynamic page title can be added via context */}
        </h2>
      </div>

      {/* Right: placeholder for future actions */}
      <div className="flex items-center gap-3">
      </div>
    </header>
  )
}
