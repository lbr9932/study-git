export function getRecommendation(checkKey: string) {
  const recommendations: Record<string, string> = {
    status: "200대 응답이 나오도록 리다이렉트, 404, 500 오류를 먼저 정리하세요.",
    title: "페이지 고유 키워드와 브랜드를 포함한 10-70자 내외의 title을 작성하세요.",
    meta_description: "페이지 내용을 요약하고 클릭 이유가 보이도록 50-170자 내외의 description을 작성하세요.",
    h1: "페이지 주제를 대표하는 H1을 1개 이상 명확히 노출하세요.",
    canonical: "중복 URL 신호를 줄이기 위해 self canonical 또는 대표 URL canonical을 지정하세요.",
    social_tag: "공유 미리보기에 필요한 OG/Twitter 태그를 title, description, url, image 중심으로 채우세요.",
    schema: "페이지 유형에 맞는 JSON-LD 구조화 데이터를 추가하세요."
  };

  return recommendations[checkKey] ?? "엑셀 기준표의 해당 항목 조건에 맞게 콘텐츠 또는 메타 데이터를 보완하세요.";
}

