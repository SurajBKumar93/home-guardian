import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Package, Search, SlidersHorizontal } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface InventoryItem {
  id: string;
  item_name: string;
  category_id: string | null;
  warranty_expiry_date: string | null;
  item_photo_url: string | null;
  price: number | null;
  store_name: string | null;
  categories: {
    name: string;
    icon: string;
  } | null;
}

const ItemsList = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems();
  }, []);

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

  const filteredItems = items.filter((item) =>
    item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.store_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <CardTitle className="text-2xl">All Items</CardTitle>
          <CardDescription>Manage your inventory and warranties</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
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
            <Button variant="outline" size="icon" className="border-2">
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
          </div>

          {/* Items List */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No items found</p>
              <p className="text-sm">Try adjusting your search or add a new item</p>
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