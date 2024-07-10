import {EventEmitter, Injectable} from '@angular/core';
import {WorkspaceTreeNode} from "../model/workspace-tree-node";
import {BehaviorSubject} from "rxjs";
import {GlobalDropType} from "../model/global-drop-type";

@Injectable({
  providedIn: 'root'
})
export class NodeDndService {

  selectedElements: BehaviorSubject<WorkspaceTreeNode[]> = new BehaviorSubject<WorkspaceTreeNode[]>([])
  dndBehaviour: BehaviorSubject<string> = new BehaviorSubject("ALL");
  globalDropEmitter: EventEmitter<GlobalDropType> = new EventEmitter<GlobalDropType>();

  constructor() {
  }

}
