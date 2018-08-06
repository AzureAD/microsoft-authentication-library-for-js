import { Routes } from '@angular/router';
import { HomeComponent} from './home/home.component'
import { ProductComponent} from './product/product.component'
import { ErrorComponent} from './error.component'
import { ProductDetailComponent} from './product/product-detail.component';
import {MsalGuard} from "@azure/msal-angular";
import {TodoListComponent} from "./todo-list/todo-list.component";
import {UserDataComponent} from "./user-data/user-data.component";

export const appRoutes: Routes = [
  { path: 'home', component: HomeComponent  },
  { path: 'todoList', component: TodoListComponent , canActivate : [MsalGuard] },
  { path: 'product', component: ProductComponent,canActivate : [MsalGuard],
    children: [
      { path: 'detail/:id', component: ProductDetailComponent  }
    ]
   },
  { path: 'userProfile' ,component: UserDataComponent, canActivate : [MsalGuard]},
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', component: ErrorComponent }
];




