"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

export default function RouteLoader() {
  const pathname = usePathname();

  useEffect(() => {
    NProgress.start();
    const timer = setTimeout(() => NProgress.done(), 250);
    return () => {
      NProgress.done();
      clearTimeout(timer);
    };
  }, [pathname]);

  return null;
}
