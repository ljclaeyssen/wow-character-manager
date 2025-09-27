import { Component, inject, signal } from '@angular/core';
import { ToolbarModule } from 'primeng/toolbar';
import { PanelModule } from 'primeng/panel';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { CharacterListComponent } from './components/character-list/character-list.component';
import { CharacterFormComponent } from './components/character-form/character-form.component';
import { CharacterDetailComponent } from './components/character-detail/character-detail.component';
import { Character } from './models/character.model';
import { CharacterStore } from './store/character.store';

@Component({
  selector: 'app-root',
  imports: [
    ToolbarModule,
    PanelModule,
    CardModule,
    ToastModule,
    ButtonModule,
    CharacterListComponent,
    CharacterFormComponent,
    CharacterDetailComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly messageService = inject(MessageService);
  private readonly characterStore = inject(CharacterStore);

  protected readonly title = signal('WoW Character Manager');
  protected readonly isLoading = signal(false);

  // View management
  protected readonly currentView = signal<'list' | 'detail'>('list');
  protected readonly selectedCharacter = signal<Character | null>(null);

  // Form state management
  protected readonly showCharacterForm = signal(false);
  protected readonly editingCharacter = signal<Character | null>(null);

  // Character form event handlers
  protected onAddCharacter(): void {
    this.editingCharacter.set(null);
    this.showCharacterForm.set(true);
  }

  protected onEditCharacter(character: Character): void {
    this.editingCharacter.set(character);
    this.showCharacterForm.set(true);
  }

  protected onFormVisibilityChange(visible: boolean): void {
    this.showCharacterForm.set(visible);
    if (!visible) {
      this.editingCharacter.set(null);
    }
  }

  protected onCharacterSaved(character: Character): void {
    const action = this.editingCharacter() ? 'updated' : 'created';

    this.showCharacterForm.set(false);
    this.editingCharacter.set(null);
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: `Character ${character.name} has been ${action} successfully!`
    });

    // If we're in detail view and editing the current character, update the view
    if (this.currentView() === 'detail' && this.selectedCharacter()?.id === character.id) {
      this.selectedCharacter.set(character);
    }
  }

  protected onFormCancelled(): void {
    this.showCharacterForm.set(false);
    this.editingCharacter.set(null);
  }

  // Character selection and detail view
  protected onCharacterSelected(character: Character): void {
    this.selectedCharacter.set(character);
    this.currentView.set('detail');
  }

  protected onCloseDetail(): void {
    this.selectedCharacter.set(null);
    this.currentView.set('list');
  }

  protected onDeleteCharacter(character: Character): void {
    // Show confirmation dialog and delete character
    this.characterStore.removeCharacter(character.id);

    this.messageService.add({
      severity: 'success',
      summary: 'Deleted',
      detail: `Character ${character.name} has been deleted successfully!`
    });

    // If we're viewing the deleted character, go back to list
    if (this.selectedCharacter()?.id === character.id) {
      this.onCloseDetail();
    }
  }
}
