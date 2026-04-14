import { Printer } from "lucide-react";
import { Button } from "../ui/Button";
import { printPage } from "@/utils/print";

export function PrintButton() {
  return (
    <Button type="button" variant="secondary" onClick={printPage}>
      <Printer className="mr-2" size={16} />
      Print
    </Button>
  );
}
