import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges,
    ViewChild
} from '@angular/core';
import Sigma from "sigma";
import Graph from "graphology";
import {Attributes} from "graphology-types";
import {WorkspaceTreeNode} from "../../../../model/workspace-tree-node";
import {CameraState, EdgeDisplayData, NodeDisplayData} from "sigma/types";
import * as d3 from "d3";
import * as d3legend from "d3-svg-legend";
import {BehaviorSubject, max, Observable, Subscription} from "rxjs";
import {axisBottom} from "d3";
import {interpolateCubehelixDefault} from "d3-scale-chromatic";

@Component({
    selector: 'app-graph-renderer',
    templateUrl: './graph-renderer.component.html',
    styleUrls: ['./graph-renderer.component.scss']
})
export class GraphRendererComponent implements OnChanges, OnDestroy, AfterViewInit {


    @ViewChild("d3Renderer")
    public d3Renderer!: ElementRef;

    @ViewChild("legendRenderer")
    private legendRenderer!: ElementRef;


    public renderer?: Sigma<Graph<Attributes, Attributes, Attributes>>;
    public hoveredNode?: string;

    public selectedNode?: string;
    public suggestions?: Set<string>;

    public hoveredNeighbors?: Set<string>;
    public uuid?: string = crypto.randomUUID();

    @Input()
    public graph!: Graph<Attributes, Attributes, Attributes>;

    @Input()
    public testSet!: any[];

    @Input()
    public currentTestIndex!: number;

    @Input()
    public coveringTests: any = {};

    @Input()
    public prioritization!: WorkspaceTreeNode;

    @Input()
    public secondPrioritization!: WorkspaceTreeNode;

    @Input()
    public subject!: WorkspaceTreeNode;

    @Input()
    public testKey!: string;

    @Input()
    public incrementalMode: boolean = true;

    @Input()
    public packageMode: boolean = false;

    @Output()
    public requestPause: EventEmitter<void> = new EventEmitter<void>();

    @Output()
    public diffLineGraphData: EventEmitter<number[]> = new EventEmitter<number[]>();

    @Output()
    public cumulativeCoverageLineGraphData: EventEmitter<number[][]> = new EventEmitter<number[][]>();

    @Input()
    public testNamesByPosition: any = {};

    @Input()
    testPositionsByName: any = {};

    @Input()
    testPositionsByName2: any = {};

    @Input()
    amountOfCoveringTestsFn!: Function;

    public failingTestNames: string[] = [];

    public unknownTestColor: string = "white"
    public nonCoverClassColorLeft: string = "white"
    public coverClassColorLeft: string = "#05003b"
    public nonCoverClassColorRight: string = "white"
    public coverClassColorRight: string = "#05003b"
    public turboScale: string[] = ["#23171b","#271a28","#2b1c33","#2f1e3f","#32204a","#362354","#39255f","#3b2768","#3e2a72","#402c7b","#422f83","#44318b","#453493","#46369b","#4839a2","#493ca8","#493eaf","#4a41b5","#4a44bb","#4b46c0","#4b49c5","#4b4cca","#4b4ecf","#4b51d3","#4a54d7","#4a56db","#4959de","#495ce2","#485fe5","#4761e7","#4664ea","#4567ec","#446aee","#446df0","#426ff2","#4172f3","#4075f5","#3f78f6","#3e7af7","#3d7df7","#3c80f8","#3a83f9","#3985f9","#3888f9","#378bf9","#368df9","#3590f8","#3393f8","#3295f7","#3198f7","#309bf6","#2f9df5","#2ea0f4","#2da2f3","#2ca5f1","#2ba7f0","#2aaaef","#2aaced","#29afec","#28b1ea","#28b4e8","#27b6e6","#27b8e5","#26bbe3","#26bde1","#26bfdf","#25c1dc","#25c3da","#25c6d8","#25c8d6","#25cad3","#25ccd1","#25cecf","#26d0cc","#26d2ca","#26d4c8","#27d6c5","#27d8c3","#28d9c0","#29dbbe","#29ddbb","#2adfb8","#2be0b6","#2ce2b3","#2de3b1","#2ee5ae","#30e6ac","#31e8a9","#32e9a6","#34eba4","#35eca1","#37ed9f","#39ef9c","#3af09a","#3cf197","#3ef295","#40f392","#42f490","#44f58d","#46f68b","#48f788","#4af786","#4df884","#4ff981","#51fa7f","#54fa7d","#56fb7a","#59fb78","#5cfc76","#5efc74","#61fd71","#64fd6f","#66fd6d","#69fd6b","#6cfd69","#6ffe67","#72fe65","#75fe63","#78fe61","#7bfe5f","#7efd5d","#81fd5c","#84fd5a","#87fd58","#8afc56","#8dfc55","#90fb53","#93fb51","#96fa50","#99fa4e","#9cf94d","#9ff84b","#a2f84a","#a6f748","#a9f647","#acf546","#aff444","#b2f343","#b5f242","#b8f141","#bbf03f","#beef3e","#c1ed3d","#c3ec3c","#c6eb3b","#c9e93a","#cce839","#cfe738","#d1e537","#d4e336","#d7e235","#d9e034","#dcdf33","#dedd32","#e0db32","#e3d931","#e5d730","#e7d52f","#e9d42f","#ecd22e","#eed02d","#f0ce2c","#f1cb2c","#f3c92b","#f5c72b","#f7c52a","#f8c329","#fac029","#fbbe28","#fdbc28","#feb927","#ffb727","#ffb526","#ffb226","#ffb025","#ffad25","#ffab24","#ffa824","#ffa623","#ffa323","#ffa022","#ff9e22","#ff9b21","#ff9921","#ff9621","#ff9320","#ff9020","#ff8e1f","#ff8b1f","#ff881e","#ff851e","#ff831d","#ff801d","#ff7d1d","#ff7a1c","#ff781c","#ff751b","#ff721b","#ff6f1a","#fd6c1a","#fc6a19","#fa6719","#f96418","#f76118","#f65f18","#f45c17","#f25916","#f05716","#ee5415","#ec5115","#ea4f14","#e84c14","#e64913","#e44713","#e24412","#df4212","#dd3f11","#da3d10","#d83a10","#d5380f","#d3360f","#d0330e","#ce310d","#cb2f0d","#c92d0c","#c62a0b","#c3280b","#c1260a","#be2409","#bb2309","#b92108","#b61f07","#b41d07","#b11b06","#af1a05","#ac1805","#aa1704","#a81604","#a51403","#a31302","#a11202","#9f1101","#9d1000","#9b0f00","#9a0e00","#980e00","#960d00","#950c00","#940c00","#930c00","#920c00","#910b00","#910c00","#900c00","#900c00","#900c00"]
    public divergingColorScaleLeft: string = "#660041"
    public divergingColorScaleMiddle: string = "#ffffff"
    public divergingColorScaleRight: string = "#a16928"


    @Input()
    maxNumberOfTestsThatCoverANode: number = 0;

    @Input() cameraSubject!: BehaviorSubject<CameraState | undefined>;
    @Input() hoveredNodeSubject!: BehaviorSubject<{ hoveredNode?: string, hoveredNeighbors?: Set<string> }>;
    @Input() refreshEmitter!: EventEmitter<void>;
    @Input() hierarchyTree!: any;
    private subscriptions: Subscription[] = [];
    @Output() private nodeClickEmitter: EventEmitter<number> = new EventEmitter();
    private nodes: any;
    @Input() isSecondPrioritization: boolean = false;
    private minDiff: number = 0;
    private maxDiff: number = 0;
    private minDiffPkg: number = 0;
    private maxDiffPkg: number = 0;
    private legendGradientDef: any;
    private svg: any;
    private legendAxisBottom: any
    private legendHeight: number = 20
    private legendWidth: number = 300
    private legendBarHeight: number = 20
    private legendMargin: { top: number; left: number; bottom: number; right: number } = {
        left: 0,
        right: 0,
        bottom: 0,
        top: 0
    }
    private legendGradientInstance: any;
    private legendWrapper: any;
    private maxCallsPackage: number = 0;
    private svgLegend: any;
    private loaded: boolean = false;
    private linearGradientUuid: string = "gradient_" + crypto.randomUUID();

    ngAfterViewInit() {
        this.clearRender();

    }


    ngOnDestroy(): void {
        this.renderer?.kill();
        this.renderer = undefined;
        this.subscriptions.forEach((eachSub) => {
            eachSub.unsubscribe();
        })

    }

    ngOnChanges(changes: SimpleChanges): void {
        setTimeout(() => {
            if (changes["currentTestIndex"] || changes["incrementalMode"] || changes["packageMode"]) {
                if (changes["incrementalMode"] || changes["packageMode"]) {
                    this.computeDiffsOrCumulativeCoverage();
                }
                this.update();
            }
        }, 50)
    }

    private logBase10(val: number) {
        if (val == 0) {
            return 0
        }
        return Math.log(val) / Math.LN10;
    }

    public update() {
        if (!this.loaded || !this.legendGradientDef) {
            return;
        }
        let colorScale: any = undefined;
        let isQuantize = false;
        if (this.incrementalMode) {
            if (this.secondPrioritization) {
                colorScale = d3.scaleLinear()
                    .domain([this.packageMode ? this.minDiffPkg : this.minDiff, 0, this.packageMode ? this.maxDiffPkg : this.maxDiff])
                    .range(<any>[this.divergingColorScaleRight, this.divergingColorScaleMiddle, this.divergingColorScaleLeft,])
            } else if (this.isSecondPrioritization) {
                isQuantize = true
                //@ts-ignore
                colorScale = d3.scaleQuantize().domain([0, this.packageMode ? this.maxCallsPackage : this.logBase10(this.maxNumberOfTestsThatCoverANode)]).range(d3.schemeBlues[9])
            } else {
                isQuantize = true
                //@ts-ignore
                colorScale = d3.scaleQuantize().domain([0, this.packageMode ? this.maxCallsPackage : this.logBase10(this.maxNumberOfTestsThatCoverANode)]).range(d3.schemeBlues[9])
            }
        } else {
            if (this.secondPrioritization) { // Não incremental, diff.
                colorScale = d3.scaleLinear()
                    .domain([-1, 0, 1])
                    .range(<any>[this.divergingColorScaleRight, this.divergingColorScaleMiddle, this.divergingColorScaleLeft,])
            } else if (this.isSecondPrioritization) { // Não incremental, direita.
                colorScale = d3.scaleLinear()
                    .domain([0, 1])
                    .range(<any>[this.nonCoverClassColorRight, this.coverClassColorRight])
            } else { // Não incremental, esquerda.
                colorScale = d3.scaleLinear()
                    .domain([0, 1])
                    .range(<any>[this.nonCoverClassColorLeft, this.coverClassColorLeft])
            }
        }
        d3.select('#'+this.linearGradientUuid).selectAll("stop").remove()
        d3.select('#'+this.linearGradientUuid).selectAll("stop")
            .data(colorScale.ticks(400).map((t: number, i: number, n: any) => {
                return {
                    offset: `${100 * i / n.length}%`,
                    t,
                    color: colorScale(t)
                }
            }))
            .enter().append("stop")
            .attr("offset", (d: any) => d.offset)
            .attr("i", (d: any) => d.t)
            .attr("stop-color", (d: any) => d.color);

        let tickDomain = []

        if (colorScale.domain().length == 3) {
            let zeroPos = Math.abs(colorScale.domain()[0]) / (Math.abs(colorScale.domain()[0]) + Math.abs(colorScale.domain()[2]))
            tickDomain = [this.legendMargin.left, (this.legendWidth * zeroPos) - this.legendMargin.right, this.legendWidth - this.legendMargin.right]
        } else {
            tickDomain = [this.legendMargin.left, this.legendWidth - this.legendMargin.right]
        }

        let axisScale = d3.scaleLinear()
            .domain(colorScale.domain())
            .range(tickDomain)
        let axisBottom;
        if (isQuantize) {
            axisBottom = (g: any) => g
                .attr("class", `x-axis`)
                .attr("transform", `translate(0,${this.legendBarHeight - this.legendMargin.bottom})`)
                .call(d3.axisBottom(axisScale)
                    .tickValues(d3.schemeBlues[9].map((color, index) => {
                        return (colorScale.domain()[1]/9)*index
                    }))
                    .tickSize(-this.legendBarHeight))
        } else {
            axisBottom = (g: any) => g
                .attr("class", `x-axis`)
                .attr("transform", `translate(0,${this.legendBarHeight - this.legendMargin.bottom})`)
                .call(d3.axisBottom(axisScale)
                    .ticks(this.legendWidth / 40)
                    .tickSize(-this.legendBarHeight))
        }


        this.legendAxisBottom.call(axisBottom)

        this.nodes
            .style("display", (d: any, i: any) => {
                if ((!d.children) && this.packageMode) {
                    return "none"
                }
                return "block"
            })
            .style("fill", (d: any) => {
                let resultingColor: string = ""
                if (this.maxCallsPackage == 0) {
                    this.calculateCumulativeCoverage([d], false, this.testSet.length - 1)
                }
                let node = d.data["name"]

                let testsThatCover = this.coveringTests[node]
                let coveredByFirst = false;
                let coveredBySecond = false;
                if (testsThatCover) {
                    let coveredByTests = this.amountOfCoveringTestsFn(node, this.isSecondPrioritization);
                    let coveredByTests2 = this.amountOfCoveringTestsFn(node, true);
                    coveredByFirst = coveredByTests > 0;
                    coveredBySecond = coveredByTests2 > 0;

                    if (this.secondPrioritization) {
                        coveredByTests = coveredByTests - coveredByTests2;
                    }


                    if (this.incrementalMode) {
                        if (!this.secondPrioritization) {
                            resultingColor = colorScale(this.logBase10(coveredByTests)).toString()
                        } else {
                            resultingColor = colorScale(coveredByTests).toString()
                        }
                    } else {
                        if (this.secondPrioritization) {
                            if (coveredByFirst && coveredBySecond) {
                                resultingColor = colorScale(0).toString()
                            } else if (coveredByFirst) {
                                resultingColor = this.divergingColorScaleLeft
                            } else if (coveredBySecond) {
                                resultingColor = this.divergingColorScaleRight
                            } else {
                                resultingColor = this.unknownTestColor
                            }
                        } else {
                            if (this.isSecondPrioritization) {
                                if (coveredByTests > 0) {
                                    resultingColor = this.coverClassColorRight
                                } else {
                                    resultingColor = this.nonCoverClassColorRight
                                }
                            } else {
                                if (coveredByTests > 0) {
                                    resultingColor = this.coverClassColorLeft
                                } else {
                                    resultingColor = this.nonCoverClassColorLeft
                                }
                            }
                        }
                    }
                } else if (this.packageMode) {
                    if (this.secondPrioritization) { // packageMode, diff
                        let coveredOnLeft = this.calculateCumulativeCoverage([d], false)
                        let coveredOnRight = this.calculateCumulativeCoverage([d], true)
                        let resultingNumber = coveredOnLeft - coveredOnRight
                        if (!this.incrementalMode) {
                            if (coveredOnLeft > 0 && coveredOnRight > 0) {
                                resultingNumber = 0;
                            } else if (coveredOnLeft == 0 && coveredOnRight > 0) {
                                resultingNumber = 1
                            } else if (coveredOnLeft > 0 && coveredOnRight == 0) {
                                resultingNumber = -1
                            } else {
                                resultingNumber = 0
                            }
                        }
                        resultingColor = colorScale(resultingNumber)
                    } else { // packageMode, bottom
                        let resultingNumber = this.calculateCumulativeCoverage([d], this.isSecondPrioritization)
                        if (!this.incrementalMode && resultingNumber > 0) {
                            resultingNumber = 1;
                        }
                        resultingColor = colorScale(resultingNumber)
                    }
                }


                return resultingColor
            });
    }

    private configureRenderer() {

        const packDef = (data: any) => d3.pack()
            .size([300, 300])
            .padding(.5)(d3.hierarchy(data).sum(d => Math.sqrt(d.value))
                .sort((a, b) => b.value! - a.value!))
        const root = packDef(this.hierarchyTree);


        this.svg = d3.select(this.d3Renderer.nativeElement)
            .attr("viewBox", `0 0 300 300`)
            .attr("style", `max-width: 100%; display: block; background: white; cursor: pointer;`);
        this.svgLegend = d3.select(this.legendRenderer.nativeElement)
            .attr("viewBox", `-10 0 ${this.legendWidth} ${this.legendHeight}`)
        var div = d3.select("body").append("div")
            .style("opacity", 0)
            .style("z-index", 1)
            .style("background-color", 'white')
            .style("margin", '4px 0 0 4px')
            .style("padding", '4px')
            .style("position", 'absolute')
        this.nodes = this.svg.append("g")
            .selectAll("circle")
            .data(root.descendants().slice(1))
            .join("circle")
            .attr("fill", (d: any) => d.children ? "white" : "purple")
            .attr("class", (d: any) => "circle-transition")
            .attr("stroke", (d: any) => d.children ? 'rgba(0,0,0,.2)' : null)
            .on("mouseout", (d: any, i: any) => {
                div.html("")
                    .style("opacity", 0)
                    .style("left", d.pageX + "px")
                    .style("top", d.pageY + "px");
            })
            .on("mousemove", function (d: any, i: any) {
                div
                    .style("opacity", 1)
                    .style("left", d.pageX + "px")
                    .style("top", d.pageY + "px");
            })
            .on("mouseover", (d: any, i: any) => {
                let text = i.data["name"]
                try {
                    if (this.secondPrioritization) {
                        text += " (" + this.amountOfCoveringTestsFn(i.data["name"], true) + "/" + this.amountOfCoveringTestsFn(i.data["name"], false) + ")";
                    } else {
                        text += " (" + this.amountOfCoveringTestsFn(i.data["name"], this.isSecondPrioritization) + ", " + this.logBase10(this.amountOfCoveringTestsFn(i.data["name"], this.isSecondPrioritization)) + ")";
                    }
                } catch (_) {
                    if (this.secondPrioritization) {
                        text += " (" + this.calculateCumulativeCoverage([i], true) + "/" + this.calculateCumulativeCoverage([i], false) + ")";
                    } else {
                        text += " (" + this.calculateCumulativeCoverage([i], this.isSecondPrioritization) + ")";
                    }
                }

                div.html(text).style("left", d.pageX + "px")
                    .style("opacity", 1)
                    .style("top", d.pageY + "px");
            });

        this.legendWrapper = this.svgLegend.append("g").attr("transform", "scale(.9)")

        this.legendGradientDef = this.legendWrapper.append("g").append("linearGradient").attr("id", this.linearGradientUuid);
        this.legendGradientInstance = this.legendWrapper.append('g')
            .attr("transform", `translate(0,${this.legendHeight - this.legendMargin.bottom - this.legendBarHeight})`)
            .append("rect")
            .attr('transform', `translate(${this.legendMargin.left}, 0)`)
            .attr("width", this.legendWidth - this.legendMargin.right - this.legendMargin.left)
            .attr("height", this.legendBarHeight)
            .style("fill", "url(#" + this.linearGradientUuid + ")");


        this.legendAxisBottom = this.legendWrapper.append('g');

        const handleZoom = (e: any) => {
            if (e && e.transform) {
                d3.select(this.d3Renderer.nativeElement.children[0]).attr("transform", e.transform)
            }
        }

        let zoom: any = d3.zoom().on('zoom', (e) => {
            this.cameraSubject.next(e)
            handleZoom(e)
        });

        d3.select(this.d3Renderer.nativeElement).call(zoom);


        let focus = root;

        const zoomTo = (v: any) => {
            const k = 300 / v[2];

            this.nodes.attr("transform", (d: any) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
            this.nodes.attr("r", (d: any) => d.r * k);
        }

        zoomTo([focus.x, focus.y, focus.r * 2]);

        this.subscriptions.push(this.cameraSubject.subscribe((newCameraState) => {
            handleZoom(newCameraState);
        }))


        if (this.secondPrioritization) {
            this.minDiffPkg = 0;
            this.maxDiffPkg = 0;
            for (let i = 0; i < this.testSet.length - 1; i++) {
                this.svg.selectAll("g").selectAll("circle").each((d: any) => {
                    if (d.children) {
                        let coveredOnLeftPrioritization = this.calculateCumulativeCoverage([d], false, i)
                        let coveredOnRightPrioritization = this.calculateCumulativeCoverage([d], true, i)
                        let diff = coveredOnLeftPrioritization - coveredOnRightPrioritization
                        if (diff < this.minDiffPkg) {
                            this.minDiffPkg = diff;
                        } else if (diff > this.maxDiffPkg) {
                            this.maxDiffPkg = diff;
                        }
                    }
                })
            }
        }
        this.loaded = true;
    }

    private calculateCumulativeCoverage(d: any[], useSecondaryPrioritization: boolean, specificTestIndex: number | undefined = undefined): number {
        let sum = 0;
        for (let eachNode of d) {
            if (eachNode.children) {
                sum = sum + this.calculateCumulativeCoverage(eachNode.children, useSecondaryPrioritization, specificTestIndex)
            } else {
                // Nó final
                if (this.testPositionsByName[eachNode.data["name"]] == undefined) {
                    sum = sum + this.amountOfCoveringTestsFn(eachNode.data["name"], useSecondaryPrioritization, specificTestIndex)
                }
            }
        }
        if (sum > this.maxCallsPackage) {
            this.maxCallsPackage = sum;
        }
        return sum;
    }

    private clearRender() {
            this.computeDiffsOrCumulativeCoverage()
            this.configureRenderer();
    }

    private computeDiffsOrCumulativeCoverage() {

        if (!this.incrementalMode) {
            let cumulativeCoverageLeft = [];
            let cumulativeCoverageRight = [];
            this.minDiff = -1;
            this.maxDiff = 1;

            for (let i = 0; i < this.testSet.length; i++) {
                let coveredToThisPointLeft = 0
                let coveredToThisPointRight = 0
                this.graph.nodes().forEach((eachClassOrTest) => {
                    let testsThatCover = this.coveringTests[eachClassOrTest]
                    if (testsThatCover) {
                        let coveredInFirst: boolean = false;
                        let coveredInSecond: boolean = false;
                        testsThatCover.forEach((eachTestThatCovers: string) => {
                            if (this.testPositionsByName[eachTestThatCovers] <= i) {
                                coveredInFirst = true
                            }
                            if (this.testPositionsByName2[eachTestThatCovers] <= i) {
                                coveredInSecond = true
                            }
                        })
                        if (coveredInFirst) {
                            coveredToThisPointLeft++;
                        }
                        if (coveredInSecond) {
                            coveredToThisPointRight++;
                        }

                    }
                })
                cumulativeCoverageLeft.push(coveredToThisPointLeft)
                cumulativeCoverageRight.push(coveredToThisPointRight)
            }
            this.cumulativeCoverageLineGraphData.emit([cumulativeCoverageLeft, cumulativeCoverageRight])
            return;
        }

        let diffs: number[] = [];

        this.minDiff = 0;
        this.maxDiff = 0;

        for (let i = 0; i < this.testSet.length; i++) {
            let totaldiff = 0
            this.graph.nodes().forEach((eachClassOrTest) => {
                let testsThatCover = this.coveringTests[eachClassOrTest]
                if (testsThatCover) {
                    let coveringTestsInFirst = 0;
                    let coveringTestsInSecond = 0;
                    testsThatCover.forEach((eachTestThatCovers: string) => {
                        if (this.testPositionsByName[eachTestThatCovers] <= i) {
                            coveringTestsInFirst++;
                        }
                        if (this.testPositionsByName2[eachTestThatCovers] <= i) {
                            coveringTestsInSecond++;
                        }

                    })
                    let diff = coveringTestsInFirst - coveringTestsInSecond;
                    if (diff > this.maxDiff) {
                        this.maxDiff = diff;

                    }
                    if (diff < this.minDiff) {
                        this.minDiff = diff;
                    }
                    totaldiff += coveringTestsInFirst - coveringTestsInSecond;
                }
            })
            diffs.push(totaldiff)
        }

        this.diffLineGraphData.emit(diffs)
    }

    getNameBgColor() {
        if (this.secondPrioritization) {
            return 'diff-background'
        }
        return this.isSecondPrioritization ? 'right-background' : 'left-background';
    }

    getBorderColor() {
        if (this.secondPrioritization) {
            return 'diff-border'
        }
        return this.isSecondPrioritization ? 'right-border' : 'left-border';
    }
}
