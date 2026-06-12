import { describe, expect, it } from "vitest";

import { formatCountry, formatSignal } from "@/lib/codeLabels";

describe("codeLabels", () => {
  it("maps signal codes to English labels", () => {
    expect(formatSignal("Monto fuera de rango").label).toBe("Amount above usual range");
  });

  it("formats country with name", () => {
    expect(formatCountry("PE").label).toBe("Peru (PE)");
  });
});
