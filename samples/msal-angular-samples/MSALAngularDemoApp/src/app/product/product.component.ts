import { Component, OnInit } from '@angular/core';
import { ProductService } from './product.service';
import { Product } from './product';
import {BroadcastService} from "@azure/msal-angular";
import { MsalService} from "@azure/msal-angular";

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
