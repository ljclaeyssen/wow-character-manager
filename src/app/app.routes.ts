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
    loadComponent: () => import('./features/dashboard/components/dashboard/dashboard.component').then(m => m.DashboardComponent),
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
        loadComponent: () => import('./features/characters/components/character-list/character-list.component').then(m => m.CharacterListComponent),
        title: 'Characters - WoW Character Manager',
        data: {
          breadcrumb: 'Characters',
          description: 'Manage your World of Warcraft characters'
        }
      },
      {
        path: 'add',
        loadComponent: () => import('./features/characters/components/character-form/character-form.component').then(m => m.CharacterFormComponent),
        title: 'Add Character - WoW Character Manager',
        data: {
          breadcrumb: 'Add Character',
          description: 'Create a new character profile'
        }
      },
      {
        path: 'edit/:id',
        loadComponent: () => import('./features/characters/components/character-form/character-form.component').then(m => m.CharacterFormComponent),
        title: 'Edit Character - WoW Character Manager',
        data: {
          breadcrumb: 'Edit Character',
          description: 'Modify character details'
        }
      },
      {
        path: 'detail/:id',
        loadComponent: () => import('./features/characters/components/character-detail/character-detail.component').then(m => m.CharacterDetailComponent),
        title: 'Character Details - WoW Character Manager',
        data: {
          breadcrumb: 'Character Details',
          description: 'View detailed character information'
        }
      }
    ]
  },

  // Settings and configuration
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/components/settings/settings.component').then(m => m.SettingsComponent),
    title: 'Settings - WoW Character Manager',
    data: {
      breadcrumb: 'Settings',
      description: 'Application settings and API configuration'
    }
  },

  // Wildcard route - must be last
  {
    path: '**',
    redirectTo: '/dashboard',
    title: 'Page Not Found - WoW Character Manager'
  }
];
