declare module 'html-to-image' {
  export function toPng(node: HTMLElement, options?: any): Promise<string>
  export function toJpeg(node: HTMLElement, options?: any): Promise<string>
  export function toSvg(node: HTMLElement, options?: any): Promise<string>
}
