# 상점 아이템

터미널 `store`에서 사서 [배송선](../ship/economy.md#배송-터미널-주문)으로 받는 도구입니다.
값은 게임 에셋(`Item`)과 프리팹에서 직접 읽었습니다.

## 아이템 목록

이름을 누르면 그 아이템만 다룬 문서로 갑니다.

| 아이템 | 가격 | 무게(lb) | 배터리 | 전도성 | 최대 할인 |
|---|--:|--:|---|:-:|--:|
| [무전기](walkie-talkie.md) | 10 | 0 | 820초 (켠 동안) | | 80% |
| [손전등](flashlight.md) | 15 | 0 | 140초 | | 80% |
| [자물쇠 따개](lockpicker.md) | 20 | 11 | — | | 80% |
| [제초제](weed-killer.md) | 20 | 0 | — | | 80% |
| [프로 손전등](flashlight.md) | 28 | 5 | 300초 | | 80% |
| [삽](shovel.md) | 30 | 14 | — | ✔ | 80% |
| [섬광탄](stun-grenade.md) | 30 | 5 | — | | 80% |
| [벨트 가방](belt-bag.md) | 45 | 16 | — | | 70% |
| [스프레이 페인트](spray-paint.md) | 50 | 0 | — | | 80% |
| [붐박스](boombox.md) | 60 | 16 | 350초 | | 80% |
| [연장 사다리](extension-ladder.md) | 60 | 0 | — | ✔ | 60% |
| [레이더 부스터](radar-booster.md) | 60 | 19 | — | ✔ | 80% |
| [TZP 흡입제](tzp-inhalant.md) | 80 | 0 | — | ✔ | 80% |
| [잽건](zap-gun.md) | 400 | 11 | 22초 (쏘는 동안) | ✔ | 80% |
| [제트팩](jetpack.md) | 900 | 53 | 50초 | ✔ | 80% |

??? note "영어 이름 (펼치기)"
    Walkie-talkie, Flashlight, Lockpicker, Weed killer, Pro-flashlight, Shovel, Stun grenade,
    Belt bag, Spray paint, Boombox, Extension ladder, Radar-booster, TZP-Inhalant, Zap gun, Jetpack
    (표 순서대로)

## 열 설명

무게(lb)
:   Round((`weight` − 1) × 105).
    이동속도·스태미나에 주는 영향은 [플레이어](../player/index.md#이동속도와-무게)에 있습니다.

배터리
:   가득 찬 상태에서 켜 두고 쓸 수 있는 시간(`batteryUsage`)입니다.
    함선 [충전기](../ship/index.md#배터리-충전기)에 대면 0.75초 만에 100%가 됩니다.

전도성
:   `isConductiveMetal`. 뇌우 때 [금속 벼락](../environment/index.md#금속-벼락)의 대상입니다.

최대 할인
:   `highestSalePercentage`. 하루가 지날 때마다 할인이 다시 정해지고(`SetItemSales`), 이 값까지 붙을 수 있습니다.

## 공통 규칙

### 조작

- **좌클릭**: 사용 (`ItemActivate`)
- **Q**: 보조 동작 (`ItemInteractLeftRight`). 무전기 전원, 스프레이 흔들기, 벨트 가방에 넣기
- 어떤 아이템도 양손(`twoHanded`)이 아닙니다.

### 떨어뜨릴 때 소리

아이템이 바닥에 닿으면 낙하 효과음(`Item.dropSFX`)이 나고, 몬스터도 듣습니다.

- **범위 8m, 크기 0.5**. 15개 상점 아이템이 모두 이 소리를 냅니다.
- 소리 규칙은 [소리와 눈 없는 개](../creatures/noise.md#아이템)에 있습니다.

## 관련 문서

- [폐기물](../scrap/index.md)
- [함선](../ship/index.md) (터미널, 충전기)
- [돈·할당량·배송](../ship/economy.md)
