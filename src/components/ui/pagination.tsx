import React from "react";
import { usePagination } from "@/components/hooks/use-pagination";
import { cn } from "@/lib/utils";

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      aria-label="pagination"
      className={cn("mt-4 flex justify-center", className)}
      role="navigation"
      {...props}
    />
  );
}

function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul className={cn("m-0 flex list-none items-center gap-1 p-0", className)} {...props} />;
}

function PaginationItem(props: React.ComponentProps<"li">) {
  return <li {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

function PaginationLink({
  className,
  isActive,
  type = "button",
  ...props
}: PaginationLinkProps) {
  return (
    <button
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "inline-flex h-10 w-10 min-w-10 items-center justify-center rounded-full border border-transparent bg-transparent text-[0.92rem] font-semibold text-[#17151f] hover:bg-[#17151f0f] disabled:cursor-not-allowed disabled:opacity-40",
        isActive && "border-[#17151f24] bg-white/80 shadow-[0_1px_2px_rgba(23,21,31,0.05)]",
        className
      )}
      type={type}
      {...props}
    />
  );
}

function PaginationPrevious(props: PaginationLinkProps) {
  return (
    <PaginationLink aria-label="上一页" {...props}>
      ←
    </PaginationLink>
  );
}

function PaginationNext(props: PaginationLinkProps) {
  return (
    <PaginationLink aria-label="下一页" {...props}>
      →
    </PaginationLink>
  );
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      className={cn("inline-flex h-10 w-10 min-w-10 items-center justify-center rounded-full text-[0.92rem] font-semibold text-[#17151f75]", className)}
      {...props}
    >
      ⋯
    </span>
  );
}

type NumberedPaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  paginationItemsToDisplay?: number;
};

function NumberedPagination({
  currentPage,
  totalPages,
  onPageChange,
  paginationItemsToDisplay = 5
}: NumberedPaginationProps) {
  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage,
    totalPages,
    paginationItemsToDisplay
  });
  const goToPage = (page: number) => onPageChange(Math.min(totalPages, Math.max(1, page)));

  if (totalPages <= 1) return null;

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            disabled={currentPage === 1}
            onClick={() => goToPage(currentPage - 1)}
          />
        </PaginationItem>

        {showLeftEllipsis && (
          <>
            <PaginationItem>
              <PaginationLink onClick={() => goToPage(1)}>1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          </>
        )}

        {pages.map((page) => (
          <PaginationItem key={page}>
            <PaginationLink isActive={currentPage === page} onClick={() => goToPage(page)}>
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}

        {showRightEllipsis && (
          <>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink onClick={() => goToPage(totalPages)}>
                {totalPages}
              </PaginationLink>
            </PaginationItem>
          </>
        )}

        <PaginationItem>
          <PaginationNext
            disabled={currentPage === totalPages}
            onClick={() => goToPage(currentPage + 1)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export {
  NumberedPagination,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
};
