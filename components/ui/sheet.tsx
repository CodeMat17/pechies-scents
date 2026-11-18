"use client";

import { useRef, type ReactNode, type PointerEvent } from "react";
import { Dialog } from "radix-ui";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * App-style sheet: slides up from the bottom on phones (drag the handle down to
 * dismiss) and becomes a right-hand drawer on tablets/desktop.
 * Built on Radix Dialog for focus trapping, Esc to close and scroll locking.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
  footer,
  className,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; t: number; dy: number } | null>(null);

  const isPhone = () => window.matchMedia("(max-width: 767px)").matches;

  const onDown = (e: PointerEvent) => {
    if (!isPhone() || (e.target as HTMLElement).closest("button")) return;
    drag.current = { y: e.clientY, t: performance.now(), dy: 0 };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    if (!drag.current || !panel.current) return;
    const dy = Math.max(0, e.clientY - drag.current.y);
    drag.current.dy = dy;
    panel.current.style.transition = "none";
    panel.current.style.setProperty("--drag", `${dy}px`);
    panel.current.style.transform = `translateY(${dy}px)`;
  };
  const onUp = () => {
    const d = drag.current;
    const el = panel.current;
    drag.current = null;
    if (!d || !el) return;
    const velocity = d.dy / Math.max(1, performance.now() - d.t);
    el.style.transition = "";
    el.style.transform = "";
    if (d.dy > 110 || velocity > 0.6) {
      onOpenChange(false);
    } else {
      el.style.removeProperty("--drag");
      el.animate(
        [{ transform: `translateY(${d.dy}px)` }, { transform: "translateY(0)" }],
        { duration: 280, easing: "cubic-bezier(0.32,0.72,0,1)" },
      );
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/65 backdrop-blur-[2px] data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
        <Dialog.Content
          ref={panel}
          onAnimationEnd={(e) => {
            if (e.currentTarget.dataset.state === "open") e.currentTarget.style.removeProperty("--drag");
          }}
          className={cn(
            "fixed z-50 flex flex-col bg-onyx text-ivory shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.8)] outline-none",
            // phone: bottom sheet
            "inset-x-0 bottom-0 max-h-[92svh] rounded-t-[28px] border-t border-white/[0.07]",
            "data-[state=open]:animate-sheet-up data-[state=closed]:animate-sheet-down",
            // tablet / desktop: right drawer
            "md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-full md:max-w-md md:rounded-none md:rounded-l-[28px] md:border-t-0 md:border-l",
            "md:data-[state=open]:animate-drawer-in md:data-[state=closed]:animate-drawer-out",
            className,
          )}
        >
          <div
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            className="shrink-0 touch-none select-none md:touch-auto"
          >
            <div className="flex justify-center pt-3 md:hidden" aria-hidden>
              <span className="h-1.5 w-10 rounded-full bg-white/20" />
            </div>
            <div className="flex items-start justify-between gap-4 px-5 pt-3 pb-4 md:px-7 md:pt-7">
              <div>
                <Dialog.Title className="font-serif text-[1.75rem] leading-none font-medium">
                  {title}
                </Dialog.Title>
                <Dialog.Description className={cn("mt-1.5 text-xs text-ivory/50", !subtitle && "sr-only")}>
                  {subtitle ?? "Dialog"}
                </Dialog.Description>
              </div>
              <Dialog.Close
                className="pressable -mt-1 -mr-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-ivory/70 hover:text-ivory"
                aria-label="Close"
              >
                <XIcon className="size-[18px]" />
              </Dialog.Close>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 md:px-7">{children}</div>

          {footer && (
            <div className="shrink-0 border-t border-white/[0.06] bg-onyx/95 px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:px-7 md:pb-7">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
