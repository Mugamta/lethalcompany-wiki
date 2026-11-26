# 몬스터 스폰

몬스터 스폰은 전부 **호스트**의 `RoundManager`가 합니다. 클라이언트는 결과(생긴 몬스터, 벤트 배정)만 받습니다.

## 세 종류의 스폰

| 분류 | 목록 | 파워 최대 | 위치 |
|---|---|---|---|
| 내부 | `currentLevel.Enemies` | `currentMaxInsidePower` | 벤트(EnemyVent)에 먼저 배정 → 정해진 시각에 나옴 |
| 외부(야간) | `currentLevel.OutsideEnemies` | `currentMaxOutsidePower` | 바깥 AI 노드에서 바로 생성 |
| 외부(주간) | `currentLevel.DaytimeEnemies` | `currentLevel.maxDaytimeEnemyPowerCount` | 바깥에서 바로 생성 |
| 은폐 수풀 | `RoundManager.WeedEnemies` | 4 (고정) | [은폐 수풀](vain-shroud.md) 참고 |

- 최대 파워는 `RefreshEnemiesList`(시드 기반)에서 정해져 모든 클라이언트에 같은 값이 있습니다.
- **현재 파워**(`currentEnemyPower` 등)는 스폰할 때만 올라가므로 호스트만 정확한 값을 압니다. 클라이언트에서는 살아 있는 몬스터의 `enemyType.PowerLevel` 합으로 추정할 수 있습니다.
- 몬스터가 죽으면 `SubtractFromPowerLevel`로 파워가 빠집니다(`removedPowerLevel`). 즉 **죽이면 그만큼 더 나올 수 있습니다.**

## 스폰 배치 시각

`RoundManager.Update`(호스트)의 흐름:

1. `currentDayTime > 85`초가 되면 `BeginEnemySpawning` → 첫 내부 배치를 계획합니다.
    - 벤트가 하나도 없거나 `maxEnemyPowerCount ≤ 0`이면 이 함수가 끝까지 안 돌아 **외부 스폰도 영영 없습니다** (회사가 이 경우).
2. 그 뒤 `timeScript.hour > currentHour` **그리고** 이번 배치에 벤트로 배정된 몬스터가 **모두 나왔을 때**(`currentEnemySpawnIndex >= enemySpawnTimes.Count`)만 `AdvanceHourAndSpawnNewBatchOfEnemies`가 돕니다.
3. 이때 `currentHour += hourTimeBetweenEnemySpawnBatches`(기본 2) 후 외부 스폰 → 은폐 수풀 스폰 → 내부 배치 계획 순서로 실행합니다.

!!! note "배치는 생각보다 늦게 옵니다"
    배치 발생 시각 = max(시계 조건, 앞 배치의 마지막 벤트 시각). 벤트 몬스터가 늦게 나오도록 배정되면 다음 배치 전체가 밀립니다.

- 스폰 곡선(`enemySpawnChanceThroughoutDay` 등)은 **증가된 `currentHour`** 로 평가합니다. 시각이 밀려도 종류·마릿수 계산 자체는 같습니다.
- **시각 조건은 따로 없습니다.** "야간 몬스터"도 곡선 값만 넘으면 낮에 나옵니다.
- 호스트가 실내 몬스터를 하나도 안 죽이면, 파워가 가득 찬 뒤(`cannotSpawnMoreInsideEnemies`) 이후 배치는 시계 조건대로 정확히 옵니다.

## 시간당 마릿수

=== "내부"

    `PlotOutEnemiesForNextHour`:

    ```
    a = enemySpawnChanceThroughoutDay(t) - 1 + |마감까지 남은 날 - 3| / 1.6
    마릿수 = RoundToInt(Clamp(Lerp(a + 마감보정 - r, a + r, NextDouble()), minEnemiesToSpawn, 20))
    ```

    - `r` = `spawnProbabilityRange`
    - 침공(private `enemyRushIndex ≠ -1`, 호두까기 파워 20 / 비축 벌레 파워 30 레벨)이면 +2
    - 빈 벤트 수를 넘을 수 없음
    - 마감 보정은 아래쪽 범위에만 붙습니다.

=== "외부(야간)"

    `SpawnEnemiesOutside`:

    ```
    a = outsideEnemySpawnChance(t) (×100 버림 /100)
    마릿수 = Next((int)(a + 마감보정 - 3), (int)(a + 3)), [minOutsideEnemiesToSpawn, 20]
    ```

=== "외부(주간)"

    ```
    마릿수 = Next((int)(c - r), (int)(c + r)), [0, 20]
    ```

    - `normalizedTimeInDayToLeave`가 지난 시각에는 스폰하지 않습니다.

### 최소 마릿수를 올리는 것

| 원인 | 효과 |
|---|---|
| 일식 (`EclipseWeather.OnEnable`) | 내부·외부 최소 마릿수 = `currentWeatherVariable` |
| 코어(장치, Apparatus) 뽑기 | 호스트 70% 확률로 내부 최소 2. 잠든 올드 버드가 모두 깨어남 |
| 폐품을 많이 찾음 (마감 D-2 이하, 최소 0일 때) | 최소 1 (아래 참고) |

폐품을 많이 찾음 조건 (`AdvanceHourAndSpawnNewBatchOfEnemies`): 아래 중 하나

1. `valueOfFoundScrapItems / profitQuota`(정수 나눗셈 → 사실상 **찾은 폐품 ≥ 할당량**) 그리고 시각 > 0.3
2. 맵 전체 폐품 가치의 65% 초과를 찾음
3. `daysPlayersSurvivedInARow ≥ 5`

"찾음" = 배 밖에 있던 폐품을 **처음 집을 때** 가치가 더해집니다.

## 종류 뽑기

`GetRandomWeightedIndex`로 가중치 비례 뽑기. 가중치 = rarity × 확률곡선(시각), 그리고:

- 파워가 넘치거나, `MaxCount`에 찼거나, `spawningDisabled`면 0
- 내부: 그날 처음 나오는 종류는 `DiversityPowerLevel` 확인
- 침공 종류·`increasedInsideEnemySpawnRateIndex`는 100, 침공 중 다른 종류는 ×0.075
- 던전 종류가 `increasedChanceInterior`와 같으면 Min(×1.5, +50)

## 벤트 대기

- 호스트 `AssignRandomEnemyToVent`가 배정하는 순간 `numberSpawned++`, `currentEnemyPower += PowerLevel`.
- `SyncVentSpawnTimeClientRpc`로 모든 클라이언트의 `EnemyVent.occupied / enemyType / spawnTime`이 설정됩니다 → **클라이언트도 어느 벤트에서 무엇이 언제 나올지 알 수 있습니다.**
- 나올 때 `OpenVentClientRpc`.
- `spawnTime - currentDayTime < enemyType.timeToPlayAudio`가 되면 벤트에서 **끼익거리는 소리**가 나고 점점 커집니다. 실내에서 이 소리가 들리면 곧 그 벤트에서 몬스터가 나온다는 뜻입니다.

!!! bug "클라이언트의 벤트 목록은 비어 있음"
    `RoundManager.allEnemyVents`는 레벨마다 호스트 전용 `LoadNewLevelWait`에서만 채워집니다. 클라이언트에서 쓰려면 `FindObjectsOfType<EnemyVent>()`로 직접 찾아야 합니다.

## 스폰 난수 시드

| 난수 | 시드 | 용도 |
|---|---|---|
| `EnemySpawnRandom` | seed + 40 | 내부 마릿수·시각·벤트·종류 |
| `OutsideEnemySpawnRandom` | seed + 41 | 외부(야간) |
| `WeedEnemySpawnRandom` | seed + 42 | 은폐 수풀 몬스터 |
| `DaytimeEnemySpawnRandom` | seed + 43 | 외부(주간) |
| `AnomalyRandom` | seed + 5 | 위치(노드 선택), 폐품, 잠긴 문 등 공용 |

종류별 난수가 따로라서, **죽은 몬스터가 없다면** 하루의 스폰 종류·마릿수를 처음부터 다시 계산해 미리 알 수 있습니다. 위치는 공용 난수라 예측이 어렵습니다(올드 버드 둥지만 예외).

### 유령 소녀가 난수를 초기화함

`DressGirlAI.Start`는 `!hasInitializedLevelRandomSeed`면 `RoundManager.InitializeRandomNumberGenerators()`를 부릅니다. 그런데 이 플래그를 `true`로 바꾸는 코드가 **어디에도 없어서**, 유령 소녀가 나올 때마다(호스트) 위 난수가 전부 시드 처음부터 다시 시작합니다.

→ 유령 소녀가 나온 뒤의 배치는 원래 순서와 달라집니다.

## 잠든 올드 버드

- 호스트가 레벨 생성 때 `PredictAllOutsideEnemies`로 하루 외부 스폰을 미리 돌려, 올드 버드(RadMech)가 뽑힐 때마다 **둥지**(`EnemyAINestSpawnObject`)를 하나씩 놓습니다.
- 실제 올드 버드가 스폰되면 목록의 첫 둥지 자리로 옮겨지고 둥지는 사라집니다 → **앞 둥지부터 깨어납니다.**
- 코어를 뽑으면(`LungProp.DisconnectFromMachinery`) 둥지마다 올드 버드가 바로 스폰됩니다.

## 첫 외부 스폰의 함정

`SpawnRandomOutsideEnemy`의 첫 호출(`firstTimeSpawningOutsideEnemies`)은 모든 외부 종류의 `numberSpawned`를 0으로 되돌립니다. 레벨 생성 때 미리 계산하며 올려 둔 값을 지우는 것입니다.
