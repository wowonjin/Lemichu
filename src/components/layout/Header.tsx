"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, Heart, LogOut, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { ADMIN_EMAIL, isAdminUser, type AuthUser, observeAuthUser, signOut } from "@/lib/auth";
import { getLoginHref } from "@/lib/redirect";
import { ModeToggle } from "./ModeToggle";

const gnb = [
  { label: "NEW", href: "/new-arrivals" },
  { label: "BEST", href: "/ranking" },
  { label: "브랜드", href: "/brand" },
  { label: "Threads 인기", href: "/threads" },
  { label: "중고명품", href: "/pre-owned" },
  { label: "여름 특가!", href: "/promotions", highlight: true },
  { label: "SALE", href: "/sale" },
  { label: "이벤트", href: "/events" },
];

const utility = [
  { label: "검색", href: "/search", icon: Search },
  { label: "찜", href: "/wishlist", icon: Heart },
  { label: "장바구니", href: "/cart", icon: ShoppingBag },
  { label: "마이", href: "/my", icon: User },
];

const menuTabs = [
  {
    label: "여성",
    columns: [
      {
        title: "의류",
        items: [
          "티셔츠/맨투맨",
          "원피스/점프수트",
          "블라우스/셔츠",
          "스커트",
          "바지/데님",
          "비치웨어",
          "니트웨어",
          "아우터",
          "패딩",
          "코트",
          "자켓",
          "블레이저/수트",
          "언더웨어/파자마",
          "스포츠/아웃도어",
          "기타의류",
        ],
      },
      {
        title: "가방",
        items: [
          "숄더백/크로스백",
          "토트백/핸드백",
          "클러치/미니백",
          "백팩",
          "파우치",
          "벨트백",
          "여행가방",
          "기타가방",
          "이너백",
        ],
      },
      {
        title: "액세서리",
        items: [
          "지갑/카드홀더",
          "주얼리",
          "모자/장갑",
          "스카프/숄",
          "선글라스",
          "벨트",
          "시계",
          "키링/참/가죽소품",
          "디지털 액세서리",
          "양말",
          "우산",
          "기타액세서리",
        ],
      },
      {
        title: "신발",
        items: [
          "스니커즈/운동화",
          "샌들/슬리퍼",
          "플랫/발레리나슈즈",
          "로퍼/레이스업",
          "펌프스/힐",
          "부츠",
          "에스파드류/웨지",
          "기타신발",
        ],
      },
    ],
  },
  {
    label: "남성",
    columns: [
      {
        title: "의류",
        items: [
          "티셔츠/맨투맨",
          "셔츠",
          "바지/데님",
          "비치웨어",
          "니트웨어",
          "아우터",
          "패딩",
          "코트",
          "자켓",
          "블레이저/수트",
          "언더웨어/파자마",
          "스포츠/아웃도어",
          "기타의류",
        ],
      },
      {
        title: "가방",
        items: [
          "숄더백/크로스백",
          "파우치",
          "토트백/탑핸들백",
          "백팩",
          "벨트백",
          "서류/비즈니스백",
          "여행가방",
          "기타가방",
          "이너백",
        ],
      },
      {
        title: "액세서리",
        items: [
          "지갑/카드홀더",
          "시계",
          "벨트",
          "모자/장갑",
          "타이/보타이",
          "주얼리",
          "선글라스",
          "키링/참/가죽소품",
          "스카프/숄",
          "디지털 액세서리",
          "양말",
          "우산",
          "기타액세서리",
        ],
      },
      {
        title: "신발",
        items: [
          "스니커즈/운동화",
          "샌들/슬리퍼",
          "로퍼/드라이빙",
          "구두/레이스업",
          "부츠",
          "에스파드류/웨지",
          "기타신발",
        ],
      },
    ],
  },
];

function categoryHref(tab: string, title?: string, item?: string) {
  const params = new URLSearchParams();
  params.set("tab", tab);
  if (title) params.set("category", title);
  if (item) params.set("item", item);
  return `/search?${params.toString()}`;
}

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(menuTabs[0].label);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const activeMenu = menuTabs.find((tab) => tab.label === activeTab) ?? menuTabs[0];
  const visibleUtility = authUser ? utility : utility.filter((item) => item.href !== "/my");
  const canAccessAdmin = isAdminUser(authUser) && authUser.email.toLowerCase() === ADMIN_EMAIL;
  const loginHref = getLoginHref(pathname);
  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = async () => {
    await signOut();
    setAuthUser(null);
    if (pathname.startsWith("/my")) {
      router.push("/login");
    }
  };

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    return observeAuthUser(setAuthUser);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
        <Link
          href="/new-arrivals"
          className="block bg-foreground px-4 py-2 text-center text-xs font-semibold text-background transition-colors hover:bg-foreground/90 md:text-sm"
        >
          27ss 신상 할인 상품 구경하기
        </Link>
        <div className="container">
          {/* Top row */}
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Left: logo + 전체/중고 toggle */}
            <div className="flex items-center gap-3">
              <Link href="/" aria-label="LEMICHU 홈">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="LEMICHU" className="h-5 w-auto md:h-6" />
              </Link>
              <ModeToggle />
            </div>

            {/* Right: icons */}
            <nav className="flex items-center gap-1 md:gap-2">
              {canAccessAdmin ? (
                <Link
                  href="/admin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center rounded-full border border-border bg-background px-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary md:px-4"
                >
                  관리자
                </Link>
              ) : null}
              {authUser ? (
                <Link
                  href="/my"
                  className="hidden h-10 items-center gap-2 rounded-full bg-secondary px-3 text-sm font-semibold text-foreground transition-colors hover:bg-gold-soft md:inline-flex"
                >
                  <span className="grid size-6 place-items-center rounded-full bg-foreground text-[11px] font-bold text-background">
                    {authUser.name.slice(0, 1)}
                  </span>
                  {authUser.name}님
                </Link>
              ) : (
                <Link
                  href={loginHref}
                  className="hidden h-10 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 md:inline-flex"
                >
                  로그인
                </Link>
              )}
              {visibleUtility.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  className="grid size-10 place-items-center rounded-full text-foreground transition-colors hover:bg-secondary"
                >
                  <item.icon className="size-5" strokeWidth={1.8} />
                </Link>
              ))}
              {authUser ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="로그아웃"
                  className="grid size-10 place-items-center rounded-full text-foreground transition-colors hover:bg-secondary"
                >
                  <LogOut className="size-5" strokeWidth={1.8} />
                </button>
              ) : (
                <Link
                  href={loginHref}
                  aria-label="로그인"
                  className="grid size-10 place-items-center rounded-full text-foreground transition-colors hover:bg-secondary md:hidden"
                >
                  <User className="size-5" strokeWidth={1.8} />
                </Link>
              )}
              <button
                type="button"
                aria-label="전체 메뉴 열기"
                aria-expanded={isMenuOpen}
                aria-controls="global-category-menu"
                onClick={() => setIsMenuOpen(true)}
                className="grid size-10 place-items-center rounded-full text-foreground transition-colors hover:bg-secondary"
              >
                <Menu className="size-5" strokeWidth={1.8} />
              </button>
            </nav>
          </div>

          {/* GNB row */}
          <nav className="flex h-11 items-center gap-5 overflow-x-auto no-scrollbar md:gap-7">
            {gnb.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "shrink-0 text-sm transition-colors hover:text-foreground",
                  item.highlight
                    ? "font-semibold text-gold hover:text-gold"
                    : "font-medium text-foreground/80"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-[60] bg-foreground/65 transition-opacity duration-200",
          isMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!isMenuOpen}
      >
        <button
          type="button"
          aria-label="전체 메뉴 닫기"
          className="absolute inset-0"
          onClick={closeMenu}
        />

        <div
          id="global-category-menu"
          role="dialog"
          aria-modal="true"
          aria-label="전체 메뉴"
          className={cn(
            "relative max-h-[72vh] overflow-y-auto border-b border-border bg-background shadow-xl transition-transform duration-300 ease-out",
            isMenuOpen ? "translate-y-0" : "-translate-y-full"
          )}
        >
          <div className="container">
            <div className="flex h-16 items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Link href="/" aria-label="LEMICHU 홈">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="LEMICHU" className="h-5 w-auto md:h-6" />
                </Link>
                <ModeToggle />
              </div>
              <button
                type="button"
                aria-label="전체 메뉴 닫기"
                onClick={closeMenu}
                className="grid size-10 place-items-center rounded-full text-foreground transition-colors hover:bg-secondary"
              >
                <X className="size-6" strokeWidth={1.8} />
              </button>
            </div>

            <nav className="flex h-11 items-center gap-2.5 overflow-x-auto border-b border-border/60 no-scrollbar">
              {menuTabs.map((tab) => {
                const isActive = tab.label === activeTab;

                return (
                  <button
                    key={tab.label}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveTab(tab.label)}
                    className={cn(
                      "relative h-full shrink-0 text-sm font-medium transition-colors",
                      isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab.label}
                    <span
                      className={cn(
                        "absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-foreground transition-opacity",
                        isActive ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </button>
                );
              })}
            </nav>

            <div className="py-5 md:py-6">
              <Link
                href={categoryHref(activeMenu.label)}
                onClick={closeMenu}
                className="inline-flex items-center gap-1 text-sm font-semibold text-foreground transition-colors hover:text-gold"
              >
                {activeMenu.label} 전체보기
                <ChevronRight className="size-4" strokeWidth={2.2} />
              </Link>

              <div
                className={cn(
                  "mt-5 grid gap-x-6 gap-y-8 pb-7 sm:grid-cols-2 lg:gap-x-8",
                  activeMenu.columns.length >= 6
                    ? "lg:grid-cols-4 xl:grid-cols-7"
                    : "lg:grid-cols-4"
                )}
              >
                {activeMenu.columns.map((column) => (
                  <section key={column.title} className="min-w-0">
                    <Link
                      href={categoryHref(activeMenu.label, column.title)}
                      onClick={closeMenu}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-foreground transition-colors hover:text-gold"
                    >
                      {column.title}
                      <ChevronRight className="size-4" strokeWidth={2.2} />
                    </Link>
                    <ul className="mt-3 space-y-2.5">
                      {column.items.map((item) => (
                        <li key={item}>
                          <Link
                            href={categoryHref(activeMenu.label, column.title, item)}
                            onClick={closeMenu}
                            className="block text-xs font-medium leading-none text-muted-foreground transition-colors hover:text-foreground"
                          >
                            {item}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
