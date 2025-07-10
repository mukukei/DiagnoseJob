let questions = [];
let currentIndex = 0;
const userId = 'test_user'; // 本番は UUID などにするのもあり！

const questionContainer = document.getElementById('question-container');
const choicesContainer = document.getElementById('choices');
const resultContainer = document.getElementById('result-container');

// 初期化
fetch('/questions')
  .then(res => res.json())
  .then(data => {
    questions = data;
    showQuestion();
  })
  .catch(err => {
    console.error('質問の取得に失敗:', err);
  });

function showQuestion() {
  if (currentIndex >= questions.length) {
    diagnose();
    return;
  }

  const q = questions[currentIndex];

  // 質問テキスト
  questionContainer.innerHTML = `<p>${q.id}. ${q.text}</p>`;

  // 選択肢を生成
  choicesContainer.innerHTML = `
    <button onclick="answer('${q.choice_a}')">${q.choice_a}</button>
    <button onclick="answer('${q.choice_b}')">${q.choice_b}</button>
  `;
}

function answer(choice) {
  const q = questions[currentIndex];

  fetch('/answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      question_id: q.id,
      answer: choice === q.choice_a ? 'A' : 'B'
    })
  }).catch(err => {
    console.error('回答保存エラー:', err);
  });

  currentIndex++;
  showQuestion();
}

function diagnose() {
  fetch('/diagnose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId })
  })
    .then(res => res.json())
    .then(data => {
      resultContainer.innerHTML = `
        <h2>診断結果</h2>
        <p>タイプ: ${data.type}</p>
        <p>${data.comment}</p>
        <p>おすすめ職種: ${data.job_suggestion}</p>
      `;

      questionContainer.innerHTML = '';
      choicesContainer.innerHTML = '';
    })
    .catch(err => {
      console.error('診断エラー:', err);
    });
}
