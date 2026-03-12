# Snake Game

A classic Snake game running as a local web server.

## Requirements

- Python 3.6+

## Start the Server

```bash
python3 server.py
```

Then open your browser and go to:

```
http://localhost:8080
```

## Controls

| Key | Action |
|-----|--------|
| Arrow Keys or WASD | Move snake |
| P | Pause / Resume |

## How to Play

1. Press **START GAME** to begin.
2. Guide the snake to eat the red food pellets.
3. Each pellet increases your score and the snake grows longer.
4. The game speeds up as your level increases (every 100 points).
5. Avoid hitting the walls or the snake's own body.
6. Your best score is saved in the browser automatically.

## Scoring

- **+10 × level** points per food eaten
- Level increases every 100 points
- Speed increases with each level (capped at max speed)

## Result

- **Super Food** (⭐): After consuming the `super food`, the snake grows to twice its original length.
  
  | Before eating **Super Food** | After eating **Super Food** |
  |--------|---------|
  | ![img1](https://github.com/renjmindy/myClaudeCode/blob/main/snake_game/Screenshot%202026-03-11%20174940%20before%20eating.png) | ![img2](https://github.com/renjmindy/myClaudeCode/blob/main/snake_game/Screenshot%202026-03-11%20175007%20after%20eating.png) |

- **Wall Penetration**: When the snake hits a wall, it doesn’t die. Instead, it wraps around the board—exiting on one side and reappearing on the opposite side.

   | Before penetrating **Wall** | After penetrating **Wall** |
  |--------|---------|
  | ![img1](https://github.com/renjmindy/myClaudeCode/blob/main/snake_game/Screenshot%202026-03-11%20175020%20before%20walking%20through%20wall.png) | ![img2](https://github.com/renjmindy/myClaudeCode/blob/main/snake_game/Screenshot%202026-03-11%20175032%20after%20walking%20through%20wall.png) |

- Video: ![Demo Video](https://github.com/renjmindy/myClaudeCode/blob/main/snake_game/Snake%20Game%20-%20Personal%20-%20Microsoft%E2%80%8B%20Edge%202026-03-11%2018-06-06.mp4)
 
