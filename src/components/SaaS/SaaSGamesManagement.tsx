import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Gamepad2, 
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Play,
  Pause,
  Users,
  TrendingUp,
  Calendar,
  Star,
  Download,
  Upload,
  Filter,
  MoreHorizontal,
  ChevronRight,
  ChevronLeft,
  Trophy,
  Target,
  Zap,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  Heart,
  ThumbsUp,
  MessageSquare,
  Share2,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

// Game Interface
interface Game {
  _id: string;
  name: string;
  description: string;
  category: 'action' | 'puzzle' | 'strategy' | 'arcade' | 'sports' | 'adventure';
  status: 'active' | 'inactive' | 'maintenance';
  companyId: string;
  companyName: string;
  totalPlayers: number;
  activePlayers: number;
  totalPlays: number;
  averageRating: number;
  totalRatings: number;
  createdAt: string;
  updatedAt: string;
  thumbnail: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedPlayTime: number; // in minutes
  isMultiplayer: boolean;
  maxPlayers: number;
  revenue: number;
  lastPlayed: string;
}

// Mock Games Data
const mockGames: Game[] = [
  {
    _id: '1',
    name: 'Space Adventure',
    description: 'An exciting space exploration game with stunning graphics and engaging gameplay.',
    category: 'adventure',
    status: 'active',
    companyId: 'comp1',
    companyName: 'TechCorp',
    totalPlayers: 1250,
    activePlayers: 89,
    totalPlays: 15600,
    averageRating: 4.5,
    totalRatings: 234,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T15:30:00Z',
    thumbnail: '/api/placeholder/200/150',
    tags: ['space', 'adventure', 'single-player'],
    difficulty: 'medium',
    estimatedPlayTime: 45,
    isMultiplayer: false,
    maxPlayers: 1,
    revenue: 12500,
    lastPlayed: '2024-01-20T14:45:00Z'
  },
  {
    _id: '2',
    name: 'Puzzle Master',
    description: 'Challenge your mind with hundreds of brain-teasing puzzles.',
    category: 'puzzle',
    status: 'active',
    companyId: 'comp2',
    companyName: 'GameStudio',
    totalPlayers: 890,
    activePlayers: 67,
    totalPlays: 8900,
    averageRating: 4.2,
    totalRatings: 156,
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-18T12:00:00Z',
    thumbnail: '/api/placeholder/200/150',
    tags: ['puzzle', 'brain', 'casual'],
    difficulty: 'easy',
    estimatedPlayTime: 15,
    isMultiplayer: false,
    maxPlayers: 1,
    revenue: 8900,
    lastPlayed: '2024-01-19T16:20:00Z'
  },
  {
    _id: '3',
    name: 'Battle Arena',
    description: 'Multiplayer battle royale game with intense combat and strategy.',
    category: 'action',
    status: 'active',
    companyId: 'comp1',
    companyName: 'TechCorp',
    totalPlayers: 2100,
    activePlayers: 156,
    totalPlays: 45600,
    averageRating: 4.7,
    totalRatings: 445,
    createdAt: '2024-01-05T14:00:00Z',
    updatedAt: '2024-01-20T18:00:00Z',
    thumbnail: '/api/placeholder/200/150',
    tags: ['battle', 'multiplayer', 'action'],
    difficulty: 'hard',
    estimatedPlayTime: 30,
    isMultiplayer: true,
    maxPlayers: 100,
    revenue: 25600,
    lastPlayed: '2024-01-20T19:30:00Z'
  }
];

export default function SaaSGamesManagement() {
  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showGameDetails, setShowGameDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);

  // Game states
  const [activeGame, setActiveGame] = useState<string | null>(null);
  
  // Tetris Game State
  const [tetrisGame, setTetrisGame] = useState({
    board: Array(20).fill(null).map(() => Array(10).fill(0)),
    currentPiece: null,
    nextPiece: null,
    score: 0,
    lines: 0,
    level: 1,
    gameOver: false,
    gameStarted: false,
    dropTime: 0
  });

  // Tic Tac Toe State
  const [ticTacToe, setTicTacToe] = useState({
    board: Array(9).fill(''),
    currentPlayer: 'X',
    winner: null,
    gameOver: false
  });

  // Memory Game State
  const [memoryGame, setMemoryGame] = useState({
    cards: Array(16).fill(null).map((_, i) => ({ id: i, value: Math.floor(i / 2), flipped: false, matched: false })),
    flippedCards: [],
    moves: 0,
    gameOver: false,
    startTime: null
  });

  // Stats
  const totalGames = games.length;
  const activeGames = games.filter(game => game.status === 'active').length;
  const totalPlayers = games.reduce((sum, game) => sum + game.totalPlayers, 0);
  const totalRevenue = games.reduce((sum, game) => sum + game.revenue, 0);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setGames(mockGames);
      setFilteredGames(mockGames);
      setLoading(false);
    }, 1000);
  }, []);

  // Tetris game loop
  useEffect(() => {
    if (activeGame === 'tetris' && tetrisGame.gameStarted && !tetrisGame.gameOver) {
      const interval = setInterval(() => {
        setTetrisGame(prev => {
          if (!prev.gameStarted || prev.gameOver) return prev;
          
          // Simple tetris logic - just move pieces down
          const newBoard = prev.board.map(row => [...row]);
          
          // Add some random blocks for demo
          if (Math.random() < 0.1) {
            const randomCol = Math.floor(Math.random() * 10);
            for (let row = 19; row >= 0; row--) {
              if (newBoard[row][randomCol] === 0) {
                newBoard[row][randomCol] = Math.floor(Math.random() * 4) + 1;
                break;
              }
            }
          }
          
          // Check for completed lines
          let linesCleared = 0;
          for (let row = 19; row >= 0; row--) {
            if (newBoard[row].every(cell => cell !== 0)) {
              newBoard.splice(row, 1);
              newBoard.unshift(Array(10).fill(0));
              linesCleared++;
              row++; // Check the same row again
            }
          }
          
          const newScore = prev.score + linesCleared * 100;
          const newLines = prev.lines + linesCleared;
          const newLevel = Math.floor(newLines / 10) + 1;
          
          return {
            ...prev,
            board: newBoard,
            score: newScore,
            lines: newLines,
            level: newLevel
          };
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [activeGame, tetrisGame.gameStarted, tetrisGame.gameOver]);

  // Keyboard controls for Tetris game
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (activeGame === 'tetris') {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            // Move piece left
            break;
          case 'ArrowRight':
            e.preventDefault();
            // Move piece right
            break;
          case 'ArrowDown':
            e.preventDefault();
            // Drop piece faster
            break;
          case 'ArrowUp':
            e.preventDefault();
            // Rotate piece
            break;
          case ' ':
            e.preventDefault();
            // Hard drop
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [activeGame]);

  useEffect(() => {
    let filtered = games;

    if (searchTerm) {
      filtered = filtered.filter(game =>
        game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.companyName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(game => game.category === categoryFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(game => game.status === statusFilter);
    }

    if (companyFilter !== 'all') {
      filtered = filtered.filter(game => game.companyId === companyFilter);
    }

    setFilteredGames(filtered);
  }, [games, searchTerm, categoryFilter, statusFilter, companyFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Tetris Game Functions
  const startTetrisGame = () => {
    setActiveGame('tetris');
    setTetrisGame({
      board: Array(20).fill(null).map(() => Array(10).fill(0)),
      currentPiece: null,
      nextPiece: null,
      score: 0,
      lines: 0,
      level: 1,
      gameOver: false,
      gameStarted: true,
      dropTime: 0
    });
  };

  // Tic Tac Toe Functions
  const startTicTacToe = () => {
    setActiveGame('tic-tac-toe');
    setTicTacToe({
      board: Array(9).fill(''),
      currentPlayer: 'X',
      winner: null,
      gameOver: false
    });
  };

  const makeMove = (index: number) => {
    if (ticTacToe.board[index] || ticTacToe.gameOver) return;

    const newBoard = [...ticTacToe.board];
    newBoard[index] = ticTacToe.currentPlayer;

    const winner = checkWinner(newBoard);
    const gameOver = winner || newBoard.every(cell => cell !== '');

    setTicTacToe(prev => ({
      ...prev,
      board: newBoard,
      currentPlayer: prev.currentPlayer === 'X' ? 'O' : 'X',
      winner,
      gameOver
    }));
  };

  const checkWinner = (board: string[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (let line of lines) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  };

  // Memory Game Functions
  const startMemoryGame = () => {
    setActiveGame('memory');
    const shuffledCards = Array(16).fill(null).map((_, i) => ({ 
      id: i, 
      value: Math.floor(i / 2), 
      flipped: false, 
      matched: false 
    })).sort(() => Math.random() - 0.5);

    setMemoryGame({
      cards: shuffledCards,
      flippedCards: [],
      moves: 0,
      gameOver: false,
      startTime: Date.now()
    });
  };

  const flipCard = (index: number) => {
    if (memoryGame.cards[index].flipped || memoryGame.cards[index].matched || memoryGame.flippedCards.length >= 2) {
      return;
    }

    const newCards = [...memoryGame.cards];
    newCards[index].flipped = true;
    const newFlippedCards = [...memoryGame.flippedCards, index];

    setMemoryGame(prev => ({
      ...prev,
      cards: newCards,
      flippedCards: newFlippedCards
    }));

    if (newFlippedCards.length === 2) {
      setTimeout(() => {
        const [first, second] = newFlippedCards;
        const card1 = newCards[first];
        const card2 = newCards[second];

        if (card1.value === card2.value) {
          newCards[first].matched = true;
          newCards[second].matched = true;
        } else {
          newCards[first].flipped = false;
          newCards[second].flipped = false;
        }

        const gameOver = newCards.every(card => card.matched);

        setMemoryGame(prev => ({
          ...prev,
          cards: newCards,
          flippedCards: [],
          moves: prev.moves + 1,
          gameOver
        }));
      }, 1000);
    }
  };

  const resetGame = () => {
    setActiveGame(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'action': return <Zap className="h-4 w-4" />;
      case 'puzzle': return <Target className="h-4 w-4" />;
      case 'strategy': return <Trophy className="h-4 w-4" />;
      case 'arcade': return <Gamepad2 className="h-4 w-4" />;
      case 'sports': return <Target className="h-4 w-4" />;
      case 'adventure': return <Globe className="h-4 w-4" />;
      default: return <Gamepad2 className="h-4 w-4" />;
    }
  };

  const paginatedGames = filteredGames.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredGames.length / itemsPerPage);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 dark:border-gray-400 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-gray-100 mb-2">
              Loading Games...
            </h2>
            <p className="text-slate-600 dark:text-gray-400">Fetching game data from the platform</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-slate-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100">
            Games
          </h1>
          <p className="text-slate-600 dark:text-gray-400 mt-2">
            Play amazing games and have fun!
          </p>
        </div>
      </div>


      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Tetris Game Card */}
         <div className="bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 p-6 rounded-xl border border-orange-200 dark:border-orange-800">
           <div className="text-center">
             <div className="w-20 h-20 bg-orange-500 dark:bg-orange-600 rounded-full mx-auto mb-4 flex items-center justify-center">
               <span className="text-white font-bold text-3xl">🧩</span>
             </div>
             <h3 className="text-xl font-bold text-slate-900 dark:text-gray-100 mb-2">Tetris Blocks</h3>
             <p className="text-slate-600 dark:text-gray-400 mb-4">Classic block puzzle game - clear lines to score!</p>
             <div className="flex items-center justify-center gap-2 mb-4">
               <Star className="h-4 w-4 text-yellow-500 fill-current" />
               <span className="text-sm font-medium text-slate-900 dark:text-gray-100">4.9/5</span>
               <Badge variant="outline" className="ml-2 dark:border-gray-600 dark:text-gray-300">Medium</Badge>
             </div>
             <Button 
               className="w-full bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600"
               onClick={startTetrisGame}
             >
               <Play className="h-4 w-4 mr-2" />
               Start Playing
             </Button>
           </div>
         </div>

        {/* Tic Tac Toe Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-500 dark:bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Target className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-gray-100 mb-2">Tic Tac Toe</h3>
            <p className="text-slate-600 dark:text-gray-400 mb-4">Strategic 3x3 grid game</p>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="text-sm font-medium text-slate-900 dark:text-gray-100">4.5/5</span>
              <Badge variant="outline" className="ml-2 dark:border-gray-600 dark:text-gray-300">Easy</Badge>
            </div>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              onClick={startTicTacToe}
            >
              <Play className="h-4 w-4 mr-2" />
              Start Playing
            </Button>
          </div>
        </div>

        {/* Memory Game Card */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
          <div className="text-center">
            <div className="w-20 h-20 bg-purple-500 dark:bg-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-gray-100 mb-2">Memory Game</h3>
            <p className="text-slate-600 dark:text-gray-400 mb-4">Test your memory skills</p>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="text-sm font-medium text-slate-900 dark:text-gray-100">4.7/5</span>
              <Badge variant="outline" className="ml-2 dark:border-gray-600 dark:text-gray-300">Medium</Badge>
            </div>
            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
              onClick={startMemoryGame}
            >
              <Play className="h-4 w-4 mr-2" />
              Start Playing
            </Button>
          </div>
        </div>
      </div>

       {/* Tetris Game Interface */}
       {activeGame === 'tetris' && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
             <div className="flex justify-between items-center mb-4">
               <h2 className="text-2xl font-bold text-slate-900">🧩 Tetris Blocks</h2>
               <Button onClick={resetGame} variant="outline" size="sm">
                 ✕ Close
               </Button>
             </div>
             
             <div className="grid grid-cols-3 gap-6">
               <div className="col-span-2">
                 <div className="bg-slate-900 rounded-lg p-4 border-2 border-slate-700">
                   <div className="grid grid-cols-10 gap-0 w-80 h-96 mx-auto">
                     {tetrisGame.board.map((row, rowIndex) =>
                       row.map((cell, colIndex) => (
                         <div
                           key={`${rowIndex}-${colIndex}`}
                           className={`w-8 h-4 border border-slate-700 ${
                             cell === 0 ? 'bg-slate-800' :
                             cell === 1 ? 'bg-red-500' :
                             cell === 2 ? 'bg-blue-500' :
                             cell === 3 ? 'bg-green-500' :
                             cell === 4 ? 'bg-yellow-500' :
                             'bg-purple-500'
                           }`}
                         />
                       ))
                     )}
                   </div>
                 </div>
               </div>
               
               <div className="space-y-4">
                 <div className="bg-slate-50 rounded-lg p-4">
                   <h3 className="font-semibold text-slate-900 mb-2">Score</h3>
                   <div className="text-2xl font-bold text-orange-600">{tetrisGame.score}</div>
                 </div>
                 
                 <div className="bg-slate-50 rounded-lg p-4">
                   <h3 className="font-semibold text-slate-900 mb-2">Lines</h3>
                   <div className="text-xl font-bold text-blue-600">{tetrisGame.lines}</div>
                 </div>
                 
                 <div className="bg-slate-50 rounded-lg p-4">
                   <h3 className="font-semibold text-slate-900 mb-2">Level</h3>
                   <div className="text-xl font-bold text-green-600">{tetrisGame.level}</div>
                 </div>
                 
                 <div className="text-sm text-slate-600">
                   <p className="mb-2">Controls:</p>
                   <p>← → Move</p>
                   <p>↓ Drop faster</p>
                   <p>↑ Rotate</p>
                   <p>Space Hard drop</p>
                 </div>
               </div>
             </div>

             {tetrisGame.gameOver && (
               <div className="text-center mt-4">
                 <div className="text-red-600 font-bold mb-4">Game Over! Final Score: {tetrisGame.score}</div>
                 <Button onClick={startTetrisGame} className="bg-orange-600 hover:bg-orange-700">
                   <Play className="h-4 w-4 mr-2" />
                   Play Again
                 </Button>
               </div>
             )}
           </div>
         </div>
       )}

      {/* Tic Tac Toe Game Interface */}
      {activeGame === 'tic-tac-toe' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-slate-900">🎯 Tic Tac Toe</h2>
              <Button onClick={resetGame} variant="outline" size="sm">
                ✕ Close
              </Button>
            </div>
            
            <div className="text-center mb-4">
              {ticTacToe.winner ? (
                <div className="text-green-600 font-bold text-lg">🎉 {ticTacToe.winner} Wins!</div>
              ) : ticTacToe.gameOver ? (
                <div className="text-slate-600 font-bold text-lg">It's a Draw!</div>
              ) : (
                <div className="text-slate-900 font-semibold">Current Player: {ticTacToe.currentPlayer}</div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 w-64 h-64 mx-auto mb-4">
              {ticTacToe.board.map((cell, index) => (
                <button
                  key={index}
                  onClick={() => makeMove(index)}
                  className="w-20 h-20 bg-slate-100 border-2 border-slate-300 rounded-lg flex items-center justify-center text-2xl font-bold hover:bg-slate-200 transition-colors"
                  disabled={cell !== '' || ticTacToe.gameOver}
                >
                  {cell}
                </button>
              ))}
            </div>

            {ticTacToe.gameOver && (
              <div className="text-center">
                <Button onClick={startTicTacToe} className="bg-blue-600 hover:bg-blue-700">
                  <Play className="h-4 w-4 mr-2" />
                  Play Again
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Memory Game Interface */}
      {activeGame === 'memory' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-slate-900">❤️ Memory Game</h2>
              <Button onClick={resetGame} variant="outline" size="sm">
                ✕ Close
              </Button>
            </div>
            
            <div className="text-center mb-4">
              <div className="text-lg font-semibold text-slate-900">Moves: {memoryGame.moves}</div>
              {memoryGame.gameOver && (
                <div className="text-green-600 font-bold mt-2">🎉 Congratulations! You completed the game!</div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2 w-80 h-80 mx-auto mb-4">
              {memoryGame.cards.map((card, index) => (
                <button
                  key={index}
                  onClick={() => flipCard(index)}
                  className={`w-18 h-18 rounded-lg flex items-center justify-center text-2xl font-bold transition-all duration-300 ${
                    card.flipped || card.matched
                      ? 'bg-white border-2 border-slate-300'
                      : 'bg-slate-200 border-2 border-slate-300 hover:bg-slate-300'
                  }`}
                  disabled={card.flipped || card.matched || memoryGame.flippedCards.length >= 2}
                >
                  {card.flipped || card.matched ? (
                    <span className="text-2xl">
                      {['🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎪', '🎨'][card.value]}
                    </span>
                  ) : (
                    '?'
                  )}
                </button>
              ))}
            </div>

            {memoryGame.gameOver && (
              <div className="text-center">
                <Button onClick={startMemoryGame} className="bg-purple-600 hover:bg-purple-700">
                  <Play className="h-4 w-4 mr-2" />
                  Play Again
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Game Details Dialog */}
      <Dialog open={showGameDetails} onOpenChange={setShowGameDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              {selectedGame?.name}
            </DialogTitle>
            <DialogDescription>
              Detailed information about the selected game
            </DialogDescription>
          </DialogHeader>
          
          {selectedGame && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Game Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Category:</span> {selectedGame.category}</div>
                    <div><span className="font-medium">Difficulty:</span> {selectedGame.difficulty}</div>
                    <div><span className="font-medium">Play Time:</span> {selectedGame.estimatedPlayTime} min</div>
                    <div><span className="font-medium">Multiplayer:</span> {selectedGame.isMultiplayer ? 'Yes' : 'No'}</div>
                    {selectedGame.isMultiplayer && (
                      <div><span className="font-medium">Max Players:</span> {selectedGame.maxPlayers}</div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Statistics</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Total Players:</span> {selectedGame.totalPlayers.toLocaleString()}</div>
                    <div><span className="font-medium">Active Players:</span> {selectedGame.activePlayers}</div>
                    <div><span className="font-medium">Total Plays:</span> {selectedGame.totalPlays.toLocaleString()}</div>
                    <div><span className="font-medium">Revenue:</span> {formatCurrency(selectedGame.revenue)}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-slate-900 mb-2">Description</h4>
                <p className="text-sm text-slate-600">{selectedGame.description}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-slate-900 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedGame.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
