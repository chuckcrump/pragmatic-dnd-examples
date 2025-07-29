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
}

// This is the colum component
function MultiListView({ column, columnId, index }: MultiListViewProps) {
  // We create a refrence to the column <div> (used by pragmatic)
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Set the passed column object as the value for our hook (L for local) 
  const [Lcolumn, setLColumn] = useState<Column>(column);

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
          index: index
        }),
      }),
      // This is another importand function that will set the target objects e.g. dest.data.etc
      dropTargetForElements({
        element,
        getData: () => ({ type: "column", columnId: column.id, index: index }),
      })
    )
    // Make sure this updates everytime one of those change
  }, [columnId, column]);

  return (
    <>
      {/* Create the column div and set it's ref */}
      <div
        className="flex flex-col w-72 p-2 rounded-xl bg-[#1f1f21] h-fit text-gray-300"
        ref={containerRef}
      >
        {/* Render the header with some nice styles */}
        <div className="flex flex-row justify-between items-center px-1">
          <h2 className="font-bold text-[20px]">{column.name}</h2>
          <Ellipsis size={20} />
        </div>
        {/* The actual list of draggable cards */}
        <ul className="flex flex-col mt-1">
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
        <div className="pt-2">
          <button className="p-1 pl-1.5 pr-2.5 rounded-lg bg-blue-400 flex items-center text-white gap-0.5">
            <Plus size={20} />
            Add
          </button>
        </div>
      </div>
    </>
  );
}

export default MultiListView;
