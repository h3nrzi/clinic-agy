import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App, { createAppRouter } from "@/App";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import type { Role } from "@/shared/types";

const dashboardPaths: Record<Role, string> = {
  PATIENT: "/patient",
  SECRETARY_TEHRAN: "/secretary/tehran",
  SECRETARY_ISFAHAN: "/secretary/isfahan",
  DOCTOR: "/doctor",
  ADMIN_FINANCE: "/finance",
};

const accountLabels: Record<Role, string> = {
  PATIENT: "حساب بیمار",
  SECRETARY_TEHRAN: "حساب منشی تهران",
  SECRETARY_ISFAHAN: "حساب منشی اصفهان",
  DOCTOR: "حساب پزشک",
  ADMIN_FINANCE: "حساب مدیر مالی",
};

export function renderApp(
  path = dashboardPaths[useAuthStore.getState().currentRole],
) {
  const router = createAppRouter([path]);
  return { ...render(<App router={router} />), router };
}

/** Change accounts through the same logout and consent/OTP flow available to evaluators. */
export async function switchAccount(role: Role) {
  fireEvent.click(screen.getByRole("button", { name: "خروج از حساب" }));
  fireEvent.click(
    await screen.findByRole("link", { name: "ورود و رزرو نوبت" }),
  );
  fireEvent.click(
    await screen.findByRole("button", { name: accountLabels[role] }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "استفاده از مشخصات آزمایشی" }),
  );
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "دریافت کد نمایشی" }));
  fireEvent.change(screen.getByLabelText("کد تأیید"), {
    target: { value: "123456" },
  });
  fireEvent.click(screen.getByRole("button", { name: "تأیید و ورود" }));
  await waitFor(() => {
    if (!screen.queryByRole("button", { name: "خروج از حساب" })) {
      throw new Error(`The ${accountLabels[role]} session has not opened yet.`);
    }
  });
}
