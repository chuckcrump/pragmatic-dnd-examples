import { createBrowserRouter } from "react-router-dom";
import ListView from "./components/simple-dnd/list-view";
import App from "./App";
import Board from "./components/board/board";

export const router = createBrowserRouter([
  { path: "/", Component: App },
  { path: "/dnd", Component: ListView },
  { path: "/multi", Component: Board },
]);
