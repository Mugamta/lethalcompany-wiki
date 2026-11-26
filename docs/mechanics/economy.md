# 돈·할당량·배송

## 초과 수당 (Overtime)

`TimeOfDay.SetNewProfitQuota`(호스트):

```
초과 수당 = (판매액 합 − 할당량) / 5 + 15 × daysUntilDeadline
```

- **할당량을 채웠으면 마감 전이라도** 이륙 때(EndOfGame) 호출됩니다.
- `daysUntilDeadline`은 이륙 **후** 값입니다. 마감 당일에 팔면 −1이 되어 **초과분 $80부터** 수당이 생깁니다.
- 회사에 D-n(n>0)에 가면 회사는 시간이 안 흘러 날이 안 지나므로 +15n.
- 지급은 `Mathf.Clamp(credits + bonus, credits, 1e8)` → 음수는 무시.

## 사망 벌금

EndOfGame(모든 클라이언트)에서 사망자가 있으면(회사 포함, 챌린지 제외) `HUDManager.ApplyPenalty`:

| 대상 | 벌금 |
|---|---|
| 시체를 못 가져온 사망자 1명마다 | −(int)(이륙 전 잔액 × **20%**) |
| 시체를 배에 가져온 사망자 1명마다 | −(int)(이륙 전 잔액 × **8%**) |

- 바닥은 Min(원래 잔액, 60) — 60 이하로는 깎이지 않습니다(원래 60 미만이면 그대로).
- 시체 회수 = 씬의 `DeadBodyInfo` 중 `isInShip`.
- 벌금 다음에 초과 수당이 들어옵니다.
- 이륙 순간 배 안(`isInElevator`)이 아닌 사람은 `ElevatorFullyRunning`에서 죽습니다(Abandoned).

## 배송 (터미널 주문)

- 주문 목록: `Terminal.orderedItemsFromTerminal`(buyableItemsList 인덱스). 다른 클라이언트에는 **개수만** 동기화되고 목록은 안 갑니다.
- 배송선 `ItemDropship`: `deliveringOrder`, `shipLanded`, `shipTimer`(호스트에서만 돎).
- 쉬는 배송선 위치는 착륙 지점이 아닙니다. 실제 착륙 지점은 `itemSpawnPositions`.
- 배송선 음악은 60m 범위·크기 1.3으로 개를 부릅니다.

## 배 안 폐품

- `isInShipRoom`/`isInElevator`는 **내려놓을 때만** 갱신됩니다. 배에서 들고 나가도 플래그는 '배 안'으로 남고, 회사 계산대에 올린 폐품도 마찬가지입니다.
- 오늘 모은 폐품 = `RoundManager.scrapCollectedInLevel`(착륙 때 0).

## 폐품 발견 → 스폰 증가

배 밖 폐품을 **처음 집을 때**(`hasBeenHeld`) 가치가 `valueOfFoundScrapItems`에 더해집니다. 마감이 가까울 때 많이 찾으면 내부 최소 스폰이 1로 오릅니다([스폰](spawning.md#최소-마릿수를-올리는-것)).
