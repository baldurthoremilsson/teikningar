"use client";

import "bootstrap/dist/css/bootstrap.min.css";
import dynamic from "next/dynamic";
import { StrictMode } from "react";

const Routes = dynamic(() => import("./routes"), {
  ssr: false,
});

export default function Home() {
  return (
    <StrictMode>
      <Routes />
    </StrictMode>
  );
}
