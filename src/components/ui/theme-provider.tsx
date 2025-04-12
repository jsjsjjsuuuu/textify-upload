
"use client"

import * as React from "react"
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "dark",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "dark", // تم تعديل القيمة الافتراضية إلى الوضع الداكن دائمًا
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  // تجاهل قيمة التخزين المحلي وتعيين الثيم دائمًا على "dark"
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "system");
    
    // تطبيق الوضع الداكن دائمًا
    root.classList.add("dark");
    
    // تطبيق تأثيرات انتقالية إلى العناصر
    document.documentElement.classList.add('theme-transition');
    
    return () => {
      // إزالة تأثيرات الانتقال بعد اكتمال التحويل
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transition');
      }, 300);
    };
  }, []);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, "dark"); // دائمًا احفظ "dark"
      setTheme("dark"); // دائمًا عين "dark"
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
