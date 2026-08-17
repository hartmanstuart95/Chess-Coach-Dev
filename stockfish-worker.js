/*
 Chess Coach Stockfish Worker Bootstrap
 Stockfish.js 18
*/

try {
  importScripts(
    'https://unpkg.com/stockfish@18.0.8/bin/stockfish-18-asm.js'
  );
} catch (err) {
  console.error('Could not import Stockfish:', err);
  throw err;
}
