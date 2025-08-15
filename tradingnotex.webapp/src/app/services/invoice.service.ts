import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

// invoice.service.ts
@Injectable({ providedIn: 'root' })
export class InvoiceService {
  constructor(private http: HttpClient) {}

  getInvoices(customerId: string): Observable<any[]> {
    return this.http.get<any[]>(`/api/billing/invoices/${customerId}`);
  }
}
