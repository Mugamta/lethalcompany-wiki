# 은폐 수풀 (덩굴, Vain Shroud)

바깥에 자라는 수풀입니다. 많이 자라면 **납치범 여우**(BushWolf)가 나옵니다.

## 단계 (행성별)

- 행성마다 `SelectableLevel.moldSpreadIterations`(세이브에 저장).
- 하루가 지날 때 `StartOfRound.SetPlanetsMold`(호스트, `Random(seed + 32)`):
    - 단계 > 0: `Next(0,100) < Clamp(15 − (int)(luck × 100))`이면 +2~7, 아니면 +2~3. **매일 무조건 자랍니다**(안 간 행성도).
    - 단계 0: 새로 생길 확률 — 오늘 간 행성 3%(할당량 3회 이상 4.5%), 다른 S+/A 행성 1.5%, 나머지 2.2%. 시작 +1~5 / +1~2.
- 남은 수풀을 **전부 베면** `CheckIfAllSporesDestroyed`가 단계를 0으로 초기화합니다.

## 수풀 위치

- 첫 수풀은 시작 위치에서 아래로 100m Raycast한 지점이라 **지붕·바위 위**일 수도 있습니다.
- 퍼진 수풀은 반경 12m 안 NavMesh 위치.

## 여우 스폰 조건

`SpawnWeedEnemies`(외부 스폰 직후, 호스트):

1. 오늘 생성된 수풀 수(`generatedAmountThisDay`, 베어도 안 줄어듦) **> 15**
2. 게임 시각 `hour ≥ 3`
3. `WeedEnemySpawnRandom.Next(0,70) ≤ 수풀 수`

→ 1~2번 `SpawnRandomWeedEnemy`. 파워 최대 4 고정, 가중치 합 ≤ 20이면 안 나옵니다.

- 벤트 같은 대기 상태가 없어 배치 순간 바로 생깁니다.
- 일반 외부 스폰에서도 수풀 몬스터 가중치에 ×수풀 수/60이 붙습니다.

## 여우의 행동

[감지·추격](../creatures/detection.md)의 납치범 여우 항목 참고. 은신처 근처 수풀 안 플레이어를 혀로 끌어갑니다.
