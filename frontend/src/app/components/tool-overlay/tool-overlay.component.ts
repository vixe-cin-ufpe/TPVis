import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-tool-overlay',
  templateUrl: './tool-overlay.component.html',
  styleUrls: ['./tool-overlay.component.scss']
})
export class ToolOverlayComponent {
  @Output()
  closeEvent: EventEmitter<void> = new EventEmitter();

  @Input()
  title: string = "Select...";

}
