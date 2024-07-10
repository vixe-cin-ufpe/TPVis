import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ColDef, GridApi, GridReadyEvent} from "ag-grid-community";
import {FormControl} from "@angular/forms";

@Component({
  selector: 'app-feature-mapper',
  templateUrl: './feature-mapper.component.html',
  styleUrls: ['./feature-mapper.component.scss']
})
export class FeatureMapperComponent implements OnInit{

    @Input()
    public initialFeatureMapper!: string;

    @Output()
    public onFeatureMapperSubmit: EventEmitter<string> = new EventEmitter();

    public columnDefs?: ColDef[];
    public rowData?: { originalClass: string; alias: any }[];
    private gridApi?: GridApi;
    public bulkAliasFormControl: FormControl = new FormControl<string>("");

    ngOnInit(): void {
        this.columnDefs = [
            {
                field: 'originalClass',
                // enables editing
                editable: false,
                wrapText: true,
                flex: 1,
                cellStyle: {'white-space': 'normal'},
                filter: 'agTextColumnFilter',
                sortable: true,
                autoHeight:true,
            },
            {
                field: 'alias',
                flex: 1,
                editable: true,
                wrapText: true,
                autoHeight:true,
                cellStyle: {'white-space': 'normal'},
                filter: 'agTextColumnFilter',
                sortable: true
            }
        ];


        let aliasByOriginalClassNameMap: any = {}

        this.initialFeatureMapper.split("\n").forEach((eachLine) => {
            if (!eachLine) {
                return
            }
            let destinationClassSignature = eachLine.split(" ")[1]

            let originalClassName = destinationClassSignature.split("(")[0].split("$")[0]
            let possiblyAliasedClassName;
            if (destinationClassSignature.includes("(")) {
                possiblyAliasedClassName = destinationClassSignature.split("(")[1].replace(")", "")
            } else {
                possiblyAliasedClassName = originalClassName
            }

            aliasByOriginalClassNameMap[originalClassName] = possiblyAliasedClassName
        })

        this.rowData = Object.keys(aliasByOriginalClassNameMap).sort().map((eachOriginalClass: string) => {
            return {
                originalClass: eachOriginalClass,
                alias: aliasByOriginalClassNameMap[eachOriginalClass],
            }
        })
    }

    onGridReady(params: GridReadyEvent) {
        this.gridApi = params.api;
    }


    applyAliases() {
        this.rowData?.forEach((eachRowData) => {
            let escapedOriginalClass = eachRowData.originalClass.replaceAll(".", "\\.").replaceAll("$", "\\$")
            let regex = "( " + escapedOriginalClass  + "(\\$.*)?\\(.*)|( " + escapedOriginalClass + "(\\$.*)?\\n)"

            let replacement = " " + eachRowData.originalClass + "(" + eachRowData.alias + ")\n"
            this.initialFeatureMapper = this.initialFeatureMapper.replace(new RegExp(regex, "g"), replacement)
        })
        this.onFeatureMapperSubmit.emit(this.initialFeatureMapper)
    }

    applyBulkAlias() {
        this.gridApi?.getSelectedRows().forEach((eachRow) => {
            eachRow.alias = this.bulkAliasFormControl.value;
        })
        this.gridApi?.redrawRows()

    }
}
