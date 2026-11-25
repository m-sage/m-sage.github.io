/* M-SAGE 웹사이트 공지 메시지 / website messages
 *
 * 여기에 한 줄(한 묶음)을 추가하면 모든 페이지(조종석·이야기·인사이트 랩) 위쪽에 공지가 나타납니다.
 * Add one entry below and it appears as a banner under the top bar on every page.
 *
 *   ko / en   : 보여 줄 문장 (한국어, 영어). 하나만 써도 됩니다.
 *   type      : "info"(기본, 파랑) · "new"(새 소식, 초록) · "warning"(주의, 주황)
 *   date      : 날짜 (보여 주기만 함)          until : 이 날짜가 지나면 자동으로 숨김 (선택)
 *   link      : 자세히 보기 주소 (선택)         pages : ["cockpit","story","lab"] 중 일부만 (선택, 기본 전체)
 *
 * 규칙: 각 묶음은 { } 로 감싸고 끝에 쉼표(,). 문장 안의 따옴표 " 는 \" 로 씁니다.
 * 저장하면 1~2분 뒤 https://m-sage.github.io 에 반영됩니다. 형식이 틀리면 게시가 멈추고 사이트는 이전 상태로 남습니다.
 *
 * 예시 (앞의 // 를 지우면 나타남):
 *   // { date: "2026-12-01", type: "new", ko: "12월 데이터로 갱신했습니다.", en: "Updated with December data.", link: "story.html#s-news" },
 */
window.MSAGE_MESSAGES = [

];
