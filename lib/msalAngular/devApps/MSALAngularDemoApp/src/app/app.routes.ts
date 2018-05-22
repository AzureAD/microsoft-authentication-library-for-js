import { Routes } from '@angular/router';
import { HomeComponent} from './home.component'
import { ProductComponent} from './product.component'
import { ErrorComponent} from './error.component'
import { ProductDetailComponent} from './product-detail.component';
import {MsalGuard} from "../../../../dist";
import {MyProfileComponent} from "./myProfile.component";
import {TodoListComponent} from "./todo-list/todo-list.component";

export const appRoutes: Routes = [
  { path: 'home', component: HomeComponent  },
  { path: 'todoList', component: TodoListComponent , canActivate : [MsalGuard] },
  { path: 'product', component: ProductComponent,canActivate : [MsalGuard],
    children: [
      { path: 'detail/:id', component: ProductDetailComponent  }
    ]
   },
  { path: 'myProfile' ,component: MyProfileComponent, canActivate : [MsalGuard]},
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', component: ErrorComponent }
];




