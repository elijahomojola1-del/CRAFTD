import { Stack, usePathname, useRouter } from "expo-router";
import { useEffect } from "react";
import { getToken } from "../utils/tokenStorage";

// Screens that can be seen without signing in.
const PUBLIC_PATHS = ["/", "/login", "/register", "/role-select", "/terms"];

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();

  // When the session has ended and can't be renewed, send the user to log in
  // instead of leaving them on a screen that silently fails to load.
  useEffect(() => {
    if (PUBLIC_PATHS.includes(pathname)) return;

    let cancelled = false;
    getToken().then((token) => {
      if (!token && !cancelled) {
        router.replace("/login");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
