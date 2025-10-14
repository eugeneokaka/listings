"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function CreateListingPage() {
  const router = useRouter();
  const { user } = useUser();

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "RENTAL",
    price: "",
    area: "",
    location: "",
    phone: "",
    mapUrl: "",
    amenities: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amenities: form.amenities
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean),
          imageUrls,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Error creating listing");
        return;
      }

      toast.success("Listing created successfully!");
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Error creating listing");
    } finally {
      setLoading(false);
    }
  };

  // 🧩 Helper to validate file size
  const handleFileValidation = (files: FileList) => {
    for (let file of Array.from(files)) {
      const sizeInMB = file.size / (1024 * 1024);
      if (sizeInMB > 4) {
        toast.error(`"${file.name}" is too large. Max size is 4MB.`);
        return false;
      }
    }
    return true;
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <Card className="shadow-md border border-border/40">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            Create a New Listing
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div className="space-y-1">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Modern Apartment in Westlands"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Spacious apartment with a balcony and parking space..."
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-1">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full border rounded-md bg-background p-2"
              >
                <option value="RENTAL">Rental</option>
                <option value="BNB">BnB</option>
              </select>
            </div>

            {/* Price */}
            <div className="space-y-1">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                placeholder="50000"
                required
              />
            </div>

            {/* Area */}
            <div className="space-y-1">
              <Label htmlFor="area">Area</Label>
              <Input
                id="area"
                name="area"
                value={form.area}
                onChange={handleChange}
                placeholder="2 Bedroom"
                required
              />
            </div>

            {/* Location */}
            <div className="space-y-1">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Nairobi, Kenya"
                required
              />
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="e.g. +254712345678"
                required
              />
            </div>

            {/* Map URL */}
            <div className="space-y-1">
              <Label htmlFor="mapUrl">Google Map URL (optional)</Label>
              <Input
                id="mapUrl"
                name="mapUrl"
                value={form.mapUrl}
                onChange={handleChange}
                placeholder="https://goo.gl/maps/..."
              />
            </div>

            {/* Amenities */}
            <div className="space-y-1">
              <Label htmlFor="amenities">Amenities</Label>
              <Input
                id="amenities"
                name="amenities"
                value={form.amenities}
                onChange={handleChange}
                placeholder="WiFi, Parking, Balcony"
              />
            </div>

            {/* Upload Images */}
            <div className="mt-6">
              <Label>Upload Images (Max 4MB each)</Label>
              <div className="border border-dashed border-muted-foreground/40 rounded-md p-4 mt-2">
                <UploadButton<OurFileRouter, "imageUploader">
                  endpoint="imageUploader"
                  onBeforeUploadBegin={(files) => {
                    if (!handleFileValidation(files as unknown as FileList)) {
                      throw new Error("File too large");
                    }
                    return files;
                  }}
                  onUploadBegin={() => {
                    setUploading(true);
                    setProgress(0);
                    toast.message("Starting upload...");
                  }}
                  onUploadProgress={(p) => setProgress(p)}
                  onClientUploadComplete={(res) => {
                    const urls = res?.map((f) => f.url) || [];
                    setImageUrls((prev) => [...prev, ...urls]);
                    setUploading(false);
                    setProgress(100);
                    toast.success("Images uploaded successfully!");
                  }}
                  onUploadError={(err) => {
                    if (err.message === "File too large") return;
                    toast.error(`Upload failed: ${err.message}`);
                    setUploading(false);
                  }}
                />
              </div>

              {/* Progress bar */}
              {uploading && (
                <div className="mt-3">
                  <div className="h-2 bg-muted-foreground/20 rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-red-600 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Uploading... {progress.toFixed(0)}%
                  </p>
                </div>
              )}

              {/* Image previews */}
              {imageUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {imageUrls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt="Uploaded"
                      className="rounded-lg object-cover w-full h-24 border"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white transition"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Creating Listing..." : "Create Listing"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
