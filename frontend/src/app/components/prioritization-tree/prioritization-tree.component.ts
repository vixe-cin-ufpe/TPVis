import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {WorkspaceTreeNode} from "../../model/workspace-tree-node";
import {StatusService} from "../../services/status.service";
import {NodeDndService} from "../../services/node-dnd.service";
import {AbstractControl, FormControl} from "@angular/forms";
import {debounce, debounceTime} from "rxjs";
import {ModifierKeySharedService} from "../../services/modifier-key-shared.service";

@Component({
  selector: 'app-prioritization-tree',
  templateUrl: './prioritization-tree.component.html',
  styleUrls: ['./prioritization-tree.component.scss'],
})
export class PrioritizationTreeComponent implements OnInit {

  @Input()
  public workspaceTreeNodes!: WorkspaceTreeNode[];

  @Input()
  collapsed: boolean = false;

  @Output()
  collapsedChange = new EventEmitter<boolean>();

  public filterControl: FormControl = new FormControl("");
  private selectionMode: boolean = false;
  public filteredWorkspaceTreeNodes: WorkspaceTreeNode[] = [];

  constructor(public nodeDndService: NodeDndService, public modifierKeyService: ModifierKeySharedService, public statusService: StatusService) {}

  getChildren = (workspaceTreeNode: WorkspaceTreeNode) => workspaceTreeNode.data;
  dndBehaviour?: string;

  ngOnInit(): void {
    this.dndBehaviour = "all"
    this.emitDndMode();

    this.nodeDndService.dndBehaviour.subscribe((newValue) => {
      this.dndBehaviour = newValue;
    })
    this.modifierKeyService.isControlKeyDown.subscribe((isSelectionEnabled) => {
      this.selectionMode = isSelectionEnabled;
    })
    this.filteredWorkspaceTreeNodes = this.workspaceTreeNodes;
    this.filterControl.valueChanges.pipe( debounceTime(1000) ).subscribe(
      value => {
        if (value) {
          this.filteredWorkspaceTreeNodes = this.filterNodesByName(this.workspaceTreeNodes, value);
        } else {
          this.filteredWorkspaceTreeNodes = this.workspaceTreeNodes;
        }
      }
    )
  }


  containsMatch(node: WorkspaceTreeNode, name: string): boolean {
    if (node.name.includes(name)) return true;
    if (node.data) {
      return node.data.some(childNode => this.containsMatch(childNode, name));
    }
    return false;
  }

  filterNodesByName(nodes: WorkspaceTreeNode[], name: string): WorkspaceTreeNode[] {
    let regExpr = new RegExp(name);
    // Function to copy a node and all its children
    function copyNode(node: WorkspaceTreeNode): WorkspaceTreeNode {
      const newNode = { ...node };

      // If the node has children, recursively copy them
      if(newNode.data) {
        newNode.data = newNode.data.map(copyNode);
      }

      return newNode;
    }

    return nodes.reduce((filteredNodes, node) => {

      // Check if a node matches the filter. If it does, make a deep copy and add to filteredNodes.
      if (regExpr.test(node.name)) {
        filteredNodes.push(copyNode(node));
      }

      // If no match but the node has children, filter the children
      else if (node.data) {
        const filteredChildren = this.filterNodesByName(node.data, name);
        if (filteredChildren.length > 0) {
          const newNode = {...node, data: filteredChildren};
          filteredNodes.push(newNode);
        }
      }

      return filteredNodes;

    }, [] as WorkspaceTreeNode[]);

  }

  handleSelection(data: WorkspaceTreeNode) {
    let selectedItems = this.nodeDndService.selectedElements.getValue();
    if (this.selectionMode) {
      if ((selectedItems.includes(data))) {
        selectedItems.splice(selectedItems.indexOf(data), 1)
      } else {
        selectedItems.push(data)
      }
    } else {
      selectedItems = [data]
    }

    this.nodeDndService.selectedElements.next(selectedItems)
  }

  dragStartNodes(data: WorkspaceTreeNode) {
    let selectedItems = this.nodeDndService.selectedElements.getValue();

    if (!selectedItems.includes(data)) {
      selectedItems = [data]
    }
    this.nodeDndService.selectedElements.next(selectedItems)
  }

  emitDndMode() {
    this.nodeDndService.dndBehaviour.next(this.dndBehaviour!);
  }
}
