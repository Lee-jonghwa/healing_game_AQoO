// context/RecoilProvider.tsx
"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { RecoilRoot } from "recoil";
import { queryClient } from "./queryClient";

export default function RecoilProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <RecoilRoot key="global-recoil">{children}</RecoilRoot>
    </QueryClientProvider>
  );
}
