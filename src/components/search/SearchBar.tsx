"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const query = value.trim();
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
  };

  return (
    <form onSubmit={submit} className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="브랜드, 상품명으로 검색"
        aria-label="상품 검색"
        className="h-12 w-full rounded-full border border-border bg-background py-3.5 pl-12 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/30"
      />
    </form>
  );
}
