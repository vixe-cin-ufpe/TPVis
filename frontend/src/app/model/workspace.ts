import {WorkspaceTreeNode} from "./workspace-tree-node";

export class Workspace {
  name?: string;
  metrics?: ("AUTC"|"APFD")[];
  data?: WorkspaceTreeNode[];
}
