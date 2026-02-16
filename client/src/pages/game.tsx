import { useEffect, useRef, useCallback, useState } from "react";

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const BIRD_SIZE = 28;
const GRAVITY = 0.15;
const FLAP_FORCE = -4.2;
const PIPE_WIDTH = 58;
const PIPE_GAP = 150;
const PIPE_SPEED = 2.5;
const PIPE_SPAWN_INTERVAL = 1800;
const GROUND_HEIGHT = 70;

interface Bird {
  x: number;
  y: number;
  velocity: number;
  rotation: number;
}

interface Pipe {
  x: number;
  topHeight: number;
  scored: boolean;
}

type GameState = "idle" | "playing" | "gameover";

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawBackground(ctx: CanvasRenderingContext2D, scrollX: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT - GROUND_HEIGHT);
  sky.addColorStop(0, "#4DC9F6");
  sky.addColorStop(0.5, "#87CEEB");
  sky.addColorStop(1, "#B0E0E6");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT);

  ctx.fillStyle = "#fff";
  ctx.globalAlpha = 0.7;
  const cloudPositions = [
    { x: 50, y: 80, w: 80, h: 30 },
    { x: 200, y: 50, w: 100, h: 35 },
    { x: 320, y: 100, w: 70, h: 25 },
    { x: 140, y: 130, w: 60, h: 20 },
  ];
  cloudPositions.forEach((cloud) => {
    const cx = ((cloud.x - scrollX * 0.2) % (CANVAS_WIDTH + 120)) - 40;
    ctx.beginPath();
    ctx.ellipse(cx, cloud.y, cloud.w / 2, cloud.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(
      cx - cloud.w * 0.25,
      cloud.y + 5,
      cloud.w / 3,
      cloud.h / 2.5,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(
      cx + cloud.w * 0.25,
      cloud.y + 3,
      cloud.w / 3,
      cloud.h / 2.8,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  const groundY = CANVAS_HEIGHT - GROUND_HEIGHT;
  const grass = ctx.createLinearGradient(0, groundY, 0, groundY + 15);
  grass.addColorStop(0, "#5DBE3E");
  grass.addColorStop(1, "#4AA832");
  ctx.fillStyle = grass;
  ctx.fillRect(0, groundY, CANVAS_WIDTH, 15);

  const dirt = ctx.createLinearGradient(0, groundY + 15, 0, CANVAS_HEIGHT);
  dirt.addColorStop(0, "#D2A356");
  dirt.addColorStop(1, "#C19240");
  ctx.fillStyle = dirt;
  ctx.fillRect(0, groundY + 15, CANVAS_WIDTH, GROUND_HEIGHT - 15);

  ctx.strokeStyle = "#4AA832";
  ctx.lineWidth = 2;
  for (let i = 0; i < CANVAS_WIDTH + 20; i += 20) {
    const gx = ((i - ((scrollX * 1.5) % 20) + 20) % (CANVAS_WIDTH + 20)) - 10;
    ctx.beginPath();
    ctx.moveTo(gx, groundY + 12);
    ctx.lineTo(gx + 5, groundY);
    ctx.lineTo(gx + 10, groundY + 12);
    ctx.stroke();
  }
}

function drawBird(ctx: CanvasRenderingContext2D, bird: Bird) {
  ctx.save();
  ctx.translate(bird.x, bird.y);
  const clampedRot = Math.max(-0.5, Math.min(bird.rotation, 1.2));
  ctx.rotate(clampedRot);

  const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2);
  bodyGrad.addColorStop(0, "#FFE135");
  bodyGrad.addColorStop(0.7, "#FFC800");
  bodyGrad.addColorStop(1, "#E6A800");
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, BIRD_SIZE / 2 + 2, BIRD_SIZE / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#CC8800";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = "#FFF";
  ctx.beginPath();
  ctx.ellipse(8, -6, 7, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.arc(10, -5, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#FFF";
  ctx.beginPath();
  ctx.arc(11, -6.5, 1.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#E85D3A";
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(22, -2);
  ctx.lineTo(22, 4);
  ctx.lineTo(14, 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#C04020";
  ctx.lineWidth = 1;
  ctx.stroke();

  const wingY = Math.sin(Date.now() * 0.015) * 3;
  ctx.fillStyle = "#E6B800";
  ctx.beginPath();
  ctx.ellipse(-6, 4 + wingY, 10, 5, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#CC8800";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

function drawPipe(ctx: CanvasRenderingContext2D, pipe: Pipe) {
  const groundY = CANVAS_HEIGHT - GROUND_HEIGHT;
  const topPipeBottom = pipe.topHeight;
  const bottomPipeTop = pipe.topHeight + PIPE_GAP;

  const pipeGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
  pipeGrad.addColorStop(0, "#5BBF2A");
  pipeGrad.addColorStop(0.3, "#73D941");
  pipeGrad.addColorStop(0.7, "#73D941");
  pipeGrad.addColorStop(1, "#4A9E22");
  ctx.fillStyle = pipeGrad;

  ctx.fillRect(pipe.x, 0, PIPE_WIDTH, topPipeBottom);
  ctx.strokeStyle = "#3D8A1A";
  ctx.lineWidth = 2;
  ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, topPipeBottom);

  const capWidth = PIPE_WIDTH + 10;
  const capHeight = 26;
  const capX = pipe.x - 5;
  drawRoundedRect(ctx, capX, topPipeBottom - capHeight, capWidth, capHeight, 4);
  ctx.fillStyle = pipeGrad;
  ctx.fill();
  ctx.strokeStyle = "#3D8A1A";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = pipeGrad;
  ctx.fillRect(pipe.x, bottomPipeTop, PIPE_WIDTH, groundY - bottomPipeTop);
  ctx.strokeStyle = "#3D8A1A";
  ctx.lineWidth = 2;
  ctx.strokeRect(pipe.x, bottomPipeTop, PIPE_WIDTH, groundY - bottomPipeTop);

  drawRoundedRect(ctx, capX, bottomPipeTop, capWidth, capHeight, 4);
  ctx.fillStyle = pipeGrad;
  ctx.fill();
  ctx.strokeStyle = "#3D8A1A";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(pipe.x + 6, 0, 6, topPipeBottom - capHeight);
  ctx.fillRect(
    pipe.x + 6,
    bottomPipeTop + capHeight,
    6,
    groundY - bottomPipeTop - capHeight
  );
}

function drawScore(ctx: CanvasRenderingContext2D, score: number) {
  ctx.save();
  ctx.font = "bold 52px 'Open Sans', sans-serif";
  ctx.textAlign = "center";
  ctx.lineWidth = 5;
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.strokeText(String(score), CANVAS_WIDTH / 2, 70);
  ctx.fillStyle = "#FFF";
  ctx.fillText(String(score), CANVAS_WIDTH / 2, 70);
  ctx.restore();
}

function drawStartScreen(ctx: CanvasRenderingContext2D) {
  ctx.save();

  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.font = "bold 48px 'Open Sans', sans-serif";
  ctx.textAlign = "center";
  ctx.lineWidth = 5;
  ctx.strokeStyle = "rgba(0,0,0,0.6)";
  ctx.strokeText("Flappy Bird", CANVAS_WIDTH / 2, 180);
  ctx.fillStyle = "#FFE135";
  ctx.fillText("Flappy Bird", CANVAS_WIDTH / 2, 180);

  const pulse = Math.sin(Date.now() * 0.004) * 0.15 + 0.85;
  ctx.globalAlpha = pulse;
  ctx.font = "22px 'Open Sans', sans-serif";
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.lineWidth = 3;
  ctx.strokeText("Click or press Space to start", CANVAS_WIDTH / 2, 400);
  ctx.fillStyle = "#FFF";
  ctx.fillText("Click or press Space to start", CANVAS_WIDTH / 2, 400);
  ctx.globalAlpha = 1;

  ctx.restore();
}

function drawGameOverScreen(
  ctx: CanvasRenderingContext2D,
  score: number,
  bestScore: number
) {
  ctx.save();

  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const panelW = 260;
  const panelH = 220;
  const panelX = (CANVAS_WIDTH - panelW) / 2;
  const panelY = 160;

  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = 20;
  drawRoundedRect(ctx, panelX, panelY, panelW, panelH, 14);
  ctx.fillStyle = "#F5E6C8";
  ctx.fill();
  ctx.strokeStyle = "#8B6914";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.shadowBlur = 0;

  drawRoundedRect(ctx, panelX + 3, panelY + 3, panelW - 6, panelH - 6, 11);
  ctx.strokeStyle = "#D4B66A";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = "bold 32px 'Open Sans', sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#D9534F";
  ctx.strokeStyle = "rgba(0,0,0,0.2)";
  ctx.lineWidth = 2;
  ctx.strokeText("Game Over", CANVAS_WIDTH / 2, panelY + 45);
  ctx.fillText("Game Over", CANVAS_WIDTH / 2, panelY + 45);

  ctx.fillStyle = "#555";
  ctx.font = "16px 'Open Sans', sans-serif";
  ctx.fillText("Score", CANVAS_WIDTH / 2, panelY + 80);
  ctx.font = "bold 40px 'Open Sans', sans-serif";
  ctx.fillStyle = "#333";
  ctx.fillText(String(score), CANVAS_WIDTH / 2, panelY + 122);

  ctx.fillStyle = "#888";
  ctx.font = "14px 'Open Sans', sans-serif";
  ctx.fillText("Best: " + bestScore, CANVAS_WIDTH / 2, panelY + 150);

  const btnW = 160;
  const btnH = 40;
  const btnX = (CANVAS_WIDTH - btnW) / 2;
  const btnY = panelY + panelH - 55;
  drawRoundedRect(ctx, btnX, btnY, btnW, btnH, 8);
  const btnGrad = ctx.createLinearGradient(0, btnY, 0, btnY + btnH);
  btnGrad.addColorStop(0, "#5BBF2A");
  btnGrad.addColorStop(1, "#4A9E22");
  ctx.fillStyle = btnGrad;
  ctx.fill();
  ctx.strokeStyle = "#3D8A1A";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#FFF";
  ctx.font = "bold 18px 'Open Sans', sans-serif";
  ctx.fillText("Play Again", CANVAS_WIDTH / 2, btnY + 27);

  ctx.restore();
}

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState>("idle");
  const birdRef = useRef<Bird>({
    x: CANVAS_WIDTH * 0.3,
    y: CANVAS_HEIGHT / 2,
    velocity: 0,
    rotation: 0,
  });
  const pipesRef = useRef<Pipe[]>([]);
  const scoreRef = useRef(0);
  const bestScoreRef = useRef(0);
  const lastPipeSpawnRef = useRef(0);
  const animFrameRef = useRef(0);
  const scrollXRef = useRef(0);
  const [, setTick] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("flappy-best");
    if (saved) bestScoreRef.current = parseInt(saved, 10) || 0;
  }, []);

  const resetGame = useCallback(() => {
    birdRef.current = {
      x: CANVAS_WIDTH * 0.3,
      y: CANVAS_HEIGHT / 2,
      velocity: 0,
      rotation: 0,
    };
    pipesRef.current = [];
    scoreRef.current = 0;
    lastPipeSpawnRef.current = Date.now();
    scrollXRef.current = 0;
  }, []);

  const handleCanvasClick = useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      if (gameStateRef.current === "gameover") {
        gameStateRef.current = "idle";
        resetGame();
        setTick((t) => t + 1);
        return;
      }
      flap();
    },
    []
  );

  const flap = useCallback(() => {
    if (gameStateRef.current === "idle") {
      gameStateRef.current = "playing";
      resetGame();
      birdRef.current.velocity = FLAP_FORCE;
    } else if (gameStateRef.current === "playing") {
      birdRef.current.velocity = FLAP_FORCE;
    }
  }, [resetGame]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        if (gameStateRef.current === "gameover") {
          gameStateRef.current = "idle";
          resetGame();
          setTick((t) => t + 1);
        } else {
          flap();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [flap, resetGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gameLoop = () => {
      const bird = birdRef.current;
      const state = gameStateRef.current;

      if (state === "playing") {
        scrollXRef.current += PIPE_SPEED;

        bird.velocity += GRAVITY;
        bird.y += bird.velocity;
        bird.rotation = bird.velocity * 0.06;

        const now = Date.now();
        if (now - lastPipeSpawnRef.current > PIPE_SPAWN_INTERVAL) {
          const minTop = 60;
          const maxTop = CANVAS_HEIGHT - GROUND_HEIGHT - PIPE_GAP - 60;
          const topHeight = minTop + Math.random() * (maxTop - minTop);
          pipesRef.current.push({
            x: CANVAS_WIDTH + 10,
            topHeight,
            scored: false,
          });
          lastPipeSpawnRef.current = now;
        }

        pipesRef.current.forEach((pipe) => {
          pipe.x -= PIPE_SPEED;
        });
        pipesRef.current = pipesRef.current.filter(
          (p) => p.x > -PIPE_WIDTH - 20
        );

        const groundY = CANVAS_HEIGHT - GROUND_HEIGHT;
        if (bird.y + BIRD_SIZE / 2 >= groundY || bird.y - BIRD_SIZE / 2 <= 0) {
          gameStateRef.current = "gameover";
          if (scoreRef.current > bestScoreRef.current) {
            bestScoreRef.current = scoreRef.current;
            localStorage.setItem("flappy-best", String(bestScoreRef.current));
          }
        }

        pipesRef.current.forEach((pipe) => {
          const birdLeft = bird.x - BIRD_SIZE / 2 + 4;
          const birdRight = bird.x + BIRD_SIZE / 2 - 4;
          const birdTop = bird.y - BIRD_SIZE / 2 + 4;
          const birdBottom = bird.y + BIRD_SIZE / 2 - 4;
          const pipeLeft = pipe.x - 5;
          const pipeRight = pipe.x + PIPE_WIDTH + 5;

          if (birdRight > pipeLeft && birdLeft < pipeRight) {
            if (
              birdTop < pipe.topHeight ||
              birdBottom > pipe.topHeight + PIPE_GAP
            ) {
              gameStateRef.current = "gameover";
              if (scoreRef.current > bestScoreRef.current) {
                bestScoreRef.current = scoreRef.current;
                localStorage.setItem(
                  "flappy-best",
                  String(bestScoreRef.current)
                );
              }
            }
          }

          if (!pipe.scored && pipe.x + PIPE_WIDTH < bird.x) {
            pipe.scored = true;
            scoreRef.current++;
          }
        });
      } else if (state === "idle") {
        bird.y = CANVAS_HEIGHT / 2 + Math.sin(Date.now() * 0.003) * 12;
        bird.rotation = 0;
        scrollXRef.current += 0.5;
      }

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      drawBackground(ctx, scrollXRef.current);

      if (state === "playing" || state === "gameover") {
        pipesRef.current.forEach((pipe) => drawPipe(ctx, pipe));
      }

      drawBird(ctx, bird);

      if (state === "playing") {
        drawScore(ctx, scoreRef.current);
      } else if (state === "idle") {
        drawStartScreen(ctx);
      } else if (state === "gameover") {
        drawScore(ctx, scoreRef.current);
        drawGameOverScreen(ctx, scoreRef.current, bestScoreRef.current);
      }

      animFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] select-none"
      data-testid="game-container"
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleCanvasClick}
        onTouchStart={(e) => {
          e.preventDefault();
          handleCanvasClick(e);
        }}
        className="rounded-md cursor-pointer"
        style={{
          maxWidth: "100vw",
          maxHeight: "85vh",
          imageRendering: "auto",
          boxShadow:
            "0 0 40px rgba(77, 201, 246, 0.2), 0 8px 32px rgba(0,0,0,0.4)",
        }}
        data-testid="game-canvas"
      />
      <p className="mt-4 text-sm text-gray-400" data-testid="text-instructions">
        Press Space, tap, or click to flap
      </p>
    </div>
  );
}
