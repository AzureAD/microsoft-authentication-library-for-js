import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

import { TodoService } from './../todo.service';
import { Todo } from '../todo';

@Component({
    selector: 'app-todo-view',
    templateUrl: './todo-view.component.html',
    styleUrls: ['./todo-view.component.css']
})
export class TodoViewComponent implements OnInit {

    todo?: Todo;

    todos: Todo[] = [];

    displayedColumns = ['status', 'description', 'edit', 'remove'];

    constructor(private service: TodoService) { }

    ngOnInit(): void {
        this.getTodos();
    }

    getTodos(): void {
        this.service.getTodos()
            .subscribe((todos: Todo[]) => {
                this.todos = todos;
            });
    }

    addTodo(add: NgForm): void {
        this.service.postTodo(add.value).subscribe(() => {
            this.getTodos();
        })
        add.resetForm();
    }

    checkTodo(todo: Todo): void {
        this.service.editTodo(todo).subscribe();
    }

    removeTodo(id: string): void {
        this.service.deleteTodo(+id).subscribe(() => {
            this.getTodos();
        })
    }
}
