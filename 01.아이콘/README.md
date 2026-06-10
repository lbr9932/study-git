# SVG 아이콘 폰트깨짐 재현 환경

이 폴더는 `fill-rule="evenodd"` / `clip-rule="evenodd"`가 들어간 SVG가 아이콘 폰트 변환 과정에서 깨지는 현상을 재현하기 위한 실습 환경입니다.

## 구조

- `svg/input/broken-icon.svg` - 문제를 재현하는 원본 SVG
- `svg/output/` - 변환 결과물 저장 위치
- `svg/output-optimize/` - `svgo`로 다시 정리한 결과물 저장 위치
- `scripts/convert_svgs.py` - `picosvg` 기반 정리 스크립트
- `docs/` - 참고 이미지

## 준비

```bash
pip install picosvg lxml
```

`svgo`는 npm으로 설치합니다.

```bash
npm install
```

## 실행

```bash
python scripts/convert_svgs.py
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
- `docs/svg-icon-error-1.png`, `docs/svg-icon-error-2.png`는 현상 참고 이미지다.

## SCSS 사용 예시

```scss
.my-icon {
  @include icon(arrow-black-24);
}

.my-icon::after {
  @include icon(arrow-black-24, after);
}
```
