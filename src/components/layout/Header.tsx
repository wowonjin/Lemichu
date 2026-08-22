"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { ADMIN_EMAIL, isAdminUser, type AuthUser, observeAuthUser, signOut } from "@/lib/auth";
import { getLoginHref } from "@/lib/redirect";
import { HoverTooltip } from "@/components/ui/hover-tooltip";
import { HeaderSearchPanel } from "@/components/search/HeaderSearchPanel";
import { addRecentSearch } from "@/lib/searchHistory";
import { AccountMenu } from "./AccountMenu";
import { HeaderEventBanner } from "./HeaderEventBanner";
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

const headerIconClassName =
  "group relative grid size-10 place-items-center rounded-full text-foreground transition-colors hover:bg-secondary";

function HeaderIconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} aria-label={label} className={headerIconClassName}>
      {children}
      <HoverTooltip label={label} />
    </Link>
  );
}

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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(menuTabs[0].label);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const activeMenu = menuTabs.find((tab) => tab.label === activeTab) ?? menuTabs[0];
  const canAccessAdmin = isAdminUser(authUser) && authUser.email.toLowerCase() === ADMIN_EMAIL;
  const loginHref = getLoginHref(pathname);
  const closeMenu = () => setIsMenuOpen(false);
  const closeSearch = () => setIsSearchOpen(false);
  const closeAccountMenu = () => setIsAccountOpen(false);

  const toggleSearch = () => {
    setIsMenuOpen(false);
    setIsAccountOpen(false);
    setIsSearchOpen((open) => !open);
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (query) addRecentSearch(query);
    setIsSearchOpen(false);
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
  };

  const handleLogout = async () => {
    closeAccountMenu();
    await signOut();
    setAuthUser(null);
    if (pathname.startsWith("/my")) {
      router.push("/login");
    }
  };

  useEffect(() => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
    setIsAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const timer = window.setTimeout(() => searchInputRef.current?.focus(), 160);
    return () => window.clearTimeout(timer);
  }, [isSearchOpen]);

  useEffect(() => {
    return observeAuthUser(setAuthUser);
  }, []);

  useEffect(() => {
    if (!isAccountOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isAccountOpen]);

  useEffect(() => {
    const root = document.documentElement;
    const { body } = document;
    const scrollbarWidth = window.innerWidth - root.clientWidth;

    if (isMenuOpen || isSearchOpen) {
      root.style.overflow = "hidden";
      body.style.overflow = "hidden";
      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`;
      }
    } else {
      root.style.overflow = "";
      body.style.overflow = "";
      body.style.paddingRight = "";
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setIsSearchOpen(false);
        setIsAccountOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      root.style.overflow = "";
      body.style.overflow = "";
      body.style.paddingRight = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen, isSearchOpen]);

  return (
    <>
      <header className="relative sticky top-0 z-50 w-full bg-background">
        {pathname === "/login" || pathname === "/signup" ? null : <HeaderEventBanner />}
        <div className={cn("relative", isSearchOpen && "z-20")}>
        <div className="container">
          {/* Top row */}
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Left: logo + 전체/중고 toggle */}
            <div className="flex items-center gap-3">
              <Link href="/" aria-label="LEMICHU 홈">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="LEMICHU" className="h-5 w-auto dark:invert md:h-6" />
              </Link>
              <ModeToggle />
            </div>

            {/* Right: search + auth / logged-in actions */}
            <nav className="flex items-center gap-1 md:gap-2">
              <button
                type="button"
                aria-label={isSearchOpen ? "검색 닫기" : "찾기"}
                aria-expanded={isSearchOpen}
                aria-controls="header-search-panel"
                onClick={toggleSearch}
                className={cn(headerIconClassName, isSearchOpen && "bg-secondary")}
              >
                {isSearchOpen ? (
                  <X className="size-5" strokeWidth={1.8} />
                ) : (
                  <Search className="size-5" strokeWidth={1.8} />
                )}
                {isSearchOpen ? null : <HoverTooltip label="찾기" />}
              </button>
              {authUser ? (
                <>
                  <HeaderIconLink href="/wishlist" label="찜">
                    <Heart className="size-5" strokeWidth={1.8} />
                  </HeaderIconLink>
                  <HeaderIconLink href="/cart" label="담기">
                    <ShoppingBag className="size-5" strokeWidth={1.8} />
                  </HeaderIconLink>
                  <AccountMenu
                    user={authUser}
                    canAccessAdmin={canAccessAdmin}
                    isOpen={isAccountOpen}
                    menuRef={accountMenuRef}
                    onToggle={() => {
                      setIsMenuOpen(false);
                      setIsSearchOpen(false);
                      setIsAccountOpen((open) => !open);
                    }}
                    onClose={closeAccountMenu}
                    onLogout={handleLogout}
                  />
                </>
              ) : (
                <>
                  <Link
                    href={loginHref}
                    className="inline-flex h-9 items-center rounded-full px-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary md:h-10 md:px-4"
                  >
                    로그인
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex h-9 items-center rounded-full bg-primary px-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 md:h-10 md:px-4"
                  >
                    회원가입
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>

        <HeaderSearchPanel
          isOpen={isSearchOpen}
          query={searchQuery}
          inputRef={searchInputRef}
          onQueryChange={setSearchQuery}
          onSubmit={submitSearch}
          onClose={closeSearch}
        />
        </div>

        <div className="container">
          <div
            className={cn(
              "grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              isSearchOpen ? "grid-rows-[0fr]" : "grid-rows-[1fr]"
            )}
          >
            <div className="overflow-hidden">
              <nav className="flex h-11 items-center gap-5 overflow-x-auto no-scrollbar md:gap-7">
                <button
                  type="button"
                  aria-label={isMenuOpen ? "전체 메뉴 닫기" : "전체 메뉴 열기"}
                  aria-expanded={isMenuOpen}
                  aria-controls="global-category-menu"
                  onClick={() => {
                    setIsAccountOpen(false);
                    setIsSearchOpen(false);
                    setIsMenuOpen((open) => !open);
                  }}
                  className="-ml-1 grid size-9 shrink-0 place-items-center rounded-full text-foreground transition-colors hover:bg-secondary"
                >
                  {isMenuOpen ? (
                    <X className="size-5" strokeWidth={1.8} />
                  ) : (
                    <Menu className="size-5" strokeWidth={1.8} />
                  )}
                </button>
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
          </div>
        </div>

        <div
          id="global-category-menu"
          role="dialog"
          aria-modal="true"
          aria-label="전체 메뉴"
          aria-hidden={!isMenuOpen}
          inert={!isMenuOpen ? true : undefined}
          className={cn(
            "absolute inset-x-0 top-full z-10 overflow-hidden",
            isMenuOpen ? "pointer-events-auto" : "pointer-events-none"
          )}
        >
          <div
            className={cn(
              "max-h-[min(72vh,calc(100dvh-9rem))] overflow-y-auto overscroll-contain bg-background transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              isMenuOpen
                ? "translate-y-0 border-b border-border shadow-xl"
                : "-translate-y-[calc(100%+8px)]"
            )}
          >
            <div className="container">
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
      </header>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-foreground/40 transition-opacity duration-300",
          isMenuOpen || isSearchOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!(isMenuOpen || isSearchOpen)}
      >
        <button
          type="button"
          aria-label={isSearchOpen ? "검색 닫기" : "전체 메뉴 닫기"}
          className="absolute inset-0"
          onClick={() => {
            closeMenu();
            closeSearch();
          }}
        />
      </div>
    </>
  );
}
