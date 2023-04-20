import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToDo } from './todo';

import { protectedResources } from './auth-config';

@Injectable({
    providedIn: 'root'
})
export class TodoService {
    url = protectedResources.toDoListAPI.endpoint;

    constructor(private http: HttpClient) { }

    getTodos() {
        return this.http.get<ToDo[]>(this.url);
    }

    getTodo(id: number) {
        return this.http.get<ToDo>(this.url + '/' + id);
    }

    postTodo(toDo: ToDo) {
        return this.http.post<ToDo>(this.url, toDo);
    }

    deleteTodo(id: number) {
        return this.http.delete(this.url + '/' + id);
    }

    editTodo(toDo: ToDo) {
        return this.http.put<ToDo>(this.url + '/' + toDo.id, toDo);
    }
}
