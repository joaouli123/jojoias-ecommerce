export type StoredShippingSelection = {
  zipcode: string;
  optionId?: string;
};

const SHIPPING_STORAGE_KEY = "luxijoias:shipping-selection";

export function readStoredShippingSelection(): StoredShippingSelection | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(SHIPPING_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredShippingSelection;
    if (!parsed || typeof parsed !== "object" || typeof parsed.zipcode !== "string") {
      return null;
    }

    return {
      zipcode: parsed.zipcode,
      optionId: typeof parsed.optionId === "string" ? parsed.optionId : undefined,
    };
  } catch {
    return null;
  }
}

export function writeStoredShippingSelection(selection: StoredShippingSelection) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(SHIPPING_STORAGE_KEY, JSON.stringify(selection));
}
