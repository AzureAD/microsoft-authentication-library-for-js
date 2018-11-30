import { Routes } from '@angular/router';
import { HomeComponent} from './home.component'
import { ErrorComponent} from './error.component'
import {MsalGuard} from "../../../../dist";
import {MsGraphComponent} from "./msGraph.component";
import {TodoListComponent} from "./todo-list/todo-list.component";
import {UserDataComponent} from "./user-data/user-data.component";


export const appRoutes: Routes = [
  { path: 'home', component: HomeComponent  },
  { path: 'todoList', component: TodoListComponent , canActivate : [MsalGuard] },
  { path: 'myCalendar' ,component: MsGraphComponent, canActivate : [MsalGuard]},
  { path: 'userData' ,component: UserDataComponent},

  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', component: ErrorComponent }
];
