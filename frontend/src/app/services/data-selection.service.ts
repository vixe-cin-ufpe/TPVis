import { Injectable } from '@angular/core';
import {BehaviorSubject} from "rxjs";
import {ToolSelectionEvent} from "../model/tool-selection-event";

@Injectable({
  providedIn: 'root'
})
export class DataSelectionService {

  private selectedPrioritizations: BehaviorSubject<ToolSelectionEvent|undefined> = new BehaviorSubject<ToolSelectionEvent|undefined>(undefined);
  public colorOption: BehaviorSubject<"global" | "metric" | "parent"> = new BehaviorSubject<"global" | "metric" | "parent">("global");

  constructor() { }

  public updateSelectedPrioritizationsByPlotlyEvent(authorToolUUID: string, $event: any) {
    if ($event == undefined || $event.points == undefined || $event.points.length == 0) {
      this.selectedPrioritizations.next(undefined)
    } else {
      let prioritizationPaths = $event.points[0].data.prioritizationPath;
      this.selectedPrioritizations.next(new ToolSelectionEvent(authorToolUUID, $event.points.map((eachPointSelected: any) => prioritizationPaths[eachPointSelected.pointIndex])));
    }
  }

  public getSelectedPrioritizationsObservable() {
    return this.selectedPrioritizations.asObservable();
  }

}
