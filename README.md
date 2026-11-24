# 비품비서

사무비품의 상태 판정부터 재산 현황, 정비업체와 조달품목 정보까지 한곳에서 관리하는 웹 서비스입니다.

> 운영 사이트: https://office-furniture-check.vercel.app/

## 주요 기능

- 사진 기반 사무비품 상태 분석 및 A~D급 질정분류
- 요정비 부위와 폐품 여부 판정
- 보유 비품 현황 및 예상 정비비 확인
- 서울·경기 지역 정비업체 정보 조회
- 조달품목과 제품 정보 조회
- Google·QR·게스트 로그인
- 사용자 정보 및 부대관리자 승인 관리
- 데스크톱과 모바일에 대응하는 반응형 화면

## 기술 구성

- 프런트엔드: 정적 HTML, CSS, JavaScript
- 데이터 및 인증: Supabase
- 서버 함수: Vercel Functions
- 사진 분석: Anthropic API
- 배포: Vercel

## 프로젝트 구조

```text
.
├── index.html                 # 서비스 화면과 클라이언트 로직
├── api/
│   └── analyze.js             # 사진 분석 서버 함수
├── supabase/
│   └── schema_and_seed.sql    # 데이터베이스 스키마 및 초기 데이터
├── package.json
└── vercel.json
```

## 환경 변수

Vercel 프로젝트에서 다음 환경 변수를 설정합니다.

| 이름 | 용도 | 필수 여부 |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | 사진 분석 API 인증 | 사진 분석 사용 시 필수 |
| `ANTHROPIC_MODEL` | 사용할 Anthropic 모델 | 선택 |
| `SUPABASE_URL` | Supabase 프로젝트 URL | 권장 |
| `SUPABASE_ANON_KEY` | Supabase 공개 클라이언트 키 | 권장 |

`ANTHROPIC_API_KEY` 같은 비밀값은 소스 코드나 커밋에 포함하지 마세요. 키가 설정되지 않으면 사진 분석 API는 `501 no_key`를 반환하고, 화면은 예시 결과로 동작합니다.

## 배포

`main` 브랜치의 변경 사항은 연결된 Vercel 프로젝트를 통해 배포됩니다. 배포 후 운영 사이트에서 로그인, 게스트 조회, 사진 업로드, 모바일 화면을 확인하세요.

## 보안 참고

Supabase의 공개 클라이언트 키는 브라우저에서 사용하는 값이므로 데이터 접근은 반드시 Row Level Security(RLS) 정책으로 제한해야 합니다. 서버 전용 API 키와 서비스 역할 키는 Vercel 환경 변수에서만 관리하세요.

## 라이선스

별도의 라이선스가 명시되지 않은 한 저작권은 저장소 소유자에게 있습니다.
