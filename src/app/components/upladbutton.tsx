"use client";

import { UploadButton } from "../../../utils/uploadthing"; // adjust if your path differs
import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";

interface UploadedImage {
  url: string;
}

interface Props {
  images: UploadedImage[];
  setImages: (images: UploadedImage[]) => void;
}

export default function UploadThingButton({ images, setImages }: Props) {
  const handleDelete = (url: string) => {
    setImages(images.filter((img) => img.url !== url));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {images.map((img) => (
          <div key={img.url} className="relative group">
            <Image
              src={img.url}
              alt="uploaded"
              width={120}
              height={120}
              className="rounded-lg object-cover border border-gray-300"
            />
            <button
              type="button"
              onClick={() => handleDelete(img.url)}
              className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <UploadButton
        endpoint="imageUploader" // must match your UploadThing config
        onClientUploadComplete={(res) => {
          if (res && res.length > 0) {
            const newImages = res.map((file) => ({ url: file.url }));
            setImages([...images, ...newImages]);
          }
        }}
        onUploadError={(error) => {
          alert(`Upload failed: ${error.message}`);
        }}
      />
    </div>
  );
}
