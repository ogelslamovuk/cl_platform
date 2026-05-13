import React from "react";
import { Database, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useStorageSync } from "@/hooks/useStorageSync";
import { A } from "@/components/admin/adminStyles";
import { generateDemoData, resetDemoData, runDemoScenario } from "@/lib/demoEngine";

export default function DemoToolsPanel() {
  const { setState } = useStorageSync();

  const handleGenerateDemo = () => {
    const s = generateDemoData();
    setState({ ...s });
    toast.success("Демо-данные сгенерированы");
  };

  const handleRunScenario = () => {
    const s = runDemoScenario();
    setState({ ...s });
    toast.success("Демо-сценарий выполнен");
  };

  const handleReset = () => {
    const s = resetDemoData();
    setState({ ...s });
    toast.success("Сброшено");
  };

  const actionClass = "w-full flex items-center gap-3 px-4 h-12 rounded-xl text-sm font-semibold transition-colors";

  return (
    <div className="space-y-3">
      <button
        onClick={handleGenerateDemo}
        className={actionClass}
        style={{ background: A.surfaceBg, border: `1px solid ${A.borderLight}`, color: A.textPrimary }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${A.cyan}50`)}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = A.borderLight)}
      >
        <Database size={16} style={{ color: A.cyan }} />
        Загрузить mock-данные
      </button>

      <button
        onClick={handleRunScenario}
        className={actionClass}
        style={{ background: A.surfaceBg, border: `1px solid ${A.borderLight}`, color: A.textPrimary }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${A.violet}50`)}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = A.borderLight)}
      >
        <RefreshCw size={16} style={{ color: A.violet }} />
        Прогнать демо-сценарий
      </button>

      <button
        onClick={handleReset}
        className={actionClass}
        style={{ background: A.surfaceBg, border: `1px solid ${A.borderLight}`, color: A.textPrimary }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${A.statusError}50`)}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = A.borderLight)}
      >
        <Trash2 size={16} style={{ color: A.statusError }} />
        Очистить mock-данные
      </button>
    </div>
  );
}
