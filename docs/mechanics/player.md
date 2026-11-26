# 플레이어

## 이동속도와 무게

`PlayerControllerB.Update`:

```
속도 = movementSpeed / carryWeight
```

곱해지는 것:

| 조건 | 효과 |
|---|---|
| 늪에 빠짐 (`sinkingValue > 0.73`) | 0 |
| 웅크림 | ÷1.5 |
| 중상 (웅크리지 않을 때) | × `limpMultiplier` |
| 이동 방해 (거미줄 등) | ÷(2 × hinderedMultiplier) |
| 취함 | ×(drunknessSpeedEffect/5 + 1) |
| 중독 | ×0.75 |
| 경사 | max(0.8, 1 + 경사 × 계수) |
| 달리기 | ×2.25 (서서히 Lerp) |

- 가속도도 무게에 반비례: 달리기 5/(무게×1.5), 걷기 10/무게.
- 화면의 무게(lb) = Round(Clamp(carryWeight − 1, 0, 100) × 105). 아이템 하나의 무게도 같은 식(`itemProperties.weight`).

## 스태미나

스태미나 회복·소모는 게임 공식의 고정값입니다(무게에 따라 달리기 소모가 늘어남).

## 목소리 범위

- 듣는 쪽에서 각 팀원의 음성 AudioSource를 3D 재생합니다. 거리 감쇠는 프리팹 값(rolloff·min·maxDistance)이라 코드에는 없습니다.
- 거리는 머리(카메라) 기준. 벽이나 몬스터에게 막힘은 저역 필터만 걸 뿐 거리를 줄이지 않습니다.
- **무전기**: 말하는 쪽이 무전기에 대고 말하고(`speakingToWalkieTalkie`), 듣는 쪽이 무전기를 들고 있으면 2D(거리 무관).
- 죽은 사람 목소리는 산 사람에게 안 들리고, 산 사람 목소리는 관전자에게 0.8 볼륨.
- 크게 말하면(평소 3배 이상) 몬스터가 듣는 소리 이벤트가 납니다([소리](noise.md)).

## 전도성 아이템

`Item.isConductiveMetal`은 켜짐/꺼짐뿐입니다(정도 없음). 뇌우의 [금속 벼락](weather.md#금속-벼락) 대상이 됩니다.

=== "폐품"

    장치(Apparatus), 종, 큰 볼트, 금전등록기, 광대 나팔, 조종 패드, 쿠키 틀, 거품기, 고급 램프, 쓰레기통 뚜껑, 금괴, 벌집, 부엌칼, 큰 차축, 금속판, 빨간 탄산음료, 반지, 정지 표지판, 주전자, 장난감 로봇, V형 엔진, 양보 표지판, Zed Dog

=== "상점 아이템 등"

    사다리, 제트팩, 열쇠, 식인종 아기(Maneater), 레이더 부스터, 삽, TZP, 잽건

=== "전도성 아님"

    산탄총, 에어혼, 손전등, 무전기, 스프레이, 붐박스, 골든 컵 등

## 사망 원인

- `PlayerControllerB.KillPlayerClientRpc(playerId, causeOfDeath)`는 모든 클라이언트에서 실행됩니다.
- 시체는 `deadBody`(`isInShip`, `grabBodyObject`), 가면에게 당했으면 `redirectToEnemy is MaskedPlayerEnemy`.

## 아이템 잔량

- 배터리: `insertedBattery.charge`, `itemProperties.requiresBattery`.
- 스프레이: private `SprayPaintItem.sprayCanTank`.
