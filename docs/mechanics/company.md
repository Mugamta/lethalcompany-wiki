# 회사 창구 괴물

## 회사 행성의 특징

- `spawnEnemiesAndScrap = false` → 던전·벤트가 없고 시간이 흐르지 않습니다.
- 그래서 `BeginEnemySpawning`과 `AdvanceHour`가 안 돌아 **내부·외부·주간 스폰이 모두 없습니다.**
- 회사 씬(`CompanyBuilding`)에는 NavMesh가 아예 없습니다.

## 기분 (CompanyMood)

- 할당량을 한 번도 안 채웠으면 `CommonCompanyMoods[0]`, 아니면 `Random(randomMapSeed + 164)`로 뽑음 → 모든 플레이어가 같습니다.
- 바닐라 기분은 3가지 (에셋에서 직접 읽은 값):

| 기분 | 한글 | 시작 인내심 | 짜증(irritability) | 민감도(sensitivity) | 모습 |
|---|---|---|---|---|---|
| Agitated | 예민함 | 2 | 0.8 | 0.6 | 촉수 |
| SilentCalm | 조용히 있고 싶음 | 3 | 0.4 | 0.7 | |
| SnoringGiant | 코 고는 거인 | 2 | 0.5 | 0.25 | |

- 셋 다 `mustBeWokenUp`·`desiresSilence`가 켜져 있고 기다림 시간은 10입니다.

## 깨우기와 인내심

현재 인내심(`patienceLevel`)과 소리 누적(`timesHearingNoise`)은 **서버만** 압니다.

### 청각

- 창구(`triggerCollider`) **9m 안** + 소리 크기 > 0.4 + 그 소리의 범위가 창구에 닿아야 들립니다. 벽 감쇠 없음.
- 달리기 발소리(0.6)는 들리고 **걷기 발소리(0.4)는 안 들립니다.**
- noiseID 941·2692는 무시.

### 소리를 들으면

| 상태 | 효과 |
|---|---|
| 자는 중이고 문이 닫힘 (`mustBeWokenUp`) | 누적 += 민감도 × (크기 + 0.3) / 인원. **5가 되면 문이 열림** |
| 깨어 있음 (`desiresSilence`) | 인내심 −짜증/2 × 크기 |

- 물건을 계산대에 올리면 문이 열립니다(자는 중이고 누적 < 5면 제외).

### 인내심이 깎이는 흐름 (서버)

- 공격 후 25초가 지났고, 문이 열려 있고, 계산대가 비어 있으면 8/짜증 초마다 인내심 −짜증.
- 인내심 ≤ 0 → **50% 공격(+6 회복) / 50% +3 회복**. 판매 연출 중에는 무시.
- 깎였는데 1 미만이면 **경고음**(`MakeLoudNoise(1)`)이 납니다. 공격은 `MakeLoudNoise(2)`.

## 촉수(죽는 범위)

- 거리 계산이 아니라 **애니메이션 판정**입니다. 기분별 모습(촉수·혀·손)의 트리거가 공격 중 `CompanyMonsterCollisionDetect.OnTriggerEnter`로 닿은 플레이어를 잡아 `KillPlayer`.
- 범위는 애니메이션 에셋이 정합니다. 쉬는 자세로 애니메이션을 샘플해 계산한 범위는 실제 공격 범위의 **절반도 안 됐습니다.**
- 예민함(Agitated) 실측: 창구 앞 약 15.5 × 14m 안, 약 80m².
