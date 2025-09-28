import { Injectable, signal, computed, inject } from '@angular/core';
import { StorageService } from './storage.service';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly storageService = inject(StorageService);
  private readonly STORAGE_KEY = 'wow-theme-preference';

  // Theme state - default to dark as requested
  private readonly _currentTheme = signal<Theme>('dark');

  // Public computed properties
  readonly currentTheme = computed(() => this._currentTheme());
  readonly isDarkMode = computed(() => this._currentTheme() === 'dark');
  readonly isLightMode = computed(() => this._currentTheme() === 'light');

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme(): void {
    // Load saved theme preference or default to dark
    const savedTheme = this.storageService.get<Theme>(this.STORAGE_KEY);
    const preferredTheme = savedTheme || 'dark'; // Default to dark as requested

    this.setTheme(preferredTheme);
  }

  setTheme(theme: Theme): void {
    this._currentTheme.set(theme);
    this.applyThemeToDocument(theme);
    this.saveThemePreference(theme);
  }

  toggleTheme(): void {
    const newTheme: Theme = this.isDarkMode() ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  private applyThemeToDocument(theme: Theme): void {
    // Remove existing theme classes
    document.documentElement.classList.remove('p-light', 'p-dark');
    document.body.classList.remove('p-light', 'p-dark');

    // Add new theme class
    const themeClass = theme === 'dark' ? 'p-dark' : 'p-light';
    document.documentElement.classList.add(themeClass);
    document.body.classList.add(themeClass);

    // Update meta theme-color for mobile browsers
    this.updateMetaThemeColor(theme);
  }

  private updateMetaThemeColor(theme: Theme): void {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const color = theme === 'dark' ? '#1f2937' : '#ffffff'; // Dark gray for dark mode, white for light

    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', color);
    } else {
      // Create meta tag if it doesn't exist
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = color;
      document.head.appendChild(meta);
    }
  }

  private saveThemePreference(theme: Theme): void {
    this.storageService.set(this.STORAGE_KEY, theme);
  }

  // Utility methods for components
  getThemeClass(): string {
    return this.isDarkMode() ? 'p-dark' : 'p-light';
  }

  getThemeIcon(): string {
    return this.isDarkMode() ? 'pi pi-sun' : 'pi pi-moon';
  }

  getThemeLabel(): string {
    return this.isDarkMode() ? 'Light Mode' : 'Dark Mode';
  }

  // Method to force refresh theme (useful for development)
  refreshTheme(): void {
    this.applyThemeToDocument(this.currentTheme());
  }
}