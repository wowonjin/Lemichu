"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { ADMIN_EMAIL, isAdminUser, type AuthUser, observeAuthUser, signOut } from "@/lib/auth";
import { getLoginHref } from "@/lib/redirect";
import { HoverTooltip } from "@/components/ui/hover-tooltip";
import { HeaderSearchPanel } from "@/components/search/HeaderSearchPanel";
import { rememberCustomerSearch } from "@/lib/search/client";
import { buildSearchHref } from "@/lib/search/url";
import type { CategoryMenuTab } from "@/data/categoryMenu";
import { AccountMenu } from "./AccountMenu";
import { HeaderEventBanner } from "./HeaderEventBanner";
import { ModeToggle } from "./ModeToggle";
import { catalogFilterHref, parseCatalogFilter, type CatalogFilterId } from "@/lib/catalogFilters";
import { buildSellInquiryMessage, copyTextToClipboard, getKakaoChatUrl } from "@/lib/kakao-inquiry";
import { useToast } from "@/components/ui/toast";

const gnb: {
  label: string;
  href: string;
  filter?: CatalogFilterId;
  kakao?: boolean;
}[] = [
  { label: "신규입고", href: catalogFilterHref("new"), filter: "new" },
  { label: "명품가방", href: catalogFilterHref("bags"), filter: "bags" },
  { label: "지갑·카드지갑", href: catalogFilterHref("wallets"), filter: "wallets" },
  { label: "내 명품 판매하기", href: getKakaoChatUrl(), kakao: true },
];

const headerIconClassName =
  "group relative grid size-10 place-items-center rounded-md text-foreground transition-colors hover:bg-secondary";

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

function isGnbActive(
  item: (typeof gnb)[number],
  pathname: string,
  filter: ReturnType<typeof parseCatalogFilter>
) {
  if (item.filter) {
    return pathname === "/products" && filter === item.filter;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function HeaderGnbLinks({
  pathname,
  filter = "all",
}: {
  pathname: string;
  filter?: ReturnType<typeof parseCatalogFilter>;
}) {
  const { toast } = useToast();

  const openSellKakao = () => {
    const copied = copyTextToClipboard(buildSellInquiryMessage());
    toast(
      copied
        ? "판매 문의 문구가 복사되었습니다. 카카오톡에 붙여넣어 보내주세요."
        : "카카오톡에서 명품 판매하기로 문의드린다고 남겨주세요."
    );
  };

  return (
    <>
      {gnb.map((item) => {
        const active = isGnbActive(item, pathname, filter);
        const className = cn(
          "inline-flex shrink-0 items-center text-sm transition-colors",
          item.kakao
            ? "h-7 rounded-md bg-[#FEE500] px-2.5 font-semibold text-[#191919] hover:opacity-90"
            : active
              ? "font-semibold text-foreground hover:text-foreground"
              : "font-medium text-foreground/80 hover:text-foreground"
        );

        if (item.kakao) {
          return (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={openSellKakao}
              className={className}
            >
              {item.label}
            </a>
          );
        }

        return (
          <Link key={item.href} href={item.href} className={className}>
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

function HeaderGnb() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (
    <HeaderGnbLinks
      pathname={pathname}
      filter={parseCatalogFilter(searchParams.get("filter"))}
    />
  );
}

function categoryHref(tab: string, title?: string, item?: string) {
  const params = new URLSearchParams();
  params.set("used", "1");
  params.set("tab", tab);
  if (title) params.set("category", title);
  if (item) params.set("item", item);
  return `/search?${params.toString()}`;
}

export function Header({ categoryMenu = [] }: { categoryMenu?: CategoryMenuTab[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(categoryMenu[0]?.label ?? "여성");
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const activeMenu = categoryMenu.find((tab) => tab.label === activeTab) ?? categoryMenu[0];
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
    const usedOnly =
      pathname.startsWith("/products") ||
      pathname.startsWith("/pre-owned") ||
      (pathname === "/search" && new URLSearchParams(window.location.search).get("used") === "1");
    if (query) {
      rememberCustomerSearch(query, {
        uid: authUser?.uid,
        source: "submit",
        usedOnly,
      });
    }
    setIsSearchOpen(false);
    router.push(query ? buildSearchHref(query, { used: usedOnly }) : usedOnly ? "/search?used=1" : "/search");
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
    if (!categoryMenu.some((tab) => tab.label === activeTab)) {
      setActiveTab(categoryMenu[0]?.label ?? "여성");
    }
  }, [categoryMenu, activeTab]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const timer = window.setTimeout(() => {
      searchInputRef.current?.focus({ preventScroll: true });
    }, 160);
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
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setIsSearchOpen(false);
        setIsAccountOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const syncHeaderHeight = () => {
      document.documentElement.style.setProperty(
        "--header-height",
        `${header.offsetHeight}px`
      );
    };

    syncHeaderHeight();
    const observer = new ResizeObserver(syncHeaderHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay || !(isMenuOpen || isSearchOpen)) return;

    const preventBackgroundScroll = (event: Event) => {
      event.preventDefault();
    };

    overlay.addEventListener("wheel", preventBackgroundScroll, { passive: false });
    overlay.addEventListener("touchmove", preventBackgroundScroll, { passive: false });
    return () => {
      overlay.removeEventListener("wheel", preventBackgroundScroll);
      overlay.removeEventListener("touchmove", preventBackgroundScroll);
    };
  }, [isMenuOpen, isSearchOpen]);

  return (
    <>
      <header ref={headerRef} className="relative sticky top-0 z-50 w-full bg-background">
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
              <Suspense
                fallback={
                  <div className="relative grid grid-cols-2 items-center rounded-md bg-secondary p-0.5 text-xs font-semibold">
                    <span className="absolute inset-y-0.5 right-0.5 w-[calc(50%-2px)] rounded-md bg-foreground" />
                    <span className="relative z-10 rounded-md px-2.5 py-1 text-center text-muted-foreground">전체</span>
                    <span className="relative z-10 rounded-md px-2.5 py-1 text-center text-background">중고</span>
                  </div>
                }
              >
                <ModeToggle />
              </Suspense>
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
                  <HeaderIconLink href="/my" label="찜">
                    <Heart className="size-5" strokeWidth={1.8} />
                  </HeaderIconLink>
                  <HeaderIconLink href="/my" label="담기">
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
                    className="inline-flex h-9 items-center rounded-md px-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary md:h-10 md:px-4"
                  >
                    로그인
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 md:h-10 md:px-4"
                  >
                    회원가입
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>

        <Suspense fallback={null}>
          <HeaderSearchPanel
            isOpen={isSearchOpen}
            query={searchQuery}
            inputRef={searchInputRef}
            onQueryChange={setSearchQuery}
            onSubmit={submitSearch}
            onClose={closeSearch}
          />
        </Suspense>
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
                  className="-ml-1 grid size-9 shrink-0 place-items-center rounded-md text-foreground transition-colors hover:bg-secondary"
                >
                  {isMenuOpen ? (
                    <X className="size-5" strokeWidth={1.8} />
                  ) : (
                    <Menu className="size-5" strokeWidth={1.8} />
                  )}
                </button>
                <Suspense fallback={<HeaderGnbLinks pathname={pathname} />}>
                  <HeaderGnb />
                </Suspense>
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
              {categoryMenu.length === 0 || !activeMenu ? (
                <div className="py-10 text-sm text-muted-foreground">
                  현재 판매 중인 중고 상품이 없습니다.
                </div>
              ) : (
                <>
                  <nav className="flex h-11 items-center gap-2.5 overflow-x-auto border-b border-border/60 no-scrollbar">
                    {categoryMenu.map((tab) => {
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
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div
        ref={overlayRef}
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
