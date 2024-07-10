import {Component, Input} from '@angular/core';
import {interpolateColor} from "../../utils/metric-color";
import {toRgbString} from "../../model/color";

@Component({
  selector: 'app-metric-badge',
  templateUrl: './metric-badge.component.html',
  styleUrls: ['./metric-badge.component.scss']
})
export class MetricBadgeComponent {

  @Input()
  value!: number;

  protected readonly interpolateColor = interpolateColor;
  protected readonly toRgbString = toRgbString;
}
