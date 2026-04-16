import { createContext, useState, useContext, ReactNode } from "react";
import { Button } from "@/components/ui/Button";

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
};

type ConfirmContextType = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmContextType>(() => Promise.resolve(false));

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<{ resolve: (value: boolean) => void } | null>(null);

  const confirm = (opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolver({ resolve });
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    resolver?.resolve(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolver?.resolve(false);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {isOpen && options && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[2rem] border border-line bg-cream p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="font-serif text-2xl italic text-ink">{options.title ?? "Confirm Action"}</h3>
            <p className="mt-2 text-sm leading-6 text-ink/75">{options.message}</p>
            <div className="mt-8 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={handleCancel}>
                {options.cancelText ?? "Cancel"}
              </Button>
              <Button type="button" onClick={handleConfirm} style={{ backgroundColor: "var(--terracotta)", color: "white" }}>
                {options.confirmText ?? "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
