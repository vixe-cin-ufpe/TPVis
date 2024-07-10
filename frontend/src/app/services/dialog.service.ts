import { Injectable } from '@angular/core';
import {BehaviorSubject} from "rxjs";
import {Dialog} from "../model/dialog";

@Injectable({
  providedIn: 'root'
})
export class DialogService {

  public dialogs: BehaviorSubject<Dialog[]> = new BehaviorSubject<Dialog[]>([]);

  constructor() { }

    process(dialog: Dialog, response: boolean) {
        dialog.response.next(response);
        let dialogList = this.dialogs.getValue();
        dialogList = dialogList.filter((eachDialog) => eachDialog != dialog);
        this.dialogs.next(dialogList);
    }

    createDialog(dialog: Dialog) {
        let dialogList = this.dialogs.getValue();
        dialogList.push(dialog);
        this.dialogs.next(dialogList);
    }

    processAll(response: boolean) {
        this.dialogs.getValue().forEach((eachDialog) => {
            eachDialog.response.next(response);
        })
        this.dialogs.next([]);
    }
}
