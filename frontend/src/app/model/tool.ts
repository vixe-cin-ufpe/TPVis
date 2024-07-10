export class Tool {
  name!: string;
  id!: 'metric-evolution'|'call-graph'|'metric-evolution-heatmap'|'autc'|'matrix'|'table'|'stack'|'subject-overview'|'metric-overview'|'position-parallel-coords'|'curve-tsne'|'test-age';
  inputAmount!: number;
  subjectAmount!: number;
  editable!: boolean;
  icon!: string;
}
