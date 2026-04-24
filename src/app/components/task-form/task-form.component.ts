import { Component, inject, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TaskService } from '../../services/task.service';
import { Task, TaskState } from '../../models/task.model';

function atLeastOneNote(control: AbstractControl): ValidationErrors | null {
  const array = control as FormArray;
  const hasContent = array.controls.some(c => (c.value as string)?.trim() !== '');
  return hasContent ? null : { atLeastOneNote: true };
}

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.scss'
})
export class TaskFormComponent implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  states = toSignal(this.taskService.getStates(), { initialValue: [] as TaskState[] });
  isEditMode = signal(false);
  isSubmitting = signal(false);
  private taskId = signal<string | null>(null);
  private originalTask = signal<Task | null>(null);

  form = new FormGroup({
    title: new FormControl('', [Validators.required, Validators.minLength(3)]),
    description: new FormControl(''),
    dueDate: new FormControl('', Validators.required),
    state: new FormControl('new'),
    completed: new FormControl(false),
    notes: new FormArray([new FormControl('')], atLeastOneNote),
  });

  get notesArray(): FormArray {
    return this.form.get('notes') as FormArray;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.isEditMode.set(true);
    this.taskId.set(id);

    this.taskService.getTask(id).subscribe(task => {
      this.originalTask.set(task);

      this.notesArray.clear();
      const notes = task.notes.length > 0 ? task.notes : [''];
      notes.forEach(note => this.notesArray.push(new FormControl(note)));

      const currentState =
        task.stateHistory.length > 0
          ? task.stateHistory[task.stateHistory.length - 1].state
          : 'new';

      this.form.patchValue({
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        state: currentState,
        completed: task.completed,
      });
    });
  }

  addNote(): void {
    this.notesArray.push(new FormControl(''));
  }

  removeNote(index: number): void {
    if (this.notesArray.length > 1) {
      this.notesArray.removeAt(index);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.form.getRawValue();
    const notes = (formValue.notes as string[]).filter(n => n.trim() !== '');
    const today = new Date().toISOString().split('T')[0];

    if (this.isEditMode()) {
      const existing = this.originalTask()!;
      const lastState = existing.stateHistory[existing.stateHistory.length - 1]?.state;
      const stateHistory = [...existing.stateHistory];

      if (formValue.state !== lastState) {
        stateHistory.push({ state: formValue.state!, date: today });
      }

      const updated: Task = {
        ...existing,
        title: formValue.title!,
        description: formValue.description ?? '',
        dueDate: formValue.dueDate!,
        completed: formValue.completed ?? false,
        stateHistory,
        notes,
      };

      this.taskService.updateTask(this.taskId()!, updated).subscribe({
        next: () => this.router.navigate(['/tasks']),
        error: () => this.isSubmitting.set(false),
      });
    } else {
      const newTask: Omit<Task, 'id'> = {
        title: formValue.title!,
        description: formValue.description ?? '',
        dueDate: formValue.dueDate!,
        completed: formValue.completed ?? false,
        stateHistory: [{ state: formValue.state!, date: today }],
        notes,
      };

      this.taskService.createTask(newTask).subscribe({
        next: () => this.router.navigate(['/tasks']),
        error: () => this.isSubmitting.set(false),
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/tasks']);
  }
}
