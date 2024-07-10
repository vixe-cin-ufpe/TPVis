import {Component} from '@angular/core';
import {AbstractPlotlyTool} from "../abstract-plotly-tool";
import {WorkspacesService} from "../../../services/workspaces.service";
import tableu20 from "../../../utils/colorways";
import {WorkspaceTreeNode} from "../../../model/workspace-tree-node";
import {lastValueFrom} from "rxjs";
import * as reorder from 'reorder.js'
import {interpolateColor, interpolateColorAsRGB} from "../../../utils/metric-color";

@Component({
  selector: 'app-metric-evolution-heatmap',
  templateUrl: './metric-evolution-heatmap.component.html',
  styleUrls: ['./metric-evolution-heatmap.component.scss']
})
export class MetricEvolutionHeatmapComponent extends AbstractPlotlyTool {
  constructor(private workspaceService: WorkspacesService) {
    super();
    this.graph.layout.margin = {l: 140, t: 0, r: 0, b: 45, pad: 0};
    this.graph.layout.colorway = tableu20;
  }

  async handleSubjectChange($event: WorkspaceTreeNode[]) {
    if ($event.length == 0) {
      this.graph.data = []
      return
    }
    let x: string[] = []
    let algorithms: string[] = [];
    let orderedSubjectList: WorkspaceTreeNode[] = JSON.parse(JSON.stringify($event))
    orderedSubjectList.sort((a, b) => a.buildNumber! - b.buildNumber!);
    for (const eachSubject of orderedSubjectList) {
      await lastValueFrom(this.workspaceService.getTestSet(this.workspaceService.$currentWorkSpace.getValue()!.name!, eachSubject.testSetPath!))
      x.push(eachSubject.name)
      eachSubject.data?.forEach(eachChildNode => {
        if (!algorithms.includes(eachChildNode.name)) {
          algorithms.push(eachChildNode.name)
        }
      })
    }

    let algorithmAverage: any = {} //avg across subjects
    let algorithmAverages: any = {} //avg in each subject

    algorithms.forEach((eachAlgorithmName: string) => {
      let averagesForAlgorithm = []
      let metricSum = 0;
      for (let i = 0; i < orderedSubjectList.length; i++) {
        let eachSubject = orderedSubjectList[i];
        for (let j = 0; j < eachSubject.data!.length; j++) {
          let possibleAlgorithm = eachSubject.data![j];
          if (possibleAlgorithm.name == eachAlgorithmName) {
            averagesForAlgorithm.push(possibleAlgorithm.averageMetric);
            metricSum += possibleAlgorithm.averageMetric!;
          }
        }
      }
      algorithmAverage[eachAlgorithmName] = metricSum / orderedSubjectList.length;
      algorithmAverages[eachAlgorithmName] = averagesForAlgorithm;
    })

    let trace: any =
      {
        z: algorithms.map((eachAlgorithm) => algorithmAverages[eachAlgorithm]),
        x,
        y: algorithms,
        type: 'heatmap',
        hoverongaps: false,
        zmin: 0,
        zmax: 1,
        colorscale: [
          [0, interpolateColorAsRGB(0)],
          [0.0999, interpolateColorAsRGB(0)],
          [0.1, interpolateColorAsRGB(0.1)],
          [0.1999999, interpolateColorAsRGB(0.1)],
          [0.2, interpolateColorAsRGB(0.2)],
          [0.299999, interpolateColorAsRGB(0.2)],
          [0.3, interpolateColorAsRGB(0.3)],
          [0.399999, interpolateColorAsRGB(0.3)],
          [0.4, interpolateColorAsRGB(0.4)],
          [0.499999, interpolateColorAsRGB(0.4)],
          [0.5, interpolateColorAsRGB(0.5)],
          [0.599999, interpolateColorAsRGB(0.5)],
          [0.6, interpolateColorAsRGB(0.6)],
          [0.699999, interpolateColorAsRGB(0.6)],
          [0.7, interpolateColorAsRGB(0.7)],
          [0.799999, interpolateColorAsRGB(0.7)],
          [0.8, interpolateColorAsRGB(0.8)],
          [0.899999, interpolateColorAsRGB(0.8)],
          [0.9, interpolateColorAsRGB(0.9)],
          [0.999999, interpolateColorAsRGB(0.9)],
          [1, interpolateColorAsRGB(1)]
        ]
      }

    let optimalSort = reorder.optimal_leaf_order().reorder(trace.z)
    trace.z = optimalSort.map((index) => trace.z[index])
    trace.y = optimalSort.map((index) => trace.y[index])

    this.graph.data = [trace]
  }


}
