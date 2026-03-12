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

- Super Food ⭐ the snake becomes twice longer after consuming `super food`. 
