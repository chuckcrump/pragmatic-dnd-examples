import { useCallback, useEffect, useState } from "react";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { reorderWithEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge";
import { reorder } from "@atlaskit/pragmatic-drag-and-drop/reorder";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { flushSync } from "react-dom";
import { v4 as uuid } from "uuid";
import MultiListView from "./multi-list-view";
import type { Column, Item } from "./types";

function MultiListMain() {
  // Set up initial data
  const [columns, setColumns] = useState<Column[]>([
    {
      id: uuid(),
      name: "Column1",
      tasks: [
        { id: uuid(), name: "test1" },
        { id: uuid(), name: "test2" },
        { id: uuid(), name: "test3" },
        { id: uuid(), name: "test4" },
      ],
    },
    {
      id: uuid(),
      name: "Column2",
      tasks: [
        { id: uuid(), name: "test5"},
        { id: uuid(), name: "test6"},
        { id: uuid(), name: "test7"},
        { id: uuid(), name: "test8"},
      ],
    },
  ]);

  // Callback function to make the item transfer more readable
  const transferArrayItem = useCallback(
    ({
      startColId,
      finishColId,
      indexInStart,
      indexInFinish,
      edge,
    }: {
      startColId: string;
      finishColId: string;
      indexInStart: number;
      indexInFinish?: number;
      edge: string | null;
    }) => {
      // If both column ids are the same we don't do any unnecessary updates
      if (startColId === finishColId) return;
      setColumns((prev) => {
        // We get the actual column objects and their indexes
        const sourceColumn = prev.find((c) => c.id === startColId);
        const destColumn = prev.find((c) => c.id === finishColId);
        const sourceIndex = prev.findIndex((c) => c.id === startColId);
        const destIndex = prev.findIndex((c) => c.id === finishColId);
        if (!sourceColumn || !destColumn) return prev;

        // Extract the task that we are going to move
        const task: Item | undefined = sourceColumn.tasks[indexInStart];
        if (!task) return prev;

        // Create a copy of the destination tasks array
        const destTasks = [...destColumn.tasks];

        // Check if we have a index for the destination tasks if not 0
        let indexInFinishColumn = indexInFinish ?? 0;

        // If the destination's tasks are empty or we don't have an edge to drop to just put the item in
        if (destColumn.tasks.length === 0 || !edge) {
          destTasks.splice(0, 0, task);
        } else {
          // If we are targeting the bottom edge we have to add 1 to the destination index in order for the position to be correct
          if (edge === "bottom") {
            indexInFinishColumn += 1;
          }
          // Saftey check for the index
          if (
            indexInFinishColumn === -1 ||
            indexInFinishColumn > destColumn.tasks.length + 1
          )
            indexInFinishColumn = 0;

          // Add it to the array at it's destination index
          destTasks.splice(indexInFinishColumn, 0, task);
        }
        // We iterate over the original columns
        const updatedColumns = prev.map((col, index) => {
          // Remove the target item from it's source array
          if (index === sourceIndex) {
            return { ...col, tasks: col.tasks.filter((t) => t.id !== task.id) };
          }
          // Update the destination column to have the new updated array
          if (index === destIndex) {
            return { ...col, tasks: destTasks };
          }
          // Return everything else
          return col;
        });
        // Update the columns state
        return updatedColumns;
      });
    },
    [],
  );

  // Main useEffect to set up Pragmatic drag and drop
  useEffect(() => {
    // Combine function because we have 2 monitorForElements one for the cards and one for the columns
    return combine(
      // This one handles dragging and dropping the columns on top of eachother to reorder on the board
      monitorForElements({
        // We make sure that we are actually dragging a column not a card
        canMonitor({ source }) {
          return source.data.type === "column"
        },
        // The ondrop handler gets the source element and the location of where it's going to drop to
        onDrop: ({ source, location }) => {
          // We get the first viable drop target get the columns indexes and swap them
          const dest = location.current.dropTargets[0];
          const sourceIndex: number = source.data.index as number;
          const destIndex: number = dest.data.index as number;
          // This part actually reorders with the reorder function from Pragmatic
          // We provide the previous columns as the list, pass the correct indexes, and let pragmatic do the rest
          setColumns((prev) => {
            return reorder({
              list: prev,
              startIndex: sourceIndex,
              finishIndex: destIndex
            })
          })
        }
      }),
      // This second one handles the cards being dragged either in the same column or across columns
      monitorForElements({
      // Just like the columns we make sure that we are actually dragging a card 
      canMonitor({ source }) {
        return source.data.type === "card"
      },
      // The start of this is the same as columns
      onDrop: ({ source, location }) => {
        const dest = location.current.dropTargets[0];
        if (!dest) return;
        
        // Instead of getting indexes of items we get the id of each column
        const sourceColumnId: string = source.data.columnId as string;
        const destColumnId: string = dest.data.columnId as string;

        // We create a variable to check that the destination element is a card (true) if not (false)
        const isDroppingCard = dest.data.type === "card";

        // First condition to see if we are dragging a card AND in the same column
        if (isDroppingCard && sourceColumnId === destColumnId) {
          // Grab the item's individual ids check that they actually exist
          const sourceId: string = source.data.id as string;
          const destId: string = dest.data.id as string;
          if (!sourceId || !destId) return;
          // Extract the edge from the source data since we reoder cards by edge detection 
          const closestEdge = extractClosestEdge(dest.data);
          // If we drop on the same element and we are on top return here nothing to change
          if (sourceId === destId && closestEdge === "top") return;

          // Now we find the indexes of the columns that we are dragging between
          const sourceColumn = columns.findIndex(
            (column) => column.id === sourceColumnId,
          );
          const destColumn = columns.findIndex(
            (column) => column.id === destColumnId,
          );

          // Then find the indexes of what we are dragging 
          const sourceIndex =
            columns[sourceColumn].tasks.findIndex(
              (task) => task.id === sourceId,
            ) ?? -1;
          // And the index of where we are dropping
          const destIndex =
            columns[destColumn].tasks.findIndex((task) => task.id === destId) ??
            -1;

          // We create a new variable that stores the new reordered list
          // This is where we also pass the closestEdge for more accurate reordering
          const reordered = reorderWithEdge({
            list: columns[destColumn].tasks,
            startIndex: sourceIndex,
            indexOfTarget: destIndex,
            closestEdgeOfTarget: closestEdge,
            axis: "vertical",
          });

          // This is where we update the actual columns
          // We get the column from it's index and set it's tasks equal to the redorered list created
          flushSync(() => {
            setColumns((prev) => {
              const currentColumns = [...prev];
              currentColumns[destColumn] = {
                ...currentColumns[destColumn],
                tasks: reordered,
              };
              return currentColumns;
            });
          });
        } else if (
          // This is for inter column reordering we check if we are dropping on a card in a different column
          // Or if the drop target is the type column (for empty columns or just simply dropping on a column)
          (isDroppingCard && sourceColumnId !== destColumnId) ||
          dest.data.type === "column"
        ) {
          // We get the closest edge once again
          const closestEdge = extractClosestEdge(dest.data);
          // Another big update where we use the callback transferArrayItem
          flushSync(() => {
            transferArrayItem({
              // We pass all the necessary data for a transfer
              // Now see line 38
              startColId: sourceColumnId,
              finishColId: destColumnId,
              indexInStart: source.data.index as number,
              indexInFinish: dest.data.index as number | undefined,
              edge: closestEdge,
            });
          });
        }
      },
    }));
  }, [columns, transferArrayItem]);

  return (
    <>
      <div className="flex flex-row p-4 gap-4 bg-[#2b343c] h-screen">
        {/* Render each column as the MultiListView component and pass the necessary props */}
        {columns.map((column, index) => (
          <MultiListView
            column={column}
            columnId={column.id}
            index={index}
            key={index}
          />
        ))}
      </div>
    </>
  );
}

export default MultiListMain;
