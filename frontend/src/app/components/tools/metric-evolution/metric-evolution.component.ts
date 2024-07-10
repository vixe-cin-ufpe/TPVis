import { Component } from '@angular/core';
import {AbstractPlotlyTool} from "../abstract-plotly-tool";
import {WorkspacesService} from "../../../services/workspaces.service";
import {WorkspaceTreeNode} from "../../../model/workspace-tree-node";
import {lastValueFrom} from "rxjs";
import tableu20 from "../../../utils/colorways";

@Component({
  selector: 'app-metric-evolution',
  templateUrl: './metric-evolution.component.html',
  styleUrls: ['./metric-evolution.component.scss']
})
export class MetricEvolutionComponent extends AbstractPlotlyTool {
  constructor(private workspaceService: WorkspacesService) {
    super();
    this.graph.layout.yaxis = {
      title: "Avg. " + this.workspaceService.$currentWorkSpace.getValue()!.metrics![0]
    }
    this.graph.layout.margin = {l: 50, t: 0, r: 0, b: 50, pad: 0};
    this.graph.layout.colorway = tableu20;
  }

  async handleSubjectChange($event: WorkspaceTreeNode[]) {
    let x: string[] = []
    let traces: any[] = [];
    let orderedSubjectList: WorkspaceTreeNode[] = JSON.parse(JSON.stringify($event))
    orderedSubjectList.sort((a, b) => a.buildNumber! - b.buildNumber!);
    for (const eachSubject of orderedSubjectList) {
      await lastValueFrom(this.workspaceService.getTestSet(this.workspaceService.$currentWorkSpace.getValue()!.name!, eachSubject.testSetPath!))
      x.push(eachSubject.name)
      eachSubject.data?.forEach(eachChildNode => {
        let tracesForAlgorithm = traces.filter((eachTrace) => eachTrace.name == eachChildNode.name)
        if (tracesForAlgorithm.length == 0) {
          traces.push({
            name: eachChildNode.name,
            type: 'lines+markers',
          })
        }
      })
    }

    traces.forEach((eachTrace) => {
      eachTrace.x = x;
      eachTrace.y = orderedSubjectList.map((eachSubject) => eachSubject.data?.filter((eachAlgorithm) => eachAlgorithm.name == eachTrace.name)[0].averageMetric)
    })

    this.graph.data = traces
  }


}
