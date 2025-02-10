import { Game } from "./components/Game";

function App() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Game width={1920} height={1080} />
    </div>
  );
}

export default App;
