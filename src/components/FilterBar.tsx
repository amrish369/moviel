import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

interface FilterBarProps {
  onSearch: (query: string) => void;
  onMoodChange: (mood: string) => void;
  onCategoryChange: (cat: string) => void;
  mood?: string;
  category?: string;
}

const moods = ["Mixed", "Action", "Romance", "Thriller", "Comedy", "Emotional"];
const categories = ["All", "Bollywood", "Hollywood", "South", "Web Series"];

const FilterBar = ({ onSearch, onMoodChange, onCategoryChange, mood, category }: FilterBarProps) => {
  const [query, setQuery] = useState("");
  const activeMood = mood ?? "Mixed";
  const activeCategory = category ?? "All";
  const [showFilters, setShowFilters] = useState(false);
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;

  // Live (debounced) search — pehle sirf Enter par chalta tha
  useEffect(() => {
    const t = setTimeout(() => onSearchRef.current(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movie, series, or keyword..."
            className="w-full pl-10 pr-9 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-body text-sm"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="p-3 rounded-lg bg-secondary border border-border hover:border-primary/50 transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
        </button>
      </form>


      {showFilters && (
        <div className="space-y-3 glass-card rounded-lg p-4 animate-in slide-in-from-top-2">
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Mood</p>
            <div className="flex flex-wrap gap-2">
              {moods.map((mood) => (
              <button
                  key={mood}
                  onClick={() => onMoodChange(mood)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeMood === mood
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Category</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => onCategoryChange(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
