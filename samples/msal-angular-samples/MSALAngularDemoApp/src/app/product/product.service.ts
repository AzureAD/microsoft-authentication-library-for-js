import {Product} from './Product'
import {HttpClient} from "@angular/common/http";
import {Injectable} from "@angular/core";

@Injectable()
export class ProductService {

  constructor(private http: HttpClient) {
  }

  public getProducts() {
    let products: Product[];
    products = [
      new Product(1, 'Memory Card', 500),
      new Product(2, 'Pen Drive', 750),
      new Product(3, 'Power Bank', 100)
    ]
    return products;
  }


  public getProduct(id) {
    let products: Product[] = this.getProducts();
    return products.find(p => p.productID == id);
  }

}
