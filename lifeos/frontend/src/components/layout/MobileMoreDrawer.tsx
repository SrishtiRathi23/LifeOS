import { NavLink } from "react-router-dom";
import { Lock, Menu, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { sectionRegistry, type SectionItem } from "@/utils/sections";
import { useSession } from "@/hooks/useSession";

export function MobileMoreDrawer() {
  const session = useSession();

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="flex flex-col items-center gap-1 rounded-full px-2 py-2 text-[11px] text-ink/70 active:bg-parchment">
          <Menu size={17} />
          <span>More</span>
        </button>
      </Dialog.Trigger>
      
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 w-[min(88vw,320px)] overflow-y-auto bg-cream p-5 shadow-2xl focus:outline-none">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-serif text-2xl italic text-ink">All Sections</h2>
            <Dialog.Close asChild>
              <button className="text-ink/60 hover:text-ink">
                <X size={24} />
              </button>
            </Dialog.Close>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {sectionRegistry.map((item: SectionItem) => {
              const Icon = item.icon;
              return (
                <Dialog.Close asChild key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-4 rounded-lg border border-line/40 px-4 py-3 text-sm transition-all ${
                        isActive 
                          ? "bg-parchment border-terracotta/30 text-terracotta" 
                          : "bg-card/40 text-ink/80 hover:bg-card"
                      }`
                    }
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.title}</span>
                    {item.premium && !session.data?.entitlements?.isPremium && <Lock className="ml-auto text-ink/35" size={15} />}
                  </NavLink>
                </Dialog.Close>
              );
            })}
          </div>

          <div className="mt-8 border-t border-line/40 pt-6">
             <p className="text-center text-[11px] text-ink/40 italic font-serif">
               LifeOS • Personal Control System
             </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
