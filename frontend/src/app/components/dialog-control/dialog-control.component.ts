import {Component, OnInit} from '@angular/core';
import {DialogService} from "../../services/dialog.service";
import {Dialog} from "../../model/dialog";

@Component({
  selector: 'app-dialog-control',
  templateUrl: './dialog-control.component.html',
  styleUrls: ['./dialog-control.component.scss']
})
export class DialogControlComponent implements OnInit{
    public dialogs: Dialog[] = [];


    constructor(public dialogService: DialogService) {
    }

    ngOnInit(): void {
        this.dialogService.dialogs.subscribe((newDialogs) => {
            this.dialogs = newDialogs;
        })
    }

}
