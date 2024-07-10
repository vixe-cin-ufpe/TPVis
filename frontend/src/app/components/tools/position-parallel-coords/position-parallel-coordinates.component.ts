import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {WorkspaceTreeNode} from "../../../model/workspace-tree-node";
import {AbstractPlotlyTool} from "../abstract-plotly-tool";
import 'zone.js/dist/long-stack-trace-zone';
import {Options} from "ngx-slider-v2";
import {FormControl} from "@angular/forms";
import {debounceTime} from "rxjs";
import * as reorder from 'reorder.js'

@Component({
  selector: 'app-position-parallel-coordinates',
  templateUrl: './position-parallel-coordinates.component.html',
  styleUrls: ['./position-parallel-coordinates.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PositionParallelCoordinatesComponent extends AbstractPlotlyTool implements OnInit {
  private failureSet: string[] = [];
  private prioritizations: WorkspaceTreeNode[] = [];

  sliderOpts: Options = {
    floor: 0,
    ceil: 500,
    maxRange: 500,
    minRange: 3,
    draggableRange: true
  };
  sliderControl: FormControl = new FormControl([0, 500]);
  mode: "all" | "changes" | "failure_and_changes" | "failures" = "changes";

  constructor() {
    super();
      this.graph.layout.margin = {l: 60, t: 100, r: 10, b: 40, pad: 0};
  }

  onSelectionChange(event: WorkspaceTreeNode[]) {
    this.prioritizations = event;
    this.plot();
  }

  onFailureSetChange(event: string[]) {
    this.failureSet = event;
    this.plot()
  }

  public plot(): void {
    let data: any = {
      type: "parcoords",
      dimensions: [],
      line: {}
    };

    if (this.prioritizations.length < 1) {
      this.graph.data = []
      let opt: Options = {
        floor: 0,
        ceil: 500,
        maxRange: 500,
        minRange: 3,
        draggableRange: true
      }
      this.sliderOpts = opt;
      return;
    }

    const allEqual = (arr: number[]) => arr.every(val => val === arr[0]);

    let opt: Options = {
      floor: 0,
      ceil: this.prioritizations[0].loadedSort!.length,
      maxRange: 500,
      minRange: 3,
      draggableRange: true
    }
    this.sliderOpts = opt;

    let reference = this.prioritizations[0].loadedSort!.slice(this.sliderControl.value[0], this.sliderControl.value[1]);
    let testLength = reference.length;

    let atLeastOneFailed = false;
    let testsToDisplay: string[] = [];
    if (this.mode == "all") {
      testsToDisplay = [...reference];
    } if (this.mode == "failures") {
      testsToDisplay = [...this.failureSet];
    } else {
      reference.forEach((eachTest, index) => {
        let positionsOfEachTest = [];
        for (const eachPrioritization of this.prioritizations) {
          let sliced = eachPrioritization.loadedSort!.slice(this.sliderControl.value[0], this.sliderControl.value[1])
          positionsOfEachTest.push(sliced.indexOf(eachTest));
        }
        if (!allEqual(positionsOfEachTest) || (this.failureSet.includes(eachTest) && this.mode == "failure_and_changes")) {
          testsToDisplay.push(eachTest);
        }
      })
    }

    reference = reference.filter(eachTest => testsToDisplay.includes(eachTest));
    data.line.color = reference.map((eachReferenceTest) => {
      if (this.failureSet.includes(eachReferenceTest)) {
        atLeastOneFailed = true;
        return 0;
      } else {
        return 1
      }
    })
    data.line.color = data.line.color.reverse()
    if (this.mode == "failures") {
      data.line.colorscale = [[0, '#ff0000'], [1, '#ff0000']]
    }else if (atLeastOneFailed) {
      data.line.colorscale = [[0, '#ff0000'], [1, '#00aaff']]
    } else {
      data.line.colorscale = [[0, '#00aaff'], [1, '#00aaff']]
    }
    this.prioritizations.forEach((eachPrioritization, index) => {
      let sliced = eachPrioritization.loadedSort!.slice(this.sliderControl.value[0], this.sliderControl.value[1])
      data.dimensions.push({
        range: [this.sliderControl.value[0], this.sliderControl.value[0] + testLength].reverse(),
        label: eachPrioritization.name,
        path: eachPrioritization.path,
        tickvals: [],
        ticktext: [],
        values: reference!.map((eachTest) => {
          let result = this.sliderControl.value[0] + sliced.indexOf(eachTest)
          if (result == -1) {
            let actualPosition = eachPrioritization.loadedSort!.indexOf(eachTest)
            return actualPosition;
          }
          return result
        }).reverse()
      });
    });

    let prioritizationMatrix = data.dimensions.map((eachDimension: any) => eachDimension.values);
    let orderedDimensions = reorder.optimal_leaf_order().reorder(prioritizationMatrix)

    data.dimensions = orderedDimensions.map((eachDimensionIndex) => data.dimensions[eachDimensionIndex]);
    let sliced = this.prioritizations.filter((eachPrioritization) => eachPrioritization.path == data.dimensions[0].path)[0].loadedSort!.slice(this.sliderControl.value[0], this.sliderControl.value[1])

    data.dimensions[0].tickvals = sliced.map((eachTest) => sliced.indexOf(eachTest) + this.sliderControl.value[0]).reverse()
    data.dimensions[0].ticktext = sliced.map((eachTest) => (sliced.indexOf(eachTest) + +this.sliderControl.value[0]) + " (" + eachTest + ")").reverse()

    sliced = this.prioritizations.filter((eachPrioritization) => eachPrioritization.path == data.dimensions[data.dimensions.length - 1].path)[0].loadedSort!.slice(this.sliderControl.value[0], this.sliderControl.value[1])

    this.graph.layout.height = testLength * 10;

    this.graph.data = [data];
  }

  override handleResize($event: ResizeObserverEntry) {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.graph.layout.width = $event.contentRect.width;
    }, 500)
  }

  ngOnInit(): void {
    this.sliderControl.valueChanges.pipe(debounceTime(2000)).subscribe(() => {
      this.plot();
    })
  }

}
