import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TooltipModule
  ],
  template: `
    <p-button
      [icon]="themeService.getThemeIcon()"
      [text]="displayMode() === 'text'"
      [outlined]="displayMode() === 'outlined'"
      [rounded]="displayMode() === 'icon'"
      [severity]="severity()"
      [size]="size()"
      [label]="displayMode() === 'text' ? themeService.getThemeLabel() : ''"
      [pTooltip]="'Switch to ' + themeService.getThemeLabel()"
      tooltipPosition="bottom"
      (onClick)="toggleTheme()">
    </p-button>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThemeToggleComponent {
  readonly themeService = inject(ThemeService);

  // Input properties for customization
  readonly displayMode = input<'icon' | 'text' | 'outlined'>('icon');
  readonly severity = input<'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'help' | 'contrast'>('secondary');
  readonly size = input<'small' | 'large' | undefined>(undefined);

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}