"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

export function WishlistToggleButton() {
  const [wished, setWished] = useState(false);

  return (
    <Button
      type="button"
      size="lg"
      variant="outline"
      aria-label={wished ? "찜 해제" : "찜하기"}
      aria-pressed={wished}
      onClick={() => setWished((value) => !value)}
    >
      <Heart
        className={cn(
          "size-5 transition-all",
          wished ? "fill-red-500 text-red-500" : "fill-transparent text-foreground"
        )}
      />
    </Button>
  );
}
