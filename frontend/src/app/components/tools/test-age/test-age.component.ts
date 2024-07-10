import {Component} from '@angular/core';
import {AbstractPlotlyTool} from "../abstract-plotly-tool";
import {WorkspacesService} from "../../../services/workspaces.service";
import {WorkspaceTreeNode} from "../../../model/workspace-tree-node";
import {firstValueFrom, lastValueFrom} from "rxjs";

@Component({
  selector: 'app-test-age',
  templateUrl: './test-age.component.html',
  styleUrls: ['./test-age.component.scss']
})
export class TestAgeComponent extends AbstractPlotlyTool {
  private testKey?: string;


  constructor(private workspaceService: WorkspacesService) {
    super();
    this.graph.layout.yaxis = {
      title: "Failure Count"
    }
    this.graph.layout.xaxis = {
      title: "Creation Date"
    }
    this.graph.layout.colorway = ["rgba(0,0,0,.35)"]
    this.graph.layout.showlegend = false;
    // this.graph.layout.hovermode = 'x';
    this.graph.layout.margin = {l: 50, t: 0, r: 0, b: 45, pad: 0};
  }

  async handleSubjectChange($event: WorkspaceTreeNode[]) {
    let failureCounts: any = {}

    for (let i = 0; i < $event.length; i++) {

      let eachSubject = $event[i];
      let testSet = await firstValueFrom(this.workspaceService.getTestSet(this.workspaceService.$currentWorkSpace.getValue()!.name!, eachSubject.testSetPath!));
      eachSubject.failures!.forEach((eachFailedTest: string) => {
        if (Object.keys(failureCounts).includes(eachFailedTest.toString())) {
          failureCounts[eachFailedTest].failingSubjects.push(eachSubject.name)
        } else {
          let testsFound = testSet.filter((eachTest) => eachTest[this.testKey!] == eachFailedTest)
          if (testsFound.length > 0) {
            let timeStamp = testSet.filter((eachTest) => eachTest[this.testKey!] == eachFailedTest)[0].creationTime;
            failureCounts[eachFailedTest] = {
              failingSubjects: [eachSubject.name],
              testTimeStamp: timeStamp
            }
          } else {
            failureCounts[eachFailedTest] = {
              failingSubjects: [eachSubject.name],
              testTimeStamp: 0
            }
          }

        }
      })
    }

    let traces = []
    let objKeys = Object.keys(failureCounts)
    for (let i = 0; i < objKeys.length; i++) {
      traces.push({
        x: [failureCounts[objKeys[i]].testTimeStamp],
        y: [failureCounts[objKeys[i]].failingSubjects.length],
        name: objKeys[i],
        text: "Test: " + objKeys[i] + " - " + failureCounts[objKeys[i]].failingSubjects.join(", ").match(/(?:[^,]+(?:,|$)){1,4}/g).join("<br>")
      })
    }
    traces = traces.map((eachTrace) => {
      eachTrace.x = eachTrace.x.map(unix => new Date(unix * 1000))
      return eachTrace;
    })

    this.graph.data = traces
  }


  handleTestKeyChange($event: string) {
    this.testKey = $event;
  }

}
