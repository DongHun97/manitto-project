function showAdminLogin() {
  document.getElementById('adminLogin').style.display = 'block';
}

let adminInfo = {};

async function adminLogin() {
  const id = document.getElementById('adminId').value;
  const password = document.getElementById('adminPw').value;
  adminInfo = { id, password };
  const res = await fetch('/admin/view', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, password, reveal: false })
  });
  const result = await res.json();
  if (res.ok) {
    renderResult(result.data, false);
  } else {
    alert("❌ 로그인 실패: " + result.error);
  }
}

async function revealRealNames() {
  const res = await fetch('/admin/view', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...adminInfo, reveal: true })
  });
  const result = await res.json();
  if (res.ok) {
    renderResult(result.data, true);
  }
}

function renderResult(data, reveal) {
  let html = `<h3>${reveal ? "✅ 실명 결과" : "🙈 익명 마니또 배정 상태"}</h3>`;
  for (const team in data) {
    html += `<h4>${team}</h4><ul>`;
    for (const person in data[team]) {
      html += `<li>${person} 👉 ${data[team][person]}</li>`;
    }
    html += "</ul>";
  }
  if (!reveal) html += `<button onclick="revealRealNames()">✅ 최종 결과 보기</button>`;
  document.getElementById('adminResult').innerHTML = html;
}
