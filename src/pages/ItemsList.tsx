import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Package, Search, SlidersHorizontal, Download } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface InventoryItem {
  id: string;
  item_name: string;
  category_id: string | null;
  warranty_expiry_date: string | null;
  item_photo_url: string | null;
  price: number | null;
  store_name: string | null;
  purchase_date: string | null;
  notes: string | null;
  created_at: string;
  categories: {
    name: string;
    icon: string;
  } | null;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

const ItemsList = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [warrantyFilter, setWarrantyFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    if (data) setCategories(data);
  };

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("inventory_items")
      .select(`
        *,
        categories (
          name,
          icon
        )
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  };

  const getFilteredAndSortedItems = () => {
    let filtered = items.filter((item) =>
      item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.store_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category_id === selectedCategory);
    }

    // Price range filter
    if (priceRange !== "all") {
      filtered = filtered.filter((item) => {
        if (!item.price) return false;
        switch (priceRange) {
          case "0-50":
            return item.price <= 50;
          case "50-200":
            return item.price > 50 && item.price <= 200;
          case "200-500":
            return item.price > 200 && item.price <= 500;
          case "500+":
            return item.price > 500;
          default:
            return true;
        }
      });
    }

    // Warranty filter
    if (warrantyFilter !== "all") {
      filtered = filtered.filter((item) => {
        if (!item.warranty_expiry_date) return warrantyFilter === "no-warranty";
        const daysLeft = differenceInDays(new Date(item.warranty_expiry_date), new Date());
        switch (warrantyFilter) {
          case "active":
            return daysLeft > 30;
          case "expiring":
            return daysLeft <= 30 && daysLeft >= 0;
          case "expired":
            return daysLeft < 0;
          case "no-warranty":
            return false;
          default:
            return true;
        }
      });
    }

    // Sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "name-asc":
          return a.item_name.localeCompare(b.item_name);
        case "name-desc":
          return b.item_name.localeCompare(a.item_name);
        case "price-high":
          return (b.price || 0) - (a.price || 0);
        case "price-low":
          return (a.price || 0) - (b.price || 0);
        case "warranty-expiring":
          if (!a.warranty_expiry_date) return 1;
          if (!b.warranty_expiry_date) return -1;
          return differenceInDays(new Date(a.warranty_expiry_date), new Date()) -
                 differenceInDays(new Date(b.warranty_expiry_date), new Date());
        default:
          return 0;
      }
    });

    return sorted;
  };

  const exportToCSV = () => {
    const csvContent = [
      ["Item Name", "Category", "Store", "Price", "Purchase Date", "Warranty Expiry", "Notes"],
      ...filteredItems.map((item) => [
        item.item_name,
        item.categories?.name || "",
        item.store_name || "",
        item.price?.toString() || "",
        item.purchase_date || "",
        item.warranty_expiry_date || "",
        item.notes || "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    toast({ title: "Inventory exported to CSV!" });
  };

  const filteredItems = getFilteredAndSortedItems();

  const getWarrantyStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const daysLeft = differenceInDays(new Date(expiryDate), new Date());
    if (daysLeft < 0) return { text: "Expired", variant: "destructive" as const };
    if (daysLeft <= 7) return { text: `${daysLeft}d left`, variant: "destructive" as const };
    if (daysLeft <= 30) return { text: `${daysLeft}d left`, variant: "secondary" as const };
    return null;
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6 pb-24">
      <Card className="border-2 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">All Items</CardTitle>
              <CardDescription>Manage your inventory and warranties</CardDescription>
            </div>
            <Button onClick={exportToCSV} variant="outline" className="border-2 gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-2"
              />
            </div>
            
            {/* Filters Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="border-2">
                  <SlidersHorizontal className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filters & Sort</SheetTitle>
                  <SheetDescription>Customize your inventory view</SheetDescription>
                </SheetHeader>
                <div className="space-y-6 mt-6">
                  {/* Sort By */}
                  <div className="space-y-2">
                    <Label>Sort By</Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                        <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                        <SelectItem value="price-high">Price (High to Low)</SelectItem>
                        <SelectItem value="price-low">Price (Low to High)</SelectItem>
                        <SelectItem value="warranty-expiring">Warranty Expiring Soon</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category Filter */}
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Range Filter */}
                  <div className="space-y-2">
                    <Label>Price Range</Label>
                    <Select value={priceRange} onValueChange={setPriceRange}>
                      <SelectTrigger className="border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Prices</SelectItem>
                        <SelectItem value="0-50">$0 - $50</SelectItem>
                        <SelectItem value="50-200">$50 - $200</SelectItem>
                        <SelectItem value="200-500">$200 - $500</SelectItem>
                        <SelectItem value="500+">$500+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Warranty Status Filter */}
                  <div className="space-y-2">
                    <Label>Warranty Status</Label>
                    <Select value={warrantyFilter} onValueChange={setWarrantyFilter}>
                      <SelectTrigger className="border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Items</SelectItem>
                        <SelectItem value="active">Active (30+ days)</SelectItem>
                        <SelectItem value="expiring">Expiring Soon (≤30 days)</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="no-warranty">No Warranty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Reset Filters */}
                  <Button
                    variant="outline"
                    className="w-full border-2"
                    onClick={() => {
                      setSelectedCategory("all");
                      setPriceRange("all");
                      setWarrantyFilter("all");
                      setSortBy("newest");
                      setSearchQuery("");
                    }}
                  >
                    Reset All Filters
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Active Filters Display */}
          {(selectedCategory !== "all" || priceRange !== "all" || warrantyFilter !== "all") && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {selectedCategory !== "all" && (
                <Badge variant="secondary">
                  {categories.find((c) => c.id === selectedCategory)?.name}
                </Badge>
              )}
              {priceRange !== "all" && (
                <Badge variant="secondary">${priceRange}</Badge>
              )}
              {warrantyFilter !== "all" && (
                <Badge variant="secondary">
                  {warrantyFilter.replace("-", " ")}
                </Badge>
              )}
            </div>
          )}

          {/* Results Count */}
          <p className="text-sm text-muted-foreground">
            Showing {filteredItems.length} of {items.length} items
          </p>

          {/* Items List */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No items found</p>
              <p className="text-sm">Try adjusting your filters or search</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => {
                const warrantyStatus = getWarrantyStatus(item.warranty_expiry_date);
                return (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/items/${item.id}`)}
                    className="flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors"
                  >
                    {/* Photo */}
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center border-2 overflow-hidden flex-shrink-0">
                      {item.item_photo_url ? (
                        <img
                          src={item.item_photo_url}
                          alt={item.item_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-8 h-8" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold truncate">{item.item_name}</h3>
                        {warrantyStatus && (
                          <Badge variant={warrantyStatus.variant} className="flex-shrink-0">
                            {warrantyStatus.text}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {item.categories && (
                          <span>
                            {item.categories.icon} {item.categories.name}
                          </span>
                        )}
                        {item.store_name && <span>• {item.store_name}</span>}
                        {item.price && (
                          <span className="font-mono">• ${item.price.toFixed(2)}</span>
                        )}
                      </div>
                      {item.warranty_expiry_date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Warranty expires {format(new Date(item.warranty_expiry_date), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ItemsList;