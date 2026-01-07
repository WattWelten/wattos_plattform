declare module '@react-three/fiber' {
  import { ReactNode } from 'react';
  import { Camera, Scene } from 'three';

  export interface CanvasProps {
    children?: ReactNode;
    camera?: any;
    gl?: any;
    onCreated?: (state: any) => void;
    [key: string]: any;
  }

  export function Canvas(props: CanvasProps): JSX.Element;

  export function useFrame(
    callback: (state: { clock: any; delta: number; gl: any; scene: Scene; camera: Camera; raycaster: any; pointer: any; viewport: any; size: { width: number; height: number } }, delta: number) => void,
    renderPriority?: number
  ): void;

  export function useThree<T = any>(): T;
}










