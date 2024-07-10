import { Injectable } from '@angular/core';
import {BehaviorSubject, debounce, map, Observable, switchMap, timer} from "rxjs";
import {Workspace} from "../model/workspace";
import {HttpClient} from "@angular/common/http";
import {StatusService} from "./status.service";
import {WorkspaceTreeNode} from "../model/workspace-tree-node";
import {environment} from "../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class  WorkspacesService {

  apiURL = environment.baseUrl;
  $currentWorkSpace: BehaviorSubject<Workspace|undefined> = new BehaviorSubject<Workspace|undefined>(undefined);
  $prioritizationColorChangeEvent: BehaviorSubject<string> = new BehaviorSubject<string>("");


  constructor(private http: HttpClient, private statusService: StatusService) {
    this.$currentWorkSpace.pipe(debounce(() => timer(10000))).subscribe((workspace) => {
      let task = this.statusService.createTask("Saving workspace...")
      this.saveWorkspace().subscribe(() => {
        this.statusService.clearTask(task)
      })
    })
    setInterval(() => {
      this.saveWorkspace().subscribe(() => {
        console.log("workspace saved")
      })
    }, 120000)
  }


  getWorkspace(name: string): Observable<Workspace> {
    return this.http
      .get<Workspace>(this.apiURL + 'workspaces/' + name);
  }

  saveWorkspace(): Observable<Workspace> {
    let workspace =  this.$currentWorkSpace.getValue();
    if (workspace) {
      return this.http
        .put<Workspace>(this.apiURL + 'workspaces/' + workspace?.name, workspace);
    }
    return new Observable<Workspace>();
  }

  getPrioritizationFromTree(workspace: Workspace, uuid: string) {
    for(let i =0; i<workspace.data!.length; i++) {
      let result = this.searchForWorkspaceTreeNode(workspace.data![i],'prioritization', uuid);
      if (result != null) {
        return result;
      }
    }
    return null;
  }

  getSubjectFromTree(workspace: Workspace, uuid: string) {
    for(let i =0; i<workspace.data!.length; i++) {
      let result = this.searchForWorkspaceTreeNode(workspace.data![i],'subject', uuid);
      if (result != null) {
        return result;
      }
    }
    return null;
  }

  private searchForWorkspaceTreeNode(element: WorkspaceTreeNode, type: 'prioritization'|'subject', uuid: string): WorkspaceTreeNode|null{
    if(element.path == uuid && type == "prioritization"){
      return element;
    }if(element.testSetPath == uuid && type == "subject"){
      return element;
    }else if (element.data != null){
      let i;
      let result = null;
      for(i=0; result == null && i < element.data.length; i++){
        result = this.searchForWorkspaceTreeNode(element.data[i],type, uuid);
      }
      return result;
    }
    return null;
  }



  getPrioritizationSort(name: string, uuid: string): Observable<string[]> {
    return this.http
      .get<string[]>(this.apiURL + 'workspaces/' + name + "/prioritizations/" + uuid);
  }

  getTestSet(name: string, uuid: string): Observable<any[]> {
    return this.http
      .get<string[]>(this.apiURL + 'workspaces/' + name + "/testset/" + uuid);
  }

  getCallGraph(name: string, uuid: string):Observable<string> {
      return this.http
          .get(this.apiURL + 'workspaces/'+name+'/call-graphs/'+uuid, {  responseType: 'text'})
  }

}
