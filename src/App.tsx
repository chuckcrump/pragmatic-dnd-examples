import { Link } from "react-router-dom";

function App() {
  return (
    <>
      <div className="flex flex-col items-center justify-center h-screen w-full">
        <h1 className="text-2xl font-bold mb-2">
          <strong className="italic text-4xl bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-blue-300 to-indigo-400">
            Pragmatic
          </strong>{" "}
          drag and drop examples
        </h1>
        <p>
          Simple apps that I made while learning atlassian Pragmatic drag and
          drop, hope you find them useful.
        </p>
        <p>
          Find pragmatic
          <a
            href="https://atlassian.design/components/pragmatic-drag-and-drop/about"
            className="ml-1 text-blue-500 underline"
          >
            Here
          </a>
        </p>
        <div className="flex flex-row gap-2 mt-2">
          <Link className="text-blue-500 underline" to="/dnd">
            Simple Drag and Drop
          </Link>
          <Link className="text-blue-500 underline" to="/multi">
            Board Example
          </Link>
        </div>
      </div>
    </>
  );
}

export default App;
