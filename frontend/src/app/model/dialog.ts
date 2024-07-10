import {Subject} from "rxjs";

export class Dialog {
    public isPrompt: boolean;
    public title: string;
    public text: string;
    public response: Subject<boolean> = new Subject<boolean>();


    constructor(isPrompt: boolean, title: string, text: string) {
        this.isPrompt = isPrompt;
        this.title = title;
        this.text = text;
    }
}
