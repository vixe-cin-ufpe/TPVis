import {AfterViewInit, Component, EventEmitter, OnDestroy} from '@angular/core';
import Graph, {UndirectedGraph} from "graphology";
import {WorkspacesService} from "../../../services/workspaces.service";
import {Attributes} from 'graphology-types';
import {WorkspaceTreeNode} from "../../../model/workspace-tree-node";
import {BehaviorSubject, firstValueFrom, Subscription} from "rxjs";
import {CameraState} from "sigma/types";
import {dfsFromNode} from "graphology-traversal";
import {AbstractPlotlyTool} from "../abstract-plotly-tool";
import {debug} from "reorder.js";

@Component({
    selector: 'app-call-graph',
    templateUrl: './call-graph.component.html',
    styleUrls: ['./call-graph.component.scss']
})
export class CallGraphComponent extends AbstractPlotlyTool implements AfterViewInit, OnDestroy {

    public graphologyInstance?: Graph<Attributes, Attributes, Attributes>;

    public selectedPrioritizations: WorkspaceTreeNode[] = [];
    public selectedSubject?: WorkspaceTreeNode;
    public currentTestIndex: number = 0;
    public playing = false;
    private playbackInterval?: number;
    protected testKey?: string;
    public packageMode: boolean = false;
    protected testSet?: any[];
    private testNames: string[] = []
    public coveringTests: any = {};
    public maxNumberOfTestsThatCoverNode: number = 0;
    public cameraSubject: BehaviorSubject<CameraState | undefined> = new BehaviorSubject<CameraState | undefined>(undefined);
    public hoveredNodeSubject: BehaviorSubject<{
        hoveredNode?: string,
        hoveredNeighbors?: Set<string>
    }> = new BehaviorSubject<{ hoveredNode?: string; hoveredNeighbors?: Set<string> }>({});
    public incrementalMode: boolean = true;
    public refreshEmitter: EventEmitter<void> = new EventEmitter<void>();

    public data: any = undefined
    private classesAddedToHierarchy: string[] = [];
    protected testNamesByPosition: any;
    protected testPositionsByName: any;
    protected testNamesByPosition2: any;
    protected testPositionsByName2: any;
    protected preprocessing: boolean = true;
    protected callgraph?: string;


    constructor(private workspacesService: WorkspacesService) {
        super();
        this.graph.layout.height = 100
        this.graph.layout.showlegend = false
        this.graph.layout.margin = {l: 5, t: 0, r: 8, b: 0, pad: 0};
        this.graph.layout.yaxis = {visible: false, zeroline: false, fixedrange: true, rangemode: 'tozero'};
        this.graph.layout.xaxis = {visible: false, zeroline: false, fixedrange: true, rangemode: 'tozero'};
        this.graph.config = {};
        this.graph.config.displayModeBar = false;
    }


    ngOnDestroy(): void {
        clearInterval(this.playbackInterval);
        this.graphologyInstance?.clear();
        this.graphologyInstance = undefined;
    }

    ngAfterViewInit(): void {
        this.playbackInterval = setInterval(() => {
            if (this.playing && this.selectedSubject && this.selectedPrioritizations.length > 0 && this.graphologyInstance) {
                this.incrementPlayback(1)
            }
        }, 100)
    }

    async handleSelectedPrioritizationChange($event: WorkspaceTreeNode[]) {
        this.selectedPrioritizations = $event;
        if (this.selectedPrioritizations.length == 2 && this.selectedSubject) {
            await this.tryBuildGraph();
        }
    }

    handleTestKeyChange($event: string) {
        this.testKey = $event;
    }

    async handleSubjectChange($event: WorkspaceTreeNode[]) {
        this.selectedSubject = $event[0];
        if (this.selectedPrioritizations.length == 2 && this.selectedSubject) {
            await this.tryBuildGraph(true);
            this.stopPlayback();
            this.startPlayback();
        }
    }

    startPlayback() {
        this.playing = true;
    }

    pausePlayback() {
        this.playing = false;
    }

    stopPlayback() {
        this.pausePlayback();
        this.currentTestIndex = 0;
    }

    incrementPlayback(number: number, refreshGraph = false) {
        let nextTestIndex = this.currentTestIndex + number;
        if (nextTestIndex == this.selectedPrioritizations[0].loadedSort?.length) {
            nextTestIndex = 0;
        } else if (nextTestIndex < 0) {
            nextTestIndex = this.selectedPrioritizations[0].loadedSort?.length! - 1
        }
        this.currentTestIndex = nextTestIndex;
    }

    private async tryBuildGraph(becauseOfSubjectChange = false) {
        this.preprocessing = true;
        if (!this.selectedSubject || !this.selectedPrioritizations[0] || !this.selectedPrioritizations[1]) {
            return;
        }

        let workspace = this.workspacesService.$currentWorkSpace.getValue()!;


        this.testSet = await firstValueFrom(this.workspacesService.getTestSet(workspace.name!, this.selectedSubject!.testSetPath!));
        const urlParams = new URLSearchParams(window.location.search);
        const workspaceParam = urlParams.get('workspace');
        this.workspacesService.getCallGraph(workspaceParam!, this.selectedSubject.callGraphPath!).subscribe((callGraph) => {
            this.callgraph = callGraph;

            this.rebuildVisualization()

        })
    }

    private addToHierarchy(classNameParts: string[]) {
        if (this.classesAddedToHierarchy.includes(classNameParts.join("."))) {
            return;
        }
        this.classesAddedToHierarchy.push(classNameParts.join("."));
        let cursor = this.data;
        for (let i = 0; i < classNameParts.length - 1; i++) {
            const eachClassNameParts = classNameParts.slice(0, i + 1).join(".");
            if (cursor == undefined) {
                cursor = {name: eachClassNameParts, children: []}
                this.data = cursor
            } else if (cursor.children.length == 0) {
                let advance = {name: eachClassNameParts, children: []}
                cursor.children.push(advance)
                cursor = advance;
            } else {
                if (cursor.name == eachClassNameParts) {
                    continue;
                }
                let notFound = true
                for (let j = 0; j < cursor.children.length; j++) {
                    const eachAddedClass: any = cursor.children[j];
                    if (eachAddedClass.name == eachClassNameParts) {
                        cursor = cursor.children[j];
                        notFound = false;
                    }
                }
                if (notFound) {
                    let advance = {name: eachClassNameParts, children: []}
                    cursor.children.push(advance)
                    cursor = advance;
                }
            }
        }
        cursor.children.push({
            name: classNameParts.join("."),
            children: [],
            value: this.getAmountOfCoveringTests(classNameParts.join("."), false, this.testSet!.length - 1),
        })
    }

    private computeTestPositionsMaps() {
        this.testNamesByPosition = {}
        this.testPositionsByName = {}
        this.testNamesByPosition2 = {}
        this.testPositionsByName2 = {}

        for (const eachTestInSet of this.testSet!) {
            this.testNamesByPosition[this.selectedPrioritizations[0]!.loadedSort?.indexOf(eachTestInSet[this.testKey!])!] = eachTestInSet["name"]
            this.testPositionsByName[eachTestInSet["name"]!] = this.selectedPrioritizations[0]!.loadedSort?.indexOf(eachTestInSet[this.testKey!])!;
            this.testNamesByPosition2[this.selectedPrioritizations[1]!.loadedSort?.indexOf(eachTestInSet[this.testKey!])!] = eachTestInSet["name"]
            this.testPositionsByName2[eachTestInSet["name"]!] = this.selectedPrioritizations[1]!.loadedSort?.indexOf(eachTestInSet[this.testKey!])!;
        }
    }

    public getAmountOfCoveringTests(className: string, useSecondaryPrioritization: boolean, specificTestIndex?: number) {
        let testsThatCover = this.coveringTests[className]
        let coveredByTests = 0;
        let indexToCompute = specificTestIndex ?? this.currentTestIndex
        testsThatCover.forEach((eachTestThatCovers: string) => {
            let positionsByName = useSecondaryPrioritization ? this.testPositionsByName2 : this.testPositionsByName
            if (positionsByName[eachTestThatCovers] <= indexToCompute) {
                coveredByTests++;
            }
        })
        return coveredByTests;
    }

    handleLineGraphData($event: any) {
        this.graph.data = []

        if (!this.incrementalMode) {
            let xAxis = $event[0].map((x: number, i: number) => i + 1)
            this.graph.layout.xaxis.range = [1, xAxis[xAxis.length - 1]]

            this.graph.data = [
                {
                    y: $event[0],
                    x: xAxis,
                    mode: 'lines',
                    name: "Cumulative covered classes in " + this.selectedPrioritizations[0].name,

                    line: {
                        shape: 'hv',
                        color: '#c51b7d',
                        width: 1,
                    }
                },
                {
                    y: $event[1],
                    x: xAxis,
                    mode: 'lines',
                    name: "Cumulative covered classes in " + this.selectedPrioritizations[1].name,
                    line: {
                        shape: 'hv',
                        width: 1,
                        color: '#a16928',
                    }
                }
            ]
        } else {
            let xAxis = $event.map((x: number, i: number) => i + 1)
            this.graph.layout.xaxis.range = [1, xAxis[xAxis.length - 1]]
            this.graph.data = [
                {
                    y: $event.map((value: any) => (value > 0) ? value : 0),
                    x: xAxis,
                    mode: 'lines',
                    fill: 'tozeroy',
                    name: "Sum Diff covered classes in " + this.selectedPrioritizations[0].name,
                    line: {
                        shape: 'hv',
                        color: '#c51b7d',
                        width: 1,
                    }
                },
                {
                    y: $event.map((value: any) => (value > 0) ? 0 : value),
                    x: xAxis,
                    mode: 'lines',
                    fill: 'tozeroy',
                    name: "Sum Diff covered classes in " + this.selectedPrioritizations[1].name,
                    line: {
                        shape: 'hv',
                        width: 1,
                        color: '#a16928',
                    }
                }


            ]
        }


        let failedTestsInFirst: any = {
            y: [],
            x: [],
            text: [],
            mode: 'markers',
            name: "Failed tests in " + this.selectedPrioritizations[0].name,
            marker: {
                color: "rgba(197,27,125,0.7)",
                symbol: "x"
            }
        }

        let failedTestsInSecond: any = {
            y: [],
            x: [],
            text: [],
            name: "Failed tests in " + this.selectedPrioritizations[1].name,
            mode: 'markers',

            marker: {
                color: "rgba(161,105,40,0.7)",
                symbol: "x"
            }
        }

        this.graph.data[0].x.forEach((eachInXDomain: number) => {
            let testIdFirst = this.selectedPrioritizations[0]!.loadedSort![eachInXDomain - 1]
            if (this.selectedSubject?.failures?.includes(testIdFirst)) {
                failedTestsInFirst.x.push(eachInXDomain)
                failedTestsInFirst.y.push(this.graph.data[0].y[eachInXDomain - 1])
                failedTestsInFirst.text.push(this.testNamesByPosition[eachInXDomain - 1])
            }
        })
        this.graph.data[0].x.forEach((eachInXDomain: number) => {
            let testIdSecond = this.selectedPrioritizations[1]!.loadedSort![eachInXDomain - 1]
            if (this.selectedSubject?.failures?.includes(testIdSecond)) {
                failedTestsInSecond.x.push(eachInXDomain)
                failedTestsInSecond.y.push(this.graph.data[1].y[eachInXDomain - 1])
                failedTestsInSecond.text.push(this.testNamesByPosition2[eachInXDomain - 1])
            }
        })
        this.graph.data.push(failedTestsInFirst)
        this.graph.data.push(failedTestsInSecond)
    }

    handleAliasesChange($event: string) {
        this.callgraph = $event;
        this.rebuildVisualization()
    }

    private rebuildVisualization() {
        this.preprocessing = true;
        setTimeout(() => {
            this.graphologyInstance = new UndirectedGraph();

            this.data = undefined
            this.computeTestPositionsMaps();

            this.testNames = this.testSet?.map((eachTest) => eachTest["name"])!

            let pkgDepth = 0

            this.callgraph!.split("\n").forEach(line => {
                if (line.startsWith("C")) {
                    let originClassName = line.split(" ")[0].split(":")[1].split("$")[0];
                    let destinationClassName = line.split(" ")[1].split("$")[0].split("(")[0];

                    if (line.split(" ")[1].split("$")[0].split("(").length > 1) {
                        destinationClassName = line.split(" ")[1].split("$")[0].split("(")[1].replace(")", "")
                    }

                    let originClassNameParts = originClassName.split(".")
                    let destinationClassNameParts = destinationClassName.split(".")

                    if (originClassNameParts.length > pkgDepth) {
                        pkgDepth = originClassNameParts.length
                    }

                    if (destinationClassNameParts.length > pkgDepth) {
                        pkgDepth = destinationClassNameParts.length
                    }

                    try {
                        this.graphologyInstance!.addNode(originClassName, {
                            label: originClassName,
                            color: 'gray',
                            size: 2
                        })
                    } catch (e) {
                        // ignore.
                    }
                    try {
                        this.graphologyInstance!.addNode(destinationClassName, {
                            label: destinationClassName,
                            color: 'gray',
                            size: 2
                        })
                    } catch (e) {
                        // ignore.
                    }
                    try {
                        this.graphologyInstance!.addEdge(originClassName, destinationClassName);
                    } catch (e) {
                        // ignore.
                    }

                }

            })

            this.classesAddedToHierarchy = []
            this.graphologyInstance!.forEachNode((eachNode) => {
                let splitNodeName = eachNode.split(".")
                for (let i = 0; i < pkgDepth - 1; i++) {
                    this.graphologyInstance?.setNodeAttribute(eachNode, "pkg" + i, i < splitNodeName.length ? splitNodeName[i] : 't')
                }
                if (!this.testNames.includes(eachNode)) {
                    let testsThatCoverNode: string[] = []
                    dfsFromNode(this.graphologyInstance!, eachNode, (node, attr, depth) => {
                        if (this.testNames.includes(node)) {
                            testsThatCoverNode.push(node)
                        }
                        return depth >= 1;
                    })
                    this.coveringTests[eachNode] = testsThatCoverNode;
                    if (this.maxNumberOfTestsThatCoverNode < testsThatCoverNode.length) {
                        this.maxNumberOfTestsThatCoverNode = testsThatCoverNode.length
                    }

                    this.addToHierarchy(eachNode.split("."));

                }

            })

            let pkgAttributes = []
            for (let i = 0; i < pkgDepth - 1; i++) {
                pkgAttributes.push("pkg" + i)
            }

            this.preprocessing = false;
        }, 10)

    }
}
