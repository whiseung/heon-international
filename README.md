# HEON International

한국어와 일본어를 지원하는 HEON International의 기업 웹사이트입니다.

빌드에는 Node.js 18 이상이, 로컬 미리 보기에는 Python 3가 필요합니다.

```sh
npm run build
npm run preview
```

브라우저에서 <http://127.0.0.1:4173>을 열어 확인합니다.

빌드 결과는 `dist/`에 생성됩니다. 페이지 템플릿은 `build.mjs`, 언어별 문구는 `src/content.mjs`, 스타일과 이미지는 `src/assets/`에 있습니다. 상담 신청은 heoninternational.com의 기존 접수 양식으로 연결합니다.

배포 주소를 검색엔진 메타데이터에 넣으려면 빌드 때 `SITE_URL`에 사이트의 주소를 지정합니다. 미리 보기에는 별도 설정이 필요하지 않습니다.

현장과 웨이퍼 사진은 NIST의 참고 이미지입니다. 이미지별 원본 링크는 사이트에 표시합니다. 대표 사진은 기존 HEON International 웹사이트에서 가져왔습니다. 글꼴 라이선스는 `src/assets/`에 있습니다.
