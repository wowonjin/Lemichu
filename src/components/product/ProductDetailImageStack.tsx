import { isRealImage } from "@/lib/placeholder";

function uniqueRealImages(images: string[]) {
  return images.filter((url, index) => isRealImage(url) && images.indexOf(url) === index);
}

export function ProductDetailImageStack({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const urls = uniqueRealImages(images);
  if (urls.length === 0) return null;

  return (
    <div className="-mx-4 mt-6 overflow-hidden md:mx-0 md:mt-8 md:rounded-md">
      <ul>
        {urls.map((src, index) => (
          <li key={`${src}-${index}`} className="bg-[#F7F7F7] dark:bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`${alt} ${index + 1}`}
              className="mx-auto block h-auto w-full"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
