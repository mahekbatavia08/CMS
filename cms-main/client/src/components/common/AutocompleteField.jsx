import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { getFilterSuggestions } from "@/services/filterService";
import { cn } from "@/lib/utils";

export default function AutocompleteField({
  type,
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
  multiple = false,
  className,
}) {
  // Helper to extract a single string search query
  const getInitialSearch = (val, isMultiple) => {
    if (isMultiple) return "";
    if (typeof val === "string") return val;
    if (Array.isArray(val)) return val[0] ? String(val[0]) : "";
    return val !== undefined && val !== null ? String(val) : "";
  };

  const [search, setSearch] = useState(() => getInitialSearch(value, multiple));
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef();

  // Always compute a string version of search safely
  const searchStr = typeof search === "string" 
    ? search 
    : (Array.isArray(search) ? search.join(", ") : (search !== undefined && search !== null ? String(search) : ""));

  // Sync external value changes for single mode
  useEffect(() => {
    if (!multiple) {
      const targetStr = getInitialSearch(value, false);
      if (targetStr !== searchStr) {
        setSearch(targetStr);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, multiple]);

  // Fetch suggestions
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!searchStr.trim()) {
      setOptions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await getFilterSuggestions(type, searchStr);
        setOptions(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [searchStr, type]);

  const selectedValues = multiple
    ? (Array.isArray(value)
        ? value.map((v) => (typeof v === "string" ? v : String(v)))
        : (typeof value === "string" && value.trim()
            ? value.split(",").map((s) => s.trim()).filter(Boolean)
            : []))
    : [];

  const suggestion = useMemo(() => {
    if (!searchStr.trim()) return "";
    const lowerSearch = searchStr.toLowerCase();
    const match = options.find((opt) => opt && opt.value && opt.value.toLowerCase().startsWith(lowerSearch));
    return match ? match.value : "";
  }, [searchStr, options]);

  const ghostTextValue = suggestion && suggestion.toLowerCase().startsWith(searchStr.toLowerCase())
    ? searchStr + suggestion.substring(searchStr.length) 
    : "";

  const handleSearchChange = (e) => {
    const val = e.target.value;
    if (multiple && val.includes(",")) {
      const parts = val.split(",").map((s) => s.trim()).filter(Boolean);
      const newVals = [...selectedValues];
      parts.forEach((p) => {
        if (!newVals.includes(p)) newVals.push(p);
      });
      onChange(newVals);
      setSearch("");
      return;
    }
    setSearch(val);
    if (!multiple) {
      onChange(val);
    }
  };

  const handleAccept = (val) => {
    const safeVal = typeof val === "string" ? val : String(val || "");
    if (!safeVal.trim()) return;
    if (multiple) {
      if (!selectedValues.includes(safeVal)) {
        onChange([...selectedValues, safeVal]);
      }
      setSearch("");
    } else {
      setSearch(safeVal);
      onChange(safeVal);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === "Tab" || e.key === "ArrowRight" || (multiple && e.key === ",")) {
      if (ghostTextValue && ghostTextValue.toLowerCase() !== searchStr.toLowerCase()) {
        e.preventDefault();
        handleAccept(ghostTextValue);
      } else if (e.key === "Enter" || e.key === ",") {
        e.preventDefault(); // Prevent form submission
        if (searchStr.trim()) {
          handleAccept(searchStr.trim());
        }
      }
    } else if (e.key === "Backspace" && searchStr === "" && multiple && selectedValues.length > 0) {
      e.preventDefault();
      onChange(selectedValues.slice(0, -1));
    }
  };

  const removePill = (valToRemove) => {
    onChange(selectedValues.filter((v) => v !== valToRemove));
  };

  return (
    <div 
      className={cn(
        "flex min-h-10 w-full flex-wrap items-center gap-2 rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors outline-none select-none focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      {multiple && selectedValues.map((val) => (
        <span 
          key={val} 
          className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
        >
          {val}
          <button
            type="button"
            onClick={() => removePill(val)}
            disabled={disabled}
            className="hover:text-destructive focus:outline-none"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      
      <div className="relative flex-1 min-w-[120px]">
        {/* Ghost Text */}
        <input
          type="text"
          readOnly
          tabIndex={-1}
          className="absolute inset-0 w-full bg-transparent p-0 text-sm text-muted-foreground border-none focus:outline-none pointer-events-none"
          value={ghostTextValue}
        />
        {/* Actual Input */}
        <input
          type="text"
          disabled={disabled}
          className="relative z-10 w-full bg-transparent p-0 text-sm text-foreground placeholder:text-muted-foreground border-none focus:outline-none"
          value={searchStr}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          placeholder={multiple && selectedValues.length > 0 ? "" : placeholder}
        />
      </div>

      {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
    </div>
  );
}
