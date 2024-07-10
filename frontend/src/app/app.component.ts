import {ChangeDetectorRef, Component, HostListener, OnInit, ViewEncapsulation} from '@angular/core';
import {
    applicationIcon,
    bugIcon,
    checkboxListIcon,
    ClarityIcons, clockIcon,
    collapseCardIcon,
    cursorMoveIcon, fastForwardIcon, fileGroupIcon,
    fileIcon, fileSettingsIcon,
    folderIcon, listIcon,
    numberListIcon, pauseIcon, pencilIcon, playIcon, rewindIcon, searchIcon, stepForwardIcon, stopIcon,
    successStandardIcon,
    windowCloseIcon
} from '@cds/core/icon';
import {Workspace} from "./model/workspace";
import {WorkspacesService} from "./services/workspaces.service";
import {Tool} from "./model/tool";
import {MetricsService} from "./services/metrics.service";
import {StatusService} from "./services/status.service";
import {CompactType, DisplayGrid, GridsterConfig, GridsterItem, GridType} from "angular-gridster2";
import {ModifierKeySharedService} from "./services/modifier-key-shared.service";
import {Preset} from "./model/preset";
import {NodeDndService} from "./services/node-dnd.service";
import {GlobalDropType} from "./model/global-drop-type";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
    public title = 'frontend';
    public workspace?: Workspace;
    public toolDragged?: Tool;
    public sidenavCollapsed = false;
    public toolsPaneCollapsed = false;
    public dragging: boolean = false;

    constructor(public nodeDndService: NodeDndService, private modifierKeysService: ModifierKeySharedService, private statusService: StatusService, private workspaceService: WorkspacesService, private metricsService: MetricsService, private loadingService: StatusService) {

        this.options = {
            gridType: GridType.Fit,
            compactType: CompactType.None,
            margin: 3,
            outerMargin: true,
            ignoreContent: true,
            outerMarginTop: null,
            outerMarginRight: null,
            outerMarginBottom: null,
            outerMarginLeft: null,
            useTransformPositioning: true,
            mobileBreakpoint: 640,
            useBodyForBreakpoint: false,
            minCols: 2,
            maxCols: 100,
            minRows: 2,
            maxRows: 100,
            maxItemCols: 100,
            minItemCols: 1,
            maxItemRows: 100,
            minItemRows: 1,
            maxItemArea: 2500,
            minItemArea: 1,
            defaultItemCols: 1,
            defaultItemRows: 1,
            fixedColWidth: 105,
            fixedRowHeight: 105,
            keepFixedHeightInMobile: false,
            keepFixedWidthInMobile: false,
            scrollSensitivity: 10,
            scrollSpeed: 20,
            enableEmptyCellClick: false,
            enableEmptyCellContextMenu: false,
            enableEmptyCellDrop: false,
            emptyCellDropCallback: ($event, gridsterItem) => {
                this.dashboard.push({x: gridsterItem.x, y: gridsterItem.y, cols: 1, rows: 1, tool: this.toolDragged});
            },
            enableEmptyCellDrag: false,
            enableOccupiedCellDrop: false,
            emptyCellDragMaxCols: 50,
            emptyCellDragMaxRows: 50,
            ignoreMarginInRow: false,
            draggable: {
                enabled: true,
                ignoreContent: true,
            },
            resizable: {
                enabled: true
            },
            swap: false,
            pushItems: true,
            disablePushOnDrag: false,
            disablePushOnResize: false,
            pushDirections: {north: true, east: true, south: true, west: true},
            pushResizeItems: false,
            displayGrid: DisplayGrid.Always,
            disableWindowResize: false,
            disableWarnings: false,
            scrollToNewItems: false,
        };

        this.dashboard = [];

    }

    options: GridsterConfig;
    dashboard: Array<GridsterItem>;


    ngOnInit(): void {
        const full = `<svg width="16" height="16" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="0.5" y="0.5" width="12" height="12" rx="2.5" stroke="black"/></svg>`;
        const splitVertical = `<svg width="16" height="16" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 3V10C5.5 11.3807 4.38071 12.5 3 12.5C1.61929 12.5 0.5 11.3807 0.5 10V3C0.5 1.61929 1.61929 0.5 3 0.5C4.38071 0.5 5.5 1.61929 5.5 3ZM12.5 3V10C12.5 11.3807 11.3807 12.5 10 12.5C8.61929 12.5 7.5 11.3807 7.5 10V3C7.5 1.61929 8.61929 0.5 10 0.5C11.3807 0.5 12.5 1.61929 12.5 3Z" stroke="black"/></svg>`;
        const splitHorizontal = `<svg width="16" height="16" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 5.5L3 5.5C1.61929 5.5 0.5 4.38071 0.5 3C0.5 1.61929 1.61929 0.5 3 0.5L10 0.5C11.3807 0.5 12.5 1.61929 12.5 3C12.5 4.38071 11.3807 5.5 10 5.5ZM10 12.5H3C1.61929 12.5 0.5 11.3807 0.5 10C0.5 8.61929 1.61929 7.5 3 7.5L10 7.5C11.3807 7.5 12.5 8.61929 12.5 10C12.5 11.3807 11.3807 12.5 10 12.5Z" stroke="black"/></svg>`;
        const quads = `<svg width="16" height="16" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 5.5C1.61929 5.5 0.5 4.38071 0.5 3C0.5 1.61929 1.61929 0.5 3 0.5C4.38071 0.5 5.5 1.61929 5.5 3C5.5 4.38071 4.38071 5.5 3 5.5ZM3 12.5C1.61929 12.5 0.5 11.3807 0.5 10C0.5 8.61929 1.61929 7.5 3 7.5C4.38071 7.5 5.5 8.61929 5.5 10C5.5 11.3807 4.38071 12.5 3 12.5ZM10 12.5C8.61929 12.5 7.5 11.3807 7.5 10C7.5 8.61929 8.61929 7.5 10 7.5C11.3807 7.5 12.5 8.61929 12.5 10C12.5 11.3807 11.3807 12.5 10 12.5ZM10 5.5C8.61929 5.5 7.5 4.38071 7.5 3C7.5 1.61929 8.61929 0.5 10 0.5C11.3807 0.5 12.5 1.61929 12.5 3C12.5 4.38071 11.3807 5.5 10 5.5Z" stroke="black"/></svg>`;
        const mixed = `<svg width="16" height="16" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 5.5L3 5.5C1.61929 5.5 0.5 4.38071 0.5 3C0.5 1.61929 1.61929 0.5 3 0.5L10 0.5C11.3807 0.5 12.5 1.61929 12.5 3C12.5 4.38071 11.3807 5.5 10 5.5ZM0.5 10C0.500001 8.61929 1.61929 7.5 3 7.5C4.38071 7.5 5.5 8.61929 5.5 10C5.5 11.3807 4.38071 12.5 3 12.5C1.61929 12.5 0.5 11.3807 0.5 10ZM7.5 10C7.5 8.61929 8.61929 7.5 10 7.5C11.3807 7.5 12.5 8.61929 12.5 10C12.5 11.3807 11.3807 12.5 10 12.5C8.61929 12.5 7.5 11.3807 7.5 10Z" stroke="black"/></svg>`;
        this.statusService.taskListBehaviourSubject.subscribe((tasks) => {
            if (tasks.length == 0) {
                this.loadingText = undefined;
            } else {
                if (tasks.length > 1) {
                    this.loadingText = `${tasks[0].label} (${tasks.length - 1} more)`;
                } else {
                    this.loadingText = tasks[0].label;
                }
            }
        })
        ClarityIcons.addIcons(folderIcon,
            numberListIcon,
            fileIcon,
            windowCloseIcon,
            successStandardIcon,
            cursorMoveIcon,
            collapseCardIcon,
            applicationIcon,
            fileSettingsIcon,
            bugIcon,
            clockIcon,
            fileGroupIcon,
            searchIcon,
            pencilIcon,
            playIcon,
            pauseIcon,
            stopIcon,
            fastForwardIcon,
            rewindIcon,
            ["split-vertical", splitVertical],
            ["split-horizontal", splitHorizontal],
            ["split-quads", quads],
            ["split-mixed", mixed],
            ["split-full", full],
        );
        let fetchTask = this.loadingService.createTask("Fetching workspace")
        const urlParams = new URLSearchParams(window.location.search);
        const workspaceParam = urlParams.get('workspace');
        if (!workspaceParam) {
            alert("Please specify 'workspace' query param.")
            return;
        }
        this.workspaceService.getWorkspace(workspaceParam!).subscribe((workspace) => {
            this.workspace = workspace;
            this.loadingService.clearTask(fetchTask);
            this.workspaceService.$currentWorkSpace!.next(this.workspace);
            this.workspaceService.$currentWorkSpace.subscribe((updatedWorkSpace) => {
                this.workspace = updatedWorkSpace;
            })

            this.metricsService.evaluateWorkspaceMetrics(this.workspace);
        })

        if (typeof Worker !== 'undefined') {

        } else {
            alert("Web workers are not supported in this environment")
        }
    }

    removeItem($event: MouseEvent | TouchEvent, item: any): void {
        $event.preventDefault();
        $event.stopPropagation();
        this.dashboard.splice(this.dashboard.indexOf(item), 1);
    }


    tools: Tool[] = [
        {
            name: "Test curve",
            id: 'autc',
            inputAmount: -1,
            subjectAmount: 1,
            editable: true,
            icon: 'assets/autc.svg'
        },
        {
            name: "Matrix",
            inputAmount: 2,
            id: 'matrix',
            subjectAmount: 1,
            editable: false,
            icon: 'assets/matrix.svg'
        },
        {
            name: "Table",
            inputAmount: 1,
            id: 'table',
            subjectAmount: 1,
            editable: false,
            icon: 'assets/table.svg'
        },
        {
            name: "Stacked Tests",
            inputAmount: -1,
            id: 'stack',
            subjectAmount: 1,
            editable: false,
            icon: 'assets/stacked-tests.svg'
        },
        {
            name: "Failure History",
            inputAmount: 0,
            id: 'subject-overview',
            subjectAmount: -1,
            editable: false,
            icon: 'assets/subject-overview.svg'
        },
        {
            name: "Metric Box Plot",
            inputAmount: -1,
            id: 'metric-overview',
            subjectAmount: 0,
            editable: false,
            icon: 'assets/metric-box.svg'
        },
        {
            name: "Position Parallel Coordinates",
            inputAmount: -1,
            id: 'position-parallel-coords',
            subjectAmount: 0,
            editable: false,
            icon: 'assets/parallel.svg'
        },
        {
            name: "Curve TSNE",
            inputAmount: -1,
            id: 'curve-tsne',
            subjectAmount: 1,
            editable: false,
            icon: 'assets/tsne.svg'
        },
        {
            name: "Metric Evolution Line",
            inputAmount: 0,
            id: 'metric-evolution',
            subjectAmount: -1,
            editable: false,
            icon: 'assets/metric-history.svg'
        },
        {
            name: "Metric Evolution Heatmap",
            inputAmount: 0,
            id: 'metric-evolution-heatmap',
            subjectAmount: -1,
            editable: false,
            icon: 'assets/metric-evolution-heatmap.svg'
        },
        {
            name: "Test Age Failure Analysis",
            inputAmount: 0,
            id: 'test-age',
            subjectAmount: -1,
            editable: false,
            icon: 'assets/test-age.svg'
        },
        {
            name: "Coverage Evolution",
            inputAmount: 2,
            id: 'call-graph',
            subjectAmount: 1,
            editable: false,
            icon: 'assets/coverage.svg'
        },
    ]
    loadingText?: string = undefined;

    dropTool() {
        this.toolDragged = undefined;
        this.options.enableEmptyCellDrop = false;
        if (this.options.api && this.options.api.optionsChanged) {
            this.options.api.optionsChanged();
        }
    }

    dragTool(tool: Tool) {
        this.toolDragged = tool;
        this.options.enableEmptyCellDrop = true;
        if (this.options.api && this.options.api.optionsChanged) {
            this.options.api.optionsChanged();
        }
    }

    protected readonly undefined = undefined;
    public displayingPresetsInToolbar: boolean = true;
    public presets: Preset[] = [
        {
            name: 'Historical View',
            iconSpec: 'clock',
            preferredBehaviour: 'best',
            layout: [
                {x: 2, y: 1, cols: 1, rows: 1, tool: this.getToolById("test-age")},
                {x: 2, y: 0, cols: 1, rows: 1, tool: this.getToolById("subject-overview")},
                {x: 0, y: 0, cols: 2, rows: 2, tool: this.getToolById("metric-evolution-heatmap")},
            ]
        },
        {
            name: 'Algorithm Comparison',
            iconSpec: 'file-group',
            preferredBehaviour: 'best',
            layout: [
                {x: 0, y: 0, cols: 1, rows: 1, tool: this.getToolById("curve-tsne")},
                {x: 0, y: 1, cols: 1, rows: 1, tool: this.getToolById("autc")},
                {x: 0, y: 2, cols: 1, rows: 1, tool: this.getToolById("metric-overview")},
                {x: 1, y: 0, cols: 2, rows: 3, tool: this.getToolById("position-parallel-coords")}
            ]
        },
        {
            name: 'Algorithm Inspection',
            iconSpec: 'search',
            preferredBehaviour: 'all',
            layout: [
                {x: 0, y: 0, cols: 1, rows: 2, tool: this.getToolById("curve-tsne")},
                {x: 0, y: 2, cols: 1, rows: 2, tool: this.getToolById("autc")},
                {x: 0, y: 4, cols: 1, rows: 2, tool: this.getToolById("metric-overview")},
                {x: 1, y: 0, cols: 2, rows: 4, tool: this.getToolById("position-parallel-coords")},
                {x: 1, y: 2, cols: 2, rows: 2, tool: this.getToolById("table")}
            ]
        },
    ];

    getToolById(toolId: string): Tool {
        return this.tools.filter((eachTool) => eachTool.id == toolId)[0]
    }

    toggleCollapseNav() {
        this.sidenavCollapsed = !this.sidenavCollapsed;
        window.dispatchEvent(new Event('resize'));
    }

    toggleCollapseToolsPane() {
        this.toolsPaneCollapsed = !this.toolsPaneCollapsed;
        window.dispatchEvent(new Event('resize'));
    }

    getPrioritizationNumberBadgeTitle(tool: Tool) {
        return `${tool.inputAmount != -1 ? tool.inputAmount : 'n'} ${tool.inputAmount > 1 || tool.inputAmount == -1 ? "prioritizations" : "prioritization"}`
    }

    getSubjectNumberBadgeTitle(tool: Tool) {
        return `${tool.subjectAmount != -1 ? tool.subjectAmount : 'n'} ${tool.subjectAmount > 1 || tool.subjectAmount == -1 ? "subjects" : "subject"}`
    }

    @HostListener("window:keydown", ['$event'])
    onKeydown($event: KeyboardEvent) {
        if ($event.key == "Control") {
            this.modifierKeysService.isControlKeyDown.next(true);
        }
    }

    @HostListener("window:keyup", ['$event'])
    onKeyUp($event: KeyboardEvent) {
        if ($event.key == "Control") {
            this.modifierKeysService.isControlKeyDown.next(false);
        }
    }


    @HostListener('document:dragstart', ['$event'])
    onDragStart(event: DragEvent): void {
        this.dragging = true;
    }

    @HostListener('document:dragend', ['$event'])
    onDragEnd(event: DragEvent): void {
        this.dragging = false;
    }

    setViewPreset(preset: Preset) {
        this.dashboard = preset.layout.map((eachItem) => JSON.parse(JSON.stringify(eachItem)));
        if (preset.preferredBehaviour) {
            this.nodeDndService.dndBehaviour.next(preset.preferredBehaviour);
        }
    }

    allowDrop($event: DragEvent) {
        $event.preventDefault()
        $event.stopPropagation()
    }

    onDrop(type: GlobalDropType) {
        this.nodeDndService.globalDropEmitter.next(type)
    }

    protected readonly GlobalDropType = GlobalDropType;
}
