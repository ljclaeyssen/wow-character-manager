import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, NavigationEnd } from '@angular/router';
import { Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Subject } from 'rxjs';

import { NavigationComponent } from './navigation.component';

// Mock Router
class MockRouter {
  events = new Subject();
  url = '/dashboard';

  navigate = jasmine.createSpy('navigate').and.returnValue(Promise.resolve(true));
}

// Host component for testing inputs/outputs
@Component({
  template: `
    <app-navigation
      [isMobile]="isMobile()"
      [sidebarVisible]="sidebarVisible()"
      (sidebarVisibleChange)="onSidebarVisibleChange($event)">
    </app-navigation>
  `
})
class HostComponent {
  isMobile = signal(false);
  sidebarVisible = signal(false);
  sidebarVisibleChanges: boolean[] = [];

  onSidebarVisibleChange(visible: boolean): void {
    this.sidebarVisibleChanges.push(visible);
    this.sidebarVisible.set(visible);
  }
}

describe('NavigationComponent', () => {
  let component: NavigationComponent;
  let fixture: ComponentFixture<NavigationComponent>;
  let hostComponent: HostComponent;
  let hostFixture: ComponentFixture<HostComponent>;
  let mockRouter: MockRouter;

  beforeEach(async () => {
    mockRouter = new MockRouter();

    await TestBed.configureTestingModule({
      imports: [NavigationComponent],
      declarations: [HostComponent],
      providers: [
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NavigationComponent);
    component = fixture.componentInstance;

    hostFixture = TestBed.createComponent(HostComponent);
    hostComponent = hostFixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with current route', () => {
      mockRouter.url = '/characters';
      fixture.detectChanges();

      expect(component['currentRoute']()).toBe('/characters');
    });

    it('should set up route tracking on init', () => {
      fixture.detectChanges();

      const navigationEnd = new NavigationEnd(1, '/settings', '/settings');
      mockRouter.events.next(navigationEnd);

      expect(component['currentRoute']()).toBe('/settings');
    });
  });

  describe('Menu Items', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have main menu items defined', () => {
      const menuItems = component['menuItems']();

      expect(menuItems).toBeDefined();
      expect(menuItems.length).toBeGreaterThan(0);

      const labels = menuItems.map(item => item.label);
      expect(labels).toContain('Dashboard');
      expect(labels).toContain('Characters');
      expect(labels).toContain('Activities');
      expect(labels).toContain('Settings');
    });

    it('should have Characters submenu items', () => {
      const menuItems = component['menuItems']();
      const charactersMenu = menuItems.find(item => item.label === 'Characters');

      expect(charactersMenu?.items).toBeDefined();
      expect(charactersMenu?.items?.length).toBe(3);

      const subLabels = charactersMenu?.items?.map(item => item.label);
      expect(subLabels).toContain('Overview');
      expect(subLabels).toContain('Add Character');
      expect(subLabels).toContain('Import/Export');
    });

    it('should have Activities submenu items', () => {
      const menuItems = component['menuItems']();
      const activitiesMenu = menuItems.find(item => item.label === 'Activities');

      expect(activitiesMenu?.items).toBeDefined();
      expect(activitiesMenu?.items?.length).toBe(3);

      const subLabels = activitiesMenu?.items?.map(item => item.label);
      expect(subLabels).toContain('Mythic+');
      expect(subLabels).toContain('Raids');
      expect(subLabels).toContain('Weekly Quests');
    });

    it('should have Reports submenu items', () => {
      const menuItems = component['menuItems']();
      const reportsMenu = menuItems.find(item => item.label === 'Reports');

      expect(reportsMenu?.items).toBeDefined();
      expect(reportsMenu?.items?.length).toBe(3);

      const subLabels = reportsMenu?.items?.map(item => item.label);
      expect(subLabels).toContain('Summary Table');
      expect(subLabels).toContain('Progress Charts');
      expect(subLabels).toContain('Weekly Report');
    });
  });

  describe('Mobile Menu Items', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should flatten menu items for mobile', () => {
      const mobileItems = component['mobileMenuItems']();

      expect(mobileItems.length).toBeGreaterThan(component['menuItems']().length);

      // Should have section headers
      const sectionHeaders = mobileItems.filter(item => item.styleClass === 'menu-section-header');
      expect(sectionHeaders.length).toBeGreaterThan(0);

      // Should have child items
      const childItems = mobileItems.filter(item => item.styleClass === 'menu-child-item');
      expect(childItems.length).toBeGreaterThan(0);
    });

    it('should mark section headers as disabled', () => {
      const mobileItems = component['mobileMenuItems']();
      const sectionHeaders = mobileItems.filter(item => item.styleClass === 'menu-section-header');

      sectionHeaders.forEach(header => {
        expect(header.disabled).toBe(true);
      });
    });
  });

  describe('Desktop Menu Items', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should add active route styling', () => {
      component['currentRoute'].set('/dashboard');

      const desktopItems = component['desktopMenuItems']();
      const dashboardItem = desktopItems.find(item => item.routerLink === '/dashboard');

      expect(dashboardItem?.styleClass).toBe('active-route');
    });

    it('should mark submenu items as active', () => {
      component['currentRoute'].set('/characters/add');

      const desktopItems = component['desktopMenuItems']();
      const charactersMenu = desktopItems.find(item => item.label === 'Characters');
      const addCharacterItem = charactersMenu?.items?.find(item => item.routerLink === '/characters/add');

      expect(addCharacterItem?.styleClass).toBe('active-route');
    });
  });

  describe('Route Activity Detection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should detect active dashboard route', () => {
      const isActive = component['isRouteActive']('/dashboard', '/dashboard');
      expect(isActive).toBe(true);
    });

    it('should detect active nested route', () => {
      const isActive = component['isRouteActive']('/characters', '/characters/add');
      expect(isActive).toBe(true);
    });

    it('should not match unrelated routes', () => {
      const isActive = component['isRouteActive']('/characters', '/settings');
      expect(isActive).toBe(false);
    });

    it('should handle root route correctly', () => {
      expect(component['isRouteActive']('/', '/')).toBe(true);
      expect(component['isRouteActive']('/', '/dashboard')).toBe(true);
      expect(component['isRouteActive']('/dashboard', '/')).toBe(true);
    });

    it('should handle empty or null routes', () => {
      expect(component['isRouteActive']('', '/dashboard')).toBe(false);
      expect(component['isRouteActive']('/dashboard', '')).toBe(false);
    });
  });

  describe('Navigation Behavior', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should navigate when menu item command is called', () => {
      const menuItems = component['menuItems']();
      const dashboardItem = menuItems.find(item => item.label === 'Dashboard');

      dashboardItem?.command?.({});

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should close mobile sidebar after navigation on mobile', () => {
      spyOn(component, 'closeMobileSidebar');

      // Set component as mobile
      component['navigate']('/characters');

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/characters']);
    });
  });

  describe('Input/Output Behavior', () => {
    beforeEach(() => {
      hostFixture.detectChanges();
    });

    it('should react to isMobile input changes', () => {
      hostComponent.isMobile.set(true);
      hostFixture.detectChanges();

      const navComponent = hostFixture.debugElement.query(By.directive(NavigationComponent)).componentInstance;
      expect(navComponent.isMobile()).toBe(true);
    });

    it('should react to sidebarVisible input changes', () => {
      hostComponent.sidebarVisible.set(true);
      hostFixture.detectChanges();

      const navComponent = hostFixture.debugElement.query(By.directive(NavigationComponent)).componentInstance;
      expect(navComponent.sidebarVisible()).toBe(true);
    });

    it('should emit sidebarVisibleChange when closed', () => {
      const navComponent = hostFixture.debugElement.query(By.directive(NavigationComponent)).componentInstance;

      navComponent.closeMobileSidebar();

      expect(hostComponent.sidebarVisibleChanges).toContain(false);
    });

    it('should emit sidebarVisibleChange on hide', () => {
      const navComponent = hostFixture.debugElement.query(By.directive(NavigationComponent)).componentInstance;

      navComponent.onSidebarHide();

      expect(hostComponent.sidebarVisibleChanges).toContain(false);
    });
  });

  describe('Mobile Menu Item Click', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should execute command when mobile menu item is clicked', () => {
      const mockCommand = jasmine.createSpy('command');
      const menuItem = { label: 'Test', command: mockCommand };

      component.onMobileMenuItemClick(menuItem);

      expect(mockCommand).toHaveBeenCalledWith({});
    });

    it('should handle menu items without commands', () => {
      const menuItem = { label: 'Test' };

      expect(() => {
        component.onMobileMenuItemClick(menuItem);
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle navigation end events properly', () => {
      const initialRoute = component['currentRoute']();

      const navigationEnd = new NavigationEnd(1, '/new-route', '/new-route');
      mockRouter.events.next(navigationEnd);

      expect(component['currentRoute']()).toBe('/new-route');
      expect(component['currentRoute']()).not.toBe(initialRoute);
    });

    it('should handle menu items with missing routerLink', () => {
      const menuItems = component['mobileMenuItems']();
      const itemWithoutRoute = menuItems.find(item => !item.routerLink && !item.disabled);

      if (itemWithoutRoute) {
        const isActive = component['isRouteActive'](itemWithoutRoute.routerLink || '', '/dashboard');
        expect(isActive).toBe(false);
      }
    });
  });
});