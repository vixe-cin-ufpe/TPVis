export class Color {
  r!: number;
  g!: number;
  b!: number;

  constructor(r: number, g: number, b: number) {
    this.r = r;
    this.g = g;
    this.b = b;
  }


}

export function toRgbString(color: Color) {
  return `rgb(${color.r}, ${color.g}, ${color.b})`
}
