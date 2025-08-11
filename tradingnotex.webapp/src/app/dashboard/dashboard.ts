import { Component, OnInit } from '@angular/core';
import { TradeService } from '../services/trade.service';
import { NgIf, NgFor, CurrencyPipe, DatePipe, NgClass } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [NgIf, NgFor, CurrencyPipe, DatePipe, NgClass],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  kpis: any = {};
  trades: any[] = [];
  loading = false;

  constructor(private tradeService: TradeService) {}

  ngOnInit() {
    this.loadKPIs();
    this.loadTrades();
  }

  loadKPIs() {
    this.loading = true;
    this.tradeService.getKPIs().subscribe({
      next: (data) => {
        this.kpis = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar KPIs', error);
        this.loading = false;
      }
    });
  }

  loadTrades() {
    this.loading = true;
    this.tradeService.list().subscribe({
      next: (data) => {
        this.trades = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar trades', error);
        this.loading = false;
      }
    });
  }
}
