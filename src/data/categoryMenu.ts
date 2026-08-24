export type CategoryMenuItemDef = {
  label: string;
  keywords: string[];
  fallback?: boolean;
};

export type CategoryMenuColumnDef = {
  title: string;
  items: CategoryMenuItemDef[];
};

export type CategoryMenuTabDef = {
  label: string;
  columns: CategoryMenuColumnDef[];
};

export type CategoryMenuColumn = {
  title: string;
  items: string[];
};

export type CategoryMenuTab = {
  label: string;
  columns: CategoryMenuColumn[];
};

const apparelColumn: CategoryMenuColumnDef = {
  title: "의류",
  items: [
    { label: "티셔츠/맨투맨", keywords: ["티셔츠", "맨투맨", "스웨트셔츠", "반팔티", "긴팔티"] },
    { label: "원피스/점프수트", keywords: ["원피스", "점프수트", "점프슈트"] },
    { label: "블라우스/셔츠", keywords: ["블라우스"] },
    { label: "스커트", keywords: ["스커트"] },
    { label: "바지/데님", keywords: ["바지", "데님", "팬츠"] },
    { label: "비치웨어", keywords: ["비치웨어", "스윔", "수영복"] },
    { label: "니트웨어", keywords: ["니트", "가디건", "스웨터"] },
    { label: "아우터", keywords: ["아우터", "점퍼", "후드", "후디"] },
    { label: "패딩", keywords: ["패딩", "다운"] },
    { label: "코트", keywords: ["코트"] },
    { label: "자켓", keywords: ["자켓", "재킷", "블루종"] },
    { label: "블레이저/수트", keywords: ["블레이저", "수트", "정장"] },
    { label: "언더웨어/파자마", keywords: ["언더웨어", "파자마", "잠옷"] },
    { label: "스포츠/아웃도어", keywords: ["스포츠", "아웃도어"] },
    { label: "기타의류", keywords: [], fallback: true },
  ],
};

const womenBagColumn: CategoryMenuColumnDef = {
  title: "가방",
  items: [
    { label: "숄더백/크로스백", keywords: ["숄더", "크로스", "호보", "체인백", "woc"] },
    { label: "토트백/핸드백", keywords: ["토트", "핸드백", "버킷"] },
    { label: "클러치/미니백", keywords: ["클러치", "미니백"] },
    { label: "백팩", keywords: ["백팩"] },
    { label: "파우치", keywords: ["파우치", "포쉐트"] },
    { label: "벨트백", keywords: ["벨트백", "웨이스트백"] },
    { label: "여행가방", keywords: ["여행가방", "캐리어", "보스턴"] },
    { label: "이너백", keywords: ["이너백"] },
    { label: "기타가방", keywords: [], fallback: true },
  ],
};

const menBagColumn: CategoryMenuColumnDef = {
  title: "가방",
  items: [
    { label: "숄더백/크로스백", keywords: ["숄더", "크로스", "호보", "체인백", "woc"] },
    { label: "파우치", keywords: ["파우치", "포쉐트"] },
    { label: "토트백/탑핸들백", keywords: ["토트", "탑핸들", "핸드백", "버킷"] },
    { label: "백팩", keywords: ["백팩"] },
    { label: "벨트백", keywords: ["벨트백", "웨이스트백"] },
    { label: "서류/비즈니스백", keywords: ["서류", "브리프", "비즈니스"] },
    { label: "여행가방", keywords: ["여행가방", "캐리어", "보스턴"] },
    { label: "이너백", keywords: ["이너백"] },
    { label: "기타가방", keywords: [], fallback: true },
  ],
};

const womenAccessoryColumn: CategoryMenuColumnDef = {
  title: "액세서리",
  items: [
    { label: "지갑/카드홀더", keywords: ["지갑", "카드홀더", "카드지갑", "장지갑", "반지갑", "월릿", "월렛"] },
    { label: "주얼리", keywords: ["주얼리", "목걸이", "반지", "브레이슬릿", "귀걸이"] },
    { label: "모자/장갑", keywords: ["모자", "캡", "버킷햇", "장갑"] },
    { label: "스카프/숄", keywords: ["스카프", "숄", "머플러"] },
    { label: "선글라스", keywords: ["선글라스", "아이웨어"] },
    { label: "벨트", keywords: ["벨트"] },
    { label: "시계", keywords: ["시계", "워치"] },
    { label: "키링/참/가죽소품", keywords: ["키링", "참", "가죽소품"] },
    { label: "디지털 액세서리", keywords: ["디지털", "폰케이스", "에어팟"] },
    { label: "양말", keywords: ["양말"] },
    { label: "우산", keywords: ["우산"] },
    { label: "기타액세서리", keywords: [], fallback: true },
  ],
};

const menAccessoryColumn: CategoryMenuColumnDef = {
  title: "액세서리",
  items: [
    { label: "지갑/카드홀더", keywords: ["지갑", "카드홀더", "카드지갑", "장지갑", "반지갑", "월릿", "월렛"] },
    { label: "시계", keywords: ["시계", "워치"] },
    { label: "벨트", keywords: ["벨트"] },
    { label: "모자/장갑", keywords: ["모자", "캡", "버킷햇", "장갑"] },
    { label: "타이/보타이", keywords: ["타이", "보타이", "넥타이"] },
    { label: "주얼리", keywords: ["주얼리", "목걸이", "반지", "브레이슬릿"] },
    { label: "선글라스", keywords: ["선글라스", "아이웨어"] },
    { label: "키링/참/가죽소품", keywords: ["키링", "참", "가죽소품"] },
    { label: "스카프/숄", keywords: ["스카프", "숄", "머플러"] },
    { label: "디지털 액세서리", keywords: ["디지털", "폰케이스", "에어팟"] },
    { label: "양말", keywords: ["양말"] },
    { label: "우산", keywords: ["우산"] },
    { label: "기타액세서리", keywords: [], fallback: true },
  ],
};

const womenShoeColumn: CategoryMenuColumnDef = {
  title: "신발",
  items: [
    { label: "스니커즈/운동화", keywords: ["스니커", "운동화"] },
    { label: "샌들/슬리퍼", keywords: ["샌들", "슬리퍼"] },
    { label: "플랫/발레리나슈즈", keywords: ["플랫", "발레리나"] },
    { label: "로퍼/레이스업", keywords: ["로퍼", "레이스업"] },
    { label: "펌프스/힐", keywords: ["펌프스", "힐"] },
    { label: "부츠", keywords: ["부츠"] },
    { label: "에스파드류/웨지", keywords: ["에스파드류", "웨지"] },
    { label: "기타신발", keywords: [], fallback: true },
  ],
};

const menShoeColumn: CategoryMenuColumnDef = {
  title: "신발",
  items: [
    { label: "스니커즈/운동화", keywords: ["스니커", "운동화"] },
    { label: "샌들/슬리퍼", keywords: ["샌들", "슬리퍼"] },
    { label: "로퍼/드라이빙", keywords: ["로퍼", "드라이빙"] },
    { label: "구두/레이스업", keywords: ["구두", "레이스업"] },
    { label: "부츠", keywords: ["부츠"] },
    { label: "에스파드류/웨지", keywords: ["에스파드류", "웨지"] },
    { label: "기타신발", keywords: [], fallback: true },
  ],
};

export const categoryMenuTabs: CategoryMenuTabDef[] = [
  {
    label: "여성",
    columns: [apparelColumn, womenBagColumn, womenAccessoryColumn, womenShoeColumn],
  },
  {
    label: "남성",
    columns: [
      { ...apparelColumn, items: apparelColumn.items.filter((item) => item.label !== "원피스/점프수트" && item.label !== "스커트") },
      menBagColumn,
      menAccessoryColumn,
      menShoeColumn,
    ],
  },
];
