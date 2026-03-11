import Link from "next/link";
import { ChevronRight } from "lucide-react";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center overflow-x-auto">
      <ol className="flex items-center gap-2 whitespace-nowrap text-sm text-zinc-500">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link href={item.href} className="font-medium hover:text-zinc-900 transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "font-semibold text-zinc-900" : "font-medium"}>{item.label}</span>
              )}

              {!isLast ? <ChevronRight className="h-4 w-4 text-zinc-400" /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}