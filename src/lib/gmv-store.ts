export const GMV_STORE_BRAND_ID = "bea819e0-5597-4072-ba4d-9c0e24b2657f";
export const GMV_STORE_NAME = "GMV Store";
export const GMV_STORE_AVATAR = "/images/gmv-logo-mark.svg";

export function getDisplayBrand(
  brandId: string,
  profileName?: string | null,
  profileAvatar?: string | null
): { name: string; avatar: string | undefined } {
  if (brandId === GMV_STORE_BRAND_ID) {
    return { name: GMV_STORE_NAME, avatar: GMV_STORE_AVATAR };
  }
  return {
    name: profileName || "Brand",
    avatar: profileAvatar || undefined,
  };
}
