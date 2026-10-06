"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { MEDICINE_MESSAGES } from "@/constants/messages";

export default function MedicinesError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="error-state">
      <span><AlertTriangle size={28} /></span>
      <h1>{MEDICINE_MESSAGES.ERROR.LOAD_FAILED_TITLE}</h1>
      <p>{MEDICINE_MESSAGES.ERROR.LOAD_FAILED_DESC}</p>
      <button className="button button-primary" onClick={retry}>
        <RotateCcw size={17} /> Thử lại
      </button>
    </div>
  );
}
