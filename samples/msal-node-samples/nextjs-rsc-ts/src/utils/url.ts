import { headers } from "next/headers";

// https://github.com/vercel/next.js/issues/43704#issuecomment-1411186664

export function getCurrentUrl() {
  const headersList = headers();

  // read the custom x-url header
  return headersList.get("x-url") || "";
}
