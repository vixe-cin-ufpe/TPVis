import {Color} from "../model/color";
import * as d3 from "d3";

export function interpolateColor(value: number) {
  let linearScale = d3.scaleLinear()
    .domain([0, 1])
    .range(<any>["#9ecae1", "#08306b"])
  let computedColor = linearScale(value).toString().replace("rgb(", "").replace(")", "").split(",").map((str) => str.trim()).map((el) => parseInt(el));
  return new Color(computedColor[0], computedColor[1], computedColor[2]);
}

export function interpolateColorAsRGB(value: number) {
  let result = interpolateColor(value);
  return `rgb(${result.r},${result.g},${result.b})`;
}
