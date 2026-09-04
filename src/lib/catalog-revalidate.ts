import { revalidatePath, revalidateTag } from "next/cache";

export function revalidateProductCatalog() {
  revalidateTag("products", "max");
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/search");
}
