import {Injectable} from '@angular/core';
import {BehaviorSubject} from "rxjs";
import {StatusTask} from "../model/statusTask";

@Injectable({
    providedIn: 'root'
})
export class StatusService {

    taskListBehaviourSubject: BehaviorSubject<StatusTask[]> = new BehaviorSubject<StatusTask[]>([]);

    public createTask(label: string) {
        let task = new StatusTask(crypto.randomUUID(), label);
        let tasks = this.taskListBehaviourSubject.getValue();
        tasks.push(task);
        this.taskListBehaviourSubject.next(tasks);
        return task;
    }

    public clearTask(task: StatusTask) {
        let tasks = this.taskListBehaviourSubject.getValue();
        tasks = tasks.filter((eachTask) =>
            eachTask.id != task.id
        );
        this.taskListBehaviourSubject.next(tasks);
    }

    constructor() {
    }
}
