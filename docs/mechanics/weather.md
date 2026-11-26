# 날씨

## 날씨가 정해지는 곳

- `SelectableLevel.currentWeather`를 쓰는 곳은 `StartOfRound.SetPlanetsWeather(인원)` 하나뿐입니다.
- 호출: 하루가 지날 때(`TimeOfDay.OnDayChanged`), 저장 불러오기, **플레이어가 접속할 때**(`OnPlayerConnectedClientRpc`) → 접속하면 전 행성 날씨를 다시 뽑습니다.
- 착륙하면 `RoundManager.SetToCurrentLevelWeather`가 `TimeOfDay.currentLevelWeather`로 복사합니다.
- 안개 짙기 = `Random(seed + 101).Next(var1, var2)`.
- 맵의 `AudioReverbTrigger` 구역이 날씨 효과를 켜고 끕니다(건물 안 등).

## 뇌우 (Stormy)

뇌우에는 성격이 다른 **두 가지 벼락**이 있습니다.

### 무작위 벼락

- `StormyWeather.Update`가 모든 클라이언트에서 **각자** 계산하지만 같은 시드라 결과가 같습니다.
- 시작: `seed = Random(randomMapSeed)`, 첫 벼락은 7초 뒤.
- 호스트가 게임 시간이 10초 경계를 넘을 때마다 시간을 동기화하고, 그때 `seed = Random(10초 단위 내림 + randomMapSeed)`로 다시 만듭니다.
- 매 벼락:
    1. `Next(0,100) < 60` 이고 (간격 × 날씨 세기) < 3 이면 **직전 자리에 또** 칩니다(연속 벼락).
    2. 아니면 바깥 AI 노드 중 하나 + ±7.5m 무작위 → NavMesh 위로 보정.
    3. 다음 간격 = Clamp(Next(-5,110) × 0.25, 0.6, 110) / Clamp(날씨 세기, 1, 100).
- 폭발(`Landmine.SpawnExplosion`): **2.4m 안 즉사, 5m 안 피해 50.**

### 금속 벼락

- **호스트만**, 시드 없는 `UnityEngine.Random` → 예측 불가.
- 날씨 시작 15초 뒤 **한 번만** `isConductiveMetal` 물건 목록을 모읍니다.
- 4초마다 실내·배 안이 아닌 것 중 플레이어와 가까운 것을 대상으로 고르고, 타이머 = Clamp(Range(1,28), 0, 20)초(들고 있으면 최소 4초).
- 타이머 < 10이 되면 **정전기 경고**(파티클 + 든 사람 팁). 남은 시간 = 10 − 파티클 시간.
- 0이 되는 순간 그 물건이 **실내가 아닐 때만** 칩니다. 실내면 취소하고 바로 다른 대상을 고릅니다.

!!! warning "경고 후 실내에 갔다 나오면"
    대상이 실내에 있는 동안 파티클은 꺼지고, 다시 나와도 켜지지 않습니다. 그런데 타이머는 계속 돌기 때문에 **시간 전에 나오면 경고 없이 맞습니다.**

- 바깥의 집·지붕 아래는 보호해 주지 않습니다(실내 여부 `isInFactory`만 봄).
- 전도성 아이템 목록은 [플레이어](player.md#전도성-아이템) 참고.

## 일식 (Eclipsed)

`EclipseWeather.OnEnable`: 내부·외부 최소 스폰 수 = `TimeOfDay.currentWeatherVariable`. 처음부터 몬스터가 많이 나옵니다.

## 비 (Rainy) — 늪

- `RoundManager.SpawnOutsideHazards`(모든 클라이언트)에서 비가 오면 `Random(randomMapSeed + 2)`로 **5~14개**(7% 확률로 5~29개)의 늪(`QuicksandTrigger`)을 바깥 AI 노드 주변 30m에 놓습니다.
- 모든 클라이언트에서 같은 자리입니다.
- 늪에 빠지면(`sinkingValue > 0.73`) 이동속도 0.

## 안개 (Foggy)

- 외부 몬스터는 `canSeeThroughFog`가 아니면 시야가 **최대 30m**로 줄어듭니다.

## 실내 안개

- `RefreshEnemiesList`에서 `Random(randomMapSeed + 5781)`로 결정(모두 같음).
    - 침공 레벨(Next(0,1000) < 4)이면 20%, 아니면 3/150 = 2%.
    - 10월 23일에는 추가 확률.
- 건물 안에서만 켜지며 시야가 짧아집니다. 증기 밸브의 국소 안개와는 별개입니다.
