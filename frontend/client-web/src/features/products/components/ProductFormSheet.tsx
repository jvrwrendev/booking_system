import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ProductForm } from "./ProductForm";
import { useProductsStore } from "../hooks/useProductsStore";
import type { Product } from "@/types/product";

interface ProductFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
}

export function ProductFormSheet({
  open,
  onOpenChange,
  product,
}: ProductFormSheetProps) {
  const { addProduct, updateProduct } = useProductsStore();
  const isEdit = !!product;

  const handleSubmit = (data: Parameters<typeof addProduct>[0]) => {
    if (product) {
      updateProduct(product.id, data);
    } else {
      addProduct(data);
    }
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
      >
        <SheetHeader className="space-y-1 border-b px-6 py-4 pr-12">
          <SheetTitle>{isEdit ? "Edit product" : "Add product"}</SheetTitle>
          <SheetDescription className="text-xs">
            {isEdit
              ? `Update ${product.name}. Changes apply immediately.`
              : "Create a new product in the catalog."}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 scrollbar-thin">
          <ProductForm
            formId="product-form"
            hideFooter
            dense
            initial={product}
            onSubmit={handleSubmit}
          />
        </div>

        <SheetFooter className="border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="product-form" className="min-w-[140px]">
            {isEdit ? "Save changes" : "Create product"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
