"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CarteraReceivableRates } from "@we4labs/shared";
import { CarteraReceivableFormModal } from "@/components/cartera-receivable-form-modal";
import { Button } from "@/components/ui/button";
import { useRole } from "@/components/role-provider";

export function CarteraNewInvoiceButton({
  rates,
  todayYmd,
}: {
  rates: CarteraReceivableRates;
  todayYmd: string;
}) {
  const router = useRouter();
  const { isAdmin } = useRole();
  const [open, setOpen] = useState(false);

  if (!isAdmin) return null;

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
