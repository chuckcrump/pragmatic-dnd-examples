import { useEffect, useRef, useState } from "react";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { preserveOffsetOnSource } from "@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source";
import {
  attachClosestEdge,
  extractClosestEdge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import type { TItem } from "./types";
import { createPortal } from "react-dom";
import "./multi-list-item.css";
import type { DraggableState } from "./types";

interface ListItemProps {
  item: TItem;
  index: number;
  columnId: string;
}

// State type to do some conditional rendering

function Card({ item, index, columnId }: ListItemProps) {
  // Ref for the element that holds the data
  const itemRef = useRef<HTMLLIElement | null>(null);
  // Ref for the element that is the drop target and container
  const mainRef = useRef<HTMLDivElement | null>(null);
  // Set the initial TaskState to be idle
  const [state, setState] = useState<DraggableState>({ type: "idle" });

  useEffect(() => {
    const mainElement = mainRef.current;
    const element = itemRef.current;
    if (!element || !mainElement) return;

    // Same function in the main but this time so make our element draggable and set it as a drop target
    return combine(
      // This part is the same as the multi-list-view
      draggable({
        element: element,
        getInitialData: () => ({
          item,
          id: item.id,
          index,
          columnId,
          type: "card",
        }),
        onDrop: () => {
          // When we drop a card set it's state back to idle
          setState({ type: "idle" });
        },
        // This is new though this is what the name suggests a way to customize the drap preview
        onGenerateDragPreview({ nativeSetDragImage, location }) {
          setCustomNativeDragPreview({
            nativeSetDragImage,
            // This keeps the mouse offset when you first pick it up
            getOffset: preserveOffsetOnSource({
              element: element,
              input: location.current.input,
            }),
            // This is is render part where we set the state of the card into preview mode with
            // With the container element and rect dimensions
            render({ container }) {
              setState({
                type: "preview",
                container,
                rect: element.getBoundingClientRect(),
              });
            },
          });
        },
      }),
      // This is the same as multi-list-view
      dropTargetForElements({
        element: mainElement,
        getIsSticky: () => true,
        // Same as the multi-list-view
        getData: ({ element, input }) => {
          return attachClosestEdge(
            {
              item,
              id: item.id,
              columnId,
              index,
              type: "card",
            },
            { element, input, allowedEdges: ["top", "bottom"] },
          );
        },
        // This is a check that if the source element is not of type "card" that you can't drop
        // This is because we drag columns too and they don't belong in lists
        canDrop({ source }) {
          if (source.data.type !== "card") {
            return false;
          }
          return true;
        },
        // In this we check if the source item's id is the same as the element's
        onDragEnter({ source, self }) {
          if ((source.data.item as TItem).id === item.id) return;
          // We now use it's data to find the edge our mouse pointer is closest to "top" or "bottom"
          const closestEdge = extractClosestEdge(self.data);
          if (!closestEdge) return;
          // We set our card state to show that something is over it and push some data that will be useful later
          setState({
            type: "is-over",
            rect: element.getBoundingClientRect(),
            edge: closestEdge,
          });
        },
        // While we are dragging over we still want to update which edge we are over
        onDrag({ self, source }) {
          // Same as onDragEnter
          const closestEdge = extractClosestEdge(self.data);
          // If it's the same card do an early return
          if (self.data.id === source.data.id) return;
          if (!closestEdge) return;
          // Update our is-over state with our new changes
          setState({
            type: "is-over",
            rect: element.getBoundingClientRect(),
            edge: closestEdge,
          });
        },
        onDragLeave: ({ source }) => {
          // When we dragLeave a card we check if it's the same as the component if so set our state as it's
          // Being dragged but it's left itself
          if (source.data.id === item.id) {
            setState({ type: "dragging-left-self" });
            return;
          }
          // Otherwise set it back to idle
          setState({ type: "idle" });
        },
        onDrop: () => {
          // When we drop a card set it's state back to idle
          setState({ type: "idle" });
        },
      }),
    );
  }, [item, columnId, index]);

  return (
    <>
      {state.type === "is-over" && state.edge === "top" ? (
        <DragShadow rect={state.rect} />
      ) : null}
      {/* This div is our main container ref */}
      <div
        ref={mainRef}
        className={
          // This is where our "state" is used
          "py-1 relative text-gray-300 " +
          // If we have left the actual source element lower it's opacity to show that it's being dragged
          (state.type === "dragging-left-self" ? "hidden " : "")
          // This is the for the drop preview indicators (where the item will be inserted)
          // If you are going for just the simple line look and using react atlassian's official react DropIndicator
          // Which you'll find in the "Optional packages" section here https://atlassian.design/components/pragmatic-drag-and-drop/about
          // This solution is similiar to what they call "shadow drop placement" you can almost do whatever you want as the preview
          // And it's fully cross framework you can find the css classes for rendering these indicators in multi-list-item.css
        }
      >
        <li className="bg-[#272729] rounded-lg cursor-grab p-2" ref={itemRef}>
          {item.name}
        </li>
      </div>
      {/*
        This again uses our state if the element is in the preview state to render our DragPreview component at the container
        That pragmatic provided in the render() in onGenerateDragPreview
      */}
      {state.type === "is-over" && state.edge === "bottom" ? (
        <DragShadow rect={state.rect} />
      ) : null}
      {state.type === "preview"
        ? createPortal(
            <DragPreview task={item} state={state} />,
            state.container,
          )
        : null}
    </>
  );
}

function DragShadow({ rect }: { rect: DOMRect }) {
  return (
    <div className="my-1">
      <div
        style={{ width: rect.width, height: rect.height }}
        className="bg-[#27292b] rounded-lg"
      ></div>
    </div>
  );
}

// This is our super simple preview component
function DragPreview({ task, state }: { task: TItem; state: DraggableState }) {
  // This element is fully customizable with css for a truly custom preview
  return (
    <div
      className="border-solid rounded-lg p-2 bg-[#272729] rotate-[4deg] text-white"
      style={
        // If it's in the preview state render it with the same width and height as the source element
        state.type === "preview"
          ? { width: state.rect.width, height: state.rect.height }
          : undefined
      }
    >
      {task.name}
    </div>
  );
}

export default Card;
