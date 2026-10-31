import { AlertTriangle, RotateCcw, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router";
import { useScenarioStore } from "@/shared/stores/useScenarioStore";

/** Scenario controls stay available here until the floating panel in ticket 02. */
export function RoleSwitcherToolbar() {
  const { activeScenario, injectScenario, resetDatabase } = useScenarioStore();
  const navigate = useNavigate();
  return (
    <aside
      className="demo-toolbar demo-scenarios"
      aria-label="ابزارهای ارزیابی دمو"
    >
      <span>
        <ShieldCheck size={18} aria-hidden="true" />
        ابزارهای نمایشی
      </span>
      <button
        onClick={() => {
          injectScenario(
            activeScenario === "INDEBTED_PATIENT"
              ? "NORMAL"
              : "INDEBTED_PATIENT",
          );
          navigate("/patient");
        }}
      >
        <AlertTriangle size={16} aria-hidden="true" />
        {activeScenario === "INDEBTED_PATIENT"
          ? "غیرفعال‌سازی بیمار بدهکار"
          : "تزریق بیمار بدهکار (قفل نرم)"}
      </button>
      <button
        onClick={() => {
          if (
            window.confirm(
              "آیا از بازنشانی کامل پایگاه داده به وضعیت اولیه (Factory Reset) اطمینان دارید؟",
            )
          ) {
            resetDatabase();
            navigate("/patient");
          }
        }}
      >
        <RotateCcw size={16} aria-hidden="true" />
        ریست کارخانه‌ای داده‌ها
      </button>
    </aside>
  );
}
