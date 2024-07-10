import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DoCheck,
  ElementRef, EventEmitter,
  OnInit, QueryList,
  ViewChildren
} from '@angular/core';
import {WorkspaceTreeNode} from "../../../model/workspace-tree-node";
import {AbstractPlotlyTool} from "../abstract-plotly-tool";
import 'zone.js/dist/long-stack-trace-zone';
import {PrioritizationDropzoneComponent} from "../../prioritization-dropzone/prioritization-dropzone.component";
import {BehaviorSubject, debounce, debounceTime} from "rxjs";
import {StatusService} from "../../../services/status.service";

@Component({
  selector: 'app-metric-box-plot',
  templateUrl: './metric-box-plot.component.html',
  styleUrls: ['./metric-box-plot.component.scss'],
})
export class MetricBoxPlotComponent extends AbstractPlotlyTool implements OnInit {

  @ViewChildren("dropzone")
  public dropzoneComponents?: QueryList<PrioritizationDropzoneComponent>;
  public displayDataOverlay: boolean = true;
  public renameGroupPlotBehaviourSubject: EventEmitter<void> = new EventEmitter();
  constructor(private statusService: StatusService) {
    super();
    this.graph.layout.xaxis = {title: "Group"}
    this.graph.layout.yaxis = {title: "Metrics", range: [0,1]}
  }

  public dropzones: any[] = [{
    key: crypto.randomUUID(),
    selection: [],
    groupName: "Group 0"
  }]

  ngOnInit(): void {
    this.graph.layout.margin = {l: 50, t: 0, r: 0, b: 50, pad: 0};
    this.graph.layout.showlegend = false;
    this.renameGroupPlotBehaviourSubject.pipe(debounceTime(200)).subscribe(() => {
      this.plot()
    })
  }

  onSelectionChange(event: WorkspaceTreeNode[], i: number) {
    if (event.length > 0) {
        this.dropzones[i].selection = event
        if (/^(Group [0-9]*)$/.test(this.dropzones[i].groupName)) {
            this.dropzones[i].groupName = event[0].name
        }
        this.dropzones = this.dropzones.filter((eachDropzone) => eachDropzone.selection.length != 0)
        if (this.dropzones.length == 0 || this.dropzones[this.dropzones.length - 1].length != 0) {
            this.dropzones.push({
                key: crypto.randomUUID(),
                selection: [],
                groupName: `Group ${i+1}`
            });
        }
        this.plot();
    }
  }

  trackByKey(index: number, data: any) {
    return data.key
  }

  private plot() {
    let traces = this.dropzones.map((eachDropZone, index) => {
      return {
        name: eachDropZone.groupName,
        type: 'box',
        marker: {
          color: 'rgb(0,0,0)'
        },
        y: eachDropZone.selection.map((eachNode: WorkspaceTreeNode) => eachNode.autc ? eachNode.autc : eachNode.apfd)
      }
    });
    this.graph.data = traces;
  }

  openDropzone() {
    this.displayDataOverlay = true;
  }

  openDropzoneForGroup(groupIndex: number) {
    this.dropzoneComponents?.filter((value, i) =>
      i == groupIndex
    )[0].open();
  }

  debouncedPlot() {

  }
}
