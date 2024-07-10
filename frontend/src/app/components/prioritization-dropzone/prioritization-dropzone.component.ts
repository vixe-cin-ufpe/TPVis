import {
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
    ViewEncapsulation
} from '@angular/core';
import {WorkspaceTreeNode} from "../../model/workspace-tree-node";
import {StatusService} from "../../services/status.service";
import {WorkspacesService} from "../../services/workspaces.service";
import {firstValueFrom, lastValueFrom, Subscription} from "rxjs";
import {Workspace} from "../../model/workspace";
import {Color} from "../../model/color";
import {NodeDndService} from "../../services/node-dnd.service";
import {interpolateColor} from "../../utils/metric-color";
import {ColorPickerControl} from "@iplab/ngx-color-picker";
import {ModifierKeySharedService} from "../../services/modifier-key-shared.service";
import tableu20 from "../../utils/colorways";
import {GlobalDropType} from "../../model/global-drop-type";
import {DataSelectionService} from "../../services/data-selection.service";
import {DialogService} from "../../services/dialog.service";
import {Dialog} from "../../model/dialog";

@Component({
    selector: 'app-prioritization-dropzone',
    templateUrl: './prioritization-dropzone.component.html',
    styleUrls: ['./prioritization-dropzone.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class PrioritizationDropzoneComponent implements OnInit, OnDestroy {


    @Input()
    public title: string = "Select data..."

    @Input()
    public toolName: string = "Dropzone"

    @Input()
    public displayColorOptions?: boolean = false;

    @Input()
    public emitInitialChange?: boolean = false;

    @Input()
    public allowedAmount!: number;

    @Input()
    allowedSubjectAmount?: number = 1;

    @Input()
    openAutomatically?: boolean = true;

    @Input()
    disablePrioritizationInput?: boolean = false;

    @Input()
    disableFilterListening?: boolean = false;

    @Input()
    disableSubjectInput?: boolean = false;

    @Input()
    disableOpenButton?: boolean = false;

    @Output()
    public subjectChange: EventEmitter<WorkspaceTreeNode[]> = new EventEmitter<WorkspaceTreeNode[]>();

    @Output()
    public selectionChange: EventEmitter<WorkspaceTreeNode[]> = new EventEmitter<WorkspaceTreeNode[]>();

    @Output()
    public onFailureSetChange: EventEmitter<string[]> = new EventEmitter<string[]>();

    @Output()
    private onTestKeyChange: EventEmitter<string> = new EventEmitter<string>();

    @Output()
    private onColorChange: EventEmitter<any> = new EventEmitter<any>();

    workspace?: Workspace;

    public loadedPrioritizations: WorkspaceTreeNode[] = [];

    dropzoneOpen: boolean = false;

    colorset: Color[] = tableu20.map((eachColor => {
        let split = eachColor.replace("rgb(", "").replace(")", "").split(",").map((str) => str.trim()).map((el) => parseInt(el));
        return new Color(split[0], split[1], split[2])
    }))

    public subjects: WorkspaceTreeNode[] = [];
    private subscriptions: Subscription[] = [];
    public colorMode: "global" | "metric" | "parent" = "global";
    colorMap: any = {};
    private selectionMode: boolean = false;
    public selectedPrioritizations: WorkspaceTreeNode[] = [];
    protected readonly Object = Object;
    public displayColorPicker: boolean = false;
    public colorPickerControl = new ColorPickerControl().hidePresets()
        .hideAlphaChannel()
    public filteredPrioritizations: string[] = [];
    public applyColorOptGlobally: boolean = false;

    constructor(private dialogService: DialogService, private dataSelectionService: DataSelectionService, public nodeDndService: NodeDndService, private modifierKeyService: ModifierKeySharedService, private loadingService: StatusService, private workspaceService: WorkspacesService) {
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((eachSubscription) => eachSubscription.unsubscribe())
    }

    ngOnInit(): void {
        if (this.openAutomatically) {
            this.dropzoneOpen = true;
        }
        this.subscriptions.push(this.modifierKeyService.isControlKeyDown.subscribe((isSelectionEnabled) => {
            this.selectionMode = isSelectionEnabled;
        }))
        this.subscriptions.push(this.workspaceService.$currentWorkSpace.subscribe(workspace => {
            this.workspace = workspace;
            if (this.emitInitialChange) {
                this.emitLoadedPrioritizations();
            }
        }))
        this.subscriptions.push(this.workspaceService.$prioritizationColorChangeEvent.subscribe((prioritizationPath) => {
            let selectedPrioritizationsThatChangedColor = this.loadedPrioritizations.filter(
                (eachPrioritization) => eachPrioritization.path == prioritizationPath
            );

            if (selectedPrioritizationsThatChangedColor.length > 0) {
                this.emitLoadedPrioritizations();
                this.emitColorModeChange();
            }
        }))
        this.subscriptions.push(this.nodeDndService.globalDropEmitter.subscribe((type: GlobalDropType) => {
            if (type == GlobalDropType.SUBJECT) {
                this.onDropSubject();
            } else {
                this.onDropPrioritization()
            }
        }))
        this.subscriptions.push(this.dataSelectionService.getSelectedPrioritizationsObservable().subscribe((toolSelectionEvent) => {
            if (!this.disableFilterListening) {
                this.filteredPrioritizations = toolSelectionEvent?.selectedPrioritizations ?? [];
                this.emitLoadedPrioritizations();
            }
        }))
        this.subscriptions.push(this.dataSelectionService.colorOption.subscribe((colorOpt) => {
            if (colorOpt != this.colorMode && !this.displayColorPicker) {
                this.colorMode = <"global" | "metric" | "parent">colorOpt;

                this.emitColorModeChange();
            }
        }))
    }

    private emitFailedTests() {
        if (this.subjects.length > 0) {
            this.onTestKeyChange.emit(this.subjects[0]?.testKey);
            this.onFailureSetChange.emit(this.subjects[0]?.failures)
        } else {
            this.onFailureSetChange.emit([]);
        }
    }

    public isSubjectDropAllowed() {
        return ((this.subjects)!.length < (this.allowedSubjectAmount)!) || (this.allowedSubjectAmount)! == -1;
    }

    public isPrioritizationDropAllowed() {
        return ((this.loadedPrioritizations.length < this.allowedAmount) || this.allowedAmount == -1) && !this.disablePrioritizationInput
    }

    async onDropPrioritization() {
        if (!this.isPrioritizationDropAllowed()) {
            return;
        }
        let prioritizationsToLoad: WorkspaceTreeNode[] = []
        this.nodeDndService.selectedElements.getValue().forEach((eachTreeNode: WorkspaceTreeNode) => {
            if (eachTreeNode.type == "prioritization") {
                prioritizationsToLoad.push(eachTreeNode)
            } else {
                let prioritizationsInNode = this.filterNodesByType("prioritization", eachTreeNode)
                prioritizationsInNode.forEach((eachTreeNode) => {
                    prioritizationsToLoad.push(eachTreeNode)
                })
            }
        })
        let response = true;
        if (this.allowedAmount != -1 && prioritizationsToLoad.length > this.allowedAmount) {
            let dialog = new Dialog(false, this.toolName, "This tool only supports " + this.allowedAmount + " prioritizations. You dragged " + prioritizationsToLoad.length + ". Picking the first " + this.allowedAmount + ".");
            this.dialogService.createDialog(dialog);
            await firstValueFrom(dialog.response);
            prioritizationsToLoad = prioritizationsToLoad.splice(0, this.allowedAmount);
        }
        if (prioritizationsToLoad.length > 5) {
            let dialog = new Dialog(true, this.toolName, "You're about to load " + prioritizationsToLoad.length + " prioritizations. Confirm?");
            this.dialogService.createDialog(dialog);
            response = await firstValueFrom(dialog.response);
        }
        if (response) {
            for (const eachPrioritizationNode of prioritizationsToLoad) {
                await this.loadDroppedPrioritization(eachPrioritizationNode)
            }
            this.emitColorModeChange();
            this.emitLoadedPrioritizations();
        }
    }

    filterNodesByType(type: string, node: WorkspaceTreeNode): WorkspaceTreeNode[] {
        let result: WorkspaceTreeNode[] = [];

        (function DFS(node: WorkspaceTreeNode) {
            if (node.type === type) result.push(node);
            if (node.data) {
                for (let child of node.data!) {
                    DFS(child);
                }
            }
        })(node);

        if (type == 'prioritization' && this.nodeDndService.dndBehaviour.getValue() == "best") {
            let actualResult: WorkspaceTreeNode[] = []
            let byParent: any = {}
            result.forEach((eachNodeFound) => {
                if (!Object.keys(byParent).includes(eachNodeFound.parentId!)) {
                    byParent[eachNodeFound.parentId!] = []
                }
                byParent[eachNodeFound.parentId!].push(eachNodeFound);
            })
            Object.keys(byParent).forEach((eachParentId) => {
                let prioritizationsForParent = byParent[eachParentId]
                let bestPrioritizationForThisParent: WorkspaceTreeNode | undefined = undefined;
                prioritizationsForParent.forEach((eachPrioritization: WorkspaceTreeNode) => {
                    if (bestPrioritizationForThisParent == undefined) {
                        bestPrioritizationForThisParent = eachPrioritization;
                    } else {
                        if (eachPrioritization.apfd) {
                            if (bestPrioritizationForThisParent.apfd! < eachPrioritization.apfd) {
                                bestPrioritizationForThisParent = eachPrioritization;
                            }
                        } else if (eachPrioritization.autc) {
                            if (bestPrioritizationForThisParent.autc! < eachPrioritization.autc) {
                                bestPrioritizationForThisParent = eachPrioritization;
                            }
                        }
                    }
                })
                actualResult.push(bestPrioritizationForThisParent!);

            })
            return actualResult;
        }

        return result;
    }

    async loadDroppedPrioritization(node: WorkspaceTreeNode) {
        let prioritization: WorkspaceTreeNode | null = this.workspaceService.getPrioritizationFromTree(this.workspace!, node.path!);
        if (this.loadedPrioritizations.includes(prioritization!)) {
            return;
        }
        this.loadedPrioritizations.push(prioritization!);
        let task = this.loadingService.createTask("Fetching prioritization...")
        prioritization!.loadedSort = await lastValueFrom(this.workspaceService.getPrioritizationSort(this.workspaceService.$currentWorkSpace.getValue()?.name!, prioritization!.path!))
        if (prioritization!.colorRGB == undefined) {
            prioritization!.colorRGB = new Color(100, 100, 100);
        }
        this.loadingService.clearTask(task)
    }

    removePrioritization(prioritization: WorkspaceTreeNode) {
        this.loadedPrioritizations = this.loadedPrioritizations.filter((eachPrioritization) => eachPrioritization != prioritization);
        this.emitLoadedPrioritizations();
    }

    getColorWithOpacity(color: Color, alpha: number) {
        if (color) {
            return `rgba(${color.r},${color.g},${color.b},${alpha})`
        }
        return 'white'
    }

    handlePrioritizationClick(prioritization: WorkspaceTreeNode) {
        if (this.selectionMode) {
            if (this.selectedPrioritizations.includes(prioritization)) {
                this.selectedPrioritizations.slice(this.selectedPrioritizations.indexOf(prioritization), 1);
            } else {
                this.selectedPrioritizations.push(prioritization);
            }
        } else {
            this.selectedPrioritizations = [prioritization];
            this.emitColorModeChange();
        }
    }

    async onDropSubject() {
        if (!this.isSubjectDropAllowed()) {
            return;
        }
        for (const eachTreeNode of this.nodeDndService.selectedElements.getValue()) {
            let subjectsToLoad = []
            if (eachTreeNode.type == "subject") {
                let subjectObj = this.workspaceService.getSubjectFromTree(this.workspace!, eachTreeNode.testSetPath!)!
                if (!this.subjects.includes(subjectObj)) {
                    subjectsToLoad.push(subjectObj);
                }
            } else {
                let subjectsInNode = this.filterNodesByType("subject", eachTreeNode)
                if (subjectsInNode.length > 0) {
                    let response: boolean = true
                    if (subjectsInNode.length > 5) {
                        let dialog = new Dialog(true, this.toolName, "You're about to load " + subjectsInNode.length + " subjects. Confirm?");
                        this.dialogService.createDialog(dialog);
                        response = await firstValueFrom(dialog.response);
                    }

                    if (response) {
                        subjectsInNode.forEach((eachSubjectInNode) => {
                            let subjectObj = this.workspaceService.getSubjectFromTree(this.workspace!, eachSubjectInNode.testSetPath!)!
                            if (!this.subjects.includes(subjectObj)) {
                                subjectsToLoad.push(subjectObj);
                            }
                        })
                    } else {
                        continue;
                    }
                }
            }
            if ((subjectsToLoad.length + this.subjects.length) > this.allowedSubjectAmount! && this.allowedSubjectAmount != -1) {
                let dialog = new Dialog(false, this.toolName, "This tool only support " + this.allowedSubjectAmount + " subjects. Picking the first " + (this.allowedSubjectAmount! - this.subjects.length) + ".");
                this.dialogService.createDialog(dialog);
                await firstValueFrom(dialog.response);

                subjectsToLoad = subjectsToLoad.splice(0, this.allowedSubjectAmount! - this.subjects.length);
            }
            this.subjects = [...this.subjects, ...subjectsToLoad]
        }
        this.emitFailedTests();
        this.subjectChange.emit(this.subjects);
    }

    clearSubject(subject: WorkspaceTreeNode) {
        this.subjects = this.subjects.filter((eachSubject) => eachSubject != subject);
        this.emitLoadedPrioritizations();
        this.emitFailedTests();
        this.subjectChange.emit(this.subjects);
    }

    allowDrop($event: DragEvent) {
        $event.preventDefault()
        $event.stopPropagation()
    }

    clearPrioritizations() {
        this.loadedPrioritizations = [];
        this.emitLoadedPrioritizations();
    }

    dragStartNodes(prioritization: WorkspaceTreeNode) {
        this.nodeDndService.selectedElements.next([prioritization])
    }

    emitColorModeChange() {

        if (this.colorMode == "metric") {
            let colorMap: any = {}
            this.loadedPrioritizations.forEach((eachPrioritization) => {
                colorMap[eachPrioritization.path!] = interpolateColor(eachPrioritization.apfd != undefined ? eachPrioritization.apfd! : eachPrioritization.autc!);
            })
            this.colorMap = colorMap;
            this.onColorChange.emit(colorMap);
        } else if (this.colorMode == "global") {
            let colorMap: any = {}
            this.loadedPrioritizations.forEach((eachPrioritization) => {
                colorMap[eachPrioritization.path!] = eachPrioritization.colorRGB;
            })
            this.colorMap = colorMap;
            this.onColorChange.emit(colorMap);
        } else if (this.colorMode == "parent") {
            let colorMap: any = {}
            let parentColors: any = {}
            let i = 0;
            this.loadedPrioritizations.forEach((eachPrioritization) => {
                if (!Object.keys(parentColors).includes(eachPrioritization.parentId!)) {
                    parentColors[eachPrioritization.parentId!] = this.colorset[(i + 1) % this.colorset.length];
                    i++;
                }
                colorMap[eachPrioritization.path!] = parentColors[eachPrioritization.parentId!];
            })
            this.colorMap = colorMap;
            this.onColorChange.emit(colorMap);
        }
        if (this.applyColorOptGlobally) {
            this.dataSelectionService.colorOption.next(this.colorMode);
        }
    }

    handleLongPress() {
        this.displayColorPicker = true;
    }

    public applyColor(event: MouseEvent): void {
        event.stopPropagation();
        this.selectedPrioritizations.forEach((eachPrioritization) => {
            let splitRgb = this.colorPickerControl.value.toRgbString().replace("rgb(", "").replace(")", "").split(",").map((eachColorValueStr) => parseInt(eachColorValueStr));
            eachPrioritization.colorRGB = new Color(splitRgb[0], splitRgb[1], splitRgb[2]);
            this.workspaceService.$prioritizationColorChangeEvent.next(eachPrioritization.path!);
            this.workspaceService.$currentWorkSpace.next(this.workspace);
            this.emitColorModeChange();
            this.displayColorPicker = false;
        })
    }

    public discardClick(event: MouseEvent): void {
        event.stopPropagation();
        if ((<any>event.target).classList.contains("color-picker")) {
            this.displayColorPicker = false;
        }
    }

    open() {
        this.dropzoneOpen = true;
    }

    clearSubjects() {
        this.subjects = []
        this.emitLoadedPrioritizations();
        this.emitFailedTests();
        this.subjectChange.emit(this.subjects);
    }

    private emitLoadedPrioritizations() {
        if (this.filteredPrioritizations.length > 0 && !this.disableFilterListening) {
            this.selectionChange.emit(this.loadedPrioritizations.filter((eachSelectedPrioritization) => {
                return this.filteredPrioritizations.includes(eachSelectedPrioritization.path!)
            }))
        } else {
            this.selectionChange.emit(this.loadedPrioritizations);
        }
    }
}
