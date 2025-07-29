import type { ReactNode } from "react";

export function Flex({
  children,
  direction = "column",
}: {
  children: ReactNode;
  direction?: "column" | "row";
}) {
  return (
    <div className="flex" style={{ flexDirection: direction }}>
      {children}
    </div>
  );
}
