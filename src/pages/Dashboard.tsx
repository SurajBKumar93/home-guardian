import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, AlertTriangle, Plus, Calendar } from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface InventoryItem {
  id: string;
  item_name: string;
  warranty_expiry_date: string | null;
  item_photo_url: string | null;
}

const Dashboard = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [expiringItems, setExpiringItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("inventory_items")
      .select("id, item_name, warranty_expiry_date, item_photo_url")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setItems(data);

      // Filter items expiring in next 30 days
      const today = new Date();
      const expiring = data.filter((item) => {
        if (!item.warranty_expiry_date) return false;
        const expiryDate = new Date(item.warranty_expiry_date);
        const daysUntilExpiry = differenceInDays(expiryDate, today);
        return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
      });
      setExpiringItems(expiring);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5" />
              Total Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{items.length}</p>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-sm border-destructive/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-destructive">{expiringItems.length}</p>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate("/add-item")}
              className="w-full shadow-xs"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Soon Section */}
      {expiringItems.length > 0 && (
        <Card className="border-2 shadow-sm border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Warranties Expiring Soon
            </CardTitle>
            <CardDescription>Items expiring in the next 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expiringItems.map((item) => {
                const daysLeft = differenceInDays(
                  new Date(item.warranty_expiry_date!),
                  new Date()
                );
                return (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/items/${item.id}`)}
                    className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors"
                  >
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center border-2">
                      {item.item_photo_url ? (
                        <img
                          src={item.item_photo_url}
                          alt={item.item_name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="w-6 h-6" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{item.item_name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {daysLeft} days left
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Items */}
      <Card className="border-2 shadow-sm">
        <CardHeader>
          <CardTitle>Recent Items</CardTitle>
          <CardDescription>Your latest additions</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No items yet. Add your first item!</p>
              <Button onClick={() => navigate("/add-item")} className="mt-4 shadow-xs">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {items.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/items/${item.id}`)}
                  className="border-2 rounded-lg p-3 cursor-pointer hover:bg-accent transition-colors"
                >
                  <div className="aspect-square bg-muted rounded-lg mb-2 border-2 overflow-hidden">
                    {item.item_photo_url ? (
                      <img
                        src={item.item_photo_url}
                        alt={item.item_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <p className="font-semibold text-sm truncate">{item.item_name}</p>
                  {item.warranty_expiry_date && (
                    <p className="text-xs text-muted-foreground">
                      Expires {format(new Date(item.warranty_expiry_date), "MMM d, yyyy")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;