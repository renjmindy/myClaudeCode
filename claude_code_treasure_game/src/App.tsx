import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from './components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/ui/table';
import closedChest from './assets/treasure_closed.png';
import keyIcon from './assets/key.png';
import treasureChest from './assets/treasure_opened.png';
import skeletonChest from './assets/treasure_opened_skeleton.png';
import chestOpenSound from './audios/chest_open.mp3';
import evilLaughSound from './audios/chest_open_with_evil_laugh.mp3';
import AuthDialog from './components/AuthDialog';
import { decodeToken, getToken, clearToken } from './lib/auth';

interface Box {
  id: number;
  isOpen: boolean;
  hasTreasure: boolean;
}

interface ScoreRow {
  score: number;
  result: string;
  played_at: string;
}

export default function App() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [score, setScore] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const [result, setResult] = useState<'Win' | 'Tie' | 'Loss' | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [scoreHistory, setScoreHistory] = useState<ScoreRow[]>([]);

  const initializeGame = () => {
    const treasureBoxIndex = Math.floor(Math.random() * 3);
    const newBoxes: Box[] = Array.from({ length: 3 }, (_, index) => ({
      id: index,
      isOpen: false,
      hasTreasure: index === treasureBoxIndex,
    }));
    setBoxes(newBoxes);
    setScore(0);
    setGameEnded(false);
    setResult(null);
    setScoreHistory([]);
  };

  useEffect(() => {
    initializeGame();
    const decoded = decodeToken();
    if (decoded) {
      setCurrentUser(decoded.username);
    } else {
      setShowAuth(true);
    }
  }, []);

  const saveScore = async (finalScore: number, finalResult: string) => {
    const token = getToken();
    if (!token) return;
    await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ score: finalScore, result: finalResult }),
    });
  };

  const fetchScoreHistory = async () => {
    const token = getToken();
    if (!token) return;
    const res = await fetch('/api/scores', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setScoreHistory(await res.json());
  };

  const openBox = async (boxId: number) => {
    if (gameEnded) return;
    const box = boxes.find(b => b.id === boxId);
    if (!box || box.isOpen) return;

    const newScore = box.hasTreasure ? score + 150 : score - 50;
    const updatedBoxes = boxes.map(b => b.id === boxId ? { ...b, isOpen: true } : b);
    const treasureFound = updatedBoxes.some(b => b.isOpen && b.hasTreasure);
    const allOpened = updatedBoxes.every(b => b.isOpen);

    new Audio(box.hasTreasure ? chestOpenSound : evilLaughSound).play();
    setBoxes(updatedBoxes);
    setScore(newScore);

    if (treasureFound || allOpened) {
      const finalResult = newScore > 0 ? 'Win' : newScore === 0 ? 'Tie' : 'Loss';
      setResult(finalResult);
      setGameEnded(true);
      await saveScore(newScore, finalResult);
      await fetchScoreHistory();
    }
  };

  const resetGame = () => {
    initializeGame();
  };

  const signOut = () => {
    clearToken();
    setCurrentUser(null);
    setShowAuth(true);
    initializeGame();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex flex-col items-center justify-center p-8 relative">
      {/* Header bar */}
      <div className="absolute top-4 right-4 flex items-center gap-3">
        {currentUser ? (
          <>
            <span className="text-amber-800 text-sm">Signed in as <strong>{currentUser}</strong></span>
            <Button variant="outline" size="sm" onClick={signOut}>Sign Out</Button>
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setShowAuth(true)}>Sign In</Button>
        )}
      </div>

      <div className="text-center mb-8">
        <h1 className="text-4xl mb-4 text-amber-900">🏴‍☠️ Treasure Hunt Game 🏴‍☠️</h1>
        <p className="text-amber-800 mb-4">
          Click on the treasure chests to discover what's inside!
        </p>
        <p className="text-amber-700 text-sm">
          💰 Treasure: +$150 | 💀 Skeleton: -$50
        </p>
      </div>

      <div className="mb-8 flex items-center gap-4">
        <div className="text-2xl text-center p-4 bg-amber-200/80 backdrop-blur-sm rounded-lg shadow-lg border-2 border-amber-400">
          <span className="text-amber-900">Current Score: </span>
          <span className={`${score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${score}
          </span>
        </div>
        {result && (
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-amber-900">Result:</span>
            {result === 'Win' && (
              <div className="w-24 h-24 rounded-full flex items-center justify-center border-4 text-4xl font-bold shadow-lg text-green-700 border-green-400 bg-green-100">
                Win
              </div>
            )}
            {result === 'Tie' && (
              <div className="w-24 h-24 rounded-full flex items-center justify-center border-4 text-4xl font-bold shadow-lg text-amber-700 border-amber-400 bg-amber-100">
                Tie
              </div>
            )}
            {result === 'Loss' && (
              <div className="w-24 h-24 rounded-full flex items-center justify-center border-4 text-4xl font-bold shadow-lg text-red-700 border-red-400 bg-red-100">
                Loss
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {boxes.map((box) => (
          <motion.div
            key={box.id}
            className="flex flex-col items-center cursor-pointer"
            style={!box.isOpen ? { cursor: `url(${keyIcon}) 16 16, pointer` } : {}}
            whileHover={{ scale: box.isOpen ? 1 : 1.05 }}
            whileTap={{ scale: box.isOpen ? 1 : 0.95 }}
            onClick={() => openBox(box.id)}
          >
            <motion.div
              initial={{ rotateY: 0 }}
              animate={{
                rotateY: box.isOpen ? 180 : 0,
                scale: box.isOpen ? 1.1 : 1
              }}
              transition={{
                duration: 0.6,
                ease: "easeInOut"
              }}
              className="relative"
            >
              <img
                src={box.isOpen
                  ? (box.hasTreasure ? treasureChest : skeletonChest)
                  : closedChest
                }
                alt={box.isOpen
                  ? (box.hasTreasure ? "Treasure!" : "Skeleton!")
                  : "Treasure Chest"
                }
                className="w-48 h-48 object-contain drop-shadow-lg"
              />

              {box.isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="absolute -top-8 left-1/2 transform -translate-x-1/2"
                >
                  {box.hasTreasure ? (
                    <div className="text-2xl animate-bounce">✨💰✨</div>
                  ) : (
                    <div className="text-2xl animate-pulse">💀👻💀</div>
                  )}
                </motion.div>
              )}
            </motion.div>

            <div className="mt-4 text-center">
              {box.isOpen ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                  className={`text-lg p-2 rounded-lg ${
                    box.hasTreasure
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}
                >
                  {box.hasTreasure ? '+$150' : '-$50'}
                </motion.div>
              ) : (
                <div className="text-amber-700 p-2">
                  Click to open!
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {gameEnded && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center w-full max-w-lg"
        >
          <div className="mb-4 p-6 bg-amber-200/80 backdrop-blur-sm rounded-xl shadow-lg border-2 border-amber-400">
            <h2 className="text-2xl mb-2 text-amber-900">Game Over!</h2>
            <p className="text-lg text-amber-800">
              Final Score: <span className={`${score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${score}
              </span>
            </p>
            <p className="text-sm text-amber-600 mt-2">
              {boxes.some(box => box.isOpen && box.hasTreasure)
                ? 'Treasure found! Well done, treasure hunter! 🎉'
                : 'No treasure found this time! Better luck next time! 💀'}
            </p>
          </div>

          {currentUser && scoreHistory.length > 0 && (
            <div className="mb-4 bg-white/80 rounded-xl shadow border border-amber-300 overflow-hidden">
              <div className="p-3 bg-amber-100 border-b border-amber-300">
                <h3 className="text-amber-900 font-semibold">Your Score History</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scoreHistory.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs text-gray-500">
                        {new Date(row.played_at + 'Z').toLocaleString()}
                      </TableCell>
                      <TableCell className={row.score >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ${row.score}
                      </TableCell>
                      <TableCell className={
                        row.result === 'Win' ? 'text-green-700 font-medium' :
                        row.result === 'Loss' ? 'text-red-700 font-medium' :
                        'text-amber-700 font-medium'
                      }>
                        {row.result}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <Button
            onClick={resetGame}
            className="text-lg px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white"
          >
            Play Again
          </Button>
        </motion.div>
      )}

      <AuthDialog
        open={showAuth}
        onSuccess={(username) => { setCurrentUser(username); setShowAuth(false); }}
        onGuestPlay={() => setShowAuth(false)}
      />
    </div>
  );
}
