"use client";

import React, { useState, useRef, useEffect } from "react";
import { Upload, Link as LinkIcon, X, Image as ImageIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ColorOption } from "@/types/product-variations";

interface ColorVariationImageManagerProps {
  colors: ColorOption[];
  onColorImageUpdate: (colorId: string, updates: Partial<ColorOption>) => void;
  disabled?: boolean;
}

export default function ColorVariationImageManager({
  colors,
  onColorImageUpdate,
  disabled = false,
}: ColorVariationImageManagerProps) {
  const [uploadingColor, setUploadingColor] = useState<string | null>(null);
  const [urlInputs, setUrlInputs] = useState<{ [key: string]: { main: string; back: string } }>({});
  // Use stable ref that persists across renders
  const fileInputRefs = useRef<{ [key: string]: { main: HTMLInputElement | null; back: HTMLInputElement | null } }>({});
  
  // Initialize refs object for new colors
  useEffect(() => {
    colors.forEach(color => {
      if (!fileInputRefs.current[color.id]) {
        fileInputRefs.current[color.id] = { main: null, back: null };
      }
    });
  }, [colors]);

  const handleFileUpload = async (colorId: string, type: "mainImageUrl" | "backImageUrl", file: File) => {
    try {
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }

      // IMMEDIATELY create blob URL and update UI (synchronous, instant preview)
      const blobUrl = URL.createObjectURL(file);
      console.log(`[ColorVariationImageManager] Created blob URL for ${type}:`, blobUrl);
      onColorImageUpdate(colorId, { [type]: blobUrl });

      // Then try to upload in background (non-blocking)
      setUploadingColor(colorId);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("productId", colorId);
      formData.append("folder", `color-variations/${colorId}`);

      try {
        const response = await fetch("/api/admin/upload-image", {
          method: "POST",
          body: formData,
        });
        if (response.ok) {
          const result = await response.json();
          const serverUrl = result.cdnUrl || result.url;
          if (serverUrl) {
            console.log(`[ColorVariationImageManager] Server upload success, replacing blob with:`, serverUrl);
            // Replace blob URL with server URL
            onColorImageUpdate(colorId, { [type]: serverUrl });
            // Clean up blob URL to free memory
            URL.revokeObjectURL(blobUrl);
          }
        } else {
          console.warn(`[ColorVariationImageManager] Server upload failed, keeping blob preview`);
        }
      } catch (networkErr) {
        console.warn(`[ColorVariationImageManager] Network error during upload, keeping blob preview:`, networkErr);
      }
    } catch (error) {
      console.error("[ColorVariationImageManager] Fatal error:", error);
      alert("Failed to process image. Please try again.");
    } finally {
      setUploadingColor(null);
    }
  };

  const handleUrlSubmit = (colorId: string, type: "mainImageUrl" | "backImageUrl") => {
    const url = urlInputs[colorId]?.[type === "mainImageUrl" ? "main" : "back"];
    if (!url?.trim()) {
      alert("Please enter a valid image URL");
      return;
    }
    try {
      new URL(url);
      onColorImageUpdate(colorId, { [type]: url.trim() });
      setUrlInputs((prev) => ({
        ...prev,
        [colorId]: { ...prev[colorId], [type === "mainImageUrl" ? "main" : "back"]: "" },
      }));
    } catch {
      alert("Invalid URL format");
    }
  };

  const handleRemoveImage = (colorId: string, type: "mainImageUrl" | "backImageUrl") => {
    onColorImageUpdate(colorId, { [type]: "" });
  };

  const handleDrop = (e: React.DragEvent, colorId: string, type: "mainImageUrl" | "backImageUrl") => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(colorId, type, file);
  };

  const ImageUploadSection = ({
    color,
    type,
  }: {
    color: ColorOption;
    type: "main" | "back";
  }) => {
    const fieldKey = type === "main" ? "mainImageUrl" : "backImageUrl";
    const imageUrl = color[fieldKey];
    const isUploading = uploadingColor === color.id;
    
    console.log(`[ImageUploadSection] Rendering ${color.name} ${type}:`, { imageUrl, isUploading });

    if (!fileInputRefs.current[color.id]) {
      fileInputRefs.current[color.id] = { main: null, back: null };
    }

    return (
      <div className="space-y-3">
        <Label className="text-sm font-medium">{type === "main" ? "Front View" : "Back View"} Image *</Label>

        {imageUrl ? (
          <div className="relative group bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
            <div className="aspect-square bg-gray-100">
              <img
                key={imageUrl}
                src={imageUrl}
                alt={`${color.name} - ${type} view`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => handleRemoveImage(color.id, fieldKey)}
                disabled={disabled}
              >
                <X className="w-4 h-4 mr-1" /> Remove
              </Button>
            </div>
            <div className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded">
              {type === "main" ? "Front" : "Back"}
            </div>
          </div>
        ) : (
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="url">
                <LinkIcon className="w-4 h-4 mr-2" />
                URL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-3">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, color.id, fieldKey)}
                onClick={() => {
                  console.log(`[Upload Card Click] Triggering file input for ${color.name} ${type}`);
                  const input = fileInputRefs.current[color.id]?.[type];
                  console.log(`[Upload Card Click] Input element:`, input);
                  if (input) {
                    input.click();
                  } else {
                    console.error(`[Upload Card Click] Input ref is null for ${color.id} ${type}`);
                  }
                }}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                  isUploading ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                } ${disabled && "opacity-50 cursor-not-allowed"}`}
              >
                <input
                  ref={(el) => {
                    console.log(`[Input Ref] Setting ref for ${color.name} ${type}:`, el);
                    if (fileInputRefs.current[color.id]) {
                      fileInputRefs.current[color.id][type] = el;
                    }
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={disabled}
                  onChange={(e) => {
                    console.log(`[Input onChange] Fired for ${color.name} ${type}`);
                    const file = e.target.files?.[0];
                    console.log(`[Input onChange] File selected:`, file);
                    if (file) {
                      // Capture the input element before async operation
                      const inputElement = e.currentTarget;
                      handleFileUpload(color.id, fieldKey, file).finally(() => {
                        // Reset input so selecting the same file again triggers onChange
                        if (inputElement) {
                          inputElement.value = "";
                        }
                      });
                    } else {
                      console.warn(`[Input onChange] No file selected`);
                    }
                  }}
                />

                <div className="space-y-3">
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm text-blue-700">Uploading...</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-blue-500" />
                      </div>
                      <p className="text-sm text-gray-700">Drop or click to upload</p>
                      <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB</p>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="url" className="mt-3">
              <div className="space-y-3">
                <Input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={urlInputs[color.id]?.[type] || ""}
                  onChange={(e) =>
                    setUrlInputs((prev) => ({
                      ...prev,
                      [color.id]: { ...prev[color.id], [type]: e.target.value },
                    }))
                  }
                  disabled={disabled}
                />
                <Button
                  type="button"
                  onClick={() => handleUrlSubmit(color.id, fieldKey)}
                  disabled={disabled || !urlInputs[color.id]?.[type]?.trim()}
                  className="w-full"
                >
                  Use This URL
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    );
  };

  if (colors.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Please select colors first before uploading images.</AlertDescription>
      </Alert>
    );
  }

  const allColorsHaveImages = colors.every((c) => c.mainImageUrl && c.backImageUrl);
  const missingImages = colors.filter((c) => !c.mainImageUrl || !c.backImageUrl);

  return (
    <div className="space-y-6">
      {missingImages.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {missingImages.length} color{missingImages.length > 1 ? "s" : ""} missing images:{" "}
            <span className="font-medium">{missingImages.map((c) => c.name).join(", ")}</span>
          </AlertDescription>
        </Alert>
      )}

      {allColorsHaveImages && (
        <Alert className="bg-green-50 border-green-200">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">All colors have both front and back images ✓</AlertDescription>
        </Alert>
      )}

      {colors.map((color) => (
        <Card key={color.id}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-gray-300" style={{ backgroundColor: color.hexCode }} />
              <div>
                <CardTitle>{color.name}</CardTitle>
                <CardDescription className="text-xs">
                  Upload front and back view images for this color
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ImageUploadSection color={color} type="main" />
              <ImageUploadSection color={color} type="back" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
