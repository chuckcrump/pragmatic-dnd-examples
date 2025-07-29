import { useEffect, useRef, useState } from "react";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { Ellipsis, Plus } from "lucide-react";
import MultiListItem from "./multi-list-item";
import type { Column } from "./types";

interface MultiListViewProps {
  column: Column;
  columnId: string;
  index: number;
  addTask: (id: string) => void;
  removeColumn: (columnId: string) => void;
}

// This is the colum component
function MultiListView({
  column,
  columnId,
  index,
  addTask,
  removeColumn,
}: MultiListViewProps) {
  // We create a refrence to the column <div> (used by pragmatic)
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Set the passed column object as the value for our hook (L for local)
  const [Lcolumn, setLColumn] = useState<Column>(column);
  const optionsRef = useRef<HTMLButtonElement | null>(null);
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
    setLColumn(column);
    // Get and check if the element ref is there and valid
    const element = containerRef.current;
    if (!element) return;
    return combine(
      // This is a function from pragmatic that will setup an element as a draggable target and to pass data
      draggable({
        element: element,
        // This is a very important function whenever we click and drag our column this is responsible
        // For setting the source data e.g. source.data.etc
        getInitialData: () => ({
          columnId: columnId,
          type: "column",
          index: index,
        }),
      }),
      // This is another important function that will set the target objects e.g. dest.data.etc
      dropTargetForElements({
        element,
        getData: () => ({ type: "column", columnId: column.id, index: index }),
      }),
    );
    // Make sure this updates everytime one of those change
  }, [columnId, column, index]);

  return (
    <>
      {/* Create the column div and set it's ref */}
      <div
        className="flex flex-col grow-0 w-72 min-w-72 p-2 rounded-xl bg-[#1f1f21] h-fit text-gray-300 max-h-full z-0"
        ref={containerRef}
      >
        {/* Render the header with some nice styles */}
        <div className="flex flex-row justify-between items-center pl-1">
          <h2 className="font-bold text-[20px]">{column.name}</h2>
          <div id="draghandle" className="flex h-7 w-full"></div>
          <button
            className="p-1 rounded-md hover:bg-[#303030]/50 z-10"
            onClick={openOptionsMenu}
            ref={optionsRef}
          >
            <Ellipsis size={20} />
          </button>
        </div>
        {/* The actual list of draggable cards */}
        <ul className="flex flex-col mt-1 overflow-y-auto">
          {/* Conditional check if there are no cards */}
          {Lcolumn.tasks.length !== 0 ? (
            (Lcolumn.tasks ?? []).map((task, index) => {
              // A little saftey check (probably unnecessary)
              if (!task) return null;
              return (
                // Render each card element with the necessary props
                <MultiListItem
                  item={task}
                  id={task.id}
                  index={index}
                  key={index}
                  columnId={columnId}
                />
              );
            })
          ) : (
            <li>No tasks</li>
          )}
        </ul>
        {/* Footer nothing done yet */}
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
    </>
  );
}

function ColumnDragPreview({ rect }: { rect: DOMRect }) {
  return (
    <div
      style={{ width: rect.width, height: rect.height }}
      className="rounded-xl bg-[#1f1f21]"
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

export default MultiListView;
