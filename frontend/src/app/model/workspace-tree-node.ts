import {FailureVersion} from "./failure-version";
import {ClrSelectedState} from "@clr/angular";
import {Color} from "./color";

export class WorkspaceTreeNode {
  name!: string;
  type!: "folder" | "prioritization" | "subject";
  path?: string;
  testSetPath?: string;
  callGraphPath?: string;
  data?: WorkspaceTreeNode[]
  // For type=subject
  failures?: string[];
  // For type=prioritization
  autc?: number;
  metricAvg?: number;
  loadedSort?: string[];
  treePath?: string;
  colorRGB?: Color;
  testKey?: string;
  averageMetric?: number;
  apfd?: number;
  selected: ClrSelectedState = ClrSelectedState.UNSELECTED;
  parentId?: string;
  buildNumber?: number;
}
