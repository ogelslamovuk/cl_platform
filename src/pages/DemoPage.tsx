import React, { useEffect, useRef } from "react";
import { useStorageSync } from "@/hooks/useStorageSync";
import B2CView from "@/components/B2CView";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ensureSeatMapDemoFlow, runDemoScenario } from "@/lib/demoEngine";

export default function DemoPage() {
  const { state, update, setState } = useStorageSync();
  const seededEmptyState = useRef(false);
  const enrichedSeatMapState = useRef(false);

  useEffect(() => {
    if (seededEmptyState.current) return;
    if (state.events.length || state.tickets.length || state.applications.length) return;

    seededEmptyState.current = true;
    setState({ ...runDemoScenario() });
  }, [setState, state.applications.length, state.events.length, state.tickets.length]);

  useEffect(() => {
    if (enrichedSeatMapState.current) return;
    if (!state.events.length && !state.tickets.length && !state.applications.length) return;
    if (state.events.some((event) =>
      event.status === "published" &&
      event.eventSeats?.length &&
      state.tickets.some((ticket) => ticket.eventId === event.eventId)
    )) return;

    enrichedSeatMapState.current = true;
    setState({ ...ensureSeatMapDemoFlow(state) });
  }, [setState, state]);

  return (
    <div
      className="min-h-screen overflow-x-hidden text-left"
      style={{
        background:
          "linear-gradient(180deg, rgba(234,241,255,0.9) 0%, rgba(245,247,251,0.96) 34%, #F5F7FB 100%)",
        color: "#111827",
      }}
    >
      <Sonner
        theme="light"
        toastOptions={{
          style: {
            background: "#FFFFFF",
            border: "1px solid #D9E2EC",
            color: "#111827",
          },
        }}
      />
      <main className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <B2CView state={state} onUpdate={update} />
      </main>
    </div>
  );
}
