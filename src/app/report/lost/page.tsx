"use client";

import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../lib/api";
import { Category } from "../../../types";
import {
  PlusCircle,
  Upload,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ImageIcon,
} from "lucide-react";

export default function ReportLostPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();

  const [itemName, setItemName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brand, setBrand] = useState("");
  const [color, setColor] = useState("");
  const [description, setDescription] = useState("");
  const [identifyingFeatures, setIdentifyingFeatures] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [approximateTime, setApproximateTime] = useState("");
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ id: string; matches: number } | null>(null);

  // Fetch categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/categories");
      return res.data?.data;
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      router.push("/login?redirect=/report/lost");
      return;
    }

    if (!categoryId) {
      setError("Please select a valid item category.");
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedImageUrl: string | null = null;

      // Upload image first if selected
      if (selectedFile) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("image", selectedFile);
        const uploadRes = await api.post("/reports/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (uploadRes.data?.success) {
          uploadedImageUrl = uploadRes.data.data.imageUrl;
        }
        setIsUploading(false);
      }

      // Create lost report
      const payload = {
        type: "LOST",
        categoryId,
        itemName,
        brand: brand || null,
        color: color || null,
        description,
        identifyingFeatures: identifyingFeatures || null,
        location,
        date,
        approximateTime: approximateTime || null,
        imageUrl: uploadedImageUrl,
      };

      const res = await api.post("/reports", payload);

      if (res.data?.success) {
        const createdReport = res.data.data;
        const matchesCount = res.data.matchesFound || 0;
        await queryClient.invalidateQueries();
        router.refresh();
        setSuccessInfo({ id: createdReport.id, matches: matchesCount });
      }
    } catch (err: unknown) {
      const message = axios.isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message
        : undefined;
      setError(
        message || "Failed to submit lost item report. Please check fields."
      );
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  if (!authLoading && !user) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Sign in required</h2>
        <p className="text-xs text-slate-500">
          You need an active Lostly account to file a lost report and monitor matching alerts.
        </p>
        <button
          onClick={() => router.push("/login?redirect=/report/lost")}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700"
        >
          Sign In to Continue
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-semibold">
          <PlusCircle className="w-3.5 h-3.5 text-rose-600" />
          Lost Item Report
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Report a Lost Belonging
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Provide as much accurate detail as possible. Our engine uses these specifics to score incoming matches.
        </p>
      </div>

      {/* Success Modal / Banner */}
      {successInfo && (
        <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl space-y-4 animate-fade-in shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" />
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Report Submitted & Analyzed!
              </h3>
              <p className="text-xs text-slate-600">
                {successInfo.matches > 0
                  ? `🎉 Great news! We found ${successInfo.matches} possible match${successInfo.matches === 1 ? "" : "es"} in our database right now!`
                  : "Report registered. We will continuously scan upcoming found items."}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push(`/items/${successInfo.id}`)}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>View Report & Match Analysis</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-2.5 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6"
      >
        {/* Section 1: Basic info */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100">
            1. Core Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Item Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. Space Grey MacBook Air 13''"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                <option value="">Select a category</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Brand / Manufacturer
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Apple, Sony, Nike, Samsonite"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Primary Color
              </label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Matte Black, Navy Blue, Silver"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Time and Location */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100">
            2. When & Where
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Date Lost <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Approximate Time
              </label>
              <input
                type="text"
                value={approximateTime}
                onChange={(e) => setApproximateTime(e.target.value)}
                placeholder="e.g. 2:30 PM or Morning"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Location Lost <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Central Library 2nd Floor"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Description & Identifying Features */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100">
            3. Detailed Description & Unique Markers
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              General Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the condition, contents, stickers, or circumstances..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Identifying Features (Crucial for Verification)
            </label>
            <textarea
              rows={2}
              value={identifyingFeatures}
              onChange={(e) => setIdentifyingFeatures(e.target.value)}
              placeholder="e.g. Scratch on top left lid, sticker of React logo, initials 'JD' inside sleeve"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>
        </div>

        {/* Section 4: Photo upload */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100">
            4. Photo Attachment
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <label className="w-full sm:w-1/2 flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-indigo-400 hover:bg-slate-50 transition-all text-center">
              <Upload className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-xs font-semibold text-slate-700">
                Click to upload photo
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                PNG, JPG or WEBP (Max 5MB)
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>

            {imagePreview ? (
              <div className="w-full sm:w-1/2 relative aspect-4/3 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full sm:w-1/2 aspect-4/3 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-center text-slate-300">
                <ImageIcon className="w-12 h-12" />
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="w-full py-3 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting || isUploading ? (
            <span>Processing & Matching...</span>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Submit Report & Run Match Engine</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
