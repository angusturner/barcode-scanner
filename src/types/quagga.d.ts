declare module 'quagga' {
  interface QuaggaJSResultObject {
    codeResult?: {
      code?: string;
      format?: string;
      confidence?: number;
    };
    box?: any;
    line?: any;
    boxes?: any[];
    angle?: number;
  }

  interface QuaggaJSStatic {
    init(config: any, callback: (err: any) => void): void;
    start(): void;
    stop(): void;
    onDetected(callback: (data: QuaggaJSResultObject) => void): void;
    offDetected(callback: (data: QuaggaJSResultObject) => void): void;
    onProcessed(callback: (data: QuaggaJSResultObject) => void): void;
    offProcessed(callback: (data: QuaggaJSResultObject) => void): void;
    canvas: {
      ctx: {
        image: CanvasRenderingContext2D;
        overlay: CanvasRenderingContext2D;
      };
      dom: {
        image: HTMLCanvasElement;
        overlay: HTMLCanvasElement;
      };
    };
    decodeSingle(config: any, callback: (result: any) => void): void;
    ImageDebug: {
      drawPath: (path: any, def: any, ctx: CanvasRenderingContext2D, style: any) => void;
    };
  }

  const Quagga: QuaggaJSStatic;
  export default Quagga;
} 