# SVG 아이콘 폰트 변환

이 폴더는 `fill-rule="evenodd"` / `clip-rule="evenodd"`가 들어간 SVG를 다루는 아이콘 폰트 실습 환경입니다. 변환 과정에서 보일 수 있는 렌더링 차이도 함께 확인할 수 있습니다.

## 구조

```text
01.아이콘/
├─ svg/
│  ├─ input/          원본 SVG
│  ├─ output/         picosvg로 1차 정리한 결과물
│  ├─ output-optimize/ svgo로 다시 정리한 결과물
│  └─ output-font/     아이콘 폰트 산출물
├─ scripts/
│  ├─ convert_svgs.py  Python 정리 스크립트
│  └─ build_font.cjs   폰트 생성용 Node 스크립트
├─ fantasticon.config.cjs  폰트 생성 설정
├─ package.json            npm 실행 명령 모음
└─ README.md               사용 방법 문서
```

## 준비

1. Node.js와 npm을 설치한다.
2. Python 3를 설치한다.
3. Python 의존성을 설치한다.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install picosvg lxml
```

4. Node 의존성을 설치한다.

```bash
npm install
```

## 실행

Python 스크립트를 직접 실행할 수도 있다.

```bash
python scripts/convert_svgs.py
```

같은 작업을 npm 명령어로도 실행할 수 있다.

```bash
npm run python:convert
```

SVG 정리까지 포함해서 실행하려면 아래 명령을 쓴다.

```bash
npm run build:svgs
```

폰트만 다시 만들고 싶으면 아래처럼 실행합니다.

```bash
npm run build:font
```

정리와 폰트 생성을 한 번에 돌리려면 아래를 실행합니다.

```bash
npm run build:all
```

## 포인트

- `fill-rule="evenodd"` / `clip-rule="evenodd"`가 포함된 path를 확인한다.
- `output/`은 `picosvg`로 1차 정리한 결과이고, `output-optimize/`는 `svgo` CLI로 다시 정리한 결과다.
- `output-font/`는 `output-optimize/`를 바탕으로 만든 아이콘 폰트 산출물이다. `icon.css`, `icon.scss`, `icon-mixin.scss`, `icon.woff2`, `icon.woff` 같은 파일과 `demo.html` 데모 페이지가 함께 생성된다.
- `npm run generate:raw` 또는 `npm run python:convert`로 Python 정리 단계를 실행할 수 있다.

## SCSS 사용 예시

```scss
.my-icon {
  @include icon(arrow-black-24) {
    color: red;
  }
}

.my-icon::after {
  @include icon(arrow-black-24, after) {
    color: red;
  }
}
```
