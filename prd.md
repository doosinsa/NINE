# NINE PRD v2.0
## 두만의 종목 발굴 시스템

**작성일**: 2026.05.10  
**작성자**: 빌 × 두 페어링  
**버전**: v2.0 (12회 세션 합의 통합본)  
**상태**: 빌드 착수 대기

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|---|---|
| **이름** | NINE |
| **한줄 설명** | 3-criteria 9점 만점으로 한국·미국 주식 850종목을 매주 자동 스크리닝하는 두 personal 종목 발굴 도구 |
| **유형** | Personal Web App — Stock Screener + Decision Support System (단일 사용자, SaaS 아님) |
| **난이도** | 중상 (3.5/5) |

### 작명 근거
3-criteria × 3점 = 만점 9점. 7점 이상 매수 후보. 시스템의 모든 의사결정이 0~9 점수 안에 함축됨. 영문이라 코드 변수명에도 자연스러움.

---

## 2. 사용자 시나리오

### 시나리오 A — 주간 정기 review (메인)
- **언제**: 매주 일요일 밤 10~11시 (지수 성장주사 후 본인 샤워 전)
- **디바이스**: iPhone 13 Pro Max, 침대에서 한 손
- **소요**: 30분 이내
- **흐름**: 주간 후보 30개 카드 swipe review → 7점+ 채점 → 매수 결정 시 Thesis Kill 입력 → 다음 주 평일 직접 매수

### 시나리오 B — 분기 thesis kill 점검
- **언제**: 분기 첫 주 (4월·7월·10월·1월) 화요일 오전, 발주 후 커피 타임
- **디바이스**: 데스크톱 (사무실)
- **소요**: 30분
- **흐름**: 보유 종목별 Thesis Kill 조건 ✗/✓ 체크 → 시스템 권고 표시 → Hold/Reduce/Sell 결정

### 시나리오 C — 신규 7점+ 알림
- **언제**: 평일 incident-driven (3-Tier 알림 시스템 적용)
- **디바이스**: 모바일
- **빈도**: Tier 1 (9/9) 월 5건 cap, Tier 2 (7~8점 디지스트) 일 1건

### 시나리오 D — 충동 검색
- **언제**: 평소 뉴스·유튜브 보다가 떠오를 때
- **소요**: 5초 ~ 15초 (universe 밖 종목 LLM 분석)
- **빈도**: 일 10건 cap

### 시나리오 E — Discover (테마 발굴) 🆕
- **언제**: 일요일 밤 시나리오 A 끝나고 5~10분 추가
- **흐름**: 이번 주 부상 테마 5개 → 호기심 끌리는 1~2개 deep dive → 대표 종목 → NINE Core로 송부

### 명시적 제외 시나리오
- 매일 아침 시장 brief
- 실시간 가격 알림
- 매수/매도 시점 추천
- 외부 공유 / 다른 사람과 watchlist 공유
- 백테스트 시뮬레이션

---

## 3. 핵심 기능 — Core 12개 + Discover 신규

### 3-A. NINE Core (Must-Have, MVP)

#### 데이터 레이어 (자동, 무인)
1. 종목 유니버스 관리 — KOSPI 200 + KOSDAQ 150 + S&P 500 (~850 종목)
2. 일별 가격·거래량 수집 — KIS API + Yahoo Finance
3. 주별 컨센서스 EPS 스냅샷 — 네이버 페이 증권 + 한경 컨센서스 스크레이핑 (Phase 1) + Finnhub (US)
4. 분기 실적 + 컨퍼런스콜 transcript 수집 — DART + Yahoo Earnings

#### 분석 레이어 (자동)
5. Quant 스코어 자동 계산 (Criteria 3 — EPS 추정치 변화율)
6. LLM brief 자동 생성 (Claude Haiku, 상위 50종목)

#### 사용자 레이어
7. 주간 후보 리스트 화면 (시나리오 A)
8. 종목 상세 + 수동 채점 (Criteria 1·2 슬라이더)
9. Thesis Kill 조건 강제 입력 (매수 전)
10. 보유 종목 분기 리뷰 페이지 (시나리오 B)

#### 알림 + 검색
11. 3-Tier 알림 시스템 (시나리오 C)
12. 충동 검색 (시나리오 D)

### 3-B. NINE Discover (신규 추가)

13. **부상 테마 자동 추출** — 글로벌 뉴스 클러스터링 + 한국 수출 데이터 + capex 발표
14. **테마별 대표 종목 큐레이션** — 5개 테마 × 3~5종목
15. **테마 → Core 송부** — 호기심 종목을 universe에 추가하고 다음 주 정식 채점

### 3-C. 선택 기능 (Phase 2 이후, MVP 제외)
- 섹터별 점수 분포 차트
- Thesis Kill 트리거 자동 감지 (뉴스 NLP)
- 점수 변화 히스토리 그래프
- Watchlist 메모 첨부
- Export to Excel
- 포트폴리오 시각화

### 3-D. 영원히 안 만들 것 (NEVER)
- 자동 매매 실행
- 백테스팅 엔진
- 멀티유저 / 외부 공유 / SaaS 전환
- 실시간 가격 알림 / 시장 brief / 마켓 뉴스 피드
- 옵션·선물·코인
- 1주일 이내 단기 트레이딩 신호
- 종목 토론·커뮤니티
- 차트·기술적 분석 도구

---

## 4. 기술 스택

| 레이어 | 기술 | 비고 |
|---|---|---|
| DB / 백엔드 | Supabase Cloud (PostgreSQL) | 무료 티어 (500MB) |
| 워크플로우 / Cron | n8n + 로컬 collector scripts | MacBook에서 개발·검증 후 Mac Mini 또는 상시 실행 Mac으로 이전 |
| LLM | Claude Haiku API (`claude-haiku-4-5-20251001`) | 월 $30 cap |
| 프론트엔드 | Next.js 16 + Tailwind v4 | 모바일 우선, PWA |
| 호스팅 (UI/API shell) | Vercel | 무료 티어. 외부 데이터 수집 worker는 Vercel에서 직접 실행하지 않음 |
| 알림 | Solapi LMS | n8n 연동 패턴 기존 |
| 인증 | 단일 비밀번호 (env var hash) | Supabase Auth 사용 X |
| **데이터 소스 (KR)** | DART OpenAPI + KIS Developer API + 네이버 페이 증권/한경 컨센서스 스크레이핑 | KIS는 신규 가입 필요 |
| **데이터 소스 (US)** | Finnhub 무료 + Yahoo Finance + SEC EDGAR | |
| **데이터 소스 (Discover)** | NewsAPI (또는 Google News API) + KITA 한국 수출 데이터 | NewsAPI 월 $0~50 |

### 새로 배워야 할 기술 = 0개
모든 스택이 Wellbeing Lab + CleanNote에서 사용 중. KIS API만 신규 가입 (REST 방식이라 학습 부담 없음).

### 가입 필요 (총 30분)
1. 한국투자증권 비대면 계좌 개설 (모바일 5분)
2. KIS Developers 가입 + 앱키 발급 (10분)
3. Finnhub 무료 가입 (5분)
4. NewsAPI 또는 Google News API 가입 (10분)

### 운영 비용 (월간)
| 항목 | 비용 |
|---|---|
| Supabase / Vercel / n8n | 0원 |
| Claude Haiku | $5~15 (Core + Discover 합쳐서) |
| Solapi LMS | 1,000~3,000원 |
| NewsAPI | $0~50 |
| **총합** | **월 30,000원 미만 (cap)** |

### Phase 2/3 미래 옵션 (PRD 명시)
- Phase 2 (6개월 후 검토): FnSpace API 코인제 (~월 5~20만원, 약관 재확인 필수)
- Phase 3 (alpha 입증 + 자산 증가 시): FnResearch 월 30만원 (단 DB 누적 약관 협상 필요)

### 운영 아키텍처 원칙
- Vercel은 로그인, 화면, API envelope, Supabase 조회를 담당한다.
- KIS, DART, Yahoo Finance, Finnhub, NewsAPI, Anthropic, Solapi 같은 외부 provider 호출은 기본적으로 Mac/n8n worker에서 실행한다.
- 개발과 smoke test는 현재 MacBook에서 수행하고, 정기 실행은 나중에 Mac Mini 또는 항상 켜져 있는 Mac으로 옮긴다.
- Vercel production에서 KIS token 발급이 HTTP 403으로 실패한 이력이 있으므로, KIS 가격 수집은 Vercel serverless runtime에 의존하지 않는다.
- Mac/n8n worker는 collector script 또는 로컬 API route를 실행해 Supabase에 결과를 저장하고, Vercel UI는 저장된 Supabase 데이터만 읽는다.

---

## 5. 화면 구성

### 5-A. 화면 맵

```
홈 (Login)
  ├── 주간 후보 리스트 (시나리오 A)
  ├── 보유 종목
  ├── 분기 리뷰 (시나리오 B)
  ├── 충동 검색 (시나리오 D)
  └── Discover (시나리오 E) 🆕
         ↓ (모두 공통 destination)
       종목 상세
         ↓ (Buy 결정 시)
       Thesis Kill 입력 모달
```

### 5-B. 화면별 상세

#### 홈 (Login)
- NINE 로고 + 슬로건 ("9점이 곧 신호")
- 비밀번호 입력 + 로그인 버튼

#### 주간 후보 리스트 (메인)
- 헤더: "이번 주 후보 N개 + 갱신 시각 + 수동 갱신"
- 필터: 전체 / 한국 / 미국 / 신규 7점+ / 점수 변화
- 카드 리스트 (한 화면에 3~4개 동시 표시, 428px 기준)
- 카드 swipe: 좌 패스 / 우 watchlist 추가

#### 보유 종목
- 평균 NINE 점수 + 위험 알림 (점수 7→6 떨어진 종목)
- 종목별 Thesis Kill 조건 상태 (✓/✗/⚠)
- **가격 변동 표시 금지** ("안 봐" 자산 보호)

#### 분기 리뷰
- "2026 Q3 리뷰" + 검토 진행률
- 종목별 Thesis Kill 조건 ✗/✓ 체크
- 시스템 권고: 0/3 → Hold, 1/3 → 모니터, 2/3 → 50% 매도, 3/3 → 전량 매도
- 너의 최종 결정: Hold / Reduce 50 / Sell All + 메모

#### 충동 검색
- 검색바 + 자동완성
- Universe 안: 캐시 즉시 표시 (1초)
- Universe 밖: "분석 시작" → 10~15초 대기 → 결과 + universe 추가 옵션
- 일일 cap 카운터 (예: "오늘 7/10 사용")

#### Discover 🆕
- 이번 주 부상 테마 5개
- 테마별: 뉴스 빈도 변화 % / 수출 신호 / capex 신호 / 대표 종목 3~5개
- "Core로 송부" 버튼 → universe 추가 + 다음 주 정식 채점

#### 종목 상세 (공통 destination)
- Quant 스코어 (자동) + LLM brief 5개 항목
- 수동 채점 슬라이더 2개 (Criteria 1·2)
- 총점 표시 (max 9)
- "이 점수는 prep이지 신탁이 아님" 워터마크 (illusion of validity 방지)
- [Pass] [Watch] [Buy]

#### Thesis Kill 입력 모달 (iOS bottom sheet)
- Thesis Kill 조건 3개 (각 30~100자, 모두 입력 필수)
- 매수 비중 (만원 단위)
- 매수 일자 + 매수가
- 저장 버튼 (3개 입력 시 활성화)

### 5-C. 빌드 우선순위

| 우선순위 | 화면 | 일정 |
|---|---|---|
| P0 | 종목 상세 + Thesis Kill 모달 | Phase 4 Day 1~3 |
| P0 | 주간 후보 리스트 | Day 4~5 |
| P0 | 보유 종목 | Day 6 |
| P1 | 분기 리뷰 | Day 7~8 |
| P1 | 충동 검색 | Day 9 |
| P1 | Discover | Day 10~12 |
| P0 | 홈 (Login) | Day 13 (마지막, 5분) |

---

## 6. 상세 기능 명세

### 6-A. 자동 데이터 수집

#### F1. 일별 가격·거래량
- **트리거**: 한국 16:00 / 미국 익일 07:00
- **실행 위치**: Mac/n8n worker. Vercel production serverless runtime에서 직접 실행하지 않음
- **소스**: KIS API + Yahoo Finance
- **저장**: `prices` 테이블 OHLCV
- **실패 처리**: 3회 retry → Solapi LMS 알림

#### F2. 주별 컨센서스 EPS 스냅샷
- **트리거**: 일요일 10:00
- **실행 위치**: Mac/n8n worker
- **소스**: 네이버 페이 증권 + 한경 컨센서스 스크레이핑 (KR), Finnhub (US)
- **저장**: `eps_estimates` 테이블 시계열 누적
- **약관 회피**: user-agent 정상값, 요청 간격 2초+

#### F3. 분기 실적 수집
- **트리거**: 어닝 발표일 자동 감지 (DART + Yahoo Earnings Calendar)
- **실행 위치**: Mac/n8n worker
- **컨퍼런스콜**: 한국은 DART 사업보고서 텍스트, 미국은 Yahoo Transcripts

#### F4. Discover 시그널 수집 🆕
- **실행 위치**: Mac/n8n worker
- **글로벌 뉴스**: NewsAPI 매일 수집, Claude Haiku 토픽 클러스터링
- **한국 수출 데이터**: KITA 월별 품목별 수출 (전년 대비 변화율 추적)
- **Capex 발표**: 분기 어닝콜 + 정부 예산안 수동 큐레이션 (분기 30분)

### 6-B. 자동 분석

#### F5. Quant 스코어 (Criteria 3)
```
3M_change = (current_consensus / 3개월전_consensus) - 1

base_score = 
  if 3M_change >= 0.10: 3
  elif 3M_change >= 0.05: 2
  elif 3M_change >= 0:    1
  else:                   0

surprise_bonus = 1 if (최근 4분기 매출 surprise 평균) > 0.05 else 0
quant_score = min(3, base_score + surprise_bonus)
```

#### F6. LLM Brief 생성 (Core)
- **모델**: Claude Haiku, temperature 0
- **출력**: JSON (structural_demand, supply_constraint, eps_revision_driver, bear_case, narrative_warning_flag, narrative_warning_reason)
- **비용 cap**: $30/월 hard limit, 80% 도달 시 경고

#### F7. Discover 테마 추출 🆕
- **부상 임계값**: 뉴스 빈도 +50% 이상 + 다른 신호 1개 이상 (수출 또는 capex)
- **출력**: 주별 부상 테마 5개 + 테마별 대표 종목 3~5개
- **종목 매핑**: Claude Haiku로 "이 테마의 한국·미국 대표 종목" 추출

### 6-C. 사용자 인터랙션

#### F8. 수동 채점 (Criteria 1+2)
- 슬라이더 0~3 (정수)
- Auto-save
- 변경 이력 보존

#### F9. 매수 결정 + Thesis Kill 입력
- 7점 미만 매수 시도 시 경고 (강제 차단 X)
- Thesis Kill 3개 입력 필수 (모달 차단)
- 매수 정보 저장 → `is_holding = true`

#### F10. 분기 thesis kill 점검
- 분기 첫 주 화요일 09:00 LMS 알림
- 종목별 ✗/✓ 체크 + 시스템 권고 + 너의 결정

#### F11. 충동 검색
- Universe 안: 1초 응답
- Universe 밖: 10~15초 LLM 분석
- 일일 10건 cap

#### F12. Discover → Core 송부 🆕
- Discover 화면에서 종목 선택 → "Core universe 추가" 버튼
- 다음 일요일 정식 데이터 수집·채점 cycle 진입

### 6-D. 알림 (3-Tier)

#### F13. Tier 1 즉시 알림 (9/9 만점)
- 채널: Solapi LMS 즉시
- 빈도 cap: 월 5건

#### F14. Tier 2 저녁 7시 디지스트
- 트리거: 매일 19:00
- 포함: 신규 7~8점 + 보유 종목 점수 변화 ±1점 이상
- 빈도 cap: 일 1건, 종목 5개 max

#### F15. Tier 3 주간 갱신
- 일요일 21:00, Core + Discover 갱신 완료 후

#### F16. Quiet Hours
- 무음: 평일 09:00~17:00 + 매일 23:00~09:00
- 예외: Tier 1만 무음 무시

### 6-E. 운영·관리

#### F17. 비용 모니터링
- Claude API 일일 사용량 → `api_costs` 테이블
- 월 $30 cap, 80% 도달 경고, 100% 자동 stop

#### F18. 데이터 무결성 모니터링
- 매주 일요일 09:00 헬스체크 LMS 리포트

#### F19. 백업
- Supabase 자동 백업 (cloud 7일)
- 매주 일요일 자정 Mac Mini로 SQL dump
- 분기 1회 복원 테스트

---

## 7. 데이터 모델 (Supabase PostgreSQL)

```sql
-- 종목 마스터
CREATE TABLE stocks (
  ticker TEXT PRIMARY KEY,
  name TEXT,
  country TEXT,                    -- 'KR' | 'US'
  sector TEXT,
  market_cap NUMERIC,
  is_holding BOOLEAN DEFAULT false,
  source TEXT,                     -- 'core_universe' | 'discover' | 'search'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- EPS 컨센서스 시계열
CREATE TABLE eps_estimates (
  ticker TEXT REFERENCES stocks(ticker),
  snapshot_date DATE,
  fy_year INT,
  consensus NUMERIC,
  analyst_count INT,
  data_source TEXT,                -- 'naver' | 'hankyung' | 'finnhub' | 'fnguide' (Phase 2)
  PRIMARY KEY (ticker, snapshot_date, fy_year)
);

-- 분기 실적
CREATE TABLE earnings (
  ticker TEXT REFERENCES stocks(ticker),
  fiscal_quarter TEXT,
  revenue NUMERIC,
  revenue_yoy NUMERIC,
  eps NUMERIC,
  eps_surprise NUMERIC,
  reported_at DATE,
  PRIMARY KEY (ticker, fiscal_quarter)
);

-- LLM 분석 (Core)
CREATE TABLE llm_briefs (
  ticker TEXT REFERENCES stocks(ticker),
  generated_at TIMESTAMPTZ DEFAULT now(),
  structural_demand TEXT,
  supply_constraint TEXT,
  eps_revision_driver TEXT,
  bear_case TEXT,
  narrative_warning_flag BOOLEAN,
  narrative_warning_reason TEXT,
  PRIMARY KEY (ticker, generated_at)
);

-- 수동 채점 + 매수 정보
CREATE TABLE manual_scores (
  ticker TEXT REFERENCES stocks(ticker) PRIMARY KEY,
  score_quant INT CHECK (score_quant BETWEEN 0 AND 3),
  score_demand INT CHECK (score_demand BETWEEN 0 AND 3),
  score_supply INT CHECK (score_supply BETWEEN 0 AND 3),
  total_score INT GENERATED ALWAYS AS (score_quant + score_demand + score_supply) STORED,
  decision TEXT,                   -- 'buy' | 'watch' | 'pass'
  thesis_summary TEXT,
  thesis_kill_1 TEXT,
  thesis_kill_2 TEXT,
  thesis_kill_3 TEXT,
  position_size_krw NUMERIC,
  bought_at_price NUMERIC,
  bought_at_date DATE,
  reviewed_at TIMESTAMPTZ DEFAULT now()
);

-- 분기 리뷰 로그
CREATE TABLE quarterly_reviews (
  id SERIAL PRIMARY KEY,
  ticker TEXT REFERENCES stocks(ticker),
  review_date DATE,
  thesis_still_valid BOOLEAN,
  kill_conditions_triggered INT,
  notes TEXT,
  action TEXT                      -- 'hold' | 'reduce_50' | 'sell_all'
);

-- Discover 테마 (신규)
CREATE TABLE discover_themes (
  id SERIAL PRIMARY KEY,
  week_of DATE,
  theme_name TEXT,
  news_frequency_change NUMERIC,
  export_signal_change NUMERIC,
  capex_signal TEXT,
  representative_tickers TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- API 비용 추적
CREATE TABLE api_costs (
  date DATE PRIMARY KEY,
  claude_haiku_input_tokens INT,
  claude_haiku_output_tokens INT,
  estimated_cost_usd NUMERIC
);

-- 일일 검색 로그 (cap 관리)
CREATE TABLE daily_search_log (
  date DATE,
  ticker TEXT,
  is_universe_outside BOOLEAN,
  PRIMARY KEY (date, ticker)
);
```

---

## 8. 디자인 가이드

### 8-A. 디자인 5원칙
1. **점수가 hero element** — 모든 화면에서 NINE 점수가 가장 큰 시각 요소
2. **Flat & Calm** — 그라데이션 X, 그림자 X, 애니메이션 최소
3. **모바일 한 손 조작** — iPhone 13 Pro Max (428pt), 엄지 닿는 하단 1/3 핵심 액션
4. **"안 봐" 자산 보호 UI** — 가격 변동 표시 X, 차트 X, 푸시 알림 X, 실시간 X
5. **Anti-Illusion 워터마크** — "이 점수는 prep이지 신탁이 아님" 항상 표시

### 8-B. 컬러 팔레트
```
Primary    #1E3A5F  (브랜드 다크 블루)
Secondary  #6B7280  (메타데이터)
Background #FFFFFF / #0F172A (auto dark)
Surface    #F9FAFB / #1E293B
Border     #E5E7EB / #334155

점수 tier:
- 9/9 만점: #B45309 (앰버 강) / #FCD34D (dark)
- 7~8점:    #15803D (그린)   / #86EFAC
- 4~6점:    #6B7280 (그레이) / #9CA3AF
- 0~3점:    #D1D5DB         / #4B5563

위험 (Thesis Kill 발생): #DC2626
신규 진입 배지:          #2563EB
```

### 8-C. 타이포그래피
```
폰트 스택:
font-family: -apple-system, BlinkMacSystemFont, 
  "Pretendard Variable", "SF Pro Text", 
  system-ui, sans-serif;

크기 (428pt 기준):
- Hero (점수): 48px / 700
- H1 (화면 제목): 24px / 600
- H2 (카드 제목): 18px / 600
- Body: 15px / 400 / line-height 1.6
- Meta: 13px / 400
- Watermark: 12px / 400 / opacity 0.4

iOS 입력 zoom 방지: input font-size 최소 16px 강제
```

### 8-D. 레이아웃 그리드 (iPhone 13 Pro Max 최적화)
```
viewport: 428 × 926pt
safe area: top 47px, bottom 34px (home indicator)
사용 가능 세로: 845px

외부 padding: 20px
카드 간격: 16px
카드 내부 padding: 20px
섹션 간격: 28px

데스크톱 max-width: 720px (centered, 1열 유지)
```

### 8-E. iOS 최적화 패턴
- Safe area: `env(safe-area-inset-*)` 처리 필수
- `viewport-fit=cover` meta 설정
- 100vh 버그 방지: `100dvh` 사용
- 카드 swipe: Framer Motion `drag="x"`
- Thesis Kill 모달: vaul 라이브러리 (iOS bottom sheet)
- Status bar 색: light/dark 자동 매핑
- PWA 설정 (manifest.json + apple-touch-icon)

### 8-F. 마이크로 카피
빌의 톤 — 친근하지만 단호. 합리화 금지.

| 상황 | 카피 |
|---|---|
| 7점 미만 매수 시도 | "7점 미만 매수는 시스템 권고와 다른 결정이야. 그래도 진행할래?" |
| Thesis Kill 미입력 | "출구 조건 없이 매수 못 함. 3개 조건 먼저 적어." |
| 9/9 만점 출현 | "9점 신규: [종목]. 진짜 드물어. 조심해서 봐." |
| 일일 검색 cap | "오늘 ad-hoc 검색 한도 도달. 내일 다시." |
| 항상 표시 | "이 점수는 prep이지 신탁이 아님" (워터마크) |

**금지 카피**: "AI가 추천", "성공 가능성 높음", "강추".

### 8-G. 다크모드
- 시스템 OS 자동 감지 (`prefers-color-scheme`)
- Tailwind v4 `dark:` modifier 자동 처리
- Default: 시스템 따라감 (일요일 밤 침대 사용 패턴 고려)

---

## 9. 제약 사항

### 9-A. 시간·예산
| 항목 | 제약 |
|---|---|
| MVP 빌드 | **5주** (Discover 추가로 4→5주) |
| 일일 코딩 | 1시간 cap |
| 운영 비용 | 월 30,000원 미만 |
| 운영 시간 (MVP 후) | 주 1시간 + 분기 30분 |

### 9-B. 기술
- 새 기술 학습 0개 (기존 스택만)
- 외부 의존: Supabase / Vercel / Anthropic / Solapi / KIS / DART / Yahoo / Finnhub / NewsAPI 한정
- DB: Supabase Postgres만
- 모바일: PWA만, 네이티브 앱 X

### 9-C. 데이터·법률
- 스크레이핑은 Personal use 한정 (외부 노출·재배포 0)
- Phase 2 유료 데이터 검토 시 약관 재확인 필수
- 한국 자본시장법: 1:1 자문 X / 외부 종목 추천 X / 리딩방 X / 유료 회원 X
- SEC EDGAR: user-agent에 본인 이메일 명시 (SEC 룰)

### 9-D. 행동·심리 제약 (NINE 고유)
| 함정 | 제약 룰 |
|---|---|
| 시스템 신뢰 함정 | "이 점수는 prep이지 신탁이 아님" 워터마크 |
| "안 봐" 자산 파괴 | 가격 X / 차트 X / 푸시 X / 실시간 X |
| 과적합 | 6개월간 점수 가중치 조정 금지, forward test only |
| 확증 편향 | LLM brief에 bear case 항상 포함 (강제) |
| 매수 후 합리화 | Thesis Kill 매수 *전* 입력 강제 |
| 손실 회피 | 분기 thesis kill 자동 체크 + 시스템 권고 표시 |
| Hot Hand Fallacy | 단일 종목 max 1,500만 (전체 7.5%) 경고 |
| Concentration Drift | Satellite 5천만 hard cap |

### 9-E. 기능 제약 (영원히 안 만들 것)
§3-D 참조

### 9-F. 외부 위험
| 위험 | 대응 |
|---|---|
| 네이버 페이 증권 페이지 변경 | 한경 컨센서스 백업 + Phase 2 유료 검토 |
| KIS API 정책 변경 | KRX Data Marketplace 또는 다른 증권사 검토 |
| Yahoo Finance 차단 | Finnhub fallback (이미 dual source) |
| Anthropic 가격 인상 | 비용 cap 자동 stop + 빈도 축소 |
| Supabase 무료 티어 초과 | $25/월 cloud 유료 |
| Mac Mini 다운 | Supabase Edge Functions 백업 cron 미리 설정 |

---

## 10. 빌드 단계 (5주 / ~50시간)

### Phase 1: 데이터 파이프라인 (Week 1, 10시간)
- Supabase 스키마 생성
- 가입 처리 (한투 계좌, KIS Developers, Finnhub, NewsAPI)
- DART OpenAPI 연결
- KIS API 연결 (한국 시세·재무)
- Finnhub + Yahoo Finance 연결 (미국)
- n8n 일별/주별 cron 설정
- 백필 스크립트 (지난 1년)

### Phase 2: Quant 스코어링 (Week 2, 10시간)
- EPS 변화율 SQL 함수
- 매출 surprise 계산
- 주별 스코어 갱신 워크플로우
- 상위 50 후보 추출 view

### Phase 3: LLM 분석 + Discover (Week 3, 15시간)
- Claude Haiku 프롬프트 설계 (Core brief + Discover 테마 클러스터링)
- 컨퍼런스콜 transcript 수집
- NewsAPI 통합 + 토픽 클러스터링
- KITA 한국 수출 데이터 연동
- JSON 응답 파싱 + DB 저장
- 비용 모니터링 ($30/월 cap)

### Phase 4: UI + 알림 (Week 4~5, 15시간)
- Next.js 대시보드 (PWA, iPhone 13 Pro Max 최적화)
  - 종목 상세 + Thesis Kill 모달 (P0, 첫 빌드)
  - 주간 후보 리스트
  - 보유 종목
  - 분기 리뷰
  - 충동 검색
  - Discover
  - 홈 (Login, 마지막)
- PWA manifest + iOS meta + 아이콘
- 비밀번호 페이지
- Solapi LMS 알림 워크플로우
- 분기별 알림 cron

---

## 11. 성공 지표

### MVP 완성 시점 (5주 후)
- ✅ 매주 일요일 watchlist + Discover 자동 갱신
- ✅ iPhone 13 Pro Max에서 30분 이내 30개 카드 review 가능
- ✅ 7점+ 신규 종목 알림 작동
- ✅ Discover 테마 5개 매주 추출

### 3개월 후
- 회고 테스트: 시스템이 한화에어로·팔란티어 시점에 7점+ 줬을 것? Beyond Meat은 narrative_warning 잡았을 것? Discover가 부상 테마로 우주·데이터 잡았을 것?
- 두의 운영 시간: 주 1시간 이하 유지?

### 6개월 후 알파 검증
- 시스템 추천 종목 평균 수익률 vs S&P 500 / KOSPI 200
- Satellite 5천만 portfolio 수익률 vs 코어 portfolio
- 본인 직관이 진짜 alpha였는지 데이터로 입증

---

## 12. 다음 액션

이 PRD 검토 후:
1. **수정 요청**: 빠진 부분, 잘못된 가정, 추가 기능
2. **승인**: Phase 1 착수
3. **연기**: 보류

PRD 승인 후 다음 세션은 **Phase 1 Day 1 — Supabase 스키마 SQL 작성**부터.

---

## 부록 A. 우리 페어링이 합의한 핵심 원칙들

이건 PRD가 아니라 NINE의 영혼. 1년 뒤 충동 들 때 다시 읽어봐.

1. **NINE은 추천 시스템이 아니라 prep 도구다.** 결정은 두가 한다.
2. **두의 "안 봐" 자산은 NINE의 가장 큰 자산이다.** 어떤 기능도 이걸 부수면 안 된다.
3. **Beyond Meat 같은 narrative trap을 거르는 게 한화에어로 같은 winner를 잡는 것보다 우선한다.** 손실 방어 > 이득 극대화.
4. **NINE의 ROI는 수익률이 아니라 "투자에 대해 안 생각하는 시간"이다.** 그 시간이 KINETAVERA로 가서 진짜 EXIT을 만든다.
5. **시스템이 너의 인지 함정을 강화하면 즉시 멈춰야 한다.** 알고리즘에 굴복하지 말 것.
