# 리썰 컴퍼니 메커니즘 위키

**Lethal Company**의 숨은 규칙을 게임 코드(`Assembly-CSharp.dll`)를 직접 디스어셈블해서 확인하고 정리한 한국어 위키입니다.
"대충 이렇다더라"가 아니라 **코드에 적힌 숫자와 조건**을 모으는 것이 목표입니다.

<div class="grid cards" markdown>

- :material-skull: **[몬스터 스폰](mechanics/spawning.md)**
  파워 레벨, 시간당 마릿수, 스폰 배치 시각, 벤트, 스폰 난수 시드
- :material-eye: **[감지·추격](mechanics/detection.md)**
  몬스터별 시야각·거리, 추격 시작·종료 조건
- :material-volume-high: **[소리와 눈 없는 개](mechanics/noise.md)**
  발소리·아이템·장치 소리의 범위와 크기, 개가 바로 분노하는 거리
- :material-sword: **[체력·공격·상태](mechanics/enemy-combat.md)**
  무기 피해·속도, 몬스터 피해량, 처치 불가 몬스터, 기절
- :material-weather-lightning: **[날씨](mechanics/weather.md)**
  뇌우 벼락(무작위·금속), 일식, 비와 늪, 안개
- :material-cash: **[돈·할당량·배송](mechanics/economy.md)**
  초과 수당 공식, 사망 벌금, 배송선
- :material-domain: **[시설·함정·장치](mechanics/facility.md)**
  함정 개수, 증기 밸브, 잠긴 문, 무너지는 다리, 순간이동기
- :material-store: **[회사 창구 괴물](mechanics/company.md)**
  기분, 인내심, 청각 범위, 촉수 범위

</div>

## 이 위키의 원칙

!!! info "표기 규칙"
    - **IL 확인** = 게임 DLL의 메서드 본문(IL)을 직접 읽어서 확인한 내용입니다.
    - **씬/프리팹 값** = 코드가 아니라 유니티 에셋에 저장된 값이라 DLL만으로는 알 수 없는 것입니다. 실제 값을 따로 측정했으면 그렇게 적습니다.
    - **호스트만** = 서버(방장) 컴퓨터에서만 계산되고 다른 플레이어에게 전달되지 않는 값입니다.
    - 시각은 게임 안 시계 기준, 거리는 미터(m)입니다.

- 확인 시점: 2026년 11월 기준 최신 버전의 `Assembly-CSharp`. 업데이트로 값이 바뀔 수 있습니다.
- 모드가 추가한 몬스터·아이템은 다루지 않습니다(바닐라 기준).
- 한글 이름은 한국어 패치에서 쓰는 이름을 따릅니다. 영어 이름은 처음 나올 때 괄호로 붙입니다.
