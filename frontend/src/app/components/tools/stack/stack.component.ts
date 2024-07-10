import {Component} from '@angular/core';
import {WorkspaceTreeNode} from "../../../model/workspace-tree-node";
import {WorkspacesService} from "../../../services/workspaces.service";
import {StatusService} from "../../../services/status.service";
import {PlotlyDataLayoutConfig} from "plotly.js";
import {AbstractPlotlyTool} from "../abstract-plotly-tool";

@Component({
  selector: 'app-stack',
  templateUrl: './stack.component.html',
  styleUrls: ['./stack.component.scss']
})
export class StackComponent extends AbstractPlotlyTool{
  private failureSet: string[] = [];
  private testKey?: string;

  selectedPrioritizations: WorkspaceTreeNode[] = []
  public override graph = {
    data: <any>[],
    layout: {
      height: 0,
      width: 0,
      showlegend: true,
      hovermode: 'x',
      hoverdistance: '0.0002',
      legend: {"orientation": "h"},
      xaxis: {
        title: "Test suite execution (%)"
      },
      yaxis: {
          title: "Prioritizations",
          visible: false,
      },
      margin: {l: 50, t: 0, r: 0, b: 50, pad: 0},
      annotations: <any>[]
    },
  };
  private prioritizationToColorMap: any = {};


  constructor(private workspaceService: WorkspacesService, private statusService: StatusService) {
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

  handleTestKeyChange($event: string) {
    this.testKey = $event;
    this.redrawPlot();
  }

  private redrawPlot() {
    let task = this.statusService.createTask("Plotting...")
    if (this.selectedPrioritizations.length > 0) {
      this.graph.data = [];
      this.graph.layout.annotations = []
      let yCursor = 0;
      let failedTestsDisplayedInLegend = false;
      let passedTestsDisplayedInLegend = false;
      let markers: any[] = []
      this.selectedPrioritizations.forEach((eachPrioritization) => {
        this.graph.layout.annotations.push({
          type: 'rect',
          xref: 'x',
          showarrow: false,
          yref: 'y',
          x: -0.02,
          y: yCursor,
          text: "●",
          font: {color: `rgb(${this.prioritizationToColorMap[eachPrioritization.path!].r}, ${this.prioritizationToColorMap[eachPrioritization.path!].g}, ${this.prioritizationToColorMap[eachPrioritization.path!].b})`, size: 24}
        })
        let sort = eachPrioritization.loadedSort!;
        let testsInTrace = 1
        let lastResult: 'passed' | 'failed' = this.failureSet.includes(eachPrioritization.loadedSort![0]) ? "failed" : "passed";
        let prevPlotPoint = 0;
        let displayedFailureMarkers: string[] = [];
        for (let i = 1; i < sort.length + 1; i++) {
          let currentTest = sort[i];
          let currentResult: 'passed' | 'failed' = this.failureSet.includes(currentTest) ? "failed" : "passed";


          if (lastResult != currentResult || i == (sort.length - 1)) {
            this.graph.data.push({
              x: [prevPlotPoint, i / sort.length],
              y: [yCursor, yCursor],
              showlegend: ((!failedTestsDisplayedInLegend && lastResult == "failed") || (!passedTestsDisplayedInLegend && lastResult == "passed")),
              type: 'scatter',
              line: {color: lastResult == "failed" ? "#ff0000" : "#00aaff", width: 20},
              mode: 'lines',
              name: lastResult == "failed" ? "Failed" : "Passed",
              text: testsInTrace > 1 ? testsInTrace + " tests" : 1 + " test"
            })
            if (lastResult == "failed") {
              failedTestsDisplayedInLegend = true
            } else if (lastResult == "passed") {
              passedTestsDisplayedInLegend = true;
            }
            prevPlotPoint = i / sort.length;
            testsInTrace = 1
          } else {
            testsInTrace++;
            if (i == sort.length - 1) {
              this.graph.data.push({
                x: [prevPlotPoint, i / sort.length],
                y: [yCursor, yCursor],
                showlegend: ((!failedTestsDisplayedInLegend && lastResult == "failed") || (!passedTestsDisplayedInLegend && lastResult == "passed")),
                type: 'scatter',
                line: {color: lastResult == "failed" ? "#ff0000" : "#00aaff", width: 20},
                mode: 'lines',
                name: lastResult == "failed" ? "Failed" : "Passed",
                text: testsInTrace > 1 ? testsInTrace + " tests" : 1 + " test"
              })
            }
          }
          if (lastResult == 'failed' && !displayedFailureMarkers.includes(sort[i - 1])) {
            displayedFailureMarkers.push(sort[i - 1])
            markers.push({
              x: [i / sort.length, i / sort.length],
              y: [yCursor, yCursor],
              type: 'scatter',
              marker: {color: "#9d0000", symbol: "x" },
              mode: 'markers',
              name: "Test " + sort[i - 1] + " failed",
              text: "Test " + sort[i - 1] + " failed",
              showlegend: false,
            })
          }

          lastResult = currentResult;
        }
        yCursor++;
      })
      this.graph.data = [...this.graph.data, ...markers]
    }

    this.statusService.clearTask(task)
  }

  handleColorChange($event: any) {
    this.prioritizationToColorMap = $event;
    this.redrawPlot();
  }
}
