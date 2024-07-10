import {Component, OnInit} from '@angular/core';
import {WorkspaceTreeNode} from "../../../model/workspace-tree-node";
import {WorkspacesService} from "../../../services/workspaces.service";
import {AbstractPlotlyTool} from "../abstract-plotly-tool";
import {toRgbString} from "../../../model/color";
import {DataSelectionService} from "../../../services/data-selection.service";

@Component({
  selector: 'app-autc',
  templateUrl: './autc.component.html',
  styleUrls: ['./autc.component.scss']
})
export class AutcComponent extends AbstractPlotlyTool {
  private failureSet: string[] = [];
  private testKey?: string;
  selectedPrioritizations: WorkspaceTreeNode[] = []
  prioritizationToColorMap: any = [];

  constructor(private dataSelectionService: DataSelectionService) {
    super();
  }

  public override graph: any = {
    data: [],
    layout: {
      height: 0,
      showlegend: false,
      margin: {l: 50, t: 0, r: 0, b: 50, pad: 0},
      xaxis: {title: "Test execution (%)"},
      yaxis: {title: "Faults detected (%)"},
      width: 0
    }
  };

  handleSelectedPrioritizationChange($event: WorkspaceTreeNode[]) {
    this.selectedPrioritizations = $event;
    this.redrawPlot();
  }

  private redrawPlot() {
    let data: any[] = []
    this.selectedPrioritizations.forEach((eachPrioritization) => {
      let execution = eachPrioritization.loadedSort;
      let x: number[] = [0]
      let y: number[] = [0]
      let failuresFound = 0;
      for (let i = 0; i < execution!.length; i++) {
        x.push(i / execution!.length);
        if (this.failureSet!.includes(execution![i])) {
          failuresFound = failuresFound + 1;
        }
        y.push(failuresFound / this.failureSet!.length);
      }

      data.push({
        x, y, type: 'scatter', mode: 'lines', name: eachPrioritization.treePath, line: {
          color: toRgbString(this.prioritizationToColorMap[eachPrioritization.path!]),
          width: 3
        }, prioritizationPath: eachPrioritization.path
      })
    })

    this.graph.data = data;
  }

  handleFailureSetChange(failureSet: string[]) {
    this.failureSet = failureSet;
    this.redrawPlot();
  }

  handleTestKeyChange($event: string) {
    this.testKey = $event;
    this.redrawPlot();
  }

  handleColorChange($event: any) {
    this.prioritizationToColorMap = $event;
    this.redrawPlot();
  }

}
