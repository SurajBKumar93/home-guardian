import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload } from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: string;
}

const AddItem = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    item_name: "",
    category_id: "",
    purchase_date: "",
    warranty_expiry_date: "",
    store_name: "",
    price: "",
    notes: "",
  });
  const [itemPhoto, setItemPhoto] = useState<File | null>(null);
  const [receiptPhoto, setReceiptPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    if (data) setCategories(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "item" | "receipt") => {
    if (e.target.files && e.target.files[0]) {
      if (type === "item") {
        setItemPhoto(e.target.files[0]);
      } else {
        setReceiptPhoto(e.target.files[0]);
      }
    }
  };

  const uploadPhoto = async (file: File, type: string): Promise<string | null> => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return null;

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${type}_${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("inventory-photos")
      .upload(fileName, file);

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    const { data } = supabase.storage
      .from("inventory-photos")
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Not authenticated");

      let itemPhotoUrl = null;
      let receiptPhotoUrl = null;

      if (itemPhoto) {
        itemPhotoUrl = await uploadPhoto(itemPhoto, "item");
      }
      if (receiptPhoto) {
        receiptPhotoUrl = await uploadPhoto(receiptPhoto, "receipt");
      }

      const { error } = await supabase.from("inventory_items").insert({
        ...formData,
        user_id: user.id,
        price: formData.price ? parseFloat(formData.price) : null,
        item_photo_url: itemPhotoUrl,
        receipt_photo_url: receiptPhotoUrl,
      });

      if (error) throw error;

      toast({ title: "Item added successfully!" });
      navigate("/items");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <Card className="border-2 shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">Add New Item</CardTitle>
          <CardDescription>Track warranties and receipts for your purchases</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Item Photo */}
            <div className="space-y-2">
              <Label>Item Photo</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                {itemPhoto ? (
                  <div className="space-y-2">
                    <img
                      src={URL.createObjectURL(itemPhoto)}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setItemPhoto(null)}
                      className="border-2"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, "item")}
                    />
                    <Camera className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload item photo</p>
                  </label>
                )}
              </div>
            </div>

            {/* Item Name */}
            <div className="space-y-2">
              <Label htmlFor="item_name">Item Name *</Label>
              <Input
                id="item_name"
                required
                placeholder="e.g., iPhone 15 Pro"
                value={formData.item_name}
                onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                className="border-2"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                <SelectTrigger className="border-2">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchase_date">Purchase Date</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warranty_expiry_date">Warranty Expiry</Label>
                <Input
                  id="warranty_expiry_date"
                  type="date"
                  value={formData.warranty_expiry_date}
                  onChange={(e) => setFormData({ ...formData, warranty_expiry_date: e.target.value })}
                  className="border-2"
                />
              </div>
            </div>

            {/* Store and Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="store_name">Store Name</Label>
                <Input
                  id="store_name"
                  placeholder="e.g., Best Buy"
                  value={formData.store_name}
                  onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                  className="border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="border-2"
                />
              </div>
            </div>

            {/* Receipt Photo */}
            <div className="space-y-2">
              <Label>Receipt Photo</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                {receiptPhoto ? (
                  <div className="space-y-2">
                    <img
                      src={URL.createObjectURL(receiptPhoto)}
                      alt="Receipt Preview"
                      className="max-h-48 mx-auto rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setReceiptPhoto(null)}
                      className="border-2"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, "receipt")}
                    />
                    <Upload className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload receipt</p>
                  </label>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional information..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="border-2"
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full shadow-sm" disabled={loading}>
              {loading ? "Adding..." : "Add Item"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddItem;