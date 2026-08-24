"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import GlobalLoading from "./loading";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) {
          router.replace("/dashboard");
        } else {
          router.replace("/login");
        }
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  return <GlobalLoading />;
}
