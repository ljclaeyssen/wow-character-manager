import { Component, computed, inject, input, output, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { MenuItem } from 'primeng/api';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MenubarModule,
    DrawerModule,
    ButtonModule,
    ThemeToggleComponent
  ],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss'
})
export class NavigationComponent implements OnDestroy {
  private readonly router = inject(Router);

  // Subscription for cleanup
  private routerSubscription?: Subscription;

  // Input/Output properties
  readonly isMobile = input<boolean>(false);
  readonly sidebarVisible = input<boolean>(false);
  readonly sidebarVisibleChange = output<boolean>();

  // Current route tracking
  protected readonly currentRoute = signal<string>('');

  // Main navigation menu items
  protected readonly menuItems = signal<MenuItem[]>([
    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      routerLink: '/dashboard',
      command: () => this.navigate('/dashboard')
    },
    {
      label: 'Characters',
      icon: 'pi pi-users',
      items: [
        {
          label: 'Overview',
          icon: 'pi pi-list',
          routerLink: '/characters',
          command: () => this.navigate('/characters')
        },
        {
          label: 'Add Character',
          icon: 'pi pi-plus',
          routerLink: '/characters/add',
          command: () => this.navigate('/characters/add')
        },
        {
          label: 'Import/Export',
          icon: 'pi pi-download',
          routerLink: '/characters/import-export',
          command: () => this.navigate('/characters/import-export')
        }
      ]
    },
    {
      label: 'Reports',
      icon: 'pi pi-chart-bar',
      items: [
        {
          label: 'Summary Table',
          icon: 'pi pi-table',
          routerLink: '/reports/summary',
          command: () => this.navigate('/reports/summary')
        },
        {
          label: 'Progress Charts',
          icon: 'pi pi-chart-line',
          routerLink: '/reports/charts',
          command: () => this.navigate('/reports/charts')
        },
        {
          label: 'Weekly Report',
          icon: 'pi pi-file-pdf',
          routerLink: '/reports/weekly',
          command: () => this.navigate('/reports/weekly')
        }
      ]
    },
    {
      label: 'Settings',
      icon: 'pi pi-cog',
      routerLink: '/settings',
      command: () => this.navigate('/settings')
    }
  ]);

  // Mobile menu items (flattened for sidebar)
  protected readonly mobileMenuItems = computed<MenuItem[]>(() => {
    const items: MenuItem[] = [];

    this.menuItems().forEach(item => {
      if (item.items) {
        // Add parent as section header
        items.push({
          label: item.label,
          icon: item.icon,
          disabled: true,
          styleClass: 'menu-section-header'
        });
        // Add child items
        item.items.forEach(child => {
          items.push({
            ...child,
            styleClass: 'menu-child-item'
          });
        });
      } else {
        items.push(item);
      }
    });

    return items;
  });

  // Desktop menu items with active state
  protected readonly desktopMenuItems = computed<MenuItem[]>(() => {
    const currentRoute = this.currentRoute();

    return this.menuItems().map(item => ({
      ...item,
      styleClass: this.isRouteActive(item.routerLink || '', currentRoute) ? 'active-route' : '',
      items: item.items?.map(subItem => ({
        ...subItem,
        styleClass: this.isRouteActive(subItem.routerLink || '', currentRoute) ? 'active-route' : ''
      }))
    }));
  });

  constructor() {
    this.initializeRouteTracking();
  }

  // Initialize route tracking
  private initializeRouteTracking(): void {
    // Set initial route
    this.currentRoute.set(this.router.url);

    // Listen for route changes
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute.set(event.urlAfterRedirects);
      });
  }

  ngOnDestroy(): void {
    // Clean up router subscription
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  // Navigation helper
  protected navigate(route: string): void {
    this.router.navigate([route]);
    if (this.isMobile()) {
      this.closeMobileSidebar();
    }
  }

  // Check if route is active
  protected isRouteActive(itemRoute: string, currentRoute: string): boolean {
    if (!itemRoute || !currentRoute) return false;

    // Exact match for root routes
    if (itemRoute === '/' || itemRoute === '/dashboard') {
      return currentRoute === itemRoute || currentRoute === '/' || currentRoute === '/dashboard';
    }

    // Starts with for nested routes
    return currentRoute.startsWith(itemRoute);
  }

  // Mobile sidebar controls
  protected closeMobileSidebar(): void {
    this.sidebarVisibleChange.emit(false);
  }

  protected onSidebarHide(): void {
    this.sidebarVisibleChange.emit(false);
  }

  // Menu item click handler for mobile
  protected onMobileMenuItemClick(item: MenuItem): void {
    if (item.command) {
      item.command({});
    }
  }
}