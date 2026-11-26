# 시설·함정·장치

## 실내 함정 개수

`RoundManager.SpawnMapObjects`(호스트):

- `Random(randomMapSeed + 587)`로 `currentLevel.indoorMapHazards` 종류마다 `(int)numberToSpawn.Evaluate(NextDouble())`개.
- 광산 던전에서는 `allowInMineshaft`가 꺼진 종류를 건너뜁니다.
- 챌린지 문(`increasedMapHazardSpawnRateIndex`, 45%)에서만 한 종류가 Min(×2, 150).
- **날씨·위험도·인원·할당량·마감은 함정 수와 무관**합니다.
- 함정끼리 5m 안에 겹치면(`requireDistanceBetweenSpawns`) 재시도 없이 건너뜀 → 곡선보다 적게 나올 수 있습니다.
- 곡선 자체는 씬 데이터입니다. "유독 많은 날"은 곡선 끝의 급상승 구간에 걸린 날입니다.

## 증기 밸브

- `RoundManager.SetSteamValveTimes`가 `Random(randomMapSeed + 513)`로 밸브마다 **75%** 확률로 터질 시각 `valveBurstTime = Clamp(r, 0.2, 1)`(normalizedTimeOfDay 단위)을 정합니다 → 모든 클라이언트가 같은 시각.
- 나머지 25%는 그날 안 터집니다.
- 터지면 국소 안개가 생기고, 잠그면 `FixValveClientRpc`.
- 밸브 수는 던전의 방 조각(파이프 방)에 따라 정해집니다.

## 잠긴 문 (열쇠 문)

- 착륙 직후 코루틴(`waitForMainEntranceTeleportToSpawn`, 모든 클라이언트)의 `SetLockedDoors`가 정합니다.
- 높이 y ≤ −160의 `canBeLocked` 문을 **정문에서 먼 순서로** 보며, `LevelRandom.NextDouble() < p`면 잠급니다. p는 1.1에서 시작해 잠글 때마다 ÷1.55.
- 따는 시간 = Clamp(Next(2,90), 2, 32)초.
- 열쇠는 잠긴 문 수 + 2개(호스트, `AnomalyRandom`).

## 터미널 보안문·터렛·지뢰

- `TerminalAccessibleObject.objectCode`가 터미널 코드입니다. 보안문(`isBigDoor`)은 private `isDoorOpen`.
- 지뢰 폭발 = 2.4m 즉사, 5m 피해 50 (몬스터에게는 4.5m 안 6).

## 무너지는 다리

`BridgeTrigger.Update`는 모든 클라이언트에서 돕니다.

| 상황 | 내구도 변화 (초당) |
|---|---|
| 거인이 올라섬 | −1/4.25 |
| 사람 n명 | −`playerCapacityAmount` × n² |
| 각자 `carryWeight > 1.1`이면 추가 | −`weightCapacityAmount` × carryWeight |
| 아무도 없음 | +0.2 |

- **사람 수의 제곱**으로 닳으므로 한 명씩 건너는 게 훨씬 안전합니다.
- 계수는 씬 데이터. 붕괴 판정은 서버에서 하고 `hasBridgeFallen`이 전달됩니다.
- `BridgeTriggerType2`(다른 형태의 다리): 밟을 때마다 서버 카운트 +1, **2회 흔들림, 4회 붕괴**.

## 순간이동기

- 누르면 `PressTeleportButtonClientRpc`(모든 클라이언트)가 쿨타임 시작(`cooldownAmount`, 프리팹 값).
- 이번 세션에 이미 생성된 적 있으면(재구매·창고에서 꺼냄) 바로 쿨타임 상태로 시작합니다.
- 역방향 순간이동기는 궤도·던전 생성 중·회사에서는 못 씁니다.

## 광산 엘리베이터

`MineshaftElevatorController`: `elevatorTopPoint`/`elevatorBottomPoint`, `elevatorIsAtBottom`, `elevatorFinishedMoving`.

## 바깥 집

렌드·애더먼스·아터피스 등의 바깥 건물에는 전용 오브젝트가 없습니다. 건물 안 조명·날씨 끔을 켜는 `AudioReverbTrigger` 구역으로 구분됩니다. **벼락은 바깥 집 안도 막아 주지 않습니다.**
