const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const TEAMS = {
  '예능1팀': ["정현아", "강연우", "강예은", "김소윤", "김준하", "박형준", "윤은선"],
  '예능2팀': ["박지호", "이현영", "이지민", "김예은", "이정우", "김소윤"],
  '뮤비1팀': ["박세영", "곽찬샘", "장혜림", "홍성진", "김늘", "김미정"],
  '뮤비2팀': ["강동훈", "김서현", "방새영", "문소희", "송호석", "고채완"],
  '광고팀': ["김민지", "김건호", "안다은", "우예나", "홍채은"],
  '다큐팀': ["김찬영", "김혜원", "이지아", "김유주", "전시은", "김준민"],
  '고독한미식가팀': ["김예슬", "김예림", "양희용", "황지상", "임채율", "변은서", "임여진", "김준규"]
};

const dataPath = path.join(__dirname, 'data.json');
let data = fs.existsSync(dataPath) ? JSON.parse(fs.readFileSync(dataPath)) : {};
let aliasMap = fs.existsSync('aliases.json') ? JSON.parse(fs.readFileSync('aliases.json')) : {};

function assignManitto(members) {
  let assigned;
  do {
    assigned = members.slice().sort(() => Math.random() - 0.5);
  } while (assigned.some((v, i) => v === members[i]));
  return assigned;
}

function generateAlias(existing) {
  let alias;
  do {
    alias = "ID-" + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  } while (Object.values(existing).includes(alias));
  return alias;
}

app.post('/register', async (req, res) => {
  const { team, name, password } = req.body;
  const members = TEAMS[team];
  if (!members || !members.includes(name)) {
    return res.status(400).json({ error: '유효하지 않은 팀 또는 이름입니다.' });
  }

  if (!data[team]) {
    const assigned = assignManitto(members);
    data[team] = {};
    aliasMap[team] = {};
    members.forEach((member, idx) => {
      data[team][member] = {
        passwordHash: null,
        assigned: assigned[idx]
      };
      aliasMap[team][assigned[idx]] = generateAlias(aliasMap[team]);
    });
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    fs.writeFileSync("aliases.json", JSON.stringify(aliasMap, null, 2));
  }

  if (data[team][name].passwordHash) {
    return res.status(400).json({ error: '이미 등록된 사용자입니다.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  data[team][name].passwordHash = passwordHash;
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  res.json({ success: true });
});

app.post('/check', async (req, res) => {
  const { team, name, password } = req.body;
  if (!data[team] || !data[team][name]) {
    return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
  }
  const isMatch = await bcrypt.compare(password, data[team][name].passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: '비밀번호가 일치하지 않습니다.' });
  }
  res.json({ assigned: data[team][name].assigned });
});

app.post('/admin/view', (req, res) => {
  const { id, password, reveal } = req.body;
  if (id === 'arthur0079' && password === 'editor0079') {
    const result = {};
    for (const team in data) {
      result[team] = {};
      for (const person in data[team]) {
        const assigned = data[team][person].assigned;
        result[team][person] = reveal ? assigned : aliasMap[team][assigned];
      }
    }
    return res.json({ success: true, data: result });
  } else {
    return res.status(403).json({ error: '관리자 인증 실패' });
  }
});


const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ 마니또 서버 실행 중: http://localhost:${port}`);
});
