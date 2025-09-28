import { Routes } from '@angular/router';

export const routes: Routes = [
  // Default route - redirect to dashboard
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },

  // Dashboard route
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'Dashboard - WoW Character Manager',
    data: {
      breadcrumb: 'Dashboard',
      description: 'Character overview and activity summary'
    }
  },

  // Character management routes
  {
    path: 'characters',
    children: [
      {
        path: '',
        loadComponent: () => import('./components/character-list/character-list.component').then(m => m.CharacterListComponent),
        title: 'Characters - WoW Character Manager',
        data: {
          breadcrumb: 'Characters',
          description: 'Manage your World of Warcraft characters'
        }
      },
      {
        path: 'add',
        loadComponent: () => import('./components/character-form/character-form.component').then(m => m.CharacterFormComponent),
        title: 'Add Character - WoW Character Manager',
        data: {
          breadcrumb: 'Add Character',
          description: 'Create a new character profile'
        }
      },
      {
        path: 'edit/:id',
        loadComponent: () => import('./components/character-form/character-form.component').then(m => m.CharacterFormComponent),
        title: 'Edit Character - WoW Character Manager',
        data: {
          breadcrumb: 'Edit Character',
          description: 'Modify character details'
        }
      },
      {
        path: 'detail/:id',
        loadComponent: () => import('./components/character-detail/character-detail.component').then(m => m.CharacterDetailComponent),
        title: 'Character Details - WoW Character Manager',
        data: {
          breadcrumb: 'Character Details',
          description: 'View detailed character information'
        }
      },
      {
        path: 'import-export',
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Import/Export - WoW Character Manager',
        data: {
          breadcrumb: 'Import/Export',
          description: 'Import and export character data'
        }
      }
    ]
  },

  // Activity tracking routes
  {
    path: 'activities',
    children: [
      {
        path: '',
        redirectTo: 'tracker',
        pathMatch: 'full'
      },
      {
        path: 'weekly-quests',
        loadComponent: () => import('./components/weekly-quest/weekly-quest.component').then(m => m.WeeklyQuestComponent),
        title: 'Weekly Quests - WoW Character Manager',
        data: {
          breadcrumb: 'Weekly Quests',
          description: 'Track weekly quest completion'
        }
      },
      {
        path: 'tracker',
        loadComponent: () => import('./components/activity-tracker/activity-tracker.component').then(m => m.ActivityTrackerComponent),
        title: 'Activity Tracker - WoW Character Manager',
        data: {
          breadcrumb: 'Activity Tracker',
          description: 'Comprehensive activity tracking'
        }
      }
    ]
  },

  // Reports and analytics routes
  {
    path: 'reports',
    children: [
      {
        path: '',
        redirectTo: 'summary',
        pathMatch: 'full'
      },
      {
        path: 'summary',
        loadComponent: () => import('./components/summary-table/summary-table.component').then(m => m.SummaryTableComponent),
        title: 'Summary Report - WoW Character Manager',
        data: {
          breadcrumb: 'Summary Table',
          description: 'Character progress summary table'
        }
      },
      {
        path: 'charts',
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Progress Charts - WoW Character Manager',
        data: {
          breadcrumb: 'Progress Charts',
          description: 'Visual progress charts and analytics'
        }
      },
      {
        path: 'weekly',
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Weekly Report - WoW Character Manager',
        data: {
          breadcrumb: 'Weekly Report',
          description: 'Weekly progress and achievement report'
        }
      }
    ]
  },

  // Settings and configuration
  {
    path: 'settings',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'Settings - WoW Character Manager',
    data: {
      breadcrumb: 'Settings',
      description: 'Application settings and preferences'
    }
  },

  // Wildcard route - must be last
  {
    path: '**',
    redirectTo: '/dashboard',
    title: 'Page Not Found - WoW Character Manager'
  }
];
