import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";

export type TItem = {
  id: string;
  name: string;
};

export type TColumn = {
  id: string;
  name: string;
  tasks: TItem[];
};

export type DraggableState =
  | { type: "idle" }
  | { type: "preview"; container: HTMLElement; rect: DOMRect }
  | { type: "is-over"; edge: Edge; rect: DOMRect }
  | { type: "dragging-left-self" };
