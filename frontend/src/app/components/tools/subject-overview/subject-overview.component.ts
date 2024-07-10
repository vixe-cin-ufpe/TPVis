import {Component} from '@angular/core';
import {AbstractPlotlyTool} from "../abstract-plotly-tool";
import {WorkspaceTreeNode} from "../../../model/workspace-tree-node";
import {WorkspacesService} from "../../../services/workspaces.service";
import {lastValueFrom} from "rxjs";

@Component({
  selector: 'app-subject-overview',
  templateUrl: './subject-overview.component.html',
  styleUrls: ['./subject-overview.component.scss']
})
export class SubjectOverviewComponent extends AbstractPlotlyTool {


  constructor(private workspaceService: WorkspacesService) {
    super();
    this.graph.layout.xaxis = {
      title: "Test Count"
    }
    this.graph.layout.margin = {l: 55, t: 20, r: 0, b: 50, pad: 0};
  }

  async handleSubjectChange($event: WorkspaceTreeNode[]) {
    let y: string[] = []
    let xPassed: number[] = []
    let xFailures: number[] = []
    let orderedSubjectList: WorkspaceTreeNode[] = JSON.parse(JSON.stringify($event))
    orderedSubjectList.sort((a, b) => a.buildNumber! - b.buildNumber!);

    for (const eachSubject of orderedSubjectList) {
      let testSet = await lastValueFrom(this.workspaceService.getTestSet(this.workspaceService.$currentWorkSpace.getValue()!.name!, eachSubject.testSetPath!))
      y.push(eachSubject.name)
      xPassed.push(testSet.length - eachSubject.failures!.length)
      xFailures.push(eachSubject.failures!.length)
    }

    let passedTrace = {
      y,
      x: xPassed,
      name: 'Passed',
      type: 'bar',
      marker:{
        color: '#00aaff'
      },
      orientation: 'h'
    }
    let failedTrace = {
      y,
      x: xFailures,
      name: 'Failed',
      type: 'bar',
      marker:{
        color: '#ff0000'
      },
      orientation: 'h'
    }

    this.graph.data = [passedTrace, failedTrace]
    this.graph.layout.barmode = 'stack'
  }
}
