"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CarteraReceivableRates } from "@we4labs/shared";
import { CarteraReceivableFormModal } from "@/components/cartera-receivable-form-modal";
import { Button } from "@/components/ui/button";

export function CarteraNewInvoiceButton({
  rates,
  todayYmd,
}: {
  rates: CarteraReceivableRates;
  todayYmd: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Nueva factura
      </Button>
      <CarteraReceivableFormModal
        open={open}
        mode="create"
        rates={rates}
        todayYmd={todayYmd}
        onClose={() => setOpen(false)}
        onSaved={() => router.refresh()}
      />
    </>
  );
}
