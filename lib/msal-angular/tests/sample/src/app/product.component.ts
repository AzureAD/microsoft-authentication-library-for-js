import { Component, OnInit } from '@angular/core';
import { ProductService } from './product.service';
import { Product } from './product';
import {BroadcastService, MsalService} from "../../../../dist";

@Component({
  templateUrl: './product.component.html',
})

export class ProductComponent
{

  products:Product[];

   constructor(private productService:ProductService, private broadcastService: BroadcastService, private authService: MsalService){
   }


   ngOnInit() {
     this.products=this.productService.getProducts();

     this.broadcastService.subscribe("msal:acquireTokenSuccess", (payload) => {
     });

     this.broadcastService.subscribe("msal:acquireTokenFailure", (payload) => {
     });

   }




}
