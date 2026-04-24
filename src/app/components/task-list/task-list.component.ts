import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { TaskService } from '../../services/task.service';
import { TaskComponent } from '../task/task.component';
import { Task } from '../../models/task.model';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [TaskComponent],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss',
})
export class TaskListComponent {
  private readonly taskService = inject(TaskService);
  private readonly router = inject(Router);

  private refresh = signal(0);
  readonly pageSize = 5;
  currentPage = signal(0);

  private tasksResource = toSignal(
    toObservable(this.refresh).pipe(
      switchMap(() => this.taskService.getTasks()),
    ),
  );

  tasks = computed(() => this.tasksResource() ?? []);
  isLoading = computed(() => this.tasksResource() === undefined);
  totalPages = computed(() => Math.ceil(this.tasks().length / this.pageSize));

  pagedTasks = computed(() => {
    const start = this.currentPage() * this.pageSize;
    return this.tasks().slice(start, start + this.pageSize);
  });

  hasPrev = computed(() => this.currentPage() > 0);
  hasNext = computed(() => this.currentPage() < this.totalPages() - 1);

  constructor() {
    effect(() => {
      const total = this.totalPages();
      const current = this.currentPage();
      if (total > 0 && current >= total) {
        this.currentPage.set(total - 1);
      }
    });
  }

  goToNew(): void {
    this.router.navigate(['/tasks/new']);
  }

  onEdit(task: Task): void {
    this.router.navigate(['/tasks', task.id, 'edit']);
  }

  onDelete(id: string): void {
    this.taskService.deleteTask(id).subscribe(() => {
      this.refresh.update((v) => v + 1);
    });
  }

  prevPage(): void {
    this.currentPage.update((p) => p - 1);
  }

  nextPage(): void {
    this.currentPage.update((p) => p + 1);
  }
}
