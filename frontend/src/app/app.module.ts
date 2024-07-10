import {NgModule, isDevMode} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import { NgxSliderModule } from 'ngx-slider-v2';
import {AppComponent} from './app.component';
import {ClarityModule} from "@clr/angular";
import {HttpClientModule} from "@angular/common/http";
import {PrioritizationTreeComponent} from './components/prioritization-tree/prioritization-tree.component';
import {CdkDrag, CdkDragHandle, CdkDropList} from "@angular/cdk/drag-drop";
import {ServiceWorkerModule} from '@angular/service-worker';
import {AutcComponent} from './components/tools/autc/autc.component';
import {MatrixComponent} from './components/tools/matrix/matrix.component';
import {PrioritizationDropzoneComponent} from './components/prioritization-dropzone/prioritization-dropzone.component';
import {MetricBadgeComponent} from './components/metric-badge/metric-badge.component';
import {PlotlyModule} from "angular-plotly.js";
import * as PlotlyJS from 'plotly.js-dist-min';
import {NgxResizeObserverModule} from "ngx-resize-observer";
import {TableComponent} from './components/tools/table/table.component';
import {AgGridModule} from 'ag-grid-angular';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {StackComponent} from "./components/tools/stack/stack.component";
import {NgForOf} from '@angular/common';
import {GridsterComponent, GridsterItemComponent} from 'angular-gridster2';
import { SubjectOverviewComponent } from './components/tools/subject-overview/subject-overview.component';
import { MetricBoxPlotComponent } from './components/tools/metric-box-plot/metric-box-plot.component';
import {PositionParallelCoordinatesComponent} from "./components/tools/position-parallel-coords/position-parallel-coordinates.component";
import { CurveTsneComponent } from './components/tools/curve-tsne/curve-tsne.component';
import {UiLongPressDirective} from "./utils/long-press";
import { ColorPickerModule } from '@iplab/ngx-color-picker';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MetricEvolutionComponent } from './components/tools/metric-evolution/metric-evolution.component';
import { TestAgeComponent } from './components/tools/test-age/test-age.component';
import { PickDataBtnComponent } from './components/pick-data-btn/pick-data-btn.component';
import { ToolOverlayComponent } from './components/tool-overlay/tool-overlay.component';
import { MetricEvolutionHeatmapComponent } from './components/tools/metric-evolution-heatmap/metric-evolution-heatmap.component';
import { DialogControlComponent } from './components/dialog-control/dialog-control.component';
import { CallGraphComponent } from './components/tools/call-graph/call-graph.component';
import { GraphRendererComponent } from './components/tools/call-graph/graph-renderer/graph-renderer.component';
import {FeatureMapperComponent} from "./components/tools/call-graph/feature-mapper/feature-mapper.component";
PlotlyModule.plotlyjs = PlotlyJS;

@NgModule({
  declarations: [
    AppComponent,
    PrioritizationTreeComponent,
    AutcComponent,
    MatrixComponent,
    StackComponent,
    PrioritizationDropzoneComponent,
    MetricBadgeComponent,
    TableComponent,
    SubjectOverviewComponent,
    MetricBoxPlotComponent,
    PositionParallelCoordinatesComponent,
    CurveTsneComponent,
    UiLongPressDirective,
    MetricEvolutionComponent,
    TestAgeComponent,
    PickDataBtnComponent,
    ToolOverlayComponent,
    MetricEvolutionHeatmapComponent,
    DialogControlComponent,
    CallGraphComponent,
    GraphRendererComponent,
    FeatureMapperComponent,
  ],
  imports: [
    BrowserModule,
    AgGridModule,
    ClarityModule,
    BrowserAnimationsModule,
    HttpClientModule,
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
    NgxResizeObserverModule,
    NgxSliderModule,
    PlotlyModule,
    ColorPickerModule,
    NgForOf, GridsterComponent, GridsterItemComponent,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
