import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-chart',
  template: '',
  standalone: true
})
export class Chart implements OnInit, OnChanges {
  @Input() data: any;
  @Input() type: string = 'line';

  constructor() { }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
  }
}
