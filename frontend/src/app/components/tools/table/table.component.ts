import {ChangeDetectorRef, Component, ViewEncapsulation} from '@angular/core';
import {WorkspaceTreeNode} from "../../../model/workspace-tree-node";
import {WorkspacesService} from "../../../services/workspaces.service";
import {firstValueFrom} from "rxjs";
import {ColDef, GridApi, GridReadyEvent} from 'ag-grid-community';

@Component({
    selector: 'app-table',
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TableComponent {

    private gridApi!: GridApi;
    public data: any[] = [];
    public columns?: ColDef[];
    public selectedPrioritizations?: WorkspaceTreeNode[];

    public defaultColDef: ColDef = {
        resizable: true,
        wrapText: true,
        cellStyle: {'white-space': 'normal'},
        filter: 'agTextColumnFilter',
    }

    public rowClassRules = {
        'passed-row': (params: any) => {
            return !this.failureSet.includes(params.data[this.testKey!]);
        },
        'failed-row': (params: any) => {
            return this.failureSet.includes(params.data[this.testKey!]);
        },
    };
    private failureSet: string[] = [];
    private testKey?: string;

    constructor(private workspacesService: WorkspacesService, private changeDetectorRefs: ChangeDetectorRef) {
    }

    onGridReady(params: GridReadyEvent) {
        this.gridApi = params.api;
    }

    async handleSelectedPrioritizationChange($event: WorkspaceTreeNode[]) {
        this.selectedPrioritizations = $event!;
        this.plot();
    }

    isNumeric = (num: any) => (typeof (num) === 'number' || typeof (num) === "string" && num.trim() !== '') && !isNaN(<number>num);

    async plot() {
        if (this.selectedPrioritizations!.length > 0 && this.testKey) {
            let prioritization = this.selectedPrioritizations![0];
            let workspace = this.workspacesService.$currentWorkSpace.getValue()!;
            let parentSubject: WorkspaceTreeNode = this.workspacesService.getSubjectFromTree(workspace, prioritization.testSetPath!)!;
            let testSet = await firstValueFrom(this.workspacesService.getTestSet(workspace.name!, parentSubject!.testSetPath!));
            testSet.forEach((eachTestInSet) => {
                eachTestInSet["rank_num"] = prioritization.loadedSort?.indexOf(eachTestInSet[this.testKey!]);
            })
            testSet = testSet.sort((a, b) => {
                return a["rank_num"] - b["rank_num"]
            })
            this.data = testSet;
            this.data = this.data.map((eachTest) => {
                let keys = Object.keys(eachTest);
                let result: any = {}
                keys.forEach((eachTestMetadata) => {
                    if (this.isNumeric(eachTest[eachTestMetadata])) {
                        result[eachTestMetadata] = parseFloat(eachTest[eachTestMetadata])
                    } else {
                        result[eachTestMetadata] = eachTest[eachTestMetadata]
                    }
                })
                return result;
            })
            this.columns = [{
                field: "rank_num",
                headerName: "rank_num",
                pinned: 'left',
                sortable: true
            }, {
                field: this.testKey,
                headerName: this.testKey,
                pinned: 'left',
                sortable: true
            }]
            this.columns = [...this.columns, ...Object.keys(this.data[0]).map((eachColumn) => {
                return {
                    field: eachColumn,
                    headerName: eachColumn,
                    sortable: true,
                    type: this.isNumeric(this.data[0][eachColumn]) ? 'number' : undefined,
                    tooltipValueGetter: (target: any) => target.data[eachColumn],
                }
            })];
            this.columns = this.columns.filter((eachColumn) => (!["rank_num", this.testKey].includes(eachColumn.field) || eachColumn.pinned))
        } else {
            this.columns = []
            this.data = []
        }
    }

    handleFailureSetChange(failureSet: string[]) {
        this.failureSet = failureSet;
        if (this.gridApi) {
            this.plot();
            this.gridApi.redrawRows()
        }
    }

    handleTestKeyChange($event: string) {
        this.testKey = $event;
        if (this.gridApi) {
            this.plot();
            this.gridApi.redrawRows()
        }
    }
}
