import {Injectable} from '@angular/core';
import {Workspace} from "../model/workspace";
import {WorkspaceTreeNode} from "../model/workspace-tree-node";
import {WorkspacesService} from "./workspaces.service";
import {firstValueFrom, timer} from "rxjs";
import {StatusService} from "./status.service";
import {FailureVersion} from "../model/failure-version";

@Injectable({
    providedIn: 'root'
})
export class MetricsService {

    prioritizationReferenceMap: any = {}
    private workspace?: Workspace;

    constructor(private workspaceService: WorkspacesService, private statusService: StatusService) {
    }

    searchForSubjectsInTreeNode(treeNode: WorkspaceTreeNode, subjectsFound: WorkspaceTreeNode[]) {
        if (treeNode.type == "subject") {
            subjectsFound.push(treeNode)
        } else if (treeNode.type == "folder") {
            treeNode.data?.forEach((eachSubTreeNode) => {
                this.searchForSubjectsInTreeNode(eachSubTreeNode, subjectsFound)
            })
        }
    }

    searchForPrioritizationInTreeNode(treeNode: WorkspaceTreeNode, prioritizationFound: WorkspaceTreeNode[]) {
        if (treeNode.type == "prioritization") {
            prioritizationFound.push(treeNode)
        } else {
            treeNode.data?.forEach((eachSubTreeNode) => {
                this.searchForPrioritizationInTreeNode(eachSubTreeNode, prioritizationFound)
            })
        }
    }

    async evaluateWorkspaceMetrics(workspace: Workspace) {
        let task = this.statusService.createTask("Scanning for non-calculated metrics")
        this.workspace = workspace;
        let subjectsFound: WorkspaceTreeNode[] = []
        workspace.data?.forEach((eachTreeNode) => {
            if (eachTreeNode.type == "folder") {
                this.searchForSubjectsInTreeNode(eachTreeNode, subjectsFound);
            } else if (eachTreeNode.type == "subject") {
                subjectsFound.push(eachTreeNode)
            }
        });


        let metricQueue: {
            metric: "AUTC" | "APFD";
            failures?: string[];
            failureVersions?: FailureVersion[],
            prioritizationPath: string;
        }[] = [];
        subjectsFound.forEach((eachSubject) => {
            workspace.metrics?.forEach((eachRequiredMetric) => {
                if (eachRequiredMetric == "AUTC") {
                    eachSubject.data?.forEach(async eachPrioritization => {
                        if (eachPrioritization[<"autc" | "apfd">eachRequiredMetric.toLowerCase()] == undefined) {
                            this.prioritizationReferenceMap[eachPrioritization!.path!] = eachPrioritization
                            metricQueue.push({
                                metric: "AUTC",
                                failures: eachSubject.failures,
                                prioritizationPath: eachPrioritization.path!
                            })
                        }
                    })
                } else if (eachRequiredMetric == "APFD") {
                    let prioritizationsFound: WorkspaceTreeNode[] = []
                    this.searchForPrioritizationInTreeNode(eachSubject, prioritizationsFound)
                    prioritizationsFound.forEach(async eachPrioritization => {
                        if (eachPrioritization.apfd == undefined) {
                            this.prioritizationReferenceMap[eachPrioritization!.path!] = eachPrioritization
                            metricQueue.push({
                                metric: "APFD",
                                failures: eachSubject.failures,
                                prioritizationPath: eachPrioritization.path!
                            })
                        }
                    })
                }
            })
        })
        this.statusService.clearTask(task);
        task = this.statusService.createTask("Preparing to calculate metrics")

        let currentTask: number = 0;

        const worker = new Worker(new URL('../workers/AUTC-worker.worker.ts', import.meta.url));
        this.statusService.clearTask(task);
        let that = this;
        worker.onmessage = (message: any) => {
            this.statusService.clearTask(task)
            if (message.data.id.startsWith("metric_")) {
                let data = message.data;
                task = this.statusService.createTask("Calculating metrics (" + currentTask + "/" + metricQueue.length + ")")
                that.patchWorkspaceWithMetricResponse(data, metricQueue[currentTask].metric);
                currentTask = currentTask + 1
                if (currentTask < metricQueue.length) {
                    let task = metricQueue[currentTask]
                    if (task.metric == "AUTC") {
                        that.publishToAutcWorker(workspace, worker, metricQueue[currentTask])
                    } else if (task.metric == "APFD") {
                        that.publishToApfdWorker(workspace, worker, metricQueue[currentTask])
                    }
                } else {
                    this.executePostMetricCalculationActions()
                }
            }
        };
        if (metricQueue.length > 0) {
            let task = metricQueue[currentTask]
            if (task.metric == "AUTC") {
                await that.publishToAutcWorker(workspace, worker, task)
            } else if (task.metric == "APFD") {
                await that.publishToApfdWorker(workspace, worker, task)
            }
        } else {
            this.executePostMetricCalculationActions()
        }
    }

    async patchWorkspaceWithMetricResponse(data: any, metric: "AUTC" | "APFD") {
        let nodeFound = this.prioritizationReferenceMap[data.id.replaceAll("metric_", "")];
        nodeFound[metric.toLowerCase()] = data.results
        this.workspaceService.$currentWorkSpace.next(this.workspace);
    }


    private calculateAverageMetrics(root: WorkspaceTreeNode) {
        if (!root) return 0;
        if (!root.data || root.data.length == 0) {
            // no children, return numeric value of autc or apfd, or 0
            return parseFloat(root.autc?.toString() ?? root.apfd?.toString() ?? "0");
        }

        let total = 0;
        for (let child of root.data) {
            total += this.calculateAverageMetrics(child);
        }

        root.averageMetric = total / root.data.length;

        return root.averageMetric;
    }

    private sortTree(root: WorkspaceTreeNode) {
        if (!root || !root.data || root.data.length == 0) {
            return;
        }

        root.data.sort((a, b) => {
            // Use averageMetric for comparison if defined, otherwise use autc/apfd
            let metricA = a.averageMetric ?? parseFloat(a.autc?.toString() ?? a.apfd?.toString() ?? "0");
            let metricB = b.averageMetric ?? parseFloat(b.autc?.toString() ?? b.apfd?.toString() ?? "0");

            return metricB - metricA;
        });

        root.data.forEach((eachNode) => this.sortTree(eachNode));
    }


    async publishToAutcWorker(workspace: Workspace, worker: Worker, task: {
        metric?: string;
        failures?: string[];
        prioritizationPath: any;
    }) {
        let prioritization = await firstValueFrom(this.workspaceService.getPrioritizationSort(workspace.name!, task.prioritizationPath))
        let failures = task.failures
        worker.postMessage({
                id: "metric_" + task.prioritizationPath,
                python: `
            import numpy
            prioritization_length = len(prioritization)
            failures_length = len(failures)

            try:
              percentage_of_execution = [0]
              percentage_of_failures_detected = [0]
              i = 0
              failures_found = 0

              for each_test in prioritization:
                i = i + 1
                percentage_of_execution.append(i / prioritization_length)
                if each_test in failures:
                  failures_found = failures_found + 1
                percentage_of_failures_detected.append(failures_found / failures_length)

              autc = numpy.trapz(percentage_of_failures_detected, x=percentage_of_execution)
            except ZeroDivisionError:
              autc = -1

            autc
          `,
                data: {prioritization, failures}
            }
        );
    }

    async publishToApfdWorker(workspace: Workspace, worker: Worker, task: {
        metric?: string;
        failures?: string[];
        prioritizationPath: any;
    }) {
        let prioritization = await firstValueFrom(this.workspaceService.getPrioritizationSort(workspace.name!, task.prioritizationPath))
        let failureVersionDict: any = {}
        failureVersionDict[1] = task.failures

        let failureVersionDictJson = JSON.stringify(failureVersionDict)
        worker.postMessage({
                id: "metric_" + task.prioritizationPath,
                python: `
                    import numpy
                    import json

                    failureVersionDict = json.loads(failureVersionDictJson)

                    apfds = []
                    for v in range(1, len(failureVersionDict)+1):
                        faulty_tcs = set(failureVersionDict[str(v)])
                        numerator = 0.0  # numerator of APFD
                        position = 1
                        m = 0.0
                        for tc_ID in prioritization:
                            if tc_ID in faulty_tcs:
                                numerator, m = position, 1.0
                                break
                            position += 1

                        n = len(prioritization)
                        apfd = 1.0 - (numerator / (n * m)) + (1.0 / (2 * n)) if m > 0 else 0.0
                        apfds.append(apfd)

                    numpy.average(apfds)
          `,
                data: {prioritization, failureVersionDictJson}
            }
        );
    }

    private executePostMetricCalculationActions() {
        let task = this.statusService.createTask("Running post-metric calculation actions")
        this.workspace!.data?.forEach((eachRootNode) => {
            this.calculateAverageMetrics(eachRootNode)
            this.sortTree(eachRootNode)
        })
        this.workspace?.data?.sort((a, b) => b.averageMetric! - a.averageMetric!)
        this.statusService.clearTask(task);
    }
}
