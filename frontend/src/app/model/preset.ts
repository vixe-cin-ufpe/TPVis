import {GridsterItem} from "angular-gridster2";

export class Preset {
  name!: string;
  iconSpec!: string;
  layout!: GridsterItem[];
  preferredBehaviour?: string;
}
