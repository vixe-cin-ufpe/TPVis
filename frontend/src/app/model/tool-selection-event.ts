export class ToolSelectionEvent {
    authorToolUUID!: string;
    selectedPrioritizations!: string[];


    constructor(authorToolUUID: string, selectedPoints: string[]) {
        this.authorToolUUID = authorToolUUID;
        this.selectedPrioritizations = selectedPoints;
    }
}
