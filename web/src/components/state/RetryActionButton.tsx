"use client";

import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui";

export function RetryActionButton() {
  return (
    <Button
      variant="outline"
      leftIcon={<RefreshCcw size={15} />}
      type="button"
      onClick={() => {
        window.location.reload();
      }}
    >
      Reintentar
    </Button>
  );
}

