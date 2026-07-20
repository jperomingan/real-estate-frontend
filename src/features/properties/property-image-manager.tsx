"use client";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import {
  ImagePlus,
  LoaderCircle,
  Trash2,
  Upload,
} from "lucide-react";
import {
  type ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getApiAssetUrl,
} from "@/lib/api-asset-url";

import {
  propertyImagesService,
} from "./property-images-service";
import type {
  PropertyImage,
} from "./properties-types";

interface PropertyImageManagerProps {
  propertyId: string;
  images: PropertyImage[];
}

interface ApiErrorResponse {
  message?: string;
  error?: {
    message?: string;
  };
}

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

function getErrorMessage(
  error: unknown,
): string {
  if (
    axios.isAxiosError<ApiErrorResponse>(
      error,
    )
  ) {
    if (!error.response) {
      return "Cannot connect to the backend API.";
    }

    return (
      error.response.data?.message ??
      error.response.data?.error
        ?.message ??
      `Request failed with status ${error.response.status}.`
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "The image operation failed.";
}

export function PropertyImageManager({
  propertyId,
  images,
}: PropertyImageManagerProps) {
  const queryClient =
    useQueryClient();

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null);

  const [validationError, setValidationError] =
    useState<string | null>(null);

  const [uploadProgress, setUploadProgress] =
    useState(0);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(
          previewUrl,
        );
      }
    };
  }, [previewUrl]);

  async function refreshProperty() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: [
          "properties",
          "detail",
          propertyId,
        ],
      }),

      queryClient.invalidateQueries({
        queryKey: ["properties"],
      }),
    ]);
  }

  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      propertyImagesService.uploadImage(
        propertyId,
        file,
        setUploadProgress,
      ),

    onSuccess: async () => {
      if (previewUrl) {
        URL.revokeObjectURL(
          previewUrl,
        );
      }

      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadProgress(0);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await refreshProperty();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (imageId: string) =>
      propertyImagesService.deleteImage(
        propertyId,
        imageId,
      ),

    onSuccess: refreshProperty,
  });

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    setValidationError(null);

    if (!file) {
      return;
    }

    if (
      !ALLOWED_TYPES.includes(
        file.type,
      )
    ) {
      setValidationError(
        "Select a JPG, JPEG, PNG, or WEBP image.",
      );

      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setValidationError(
        "The image must not exceed 5 MB.",
      );

      event.target.value = "";
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(
        previewUrl,
      );
    }

    setSelectedFile(file);
    setPreviewUrl(
      URL.createObjectURL(file),
    );
  }

  function handleDelete(
    image: PropertyImage,
  ) {
    const confirmed =
      window.confirm(
        `Delete "${image.altText ?? "property image"}"?`,
      );

    if (confirmed) {
      deleteMutation.mutate(
        image.id,
      );
    }
  }

  const mutationError =
    uploadMutation.error ??
    deleteMutation.error;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">
          Manage Property Images
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Upload JPG, PNG, or WEBP
          images up to 5 MB each.
        </p>
      </div>

      <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={
            uploadMutation.isPending
          }
          className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-800"
        />

        {previewUrl && (
          <div
            className="mt-4 h-56 rounded-xl bg-slate-200 bg-cover bg-center"
            style={{
              backgroundImage:
                `url("${previewUrl}")`,
            }}
          />
        )}

        {selectedFile && (
          <div className="mt-5 space-y-4">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">
                  {selectedFile.name}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {(
                    selectedFile.size /
                    1024 /
                    1024
                  ).toFixed(2)}{" "}
                  MB
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  uploadMutation.mutate(
                    selectedFile,
                  );
                }}
                disabled={
                  uploadMutation.isPending
                }
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploadMutation.isPending ? (
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Upload size={17} />
                )}

                {uploadMutation.isPending
                  ? "Uploading..."
                  : "Upload Image"}
              </button>
            </div>

            {uploadMutation.isPending && (
              <div className="space-y-2 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="flex items-center justify-between gap-4 text-xs font-medium text-emerald-800">
                  <span>
                    Uploading image
                  </span>

                  <span>
                    {uploadProgress}%
                  </span>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-emerald-100">
                  <div
                    className="h-full rounded-full bg-emerald-700 transition-[width] duration-200 ease-out"
                    style={{
                      width:
                        `${uploadProgress}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {validationError && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {validationError}
        </div>
      )}

      {mutationError && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getErrorMessage(
            mutationError,
          )}
        </div>
      )}

      {images.length === 0 ? (
        <div className="mt-6 flex min-h-40 flex-col items-center justify-center rounded-xl bg-slate-50 text-center text-slate-500">
          <ImagePlus size={30} />

          <p className="mt-3 text-sm">
            No uploaded property images.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...images]
            .sort(
              (first, second) =>
                first.sortOrder -
                second.sortOrder,
            )
            .map((image) => (
              <article
                key={image.id}
                className="overflow-hidden rounded-xl border border-slate-200"
              >
                <div
                  className="h-44 bg-slate-100 bg-cover bg-center"
                  style={{
                    backgroundImage:
                      `url("${getApiAssetUrl(image.url)}")`,
                  }}
                />

                <div className="flex items-center justify-between gap-3 p-3">
                  <p className="min-w-0 truncate text-xs text-slate-500">
                    {image.altText ??
                      `Image ${image.sortOrder + 1}`}
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      handleDelete(image);
                    }}
                    disabled={
                      deleteMutation.isPending
                    }
                    aria-label="Delete image"
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
        </div>
      )}
    </section>
  );
}
