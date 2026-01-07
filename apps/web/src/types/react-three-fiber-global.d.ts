/// <reference types="@react-three/fiber" />

declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      primitive: any;
      ambientLight: any;
      directionalLight: any;
      pointLight: any;
      spotLight: any;
      boxGeometry: any;
      meshStandardMaterial: any;
      [key: string]: any;
    }
  }
}

export {};

