const COURIER_TRACKING_URLS: Array<{
  keywords: string[];
  build: (invoiceNo: string) => string;
}> = [
  {
    keywords: ["cj", "대한통운"],
    build: (invoiceNo) =>
      `https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=${encodeURIComponent(invoiceNo)}`,
  },
  {
    keywords: ["한진"],
    build: (invoiceNo) =>
      `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText2=${encodeURIComponent(invoiceNo)}`,
  },
  {
    keywords: ["롯데"],
    build: (invoiceNo) =>
      `https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo=${encodeURIComponent(invoiceNo)}`,
  },
  {
    keywords: ["우체국", "post"],
    build: (invoiceNo) =>
      `https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=${encodeURIComponent(invoiceNo)}`,
  },
  {
    keywords: ["로젠"],
    build: (invoiceNo) =>
      `https://www.ilogen.com/web/personal/trace/${encodeURIComponent(invoiceNo)}`,
  },
];

export function getCourierTrackingUrl(courier?: string, invoiceNo?: string) {
  const trimmedInvoice = invoiceNo?.replace(/\s+/g, "");
  if (!trimmedInvoice) return null;

  const name = courier?.toLowerCase() ?? "";
  const matched = COURIER_TRACKING_URLS.find((item) =>
    item.keywords.some((keyword) => name.includes(keyword.toLowerCase()))
  );

  return matched ? matched.build(trimmedInvoice) : null;
}
