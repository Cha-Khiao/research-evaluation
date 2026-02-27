"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// ใช้ React.ComponentProps ดึง Type มาโดยตรง จะไม่เกิด Error หาไฟล์ไม่เจอครับ
export function ThemeProvider({ 
  children, 
  ...props 
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}