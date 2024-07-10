import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {AbstractPlotlyTool} from "../abstract-plotly-tool";
import {WorkspaceTreeNode} from "../../../model/workspace-tree-node";
import {StatusService} from "../../../services/status.service";
import {DataSelectionService} from "../../../services/data-selection.service";
import {Observable, Subscription} from "rxjs";
import {ToolSelectionEvent} from "../../../model/tool-selection-event";
import {PlotlyModule} from "angular-plotly.js";
import {StatusTask} from "../../../model/statusTask";

@Component({
    selector: 'app-curve-tsne',
    templateUrl: './curve-tsne.component.html',
    styleUrls: ['./curve-tsne.component.scss'],
})
export class CurveTsneComponent extends AbstractPlotlyTool implements OnInit, OnDestroy {

    private failureSet: string[] = [];
    private testKey?: string;
    selectedPrioritizations: WorkspaceTreeNode[] = []
    private loading: Boolean = false;
    private redrawRequested: boolean = false;
    private worker?: Worker;
    private prioritizationToColorMap: any = {};
    private selectionSubscription?: Subscription = undefined;
    public toolUUID = crypto.randomUUID();
    private computeTask?: StatusTask;

    constructor(private statusService: StatusService, private dataSelectionService: DataSelectionService) {
        super();
    }

    ngOnInit(): void {
        let task = this.statusService.createTask("Preparing TSNE worker...")
        this.worker = new Worker(new URL('../../../workers/AUTC-worker.worker.ts', import.meta.url));
        this.statusService.clearTask(task)
        this.graph.layout.margin = {l: 0, t: 0, r: 0, b: 0, pad: 0};
        this.selectionSubscription = this.dataSelectionService.getSelectedPrioritizationsObservable().subscribe((selectionEvent) => {
            if (selectionEvent?.authorToolUUID != this.toolUUID) {
                this.graph.selectedPoints = [null]
                this.graph.revision++;
                setTimeout(() => {
                    this.graph.revision++;
                    PlotlyModule.plotlyjs.restyle(this.toolUUID, {selectedpoints: [null]});
                }, 100)
            }
        })
    }

    ngOnDestroy() {
        this.worker?.terminate()
        this.selectionSubscription!.unsubscribe();
    }

    handleSelectedPrioritizationChange($event: WorkspaceTreeNode[]) {
        this.selectedPrioritizations = $event;
        this.redrawPlot();
    }

    private redrawPlot() {
        if (this.failureSet.length == 0 || this.selectedPrioritizations.length < 4 || this.loading) {
            if (this.loading && this.selectedPrioritizations.length > 4 && this.failureSet.length > 0) {
                this.redrawRequested = true;
            }
            return;
        }
        if (this.computeTask != null) {
            this.statusService.clearTask(this.computeTask);
        }
        this.computeTask = this.statusService.createTask("Computing TSNE...")
        this.redrawRequested = false;
        let percentages: number[][] = []
        this.selectedPrioritizations.forEach((eachPrioritization) => {
            let execution = eachPrioritization.loadedSort;
            let x: number[] = [0]
            let y: number[] = [0]
            let failuresFound = 0;
            for (let i = 0; i < execution!.length; i++) {
                x.push(i / execution!.length);
                if (this.failureSet!.includes(execution![i])) {
                    failuresFound = failuresFound + 1;
                }
                y.push(failuresFound / this.failureSet!.length);
            }
            percentages.push(y)

        })

        let reqUUID = crypto.randomUUID();

        this.worker!.postMessage({
            id: "curve_tsne_" + reqUUID,
            python: `
        import scipy.stats as stats
        import numpy as np
        import pandas as pd
        from sklearn.manifold import TSNE
        from js import pyodide, console

        n = len(data)
        X = data.to_py()

        metric = np.zeros((n, n))
        for i in range(n):
          for j in range(i, n):
            tau_calc = stats.kendalltau(np.array(X[i], dtype='double'), np.array(X[j], dtype='double'))

            metric[i][j] = metric[j][i] = tau_calc.correlation

        tsne_model = TSNE(n_components=2, learning_rate='auto',init='random', perplexity=3, random_state=1)

        Y_tsne = tsne_model.fit_transform(metric)
        Y_tsne
        `,
            data: {data: percentages}
        });
        this.worker!.onmessage = (message: any) => {
            if (message.data.id == "curve_tsne_" + reqUUID) {
                this.loading = false;
                if (this.computeTask != null) {
                    this.statusService.clearTask(this.computeTask);
                }

                let data = message.data;

                let trace: any = {
                    mode: 'markers',
                    type: 'scatter',
                    x: [],
                    y: [],
                    marker: {
                        color: [],
                    },
                    prioritizationPath: [],
                    text: []
                }
                data.results.forEach((eachPrioritizationTSNEResult: number[], index: number) => {
                    trace.x.push(eachPrioritizationTSNEResult[0]);
                    trace.y.push(eachPrioritizationTSNEResult[1]);
                    trace.text.push(this.selectedPrioritizations[index].name);
                    trace.prioritizationPath.push(this.selectedPrioritizations[index].path);
                    trace.marker.color.push(this.prioritizationToColorMap[this.selectedPrioritizations[index].path!]);
                })
                this.graph.data = [trace]
                this.graph.revision++;
                if (this.redrawRequested) {
                    this.redrawPlot();
                }
            }
        };
    }

    handleColorChange($event: any) {
        this.prioritizationToColorMap = $event;
        this.redrawPlot();
    }

    handleFailureSetChange(failureSet: string[]) {
        this.failureSet = failureSet;
        this.redrawPlot();
    }

    handleTestKeyChange($event: string) {
        this.testKey = $event;
        this.redrawPlot();
    }


    handleScatterSelect($event: any) {
        this.graph.selectedPoints = $event;
        this.dataSelectionService.updateSelectedPrioritizationsByPlotlyEvent(this.toolUUID, $event)
    }
}
