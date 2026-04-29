const https = require('https');

// Cache for API questions to avoid rate limiting
let questionCache = [];
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MIN_FETCH_INTERVAL = 6000; // 6 seconds between API calls (API limit is 5 seconds)

// Available categories (user-specified)
const AVAILABLE_CATEGORIES = [
  { id: 9, name: "General Knowledge" },
  { id: 11, name: "Entertainment: Film" },
  { id: 17, name: "Science & Nature" },
  { id: 18, name: "Science: Computers" },
  { id: 19, name: "Science: Mathematics" },
  { id: 20, name: "Mythology" },
  { id: 21, name: "Sports" },
  { id: 22, name: "Geography" },
  { id: 23, name: "History" },
  { id: 24, name: "Politics" },
  { id: 25, name: "Art" },
  { id: 26, name: "Celebrities" },
  { id: 27, name: "Animals" },
  { id: 28, name: "Vehicles" },
  { id: 30, name: "Science: Gadgets" }
];

// Difficulty mapping for categories
const DIFFICULTY_MAPPING = {
  easy: [
    { id: 9, name: "General Knowledge" },
    { id: 11, name: "Entertainment: Film" },
    { id: 21, name: "Sports" },
    { id: 26, name: "Celebrities" },
    { id: 27, name: "Animals" }
  ],
  medium: [
    { id: 17, name: "Science & Nature" },
    { id: 22, name: "Geography" },
    { id: 23, name: "History" },
    { id: 28, name: "Vehicles" }
  ],
  hard: [
    { id: 18, name: "Science: Computers" },
    { id: 19, name: "Science: Mathematics" },
    { id: 20, name: "Mythology" },
    { id: 24, name: "Politics" },
    { id: 25, name: "Art" },
    { id: 30, name: "Science: Gadgets" }
  ]
};

// Difficulty scoring multipliers
const DIFFICULTY_POINTS = {
  easy: { base: 100, color: "#00ff88" },      // Green
  medium: { base: 150, color: "#ffd700" },    // Gold  
  hard: { base: 200, color: "#ff3d6b" }       // Red
};

// Fallback questions in case API fails
const fallbackQuestions = [
  {
    id: 1,
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    answer: 1,
    category: "Science",
  },
  {
    id: 2,
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
    answer: 3,
    category: "Geography",
  },
  {
    id: 3,
    question: "Who painted the Mona Lisa?",
    options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
    answer: 2,
    category: "Art",
  },
  {
    id: 4,
    question: "What is the chemical symbol for gold?",
    options: ["Ag", "Fe", "Au", "Cu"],
    answer: 2,
    category: "Science",
  },
  {
    id: 5,
    question: "In which year did World War II end?",
    options: ["1943", "1944", "1945", "1946"],
    answer: 2,
    category: "History",
  },
  {
    id: 6,
    question: "What is the fastest land animal?",
    options: ["Lion", "Cheetah", "Leopard", "Gazelle"],
    answer: 1,
    category: "Nature",
  },
  {
    id: 7,
    question: "How many sides does a hexagon have?",
    options: ["5", "6", "7", "8"],
    answer: 1,
    category: "Math",
  },
  {
    id: 8,
    question: "What language has the most native speakers?",
    options: ["English", "Spanish", "Mandarin Chinese", "Hindi"],
    answer: 2,
    category: "Language",
  },
];

// Fetch questions from Open Trivia DB API with rate limiting
async function fetchQuestionsFromAPI(count = 8, categoryId = null) {
  return new Promise((resolve, reject) => {
    // Check if we need to wait for rate limiting
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime;
    
    if (timeSinceLastFetch < MIN_FETCH_INTERVAL) {
      console.log(`Rate limiting: waiting ${MIN_FETCH_INTERVAL - timeSinceLastFetch}ms before API call`);
      setTimeout(() => {
        performAPICall(count, resolve, reject, categoryId);
      }, MIN_FETCH_INTERVAL - timeSinceLastFetch);
    } else {
      performAPICall(count, resolve, reject, categoryId);
    }
  });
}

function performAPICall(count, resolve, reject, categoryId = null) {
  let url = `https://opentdb.com/api.php?amount=${count}&type=multiple&encode=url3986`;
  if (categoryId) {
    url += `&category=${categoryId}`;
  }
  lastFetchTime = Date.now();
  
  https.get(url, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        
        if (response.response_code === 0) {
          // Transform API response to our format
          const questions = response.results.map((q, index) => {
            // Decode URL encoded strings
            const question = decodeURIComponent(q.question);
            const category = decodeURIComponent(q.category);
            
            // Combine correct and incorrect answers, then shuffle
            const allAnswers = [...q.incorrect_answers, q.correct_answer];
            const shuffledAnswers = allAnswers.sort(() => Math.random() - 0.5);
            
            // Find the index of the correct answer after shuffling
            const correctAnswerIndex = shuffledAnswers.indexOf(q.correct_answer);
            
            return {
              id: index + 1,
              question: question,
              options: shuffledAnswers.map(answer => decodeURIComponent(answer)),
              answer: correctAnswerIndex,
              category: category,
            };
          });
          
          // Update cache
          questionCache = questions;
          console.log('Successfully fetched fresh questions from API');
          resolve(questions);
        } else {
          console.log('API returned non-zero response code:', response.response_code);
          resolve(getFallbackQuestions(count));
        }
      } catch (error) {
        console.error('Error parsing API response:', error);
        resolve(getFallbackQuestions(count));
      }
    });
  }).on('error', (error) => {
    console.error('Error fetching from API:', error);
    resolve(getFallbackQuestions(count));
  });
}

// Fallback to static questions
function getFallbackQuestions(count = 8) {
  const shuffled = [...fallbackQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Get random category from difficulty level
function getRandomCategory(difficulty) {
  const categories = DIFFICULTY_MAPPING[difficulty];
  if (!categories || categories.length === 0) return null;
  return categories[Math.floor(Math.random() * categories.length)];
}

// Determine difficulty based on category
function getDifficultyByCategory(categoryId) {
  for (const [difficulty, categories] of Object.entries(DIFFICULTY_MAPPING)) {
    if (categories.find(cat => cat.id === categoryId)) {
      return difficulty;
    }
  }
  return 'medium'; // Default fallback
}

// Main function to get mixed difficulty questions (5 easy, 3 medium, 2 hard)
async function getMixedDifficultyQuestions() {
  const questionCounts = { easy: 5, medium: 3, hard: 2 };
  const allQuestions = [];
  
  console.log('Fetching mixed difficulty questions: 5 easy, 3 medium, 2 hard');
  
  for (const [difficulty, count] of Object.entries(questionCounts)) {
    try {
      // Get random category for this difficulty
      const category = getRandomCategory(difficulty);
      if (!category) {
        console.warn(`No categories found for ${difficulty} difficulty`);
        continue;
      }
      
      console.log(`Fetching ${count} ${difficulty} questions from ${category.name}`);
      const questions = await fetchQuestionsFromAPI(count, category.id);
      
      // Add difficulty metadata to each question
      const questionsWithDifficulty = questions.map(q => ({
        ...q,
        difficulty: difficulty,
        points: DIFFICULTY_POINTS[difficulty].base,
        difficultyColor: DIFFICULTY_POINTS[difficulty].color
      }));
      
      allQuestions.push(...questionsWithDifficulty);
      
      // Add delay between API calls to respect rate limiting
      if (difficulty !== 'hard') {
        await new Promise(resolve => setTimeout(resolve, 6000));
      }
      
    } catch (error) {
      console.error(`Failed to fetch ${difficulty} questions:`, error);
      // Add fallback questions for this difficulty
      const fallback = getFallbackQuestionsByDifficulty(count, difficulty);
      allQuestions.push(...fallback);
    }
  }
  
  // Shuffle all questions to mix difficulties
  const shuffled = allQuestions.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 10); // Ensure exactly 10 questions
}

// Get fallback questions by difficulty
function getFallbackQuestionsByDifficulty(count, difficulty) {
  const difficultyFallbacks = fallbackQuestions.slice(0, count).map(q => ({
    ...q,
    difficulty: difficulty,
    points: DIFFICULTY_POINTS[difficulty].base,
    difficultyColor: DIFFICULTY_POINTS[difficulty].color
  }));
  return difficultyFallbacks;
}

// Get questions by specific difficulty distribution
async function getRandomQuestionsByDifficulty(difficultyDistribution) {
  const allQuestions = [];
  
  console.log(`Fetching questions by difficulty distribution:`, difficultyDistribution);
  
  for (const [difficulty, count] of Object.entries(difficultyDistribution)) {
    try {
      // Get random category for this difficulty
      const category = getRandomCategory(difficulty);
      if (!category) {
        console.warn(`No categories found for ${difficulty} difficulty`);
        continue;
      }
      
      console.log(`Fetching ${count} ${difficulty} questions from ${category.name}`);
      const questions = await fetchQuestionsFromAPI(count, category.id);
      
      // Add difficulty metadata to each question
      const questionsWithDifficulty = questions.map(q => ({
        ...q,
        difficulty: difficulty,
        points: DIFFICULTY_POINTS[difficulty].base,
        difficultyColor: DIFFICULTY_POINTS[difficulty].color
      }));
      
      allQuestions.push(...questionsWithDifficulty);
      
      // Add delay between API calls to respect rate limiting
      if (difficulty !== Object.keys(difficultyDistribution)[Object.keys(difficultyDistribution).length - 1]) {
        await new Promise(resolve => setTimeout(resolve, 6000));
      }
      
    } catch (error) {
      console.error(`Failed to fetch ${difficulty} questions:`, error);
      // Add fallback questions for this difficulty
      const fallback = getFallbackQuestionsByDifficulty(count, difficulty);
      allQuestions.push(...fallback);
    }
  }
  
  // Shuffle all questions to mix difficulties
  const shuffled = allQuestions.sort(() => Math.random() - 0.5);
  return shuffled;
}

// Main function to get random questions with caching and category support
async function getRandomQuestions(count = 8, categoryId = null) {
  // If no specific category and count is 10, use mixed difficulty
  if (!categoryId && count === 10) {
    return await getMixedDifficultyQuestions();
  }
  
  const now = Date.now();
  const cacheKey = categoryId ? `cat_${categoryId}` : 'all';
  
  // For simplicity, we'll bypass cache when specific category is requested
  // In production, you'd want per-category caching
  if (!categoryId && questionCache.length >= count && (now - lastFetchTime) < CACHE_DURATION) {
    console.log('Using cached questions');
    const shuffled = [...questionCache].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
  
  try {
    const categoryName = categoryId ? 
      AVAILABLE_CATEGORIES.find(c => c.id === categoryId)?.name || 'Unknown' : 
      'All Categories';
    console.log(`Fetching fresh questions from API... Category: ${categoryName}`);
    
    const questions = await fetchQuestionsFromAPI(count, categoryId);
    
    // Add difficulty metadata if not mixed difficulty
    const questionsWithDifficulty = questions.map(q => {
      const difficulty = categoryId ? getDifficultyByCategory(categoryId) : 'medium';
      return {
        ...q,
        difficulty: difficulty,
        points: DIFFICULTY_POINTS[difficulty].base,
        difficultyColor: DIFFICULTY_POINTS[difficulty].color
      };
    });
    
    return questionsWithDifficulty;
  } catch (error) {
    console.error('Failed to fetch questions, using fallback:', error);
    return getFallbackQuestions(count);
  }
}

module.exports = { 
  getRandomQuestions, 
  getRandomQuestionsByDifficulty,
  getFallbackQuestions, 
  AVAILABLE_CATEGORIES 
};
