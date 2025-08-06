import { useEffect, useRef, useState } from "react";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { Ellipsis, Plus } from "lucide-react";
import Card from "./card";
import type { TColumn } from "./types";
import {
  attachClosestEdge,
  extractClosestEdge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import type { DraggableState } from "./types";

interface MultiListViewProps {
  column: TColumn;
  index: number;
  addTask: (id: string) => void;
  removeColumn: (columnId: string) => void;
}

// This is the column component
function Column({ column, index, addTask, removeColumn }: MultiListViewProps) {
  // We create a refrence to the column <div> (used by pragmatic)
  const containerRef = useRef<HTMLDivElement | null>(null);
  const optionsRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const handleRef = useRef<HTMLDivElement | null>(null);

  const [state, setState] = useState<DraggableState>({ type: "idle" });
  // Set the passed column object as the value for our hook (L for local)
  const [localColumn, setLocalColumn] = useState<TColumn>(column);
  const [optionsPos, setOptionsPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [showOptions, setShowOptions] = useState<boolean>(false);

  function openOptionsMenu() {
    if (showOptions) {
      setShowOptions(false);
      return;
    }
    if (!optionsRef.current) return;
    const rect = optionsRef.current.getBoundingClientRect();
    const newPosition: { x: number; y: number } = {
      x: rect.left + rect.width,
      y: rect.top + rect.height,
    };
    setOptionsPos(newPosition);
    setShowOptions(true);
  }

  function removeCol(columnId: string) {
    removeColumn(columnId);
    setShowOptions(false);
  }

  // Same setup step as the multi-list-main
  useEffect(() => {
    // Except whenever column changes in the parent component update our local one
    setLocalColumn(column);
    // Get and check if the element ref is there and valid
    const element = containerRef.current;
    const list = listRef.current;
    const handle = handleRef.current;
    if (!element || !list || !handle) return;
    return combine(
      // This is a function from pragmatic that will setup an element as a draggable target and to pass data
      draggable({
        element: element,
        dragHandle: handle,
        // This is a very important function whenever we click and drag our column this is responsible
        // For setting the source data e.g. source.data.etc
        getInitialData: () => ({
          columnId: column.id,
          type: "column",
          index: index,
          columnRect: element.getBoundingClientRect(),
        }),
        onDrop: () => {
          setTimeout(() => {
            setState({ type: "idle" });
          });
        },
      }),
      // This is another important function that will set the target objects e.g. dest.data.etc
      dropTargetForElements({
        element: list,
        canDrop: ({ source }) => {
          return source.data.type === "card";
        },
        getIsSticky: () => true,
        getData: () => ({
          type: "column",
          columnId: localColumn.id,
          index: index,
        }),
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) => {
          return source.data.type === "column";
        },
        getIsSticky: () => true,
        getData: ({ input }) => {
          return attachClosestEdge(
            {
              type: "column",
              columnId: column.id,
              index: index,
              columnRect: element.getBoundingClientRect(),
            },
            { element, input, allowedEdges: ["left", "right"] },
          );
        },
        onDragEnter({ source, self }) {
          if ((source.data.columnId as string) === localColumn.id) return;
          const closestEdge = extractClosestEdge(self.data);
          const rect = source.data.columnRect as DOMRect;
          if (!closestEdge || !rect) return;
          setState({
            type: "is-over",
            rect: rect,
            edge: closestEdge,
          });
        },
        onDrag({ self, source }) {
          const closestEdge = extractClosestEdge(self.data);
          if (self.data.columnId === source.data.columnId) return;
          const rect = source.data.columnRect as DOMRect;
          if (!closestEdge || !rect) return;
          setState({
            type: "is-over",
            rect: rect,
            edge: closestEdge,
          });
        },
        onDragLeave: ({ source }) => {
          if (source.data.columnId === localColumn.id) {
            setState({ type: "dragging-left-self" });
            return;
          }
          setState({ type: "idle" });
        },
        onDrop: () => {
          setTimeout(() => {
            setState({ type: "idle" });
          });
        },
      }),
    );
  }, [column, index, localColumn]);

  return (
    <>
      {state.type === "is-over" && state.edge === "left" ? (
        <ColumnShadow rect={state.rect} />
      ) : null}
      {/* Create the column div and set it's ref */}
      <div
        className={`flex flex-col grow-0 w-72 min-w-72 p-2 rounded-xl bg-[#1f1f21] h-fit text-gray-300 max-h-full z-0 ${state.type === "dragging-left-self" ? "hidden" : ""}`}
        ref={containerRef}
      >
        {/* Render the header with some nice styles */}
        <div className="flex flex-row justify-between items-center pl-1">
          <h2 className="font-bold text-[20px]">{column.name}</h2>
          <div
            id="draghandle"
            className="flex h-7 w-full cursor-grab"
            ref={handleRef}
          ></div>
          <button
            className="p-1 rounded-md hover:bg-[#303030]/50 z-10"
            onClick={openOptionsMenu}
            ref={optionsRef}
          >
            <Ellipsis size={20} />
          </button>
        </div>
        {/* The actual list of draggable cards */}
        <ul className="flex flex-col overflow-y-auto min-h-4" ref={listRef}>
          {/* Conditional check if there are no cards */}
          {localColumn.tasks.length !== 0 ? (
            localColumn.tasks.map((task, index) => (
              // A little saftey check (probably unnecessary)
              // Render each card element with the necessary props
              <Card
                item={task}
                index={index}
                columnId={column.id}
                key={task.id}
              />
            ))
          ) : (
            <p className="text-xs px-1.5 mt-1.5">No items...</p>
          )}
        </ul>
        <div className="pt-1">
          <button
            className="p-1 pl-1.5 pr-2.5 rounded-lg hover:bg-[#303030]/50 flex items-center text-white gap-0.5 w-full transition-all ease-out"
            onClick={() => addTask(column.id)}
          >
            <Plus size={20} />
            Add
          </button>
        </div>
      </div>
      {showOptions ? (
        <OptionsMenu pos={optionsPos} removeColumn={removeCol} id={column.id} />
      ) : null}
      {state.type === "is-over" && state.edge === "right" ? (
        <ColumnShadow rect={state.rect} />
      ) : null}
    </>
  );
}

function ColumnShadow({ rect }: { rect: DOMRect }) {
  return (
    <div
      style={{ height: rect.height }}
      className="rounded-xl bg-[#1f1f21]/50 w-72 min-w-72"
    ></div>
  );
}

function OptionsMenu({
  pos,
  removeColumn,
  id,
}: {
  pos: { x: number; y: number };
  removeColumn: (columnId: string) => void;
  id: string;
}) {
  return (
    <div
      className="fixed p-1 rounded-md bg-[#1f1f21] border-[1px] border-[#404040] z-20 text-white"
      style={{ top: pos.y, left: pos.x }}
    >
      <button
        className="flex items-center p-0.5 px-1 rounded-sm hover:bg-[#404040]/50"
        onClick={() => removeColumn(id)}
      >
        Remove
      </button>
    </div>
  );
}

export default Column;
