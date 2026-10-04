import { type ComponentProps, forwardRef } from "react";
import { Search } from "lucide-react";

export interface SearchInputProps extends ComponentProps<"input"> {
  iconSize?: number;
  containerClassName?: string;
}

// Search input field with embedded search icon for filter bars.
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput(
    { iconSize = 17, containerClassName = "", className = "", ...props },
    ref,
  ) {
    return (
      <label className={`search-field ${containerClassName}`.trim()}>
        <Search size={iconSize} aria-hidden="true" />
        <input ref={ref} className={className} {...props} />
      </label>
    );
  },
);
