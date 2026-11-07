# ZERO FRONTIER v5 — Third-person Cover Shooter

Based on the complete v4 audio integration ZIP. All 102 MP3 effects, original scripts, storage keys, menu and story sample are retained.

Changes: differentiated rear-view silhouettes for Miguel and Daniel, crouch/aim/weapon/reload animations, mobile drag-to-aim with explicit FIRE button, desktop mouse aim and left-click shoot, more consistent canvas handling, responsive control styling. Miguel keeps a short Desert Eagle silhouette. Daniel weapon is a temporary generic placeholder and is not canon. No new story canon.

Controls: PC mouse move to aim, left click to fire, Space cover, R reload, 1/2 operative selection. Mobile drag to aim (release to cover), FIRE button shoots, cover toggle and reload buttons.

Code syntax and ZIP integrity checked. Runtime device testing is still recommended.


## v9
스테이지 선택 및 웨이브/진행도 시스템. V9_CHANGELOG.md 참고.

## v10
스테이지 03 최종 웨이브 임시 보스전. V10_CHANGELOG.md 참고.


## v11
전투 애니메이션, 보스 피격 피드백, 경고 시각화 및 포인터 입력 안정화. 상세 내역: V11_CHANGELOG.md


## v12
조작 안내, 보스 경고 타이머, 진행도 백업/복원은 V12_CHANGELOG.md 참고. 백업은 v9 스테이지 진행도만 포함하며 설정/오디오 설정은 포함하지 않습니다.


## v13
전투 일시정지·입력 정리·화면 회전 대응·진행도 복구 스냅샷·성능 진단 추가. `V13_CHANGELOG.md` 참조.


## v14
전투 밸런스, 명중·피격 피드백, 입력 안정화 및 진단 지표를 개선했습니다. 자세한 변경 사항은 V14_CHANGELOG.md를 참고하세요.


## v15
난이도 선택, 전투 결과 통계, 모바일 조준 감도·사격 방식·큰 버튼, 별도 설정 저장을 추가했습니다. `V15_CHANGELOG.md` 참고.


## v16
스테이지별 전투 기록, 난이도별 클리어 통계, 모바일 좌우 버튼 배치, 설정 JSON 백업·복원. 자세한 사항은 V16_CHANGELOG.md 참조.

## v17 추가
전투 상세/성과 비교 필터, 저장 데이터 읽기 전용 진단, 모바일 접근성 개선. 상세 내용은 `V17_CHANGELOG.md`.


## v18 추가
전투 기록 추이 그래프, CSV/JSON 내보내기, 모바일 HUD 간결 모드. 자세한 사항은 V18_CHANGELOG.md를 참고하세요.

## v19 업데이트
전투 기록 검색/정렬, 스테이지별 승률·명중률 그래프, 전체 기록 JSON 백업·복원. 자세한 내용은 `V19_CHANGELOG.md`.

## v20
기록 복구/중복 관리, 성과 비교 필터, 모바일 HUD 크기·투명도, 플레이 테스트 진단. 자세한 내용은 V20_CHANGELOG.md 참고.

## v21
실기기 플레이 테스트 체크리스트, 오류 로그, 안전 스냅샷/복원, FPS 진단, 보고서 내보내기. `V21_CHANGELOG.md` 참조.

## v22 추가
- `v22.js`: 프레임 저하 경고, 오류 분류, 터치 진단, 플레이 테스트 기록, 복구본 검증/롤백
- `V22_CHANGELOG.md`: 세부 변경 사항 및 주의 사항
- 실제 PC/모바일 플레이 테스트는 별도 필요합니다.


## V23 — 진단 및 안전 복원
- 페이지 전체 requestAnimationFrame 프레임 간격과 P95 기반 성능 경고 보조 (원인 자동 확정 불가)
- 포인터 활성 상태와 이벤트 횟수 표시 (전투 조작 로직 변경 없음)
- v22 플레이 테스트 결과 A/B 비교 및 진단 JSON 내보내기
- v21 안전 복구본 / v22 롤백 / v23 보호 슬롯 검증 후 수동 복원
- 복원 전 v23 보호 슬롯 저장 및 저장 후 검증, 오류 시 이전 값 복구 시도
- 실제 기기 브라우저 플레이 검증은 별도 필요


## v24
전투 성능 추정, 모바일 pointer 상태 점검, 오류 재현 메모, 테스트 세션 내보내기, 기록 스냅샷/안전 복원 도구를 추가했습니다. 자세한 사항은 V24_CHANGELOG.md를 확인하세요.


## v25 업데이트
총기 도감(미겔 Desert Eagle / 다니엘 HK416 A5 게임 전용), 전투 성능 기록 비교, 모바일 터치 지연 관찰, 오류 재현 사례, 테스트 세션 조회, 저장 복구 검증. 자세한 사항은 V25_CHANGELOG.md 참고.


## v26 — 무장별 시각 피드백 및 총기 도감 UI
`V26_CHANGELOG.md` 참조. 전투 판정과 저장 키를 변경하지 않는 독립 시각 레이어 `v26.js`를 추가했습니다.


## v27 캐릭터 스킬
미겔: 정밀 조준(Q), 의무관 응급처치(E). 다니엘: 방호 태세(Q), 신속 재장전(E), 돌격 통솔(T). 모바일에서는 전투 HUD 버튼을 누르세요. 게임 전용 능력으로 공식 설정과 구분됩니다. 자세한 내용은 V27_CHANGELOG.md 참조.


## v28
전술 스킬별 시각 효과, 스킬 상태 HUD, 모바일 버튼 개선. 자세한 내용은 V28_CHANGELOG.md.

## v29
전술 스킬 지속 시각 효과, 쿨타임 HUD, 캐릭터 전환 및 총기별 사격 피드백, 모바일 접근성 개선. `V29_CHANGELOG.md` 참고.

## v30
전술 HUD 남은 시간, 스킬/전환/사격 연출 및 모바일 터치 피드백. V30_CHANGELOG.md 참고.


## v31
전술 HUD 시간 표시, 총기별 시각 피드백, 재장전 표시 및 모바일 터치 안정성. 상세 내역 `V31_CHANGELOG.md`.


## v33
실제 전투 타이머 기반 재장전 HUD 및 모바일 터치 상태 정리. 상세 내용은 `V33_CHANGELOG.md`.

## v34
전투 이벤트 진단(메모리 기반·JSON 내보내기), 일시정지 중 재장전 HUD 동결, 장식 오버레이 터치 간섭 방지. 자세한 내용은 `V34_CHANGELOG.md` 참조.


## v36
모바일 포인터 소유권 및 일시정지 입력 정리, 전투 이벤트 오류 진단과 JSON 재현 보고서 추가. 자세한 내용은 V36_CHANGELOG.md.


## v37
Mobile aim/fire boundary fixes, paused reload HUD state and v37 diagnostic JSON export. See V37_CHANGELOG.md.


## v39
See `V39_CHANGELOG.md` for input recovery and diagnostic improvements.


## v40
모바일 입력 경계 처리와 전투 진단 보강. 상세 내용: V40_CHANGELOG.md
