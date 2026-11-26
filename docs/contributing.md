# 위키 기여

## 문서 고치기

각 페이지 오른쪽 위의 연필 아이콘을 누르면 GitHub에서 바로 고칠 수 있습니다. 문서는 `docs/` 폴더의 마크다운 파일입니다.

## 로컬에서 미리 보기

```powershell
pip install -r requirements.txt
```

```powershell
mkdocs serve
```

브라우저에서 <http://127.0.0.1:8000> 을 엽니다. 파일을 저장하면 자동으로 새로고침됩니다.

## 배포

`main` 브랜치에 푸시하면 GitHub Actions(`.github/workflows/pages.yml`)가 사이트를 빌드해 GitHub Pages에 올립니다.
처음 한 번은 저장소 **Settings → Pages → Source**를 **GitHub Actions**로 바꿔야 합니다.

## 작성 규칙

- 코드에서 확인한 사실과 추측을 구분합니다. 확인하지 못한 값은 "씬/프리팹 값", "미확인"이라고 적습니다.
- 숫자에는 단위를 붙입니다(m, 초, %).
- 게임 클래스·필드 이름은 `코드` 형식으로 적어 다른 사람이 직접 찾아볼 수 있게 합니다.

## 게임 코드 확인하는 법

1. 게임 폴더 `Lethal Company_Data\Managed\Assembly-CSharp.dll`을 ILSpy·dnSpy 같은 디컴파일러로 엽니다.
2. 또는 PowerShell에서 `Reflection.Assembly.LoadFrom`으로 불러와 `GetFields()`, `GetMethodBody().GetILAsByteArray()`로 직접 읽을 수 있습니다.
3. 씬·프리팹에 저장된 값(애니메이션, 곡선, 계수)은 DLL에 없으므로 에셋 파일(`sharedassets*.assets`)을 읽거나 게임 안에서 측정해야 합니다.
