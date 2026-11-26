# 몬스터 체력·공격·상태

## 플레이어 무기

| 무기 | 피해 | 속도 | 범위 |
|---|---|---|---|
| 삽 · 정지 표지판 · 양보 표지판 (`Shovel`) | `shovelHitForce` | 들기 0.35초 + 휘두름 0.13초 + 회복 0.3초 | SphereCast 반경 0.8, 거리 1.5 |
| 부엌칼 | `knifeHitForce` | 마지막 피해 후 0.43초 동안 피해 없음 | 거리 0.75 |
| 산탄총 | 3.7m 안 5 / 6m 안 3 / 그 밖 2 | `shellsLoaded`, 안전장치 `safetyOn` | — |

- 산탄총에 **플레이어**가 맞으면(정면 30°, 벽 없음): 15m 안 100 / 23m 안 40 / 30m 안 20.
- 호두까기 발차기는 피해가 아니라 `KillPlayer`(즉사)입니다.
- 헛스윙 소리와 산탄총 발사음은 몬스터가 못 듣습니다([소리](noise.md) 참고).

## 몬스터 체력

- 현재 체력은 `EnemyAI.enemyHP`. **최대 체력 필드는 없습니다.**
- `enemyType.canDie = false`이거나, 그 클래스가 `HitEnemy`를 재정의하지 않았으면 **처치 불가**입니다. 기본 `EnemyAI.HitEnemy`는 소리만 냅니다.
    - 처치 불가: 배회 메뚜기, 포자 도마뱀, 코일헤드, 광대, 올드 버드, 이발사, 사냥 벌, 집사 벌, 유령 소녀 등
- 늪지 점액괴어(가오리, `StingrayAI`)는 HP가 **0 미만**일 때만 죽습니다(0이면 생존).
- 터렛은 몬스터에게 피해를 주는 코드가 없습니다.

## 몬스터 공격력

`DamagePlayer`의 첫 인수 = 피해, `OnCollideWithPlayer`의 `timeSinceHittingPlayer` 비교값 = 공격 간격입니다. 즉사형은 `KillPlayer`를 부릅니다.

- 페이오파(`PumaAI`)는 간격 값이 코드에 없습니다. 공격 상태에서 할퀴기 애니메이션 이벤트(`AnimationEventC`)가 날 때마다 3초 안에 닿으면 7 피해 + 밀쳐냄 → 실제 간격은 애니메이션 클립이 정합니다.
- 피해 없음(비공격적): 튤립 뱀, 배회 메뚜기, 만티코일.

## 기절

- `SetEnemyStunned(true, t)` → `stunNormalizedTimer = t`. 기절 직후 0.5초(`postStunInvincibilityTimer`)는 다시 기절하지 않고, 이미 기절 중이면 덮어씁니다.
- `EnemyAI.Update`가 매 프레임 `dt / enemyType.stunTimeMultiplier`씩 뺍니다 → **남은 초 = 타이머 × 배율**.
- `stunnedIndefinitely > 0`(잽건 등)이면 계속 기절.
- 기절은 각 클라이언트가 따로 계산합니다(동기화 값 아님).

## 몬스터별 상태 번호

상태는 `currentBehaviourStateIndex`(RPC로 동기화)와 `enemyBehaviourStates[i].name`으로 알 수 있습니다. 아래는 각 클래스의 `SwitchToBehaviourState` 인수와 분기 내용으로 확인한 의미입니다.

| 몬스터 | 상태 | 비고 |
|---|---|---|
| 브래컨 (Flowerman) | 0 몰래 접근 / 1 들켜서 피함·시체 운반 / 2 분노 | `isInAngerMode`도 분노, `carryingPlayerBody` |
| 비축 벌레 (HoarderBug) | 0 폐품 찾기 / 1 둥지로 운반·둥지 경계·지킴 / 2 분노 | `heldItem`, `watchingPlayer`, `angryAtPlayer` |
| 숲의 거인 | 1 추격 | `chasingPlayer` |
| 코일헤드 · 덤퍼 · 가면 쓴 자 | 1 추격 | |
| 광대 · 호두까기 · 개코 매 · 거미 · 포자 도마뱀 · 거대 키위 | 2 공격/추격 | |
| 집사 · 사냥 벌 | 1 이상 | |
| 눈 없는 개 · 식인 괴물 | 2 이상 | |
| 페이오파 | 2 공격, 또는 0(나무 위가 아닐 때) | |
| 늪지 점액괴어 (Stingray) | 0 숨을 곳으로 이동 / 1 위장 | 위장 중 1.5m 안 접근이나 맞으면 돌진하며 나옴 |
| 납치범 여우 (BushWolf) | 0 숨음 / 1 노려봄 / 2 혀 공격 | 0으로 돌아가도 대상 안 비움 |

### 유령 소녀

- 홀린 한 명의 화면에서만 의미 있는 private `timesSeenByPlayer`(본 횟수)와 `chaseTimer`(추격 20초).
- 볼 때마다 +1. **2회 넘게 보면 85%, 3~4회 넘으면 추격.** 2회 이상 본 뒤 5m 안으로 다가오면 65%.
- 50m 멀어지면 추격 끝.
- 소녀가 나올 때 스폰 난수가 초기화됩니다([스폰](spawning.md#유령-소녀가-난수를-초기화함)).

## 비축 벌레 둥지

`HoarderBugAI.nestPosition`은 `SyncNestPositionClientRpc`로 모든 클라이언트에 동기화됩니다(미정이면 zero).
