const tips = [
  'Skip counting helps! Count by the larger number to find the answer quickly.',
  'Doubles are easy: 6 × 6 is just 6 + 6 + 6 + 6 + 6 + 6.',
  'Switching numbers does not change the product: 3 × 8 = 8 × 3.',
  'Use nearby facts. If you know 4 × 7, then 5 × 7 is just 7 more.',
  'Ten times a number is easy. 9 × 6 is (10 × 6) − 6.',
  'Five times a number ends with 0 or 5. 5 × 7 = 35.',
  'Think of arrays. 4 × 3 is four rows of three dots each.',
  'Break it apart: 7 × 6 is (7 × 3) + (7 × 3).'
];

const state = {
  factorA: 0,
  factorB: 0,
  correctAnswer: 0,
  asked: 0,
  correct: 0,
  streak: 0,
  bestStreak: 0,
  timerId: null,
  timeLeft: 0
};

const questionEl = document.getElementById('question');
const answersEl = document.getElementById('answers');
const feedbackEl = document.getElementById('feedback');
const tipEl = document.getElementById('tip');
const maxNumberInput = document.getElementById('max-number');
const maxNumberDisplay = document.getElementById('max-number-display');
const resetButton = document.getElementById('reset-button');
const questionsAskedEl = document.getElementById('questions-asked');
const correctAnswersEl = document.getElementById('correct-answers');
const accuracyEl = document.getElementById('accuracy');
const bestStreakEl = document.getElementById('best-streak');
const nextButton = document.getElementById('next-button');
const timerEl = document.getElementById('timer');
const timeLimitSelect = document.getElementById('time-limit');

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function generateOptions(correctAnswer, limit) {
  const answers = new Set([correctAnswer]);

  while (answers.size < 4) {
    const strategy = Math.random();
    let candidate;

    if (strategy < 0.4) {
      const a = randomInt(1, limit);
      const b = randomInt(1, limit);
      candidate = a * b;
    } else if (strategy < 0.7) {
      const offset = randomInt(-limit, limit);
      candidate = correctAnswer + offset;
    } else {
      const multiplier = randomInt(2, 12);
      candidate = multiplier * randomInt(1, limit);
    }

    if (candidate > 0) {
      answers.add(candidate);
    }
  }

  return shuffle(Array.from(answers));
}

function updateStats() {
  questionsAskedEl.textContent = state.asked;
  correctAnswersEl.textContent = state.correct;
  const accuracy = state.asked === 0 ? 0 : Math.round((state.correct / state.asked) * 100);
  accuracyEl.textContent = `${accuracy}%`;
  bestStreakEl.textContent = state.bestStreak;
}

function setFeedback(message, type) {
  feedbackEl.textContent = message;
  feedbackEl.className = `feedback ${type ?? ''}`.trim();
}

function pickTip() {
  const nextTip = tips[randomInt(0, tips.length - 1)];
  tipEl.textContent = nextTip;
}

function presentQuestion() {
  const limit = Number(maxNumberInput.value);
  state.factorA = randomInt(2, limit);
  state.factorB = randomInt(2, limit);
  state.correctAnswer = state.factorA * state.factorB;

  questionEl.textContent = `${state.factorA} × ${state.factorB} ?`;
  answersEl.innerHTML = '';
  setFeedback('Pick the correct answer!', 'neutral');
  pickTip();

  const choices = generateOptions(state.correctAnswer, limit);

  choices.forEach((choice) => {
    const button = document.createElement('button');
    button.className = 'answer';
    button.type = 'button';
    button.textContent = choice;
    button.addEventListener('click', () => handleAnswer(choice, button));
    answersEl.appendChild(button);
  });

  disableAnswers(false);
  nextButton.disabled = true;
  setupTimer();
}

function disableAnswers(disabled) {
  const buttons = answersEl.querySelectorAll('button');
  buttons.forEach((btn) => {
    btn.disabled = disabled;
  });
}

function highlightAnswers(selectedButton, isCorrect) {
  const buttons = answersEl.querySelectorAll('button');
  buttons.forEach((btn) => {
    const choice = Number(btn.textContent);
    if (choice === state.correctAnswer) {
      btn.classList.add('correct');
    }
    if (btn === selectedButton && !isCorrect) {
      btn.classList.add('incorrect');
    }
  });
}

function handleAnswer(choice, button) {
  if (nextButton.disabled === false) {
    return; // already answered
  }

  clearTimer();
  const isCorrect = choice === state.correctAnswer;
  state.asked += 1;
  if (isCorrect) {
    state.correct += 1;
    state.streak += 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    setFeedback('Great job! That\'s correct! 🎉', 'correct');
  } else {
    state.streak = 0;
    setFeedback(`Not quite. ${state.factorA} × ${state.factorB} = ${state.correctAnswer}.`, 'incorrect');
  }

  highlightAnswers(button, isCorrect);
  disableAnswers(true);
  nextButton.disabled = false;
  updateStats();
}

function setupTimer() {
  clearTimer();
  const limit = Number(timeLimitSelect.value);
  if (!limit) {
    timerEl.classList.add('hidden');
    return;
  }

  state.timeLeft = limit;
  timerEl.textContent = `${state.timeLeft} seconds left`;
  timerEl.classList.remove('hidden');

  state.timerId = setInterval(() => {
    state.timeLeft -= 1;
    if (state.timeLeft <= 0) {
      clearTimer();
      timerEl.textContent = 'Time\'s up!';
      disableAnswers(true);
      highlightAnswers(null, false);
      nextButton.disabled = false;
      state.asked += 1;
      state.streak = 0;
      setFeedback(`Time\'s up! ${state.factorA} × ${state.factorB} = ${state.correctAnswer}.`, 'timeout');
      updateStats();
      return;
    }
    timerEl.textContent = `${state.timeLeft} ${state.timeLeft === 1 ? 'second' : 'seconds'} left`;
  }, 1000);
}

function clearTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

function resetScore() {
  state.asked = 0;
  state.correct = 0;
  state.streak = 0;
  state.bestStreak = 0;
  updateStats();
  setFeedback('Score reset. Ready for a new challenge!', 'neutral');
  presentQuestion();
}

maxNumberInput.addEventListener('input', () => {
  maxNumberDisplay.textContent = maxNumberInput.value;
  presentQuestion();
});

nextButton.addEventListener('click', presentQuestion);
resetButton.addEventListener('click', resetScore);

timeLimitSelect.addEventListener('change', () => {
  presentQuestion();
});

updateStats();
presentQuestion();
