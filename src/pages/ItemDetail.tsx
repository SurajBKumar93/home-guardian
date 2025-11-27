import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Store,
  FileText,
  Trash2,
  Package,
  AlertCircle,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ItemDetail {
  id: string;
  item_name: string;
  category_id: string | null;
  purchase_date: string | null;
  warranty_expiry_date: string | null;
  store_name: string | null;
  price: number | null;
  item_photo_url: string | null;
  receipt_photo_url: string | null;
  notes: string | null;
  categories: {
    name: string;
    icon: string;
  } | null;
}

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchItem();
  }, [id]);

  const fetchItem = async () => {
    const { data, error } = await supabase
      .from("inventory_items")
      .select(`
        *,
        categories (
          name,
          icon
        )
      `)
      .eq("id", id)
      .single();

    if (!error && data) {
      setItem(data);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!id) return;

    const { error } = await supabase.from("inventory_items").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    } else {
      toast({ title: "Item deleted successfully" });
      navigate("/items");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg mb-4">Item not found</p>
        <Button onClick={() => navigate("/items")}>Back to Items</Button>
      </div>
    );
  }

  const warrantyDaysLeft = item.warranty_expiry_date
    ? differenceInDays(new Date(item.warranty_expiry_date), new Date())
    : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/items")} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon">
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Item?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the item and all its data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Item Photo */}
      <Card className="border-2 shadow-md overflow-hidden">
        <div className="aspect-video bg-muted border-b-2 flex items-center justify-center">
          {item.item_photo_url ? (
            <img
              src={item.item_photo_url}
              alt={item.item_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package className="w-24 h-24 text-muted-foreground" />
          )}
        </div>
        <CardHeader>
          <CardTitle className="text-3xl">{item.item_name}</CardTitle>
          {item.categories && (
            <p className="text-lg text-muted-foreground">
              {item.categories.icon} {item.categories.name}
            </p>
          )}
        </CardHeader>
      </Card>

      {/* Warranty Status */}
      {item.warranty_expiry_date && (
        <Card
          className={`border-2 shadow-sm ${
            warrantyDaysLeft !== null && warrantyDaysLeft < 30
              ? "border-destructive/50 bg-destructive/5"
              : ""
          }`}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle
                className={`w-8 h-8 ${
                  warrantyDaysLeft !== null && warrantyDaysLeft < 30
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Warranty Status</h3>
                {warrantyDaysLeft !== null && warrantyDaysLeft >= 0 ? (
                  <p className="text-muted-foreground">
                    {warrantyDaysLeft} days remaining • Expires{" "}
                    {format(new Date(item.warranty_expiry_date), "MMMM d, yyyy")}
                  </p>
                ) : (
                  <p className="text-destructive font-semibold">Expired</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Item Details */}
      <Card className="border-2 shadow-sm">
        <CardHeader>
          <CardTitle>Item Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {item.purchase_date && (
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Purchase Date</p>
                <p className="font-semibold">{format(new Date(item.purchase_date), "MMMM d, yyyy")}</p>
              </div>
            </div>
          )}
          {item.store_name && (
            <div className="flex items-center gap-3">
              <Store className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Store</p>
                <p className="font-semibold">{item.store_name}</p>
              </div>
            </div>
          )}
          {item.price !== null && (
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="font-semibold font-mono">${item.price.toFixed(2)}</p>
              </div>
            </div>
          )}
          {item.notes && (
            <div className="flex items-start gap-3 pt-2">
              <FileText className="w-5 h-5 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Notes</p>
                <p className="whitespace-pre-wrap">{item.notes}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt Photo */}
      {item.receipt_photo_url && (
        <Card className="border-2 shadow-sm">
          <CardHeader>
            <CardTitle>Receipt</CardTitle>
          </CardHeader>
          <CardContent>
            <img
              src={item.receipt_photo_url}
              alt="Receipt"
              className="w-full rounded-lg border-2"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ItemDetail;