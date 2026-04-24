import { Component, computed, input, output, signal } from '@angular/core';
import { Task } from '../../models/task.model';

@Component({
  selector: 'app-task',
  standalone: true,
  templateUrl: './task.component.html',
  styleUrl: './task.component.scss'
})
export class TaskComponent {
  task = input.required<Task>();
  edit = output<Task>();
  delete = output<string>();

  notesExpanded = signal(false);

  currentState = computed(() => {
    const history = this.task().stateHistory;
    return history.length > 0 ? history[history.length - 1].state : 'new';
  });

  toggleNotes(): void {
    this.notesExpanded.update(v => !v);
  }

  onEdit(): void {
    this.edit.emit(this.task());
  }

  onDelete(): void {
    this.delete.emit(this.task().id!);
  }
}
