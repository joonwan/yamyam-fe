# 냠냠 코치 (YumYum Coach)

> AI 기반 식단 관리 웹 애플리케이션

냠냠 코치는 사용자의 식단을 체계적으로 관리하고, AI가 영양 분석 및 피드백을 제공하는 웹 애플리케이션입니다. 식단 기록, 챌린지 참여, 커뮤니티 공유 등 다양한 기능을 통해 건강한 식습관 형성을 돕습니다.

## 📌 주요 기능

### 1. 사용자 인증
- 로그인 / 회원가입
- 사용자 프로필 관리 (키, 몸무게, 나이, 성별)
- 안전한 로그아웃 (확인 모달)

### 2. 식단 관리
- **식단 계획 생성**: 기간별 식단 계획 수립
- **일별 식단 기록**: 아침/점심/저녁/간식 시간대별 식단 입력
- **식단 수정**: 기존 식단 내역 수정
- **음식 정보 입력**: 음식명, 양, 칼로리 등 상세 정보 관리
- **날짜별 조회**: 달력 형태로 식단 이력 확인

### 3. AI 영양 분석
- 일일 총 칼로리 분석
- 목표 칼로리 대비 달성률
- 영양소 분석 (단백질, 탄수화물, 지방)
- AI 코멘트 및 추천

### 4. 챌린지
- 다양한 식단 챌린지 참여
- 챌린지 진행률 추적
- 참여 중인 챌린지 관리
- 챌린지 상세 정보 및 보상 확인
- 챌린지 포기 기능

### 5. 커뮤니티
- 식단 공유 게시판
- 레시피 및 팁 공유
- 댓글을 통한 소통
- 좋아요 및 공유 기능

## 🛠 기술 스택

### Frontend
- **Framework**: Vue.js 3 (Composition API)
- **Build Tool**: Vite
- **Routing**: Vue Router 4
- **Styling**: Scoped CSS, Flexbox, Grid
- **Language**: JavaScript (ES6+)

## 📋 시스템 요구사항

### 최소 요구사항
- **Node.js**: v16.0.0 이상
- **npm**: v7.0.0 이상
- **브라우저**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **운영체제**: Windows 10+, macOS 10.15+, Linux (Ubuntu 20.04+)

### 권장 요구사항
- **Node.js**: v18.0.0 이상
- **npm**: v9.0.0 이상
- **메모리**: 4GB RAM 이상
- **디스플레이**: 1920x1080 이상

## 🚀 설치 및 실행 방법

### 1. 저장소 클론
```bash
git clone <repository-url>
cd yamyam-fe
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 개발 서버 실행

#### Windows
```bash
# PowerShell 또는 CMD에서
npm run dev
```

#### macOS
```bash
# Terminal에서
npm run dev
```

#### Linux
```bash
# Terminal에서
npm run dev
```

개발 서버가 시작되면 브라우저에서 `http://localhost:5173` (기본 포트)으로 접속합니다.

### 4. 프로덕션 빌드
```bash
# 프로덕션용 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## 📂 프로젝트 구조

```
yamyam-fe/
├── public/                 # 정적 파일
├── src/
│   ├── assets/            # 이미지, 폰트 등 리소스
│   ├── components/        # 재사용 가능한 컴포넌트
│   ├── router/            # Vue Router 설정
│   │   └── index.js       # 라우트 정의
│   ├── views/             # 페이지 컴포넌트
│   │   ├── LoginView.vue          # 로그인 페이지
│   │   ├── SignupView.vue         # 회원가입 페이지
│   │   ├── MainView.vue           # 대시보드
│   │   ├── DietView.vue           # 식단 관리 페이지
│   │   ├── AddDietView.vue        # 식단 추가 페이지
│   │   ├── EditDietView.vue       # 식단 수정 페이지
│   │   ├── BoardView.vue          # 커뮤니티 게시판
│   │   └── ChallengeView.vue      # 챌린지 페이지
│   ├── App.vue            # 루트 컴포넌트
│   └── main.js            # 앱 진입점
├── .gitignore             # Git 무시 파일 목록
├── index.html             # HTML 템플릿
├── package.json           # 프로젝트 메타데이터 및 의존성
├── vite.config.js         # Vite 설정
├── PROJECT_CONTEXT.md     # 프로젝트 작업 내역 (gitignore)
└── README.md              # 프로젝트 문서 (이 파일)
```

## 🎯 주요 라우트

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | - | `/login`으로 리다이렉트 |
| `/login` | LoginView | 로그인 페이지 |
| `/signup` | SignupView | 회원가입 페이지 |
| `/main` | MainView | 대시보드 (오늘의 식단, AI 분석) |
| `/diet` | DietView | 식단 관리 (식단 계획 목록, 일별 식단) |
| `/diet/add` | AddDietView | 식단 추가 (새 식단 입력) |
| `/diet/edit` | EditDietView | 식단 수정 (기존 식단 수정) |
| `/board` | BoardView | 커뮤니티 게시판 |
| `/challenge` | ChallengeView | 챌린지 (참여 중/참여 가능) |

## 💡 사용 방법

### 1. 로그인
- 더미 계정: `test@yamyam.com` / `test1234`
- 실제 서비스에서는 회원가입 후 로그인

### 2. 식단 등록
1. 대시보드에서 식사 시간대별 "식단 추가" 버튼 클릭
2. 자동으로 해당 시간대가 선택됨 (예: 저녁 버튼 → 저녁 자동 선택)
3. 음식 정보 입력 (음식명, 양, 칼로리)
4. "+ 음식 추가" 버튼으로 여러 음식 입력 가능
5. "식단 추가" 버튼으로 저장

### 3. 식단 수정
1. 식단 관리 페이지에서 수정할 식사 카드의 "수정" 버튼 클릭
2. 기존 데이터가 자동으로 로드됨
3. 정보 수정 후 "식단 수정" 버튼으로 저장

### 4. 챌린지 참여
1. 챌린지 페이지에서 "챌린지 참여하기" 버튼 클릭
2. 확인 모달에서 "참여하기" 버튼 클릭
3. 참여 중인 챌린지에 추가됨
4. 진행률 추적 가능


## 📄 라이선스

이 프로젝트는 교육 목적으로 제작되었습니다.

---

**냠냠 코치**로 건강한 식습관을 시작하세요! 🥗✨
