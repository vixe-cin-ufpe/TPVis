export class AbstractPlotlyTool {

    public graph: any = {
        layout: <any>{
            height: 0,
            width: 0,
        },
        data: <any[]>[], revision: 0
    };
    protected debounceTimer?: any;
    config: any = {responsive: true};

    handleResize($event: ResizeObserverEntry, onlyWidth: boolean = false) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            if (!onlyWidth) {
                this.graph.layout.height = $event.contentRect.height;
            }
            this.graph.layout.width = $event.contentRect.width;
            this.graph.revision++;
        }, 200)
    }
}
