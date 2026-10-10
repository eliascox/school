/**
 * Global Theme Service for School Management System
 * Supports Light & Dark (Night) Mode with instant switching, persistence,
 * and reactive listeners across all components.
 */

export type AppTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'sms_theme';

class ThemeService {
  private currentTheme: AppTheme = 'light';
  private listeners: ((theme: AppTheme) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as AppTheme | null;
      if (stored === 'dark' || stored === 'light') {
        this.currentTheme = stored;
      } else {
        // Default to light mode
        this.currentTheme = 'light';
      }
      this.applyTheme(this.currentTheme);
    }
  }

  public getTheme(): AppTheme {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as AppTheme | null;
      if (stored === 'dark' || stored === 'light') {
        this.currentTheme = stored;
      }
    }
    return this.currentTheme;
  }

  public setTheme(theme: AppTheme): void {
    this.currentTheme = theme;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch (e) {}
      this.applyTheme(theme);
      window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme } }));
    }
    this.notify();
  }

  public toggleTheme(): AppTheme {
    const nextTheme: AppTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(nextTheme);
    return nextTheme;
  }

  public isDark(): boolean {
    return this.currentTheme === 'dark';
  }

  public subscribe(listener: (theme: AppTheme) => void): () => void {
    this.listeners.push(listener);
    listener(this.currentTheme);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx > -1) {
        this.listeners.splice(idx, 1);
      }
    };
  }

  private applyTheme(theme: AppTheme): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener(this.currentTheme));
  }
}

export const themeService = new ThemeService();
