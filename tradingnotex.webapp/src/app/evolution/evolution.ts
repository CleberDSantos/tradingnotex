import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor, NgClass, JsonPipe, CurrencyPipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-evolution',
  imports: [FormsModule, NgIf, NgFor, NgClass, JsonPipe, CurrencyPipe, DecimalPipe],
  templateUrl: './evolution.html',
  styleUrl: './evolution.scss'
})
export class EvolutionComponent {
  @Input() data: any;

  constructor() {}
}
