import React from "react";
import { GameStatus } from "../game/types";

interface GameOverlayProps {
  status: GameStatus;
  stage: number;
  score: number;
  onStartGame?: () => void;
}

export const GameOverlay: React.FC<GameOverlayProps> = ({ status, stage, score }) => {
  const baseStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    color: "white",
    fontFamily: "monospace",
    pointerEvents: "none",
  };

  // Always show score during gameplay
  if (status === "playing" || status === "respawning") {
    return (
      <div style={baseStyle}>
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: "24px",
          }}
        >
          {score.toString().padStart(6, "0")}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: "12px",
            opacity: 0.7,
          }}
        >
          © 1979 ATARI INC
        </div>
      </div>
    );
  }

  // Menu states with dark overlay
  return (
    <div style={{ ...baseStyle, backgroundColor: "rgba(0, 0, 0, 0.7)" }}>
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
        }}
      >
        {status === "attract" && (
          <>
            <div style={{ fontSize: "32px", marginBottom: "20px" }}>ASTEROIDS</div>
            <div style={{ fontSize: "16px" }}>PRESS SPACE TO PLAY</div>
          </>
        )}
        {status === "game-over" && (
          <>
            <div style={{ fontSize: "32px", marginBottom: "20px" }}>GAME OVER</div>
            <div style={{ fontSize: "16px" }}>FINAL SCORE: {score.toString().padStart(6, "0")}</div>
            <div style={{ fontSize: "16px", marginTop: "20px" }}>PRESS SPACE TO PLAY AGAIN</div>
          </>
        )}
        {status === "stage-complete" && <div style={{ fontSize: "24px" }}>STAGE {stage} COMPLETE</div>}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: "12px",
          opacity: 0.7,
        }}
      >
        © 1979 ATARI INC
      </div>
    </div>
  );
};
