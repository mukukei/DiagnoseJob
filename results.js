const userId = 'test_user'; // 今は固定でOK

const resultsContainer = document.getElementById('results-container');

fetch(`/results?user_id=${userId}`)
  .then(res => res.json())
  .then(data => {
    if (data.length === 0) {
      resultsContainer.innerHTML = '<p>診断履歴はまだありません。</p>';
      return;
    }

    let html = '<ul>';
    data.forEach(result => {
      html += `
        <li>
          <strong>${new Date(result.created_at).toLocaleString()}</strong><br>
          タイプ: ${result.type}<br>
          コメント: ${result.comment}<br>
          おすすめ職種: ${result.job_suggestion}<br>
        </li>
        <hr>
      `;
    });
    html += '</ul>';
    resultsContainer.innerHTML = html;
  })
  .catch(err => {
    console.error(err);
    resultsContainer.innerHTML = '<p>履歴取得に失敗しました。</p>';
  });
