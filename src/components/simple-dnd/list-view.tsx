import { useEffect, useRef, useState } from "react";
import ListItem from "./list-item";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { reorderWithEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge";
import { flushSync } from "react-dom";
import { v4 as uuid } from "uuid";
import type { Item } from "./types";


function ListView() {
  const containerRef = useRef<HTMLUListElement | null>(null);
  const [items, setItems] = useState<Item[]>([
    { id: uuid(), name: "test1" },
    { id: uuid(), name: "test2" },
    { id: uuid(), name: "test3" },
    { id: uuid(), name: "test4" },
  ]);

  useEffect(() => {
    return monitorForElements({
      canMonitor({ source }) {
        return source.data.id !== null;
      },
      onDrop: ({ source, location }) => {
        const dest = location.current.dropTargets[0];
        if (!dest) return;

        const sourceId: string = source.data.id as string;
        const destId: string = dest.data.id as string;
        const closestEdge = extractClosestEdge(dest.data);
        const sourceIndex = items.findIndex((i) => i.id == sourceId);
        const destIndex = items.findIndex((i) => i.id == destId);

        flushSync(() => {
          setItems((prev) => {
            if (sourceIndex < 0 || sourceIndex >= prev.length) return prev;
            if (destIndex < 0 || destIndex >= prev.length) return prev;
            return reorderWithEdge({
              list: prev,
              startIndex: sourceIndex,
              indexOfTarget: destIndex,
              closestEdgeOfTarget: closestEdge,
              axis: "vertical",
            });
          });
        });
      },
    });
  }, [items]);

  return (
    <>
      <div className="flex w-full h-screen items-center justify-center">
        <ul
          className="flex flex-col w-96 p-2 gap-2 relative"
          ref={containerRef}
        >
          {items.map((item) => (
            <ListItem item={item} id={item.id} key={item.id} />
          ))}
        </ul>
      </div>
    </>
  );
}

export default ListView;
