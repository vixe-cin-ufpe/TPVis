import { Component } from '@angular/core';
import {WorkspaceTreeNode} from "../../../model/workspace-tree-node";
import {WorkspacesService} from "../../../services/workspaces.service";
import {StatusService} from "../../../services/status.service";
import {PlotlyDataLayoutConfig} from "plotly.js";
import {AbstractPlotlyTool} from "../abstract-plotly-tool";

@Component({
  selector: 'app-matrix',
  templateUrl: './matrix.component.html',
  styleUrls: ['./matrix.component.scss']
})
export class MatrixComponent extends AbstractPlotlyTool{
  private failureSet: string[] = [];

  selectedPrioritizations: WorkspaceTreeNode[] = []
  public override graph = {
    data: [
      { x: [0], y: [0], type: 'scatter', mode: 'lines' },
    ],
    layout: { height: 0, width: 0, showlegend: true, legend: {"orientation": "h", xanchor: "center", x: 0.5, y: 1}, margin:{l:50, t:0,r:0,b:50, pad: 0}}
  };


  constructor(private statusService: StatusService) {
    super();
  }

  handleSelectedPrioritizationChange($event: WorkspaceTreeNode[]) {
    this.selectedPrioritizations = $event;
    this.redrawPlot();
  }

  handleFailureSetChange(failureSet: string[]) {
    this.failureSet = failureSet;
    this.redrawPlot();
  }

  private redrawPlot() {
    let task = this.statusService.createTask("Plotting Matrix...");

    if (this.selectedPrioritizations.length < 2 || this.selectedPrioritizations[0].testSetPath != this.selectedPrioritizations[1].testSetPath) {
      this.graph.data = [];
      let layout = this.graph.layout as any;
      if (layout && layout.xaxis && layout.yaxis) {
        layout.xaxis!.color = undefined;
        layout.xaxis!.title = undefined;
        layout.yaxis!.color = undefined;
        layout.yaxis!.title = undefined;
      }
      this.statusService.clearTask(task)
      return;
    }

    let data: any[] = []
    let executionA = this.selectedPrioritizations[0].loadedSort!
    let executionB = this.selectedPrioritizations[1].loadedSort!

    let xPass: number[] = []
    let yPass: number[] = []
    let textPass: string[] = []
    let xFail: number[] = []
    let yFail: number[] = []
    let textFail: string[] = []
    executionA.forEach((eachTestInPrioritizationA, index) => {
      if (this.failureSet.includes(eachTestInPrioritizationA)) {
        xFail.push(index);
        yFail.push(executionB.indexOf(eachTestInPrioritizationA));
        textFail.push(eachTestInPrioritizationA);
      } else {
        xPass.push(index);
        yPass.push(executionB.indexOf(eachTestInPrioritizationA));
        textPass.push(eachTestInPrioritizationA);
      }
    })

    data.push({x: xPass, y: yPass, text: textPass, type: 'scatter', mode: 'markers', name: 'Passed tests', marker: {color: '#00aaff'}})
    data.push({x: xFail, y: yFail, text: textFail, type: 'scatter', mode: 'markers', name: 'Failing tests', marker: {color: '#ff0000'}})

    this.graph.data = data;

    (this.graph.layout as any).xaxis!.title = this.selectedPrioritizations[0].treePath;
    (this.graph.layout as any).yaxis!.title = this.selectedPrioritizations[1].treePath;
      this.statusService.clearTask(task)
  }
}
