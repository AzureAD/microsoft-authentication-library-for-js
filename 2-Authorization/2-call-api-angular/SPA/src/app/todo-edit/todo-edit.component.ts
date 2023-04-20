import { TodoService } from './../todo.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ToDo } from '../todo';

@Component({
    selector: 'app-todo-edit',
    templateUrl: './todo-edit.component.html',
    styleUrls: ['./todo-edit.component.css']
})
export class TodoEditComponent implements OnInit {

    toDo: ToDo = {
        id: 1,
        description: "undefined",
    };

    constructor(private route: ActivatedRoute, private router: Router, private service: TodoService) { }

    ngOnInit(): void {
        this.route.paramMap.subscribe((params: any) => {
            let id = +params.get('id')!;
            this.service.getTodo(+id).subscribe((response: ToDo) => {
                this.toDo = response;
            })
        })
    }

    editTodo(toDo: ToDo): void {
        this.toDo.description = toDo.description;
        this.service.editTodo(this.toDo).subscribe(() => {
            this.router.navigate(['/todo-view']);
        })
    }

}
