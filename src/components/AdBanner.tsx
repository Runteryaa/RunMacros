"use client";
import { useEffect, useRef } from "react";

export default function AdBanner() {
  const adRef = useRef(null);

  useEffect(() => {
    // AdSense code: will only run in browser
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {}
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client="ca-pub-9944004180654653"
      data-ad-slot="3641520661"
      data-ad-format="auto"
      ref={adRef}
    ></ins>
  );
}
